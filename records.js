"use strict";
/* مرحلهٔ ۳: جلسه‌ها و جدول سوابق حضور */
const NEXT = {A: "P", P: "L", L: "E", E: "A"};
const MARK = {P: "ح", L: "ت", E: "م", A: ""};
const fmts = {};
const sLabel = s => {
  const cal = S.settings?.cal === "gregorian" ? "gregory" : "persian";
  const lc = isEn() ? "en-US" : "fa-IR";
  const d = fmts[lc + cal] ||= new Intl.DateTimeFormat(lc + "-u-ca-" + cal, {month: "2-digit", day: "2-digit"});
  const t = fmts[lc] ||= new Intl.DateTimeFormat(lc, {hour: "2-digit", minute: "2-digit", hour12: false});
  return `${d.format(s.t)} ${t.format(s.t)}`;
};
/* فعالیت (ستاره/سکه) و تنبیه (رعدوبرق/ضربدر): هر ۵ ستاره = ۱ سکه، حداکثر ۳ سکه */
const MAX_COINS = 3;
const apOf = (a, n) => ({s: +(a?.[n]?.stars || 0), c: +(a?.[n]?.coins || 0)});
function apAdd(a, n) {
  let {s, c} = apOf(a, n); if (c >= MAX_COINS && s >= 4) return false;
  s++; if (s >= 5) { s -= 5; c++; } a[n] = {stars: s, coins: c}; return true;
}
function apRm(a, n) { let {s, c} = apOf(a, n); if (s > 0) s--; else if (c > 0) { c--; s = 4; } a[n] = {stars: s, coins: c}; }
const apHtml = (v, k) => (v.c ? `<span class="${k}c">${icon(k === "a" ? "coins" : "xc")}${fa(v.c)}</span> ` : "") + (v.s ? `<span class="${k}s">${icon(k === "a" ? "star" : "zap")}${fa(v.s)}</span>` : "") || "·";
const nowLocal = t => { const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

function addSession(c, found) {                         // found: مجموعهٔ نام‌های حاضر (یا خالی برای جلسهٔ ساده)
  const s = {id: uid(), t: Date.now(), marks: {}};
  c.people.forEach(n => s.marks[n] = found && found.has(n) ? "P" : "A");
  (c.sessions = c.sessions || []).push(s); save(); return s;
}

function viewRecords(c) {
  c.sessions = c.sessions || [];
  setBar("سوابق حضور", {back: "#/c/" + c.id, sub: c.name, acc: "warn",
    right: `<button class="ib" id="cs" aria-label="ثبت جلسه با چهره">${icon("cam")}</button><button class="ib" id="ps" aria-label="جلسهٔ ساده">${icon("plus")}</button>`});
  $("#cs").onclick = () => go(`#/c/${c.id}/attend`);
  $("#ps").onclick = () => { addSession(c, null); viewRecords(c); toast("جلسه اضافه شد"); };
  if (!c.people.length && !c.sessions.length) return show(`<div class="empty">اول از «تعریف افراد» نام‌ها را وارد کن.</div>`);
  const limit = S.settings.limit ?? 6;
  const nw = Math.min(Math.max(S.settings.nameW ?? 140, 80), 420);
  const names = [...c.people].sort((a, b) => a.localeCompare(b, "fa"));
  const ss = c.sessions.slice().sort((a, b) => a.t - b.t);
  const att = (n) => ss.filter(s => "PL".includes(s.marks[n] || "A")).length;
  const abs = n => ss.filter(s => (s.marks[n] || "A") === "A").length;
  show(`<div class="wrap" id="tw"><table class="tb" style="--nw:${nw}px"><thead><tr>
      <th class="nm" id="nh">نام<span class="grip"></span></th>
      ${ss.map(s => `<th class="sc" data-s="${s.id}"><span class="rot">${sLabel(s)}</span></th>`).join("")}
      <th class="tot">حضور</th><th class="ap">فعالیت</th><th class="ap">تنبیه</th></tr></thead>
    <tbody>${names.map(n => `<tr class="${abs(n) > limit ? "red" : ""}" data-n="${esc(n)}"><td class="nm">${esc(n)}</td>
      ${ss.map(s => { const m = s.marks[n] || "A"; return `<td class="mk m${m}" data-s="${s.id}">${MARK[m]}</td>`; }).join("")}
      <td class="tot">${fa(att(n))}/${fa(ss.length)}</td>
      <td class="ap" data-ap="act">${apHtml(apOf(c.act, n), "a")}</td><td class="ap" data-ap="pen">${apHtml(apOf(c.pen, n), "p")}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td class="nm">حاضرین</td>${ss.map(s => `<td class="ft" data-f="${s.id}">${fa(names.filter(n => "PL".includes(s.marks[n] || "A")).length)}</td>`).join("")}<td class="tot"></td><td class="ap"></td><td class="ap"></td></tr></tfoot>
    </table></div>
    <div class="row"><button class="btn soft" id="xl" style="flex:1">${icon("down")} دریافت جدول به صورت فایل اکسل</button></div>
    <div class="muted legend"><span class="mk mP">ح</span> حاضر <span class="mk mL">ت</span> تأخیر <span class="mk mE">م</span> مجاز <span>خالی = غایب</span></div>`);
  $("#xl").onclick = () => exportXlsx(c, names, ss);
  const tb = $("#tw");
  // تغییر وضعیت یک خانه با لمس
  tb.querySelector("tbody").onclick = e => {
    const nm = e.target.closest("td.nm"), ap = e.target.closest("td.ap");
    if (nm) return personMenu(c, nm.parentElement.dataset.n);
    if (ap) return apPanel(c, ap.parentElement.dataset.n, () => viewRecords(c));
    const td = e.target.closest("td.mk"); if (!td) return;
    const tr = td.parentElement, n = tr.dataset.n, s = c.sessions.find(x => x.id === td.dataset.s);
    const m = NEXT[s.marks[n] || "A"]; s.marks[n] = m; save();
    td.className = "mk m" + m; td.textContent = MARK[m];
    tr.querySelector("td.tot").textContent = `${fa(att(n))}/${fa(ss.length)}`;
    tr.classList.toggle("red", abs(n) > limit);
    tb.querySelector(`[data-f="${s.id}"]`).textContent = fa(names.filter(x => "PL".includes(s.marks[x] || "A")).length);
    mdAfterTap(c, s);
  };
  // لمس سرستون جلسه: تاریخ و حذف
  tb.querySelectorAll("th.sc").forEach(th => th.onclick = () => editSession(c, th.dataset.s));
  // کشیدن سرستون نام: تغییر عرض ستون (ذخیره می‌شود)
  const nh = $("#nh"), table = tb.querySelector("table");
  nh.onpointerdown = e => {
    nh.setPointerCapture(e.pointerId);
    const x0 = e.clientX, w0 = nh.offsetWidth, rtl = getComputedStyle(document.documentElement).direction === "rtl";
    const mv = ev => {
      const d = ev.clientX - x0, w = Math.min(Math.max(w0 + (rtl ? -d : d), 80), Math.min(420, innerWidth * .75));
      table.style.setProperty("--nw", w + "px"); S.settings.nameW = Math.round(w);
    };
    const up = () => { nh.removeEventListener("pointermove", mv); nh.removeEventListener("pointerup", up); nh.removeEventListener("pointercancel", up); save(); };
    nh.addEventListener("pointermove", mv); nh.addEventListener("pointerup", up); nh.addEventListener("pointercancel", up);
  };
}

function editSession(c, id) {
  const s = c.sessions.find(x => x.id === id); if (!s) return;
  dlg.innerHTML = `<h2>جلسه</h2><div class="muted">${sLabel(s)}</div>
    <input type="datetime-local" id="dt" value="${nowLocal(s.t)}" style="width:100%;margin-top:12px;border:0;border-radius:14px;padding:12px;background:var(--card2);color:var(--text);font:inherit">
    <div class="row"><button class="btn danger" data-r="del">حذف جلسه</button><button class="btn soft" data-r="no">بستن</button><button class="btn" data-r="ok">ذخیره تاریخ</button></div>`;
  dlg.querySelectorAll("button").forEach(b => b.onclick = () => {
    dlg.close();
    if (b.dataset.r === "ok") { const v = new Date($("#dt").value).getTime(); if (v) { s.t = v; save(); viewRecords(c); } }
    if (b.dataset.r === "del") {
      const i = c.sessions.indexOf(s); c.sessions.splice(i, 1);
      trashAdd("session", sLabel(s), {cid: c.id, i, s}); viewRecords(c);
    }
  });
  dlg.showModal();
}

/* پنل سریع فعالیت و تنبیه یک دانشجو (باز می‌ماند تا چند ستاره پشت‌سرهم بدهی) */
function apPanel(c, n, done) {
  c.act = c.act || {}; c.pen = c.pen || {};
  const sec = (key, store, ic, ic2, title) => `<div class="apsec"><div class="muted">${title}</div><div class="aprow">
    <button class="btn soft" data-m="${key}">${icon("minus")}</button><div class="apv" id="v_${key}"></div><button class="btn ${key === "act" ? "" : "danger"}" data-p="${key}">${icon("plus")}</button></div></div>`;
  dlg.innerHTML = `<h2>${esc(n)}</h2>${sec("act", c.act, "★", "🪙", "فعالیت (ستاره و سکه)")}${sec("pen", c.pen, "⚡", "✖", "تنبیه (رعدوبرق و ضربدر)")}
    <div class="row"><button class="btn" id="dn">بستن</button></div>`;
  const draw = () => { $("#v_act").innerHTML = apHtml(apOf(c.act, n), "a"); $("#v_pen").innerHTML = apHtml(apOf(c.pen, n), "p"); };
  dlg.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { const st = b.dataset.p === "act" ? c.act : c.pen; if (!apAdd(st, n)) toast("به سقف رسیده است"); save(); draw(); });
  dlg.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { apRm(b.dataset.m === "act" ? c.act : c.pen, n); save(); draw(); });
  $("#dn").onclick = () => dlg.close();
  dlg.onclose = () => { dlg.onclose = null; done(); };
  draw(); dlg.showModal();
}

/* منوی یک فرد در جدول: ادغام با فرد تکراری یا حذف */
function personMenu(c, n) {
  dlg.innerHTML = `<h2>${esc(n)}</h2><div class="row" style="flex-direction:column">
    <button class="btn soft" data-r="merge">ادغام با فرد تکراری</button><button class="btn soft" data-r="ren">تغییر نام</button>
    <button class="btn danger" data-r="del">حذف این فرد</button><button class="btn soft" data-r="no">بستن</button></div>`;
  dlg.querySelectorAll("button").forEach(b => b.onclick = async () => {
    dlg.close();
    if (b.dataset.r === "ren") { const v = await ask({title: "نام", input: n, ok: "ذخیره"}); if (v && v !== n) { if (c.people.includes(v)) return toast("این نام قبلاً هست"); renamePerson(c, n, v); viewRecords(c); } }
    if (b.dataset.r === "del") { if (await ask({title: "حذف", text: `«${n}» با همهٔ سوابقش حذف شود؟`, ok: "حذف", danger: true})) { deletePerson(c, n); viewRecords(c); } }
    if (b.dataset.r === "merge") pickMerge(c, n);
  });
  dlg.showModal();
}
function pickMerge(c, keep) {
  const others = c.people.filter(x => x !== keep);
  if (!others.length) return toast("فرد دیگری برای ادغام نیست");
  dlg.innerHTML = `<h2>کدام فرد تکراری در «${esc(keep)}» ادغام شود؟</h2><div class="row" style="flex-direction:column;max-height:50vh;overflow:auto">
    ${others.map((o, i) => `<button class="btn soft" data-i="${i}">${esc(o)}</button>`).join("")}</div><div class="row"><button class="btn soft" id="no">انصراف</button></div>`;
  $("#no").onclick = () => dlg.close();
  dlg.querySelectorAll("[data-i]").forEach(b => b.onclick = async () => {
    const dup = others[+b.dataset.i]; dlg.close();
    if (await ask({title: "ادغام", text: `«${dup}» در «${keep}» ادغام شود؟ حضور هر دو جمع می‌شود و «${dup}» حذف می‌شود.`, ok: "ادغام"})) { mergePeople(c, keep, dup); viewRecords(c); toast("ادغام شد"); }
  });
  dlg.showModal();
}
function renamePerson(c, n, v) {
  const i = c.people.indexOf(n); c.people[i] = v;
  if (c.faces?.[n]) { c.faces[v] = c.faces[n]; delete c.faces[n]; }
  (c.sessions || []).forEach(s => { if (n in s.marks) { s.marks[v] = s.marks[n]; delete s.marks[n]; } });
  for (const k of ["act", "pen"]) if (c[k]?.[n]) { c[k][v] = c[k][n]; delete c[k][n]; }
  if (c.md?.users?.[n] != null) { c.md.users[v] = c.md.users[n]; delete c.md.users[n]; }
  save();
}
function deletePerson(c, n) {
  const i = c.people.indexOf(n), fs = c.faces?.[n], marks = {};
  (c.sessions || []).forEach(s => { if (n in s.marks) { marks[s.id] = s.marks[n]; delete s.marks[n]; } });
  c.people.splice(i, 1); if (c.faces) delete c.faces[n];
  trashAdd("person", n, {cid: c.id, i, n, fs, marks});
}
function mergePeople(c, keep, dup) {
  c.faces = c.faces || {};
  c.faces[keep] = [...(c.faces[keep] || []), ...(c.faces[dup] || [])].slice(0, Math.max(VP("max_faces"), (c.faces[keep] || []).length)); delete c.faces[dup];
  (c.sessions || []).forEach(s => { const a = s.marks[keep] || "A", b = s.marks[dup] || "A"; s.marks[keep] = a !== "A" ? a : b; delete s.marks[dup]; });
  for (const k of ["act", "pen"]) {
    const t = x => (x.c || 0) * 5 + (x.s || 0), tot = Math.min(t(apOf(c[k], keep)) + t(apOf(c[k], dup)), MAX_COINS * 5 + 4);
    if (c[k]) { c[k][keep] = {stars: tot % 5, coins: Math.floor(tot / 5)}; delete c[k][dup]; }
  }
  if (c.md?.users && c.md.users[keep] == null && c.md.users[dup] != null) c.md.users[keep] = c.md.users[dup];
  if (c.md?.users) delete c.md.users[dup];
  c.people.splice(c.people.indexOf(dup), 1); save();
}


/* ---------- خروجی اکسل (xlsx بدون کتابخانه: zip بدون فشرده‌سازی + XML) ---------- */
const _crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const _crc = b => { let c = ~0; for (let i = 0; i < b.length; i++) c = _crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return ~c >>> 0; };
function zipStore(files) {                                   // files: [[نام, متن]]
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const u16 = v => [v & 255, v >> 8 & 255], u32 = v => [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24 & 255];
  for (const [name, text] of files) {
    const nb = enc.encode(name), d = enc.encode(text), crc = _crc(d);
    const h = Uint8Array.from([0x50, 0x4b, 3, 4, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(d.length), ...u32(d.length), ...u16(nb.length), 0, 0]);
    parts.push(h, nb, d);
    cen.push(Uint8Array.from([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(d.length), ...u32(d.length), ...u16(nb.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]), nb);
    off += h.length + nb.length + d.length;
  }
  const cl = cen.reduce((a, b) => a + b.length, 0);
  return new Blob([...parts, ...cen, Uint8Array.from([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cl), ...u32(off), 0, 0])],
    {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
function exportXlsx(c, names, ss) {
  const X = s => String(s).replace(/[&<>"\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[ch] || ""));
  const col = n => { let s = ""; for (n++; n > 0; n = (n - 1) / 26 | 0) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
  const lc = isEn() ? "en-US" : "fa-IR", cal = S.settings?.cal === "gregorian" ? "gregory" : "persian";
  const df = new Intl.DateTimeFormat(lc + "-u-ca-" + cal, {year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false});
  const T = isEn() ? {n: "Name", pr: "Present", ab: "Absent", ps: "Present sessions", as: "Absent sessions", st: "Activity stars", co: "Activity coins", ps2: "Penalty strikes", pc: "Penalty crosses", f: "Present count", L: "Late", E: "Excused", A: "Absent", P: "Present"}
    : {n: "نام", pr: "حاضر", ab: "غایب", ps: "تعداد حضور", as: "تعداد غیبت", st: "ستارهٔ فعالیت", co: "سکهٔ فعالیت", ps2: "رعدوبرق تنبیه", pc: "ضربدر تنبیه", f: "حاضرین", L: "تأخیر", E: "مجاز", A: "غ", P: "ح"};
  const L = {P: T.P, L: T.L, E: T.E, A: T.A};
  const cell = (r, k, v) => typeof v === "number" ? `<c r="${col(k)}${r}"><v>${v}</v></c>` : `<c r="${col(k)}${r}" t="inlineStr"><is><t>${X(v)}</t></is></c>`;
  const rows = [[T.n, ...ss.map(s => df.format(s.t)), T.ps, T.as, T.st, T.co, T.ps2, T.pc]];
  names.forEach(n => { const a = apOf(c.act, n), p = apOf(c.pen, n);
    rows.push([n, ...ss.map(s => L[s.marks[n] || "A"]), ss.filter(s => "PL".includes(s.marks[n] || "A")).length, ss.filter(s => (s.marks[n] || "A") === "A").length, a.s, a.c, p.s, p.c]); });
  rows.push([T.f, ...ss.map(s => names.filter(n => "PL".includes(s.marks[n] || "A")).length)]);
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="${isEn() ? 0 : 1}" workbookViewId="0"><pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="${rows[0].length}" width="15" customWidth="1"/></cols><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${r.map((v, k) => cell(i + 1, k, v)).join("")}</row>`).join("")}</sheetData></worksheet>`;
  const nm = X((c.name || "Sheet").replace(/[\\/?*\[\]:]/g, " ").slice(0, 31) || "Sheet");
  const blob = zipStore([
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${nm}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`],
    ["xl/worksheets/sheet1.xml", sheet]]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = ((c.name || "records").replace(/[\\/:*?"<>|]/g, "_")) + "-" + new Date().toISOString().slice(0, 10) + ".xlsx";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast(isEn() ? "Excel file downloaded" : "فایل اکسل دریافت شد");
}
