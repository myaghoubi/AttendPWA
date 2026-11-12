"use strict";
/* مرحلهٔ ۳: جلسه‌ها و جدول سوابق حضور */
const NEXT = {A: "P", P: "L", L: "E", E: "A"};
const MARK = {P: "ح", L: "ت", E: "م", A: ""};
const dFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {month: "2-digit", day: "2-digit"});
const tFmt = new Intl.DateTimeFormat("fa-IR", {hour: "2-digit", minute: "2-digit", hour12: false});
const sLabel = s => `${dFmt.format(s.t)} ${tFmt.format(s.t)}`;
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
      <th class="tot">حضور</th></tr></thead>
    <tbody>${names.map(n => `<tr class="${abs(n) > limit ? "red" : ""}" data-n="${esc(n)}"><td class="nm">${esc(n)}</td>
      ${ss.map(s => { const m = s.marks[n] || "A"; return `<td class="mk m${m}" data-s="${s.id}">${MARK[m]}</td>`; }).join("")}
      <td class="tot">${fa(att(n))}/${fa(ss.length)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td class="nm">حاضرین</td>${ss.map(s => `<td class="ft" data-f="${s.id}">${fa(names.filter(n => "PL".includes(s.marks[n] || "A")).length)}</td>`).join("")}<td class="tot"></td></tr></tfoot>
    </table></div>
    <div class="muted legend"><span class="mk mP">ح</span> حاضر <span class="mk mL">ت</span> تأخیر <span class="mk mE">م</span> مجاز <span>خالی = غایب</span></div>`);
  const tb = $("#tw");
  // تغییر وضعیت یک خانه با لمس
  tb.querySelector("tbody").onclick = e => {
    const td = e.target.closest("td.mk"); if (!td) return;
    const tr = td.parentElement, n = tr.dataset.n, s = c.sessions.find(x => x.id === td.dataset.s);
    const m = NEXT[s.marks[n] || "A"]; s.marks[n] = m; save();
    td.className = "mk m" + m; td.textContent = MARK[m];
    tr.querySelector("td.tot").textContent = `${fa(att(n))}/${fa(ss.length)}`;
    tr.classList.toggle("red", abs(n) > limit);
    tb.querySelector(`[data-f="${s.id}"]`).textContent = fa(names.filter(x => "PL".includes(s.marks[x] || "A")).length);
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
