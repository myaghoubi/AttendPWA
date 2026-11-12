"use strict";
/* حضور و غیاب — PWA، مرحلهٔ ۱: اسکلت، دروس، افراد، پشتیبان‌گیری */
const $ = s => document.querySelector(s);
const bar = $("#bar"), page = $("#page"), dlg = $("#dlg");
const ACCENTS = ["primary", "ok", "warn", "danger"];
const IC = {
  back: '<path d="M9 6l6 6-6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
};
const icon = n => `<svg viewBox="0 0 24 24">${IC[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fa = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

/* ---------- ذخیره‌سازی: IndexedDB (در صورت نبود: localStorage) ---------- */
const Store = {
  db: null,
  async open() {
    try {
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open("attendance", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    } catch (e) { this.db = null; }
  },
  async get(k) {
    if (this.db) return new Promise(res => {
      const q = this.db.transaction("kv").objectStore("kv").get(k);
      q.onsuccess = () => res(q.result); q.onerror = () => res(undefined);
    });
    try { return JSON.parse(localStorage.getItem("att_" + k)); } catch (e) { return undefined; }
  },
  async set(k, v) {
    if (this.db) return new Promise(res => {
      const t = this.db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k);
      t.oncomplete = () => res(); t.onerror = () => res();
    });
    try { localStorage.setItem("att_" + k, JSON.stringify(v)); } catch (e) {}
  },
};
let S = {v: 1, courses: [], settings: {theme: "system"}};
function save() { Store.set("state", S); }   // داده کوچک است: هر تغییر بلافاصله نوشته می‌شود
addEventListener("pagehide", save);
addEventListener("visibilitychange", () => document.hidden && save());

/* ---------- ظاهر ---------- */
function applyTheme() {
  const t = S.settings.theme;
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

let toastT = null;
function toast(msg, undo) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>` + (undo ? `<button>برگردان</button>` : "");
  t.classList.add("show");
  if (undo) t.querySelector("button").onclick = () => { undo(); t.classList.remove("show"); };
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), undo ? 7000 : 2600);
}
function ask({title, text, input, ok = "تأیید", danger = false}) {
  return new Promise(res => {
    dlg.innerHTML = `<h2>${esc(title)}</h2>${text ? `<div class="muted">${esc(text)}</div>` : ""}
      ${input !== undefined ? `<input type="text" id="dv" value="${esc(input)}" style="width:100%;margin-top:12px;box-shadow:none;background:var(--card2)">` : ""}
      <div class="row"><button class="btn soft" data-r="0">انصراف</button><button class="btn ${danger ? "danger" : ""}" data-r="1">${esc(ok)}</button></div>`;
    const done = v => { dlg.close(); res(v); };
    dlg.querySelectorAll("button").forEach(b => b.onclick = () => done(b.dataset.r === "1" ? (input !== undefined ? $("#dv").value.trim() : true) : null));
    dlg.oncancel = () => res(null);
    dlg.showModal();
    if (input !== undefined) { const i = $("#dv"); i.focus(); i.select(); i.onkeydown = e => { if (e.key === "Enter") done(i.value.trim()); }; }
  });
}

/* ---------- مسیریابی ---------- */
const go = h => { location.hash = h; };
function setBar(title, {back, sub, right = "", acc} = {}) {
  bar.style.background = acc ? `var(--${acc})` : "";
  if (acc && document.documentElement.dataset.theme === "dark") bar.style.background = "";
  bar.innerHTML = (back ? `<button class="ib" id="bk" aria-label="بازگشت">${icon("back")}</button>` : "") +
    `<h1>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}</h1>${right}<button class="ib" id="mn" aria-label="منو">${icon("menu")}</button>`;
  if (back) $("#bk").onclick = () => go(back);
  $("#mn").onclick = openMenu;
}
function show(html) { page.innerHTML = html; page.classList.remove("page-in"); void page.offsetWidth; page.classList.add("page-in"); window.scrollTo(0, 0); }
const course = id => S.courses.find(c => c.id === id);

function route() {
  closeMenu();
  Face.stopCam();                                        // دوربین فقط در صفحهٔ خودش روشن است
  const p = location.hash.replace(/^#\/?/, "").split("/");
  if (p[0] === "c" && course(p[1])) {
    if (p[2] === "people") return viewPeople(course(p[1]));
    if (p[2] === "face") return viewEnroll(course(p[1]), +p[3]);
    if (p[2] === "attend") return viewAttend(course(p[1]));
    if (p[2] === "records") return viewRecords(course(p[1]));
    return viewCourse(course(p[1]));
  }
  if (p[0] === "settings") return viewSettings();
  return viewCourses();
}

/* ---------- بازیابی حذف‌شده‌ها (یک ساعت) و منوی اصلی ---------- */
const HOLD = 3600e3;
const KIND = {course: "درس", person: "فرد", session: "جلسه", unknown: "ناشناس"};
function trashPurge() { S.trash = (S.trash || []).filter(e => Date.now() - e.t < HOLD); }
function trashAdd(kind, label, data) {
  trashPurge(); const e = {id: uid(), kind, label, data, t: Date.now()}; S.trash.push(e); save();
  toast(`«${label}» حذف شد`, () => trashRestore(e.id));
}
function trashRestore(id) {
  trashPurge(); const e = S.trash.find(x => x.id === id); if (!e) return toast("زمان بازیابی گذشته است");
  const d = e.data;
  if (e.kind === "course") S.courses.splice(Math.min(d.i, S.courses.length), 0, d.c);
  else {
    const c = course(d.cid || d.c);
    if (!c) return toast("درس این مورد دیگر وجود ندارد");
    if (e.kind === "person") {
      c.people.splice(Math.min(d.i, c.people.length), 0, d.n);
      if (d.fs) (c.faces = c.faces || {})[d.n] = d.fs;
      (c.sessions || []).forEach(s => { if (d.marks[s.id] !== undefined) s.marks[d.n] = d.marks[s.id]; });
    } else if (e.kind === "unknown") (c.unknown = c.unknown || []).splice(Math.min(d.i, c.unknown.length), 0, d.u);
    else (c.sessions = c.sessions || []).splice(Math.min(d.i, c.sessions.length), 0, d.s);
  }
  S.trash = S.trash.filter(x => x !== e); save(); closeMenu(); toast("بازیابی شد"); route();
}
function openMenu() {
  trashPurge();
  const dr = $("#drawer"), left = S.trash.slice().reverse();
  const ring = e => { const rem = Math.max(0, HOLD - (Date.now() - e.t)), m = Math.ceil(rem / 60000);
    return `<span class="ring" style="--p:${Math.round(rem / HOLD * 360)}deg"><i>${fa(m)}</i></span>`; };
  const item = (h, t, extra = "", s = "") => `<button class="mi" data-h="${h}"><span class="mt">${t}${s ? `<small>${s}</small>` : ""}</span>${extra}</button>`;
  dr.innerHTML = `<div class="scrim"></div><nav>
    <div class="nh">حضور و غیاب</div>
    ${item("#/", "دروس")}${item("#/settings", "تنظیمات")}${item("#/settings", "پشتیبان‌گیری و بازیابی از فایل")}
    ${left.length ? `<div class="section">بازیابی</div>` + left.map(e => `<button class="mi" data-r="${e.id}"><span class="mt">برگردان ${KIND[e.kind]}<small>${esc(e.label)}</small></span>${ring(e)}</button>`).join("") : ""}
    </nav>`;
  dr.classList.add("open");
  dr.querySelector(".scrim").onclick = closeMenu;
  dr.querySelectorAll("[data-h]").forEach(b => b.onclick = () => { closeMenu(); go(b.dataset.h); });
  dr.querySelectorAll("[data-r]").forEach(b => b.onclick = () => trashRestore(b.dataset.r));
}
function closeMenu() { $("#drawer").classList.remove("open"); }

/* ---------- دروس ---------- */
function viewCourses() {
  setBar("دروس", {right: `<button class="ib" id="add" aria-label="درس جدید">${icon("plus")}</button>`});
  $("#add").onclick = newCourse;
  show(S.courses.length ? S.courses.map(c => `
    <div class="card" data-id="${c.id}" style="--accent:var(--${c.acc})">
      <div class="stripe"></div>
      <div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${fa(c.people.length)} نفر</div></div>
      <div class="act"><button class="mini" data-a="ren" aria-label="ویرایش نام">${icon("edit")}</button>
      <button class="mini del" data-a="del" aria-label="حذف">${icon("trash")}</button></div>
    </div>`).join("") : `<div class="empty">هنوز درسی نیست.<br>با دکمهٔ + بالای صفحه یک درس بساز.</div>`);
  page.querySelectorAll(".card").forEach(el => el.onclick = async e => {
    const id = el.dataset.id, a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "ren") return renameCourse(course(id));
    if (a === "del") return delCourse(course(id));
    go("#/c/" + id);
  });
}
async function newCourse() {
  const n = await ask({title: "درس جدید", input: "", ok: "ساخت"});
  if (!n) return;
  S.courses.push({id: uid(), name: n, acc: ACCENTS[S.courses.length % ACCENTS.length], people: []});
  save(); route();
}
async function renameCourse(c) {
  const n = await ask({title: "نام درس", input: c.name, ok: "ذخیره"});
  if (n) { c.name = n; save(); route(); }
}
async function delCourse(c) {
  if (!await ask({title: "حذف درس", text: `درس «${c.name}» با همهٔ افرادش حذف شود؟`, ok: "حذف", danger: true})) return;
  const i = S.courses.indexOf(c);
  S.courses.splice(i, 1); trashAdd("course", c.name, {c, i}); route();
}

/* ---------- صفحهٔ درس ---------- */
function viewCourse(c) {
  setBar(c.name, {back: "#/", acc: c.acc});
  const card = (key, t, s, acc, on) => `<button class="card ${on ? "" : "off"}" data-go="${key}" style="--accent:var(--${acc})">
    <div class="stripe"></div><div class="txt"><div class="t">${t}${on ? "" : '<span class="soon">به‌زودی</span>'}</div><div class="s">${s}</div></div></button>`;
  show(card("people", "تعریف افراد", `${fa(c.people.length)} نفر`, "primary", true) +
       card("attend", "حضور و غیاب", "تشخیص چهره (آزمایشی)", "ok", true) +
       card("records", "سوابق حضور", `${fa((c.sessions || []).length)} جلسه`, "warn", true));
  page.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(`#/c/${c.id}/${b.dataset.go}`));
}
function viewSoon(c, k) {
  setBar(k === "attend" ? "حضور و غیاب" : "سوابق حضور", {back: "#/c/" + c.id, sub: c.name, acc: c.acc});
  show(`<div class="empty">این بخش در مرحلهٔ بعد اضافه می‌شود.</div>`);
}

/* ---------- افراد ---------- */
function viewPeople(c) {
  setBar("تعریف افراد", {back: "#/c/" + c.id, sub: c.name, acc: "primary"});
  const list = () => c.people.length ? c.people.map((n, i) => `
    <div class="card" style="min-height:64px;cursor:default;--accent:var(--primary)">
      <div class="avatar">${(c.faces?.[n] || [])[0] ? `<img src="${c.faces[n][0].t}" alt="">` : esc([...n][0] || "؟")}</div>
      <div class="txt"><div class="t">${esc(n)}</div><div class="s">${(c.faces?.[n] || []).length ? fa(c.faces[n].length) + " نمونهٔ چهره" : "بدون نمونهٔ چهره"}</div></div>
      <div class="act"><button class="mini" data-a="cam" data-i="${i}" aria-label="نمونهٔ چهره">${icon("cam")}</button>
      <button class="mini" data-a="ren" data-i="${i}">${icon("edit")}</button>
      <button class="mini del" data-a="del" data-i="${i}">${icon("trash")}</button></div></div>`).join("")
    : `<div class="empty">هنوز کسی اضافه نشده.</div>`;
  show(`<div class="row"><input type="text" id="nm" placeholder="نام و نام خانوادگی" autocomplete="off" enterkeyhint="done">
      <button class="btn" id="ad">افزودن</button></div>
    <div class="chips"><div class="chip" data-sm="cam">دوربین زنده</div><div class="chip" data-sm="photo">از عکس</div></div>
    <div id="scan"></div>
    <div id="unk" style="display:flex;flex-direction:column;gap:10px"></div>
    <div class="muted" id="cnt"></div><div id="lst" style="display:flex;flex-direction:column;gap:10px"></div>`);
  const drawUnk = () => {
    const u = c.unknown || [];
    $("#unk").innerHTML = u.length ? `<div class="section">ناشناس‌ها: نام بده تا به فهرست افراد اضافه شوند</div>` + u.map((x, k) => `
      <div class="card" style="min-height:64px;cursor:default;--accent:var(--warn)">
        <div class="avatar">${x.s[0] ? `<img src="${x.s[0].t}" alt="">` : "؟"}</div>
        <div class="txt"><div class="t">بدون نام ${fa(k + 1)}</div><div class="s">${fa(x.s.length)} نمونهٔ چهره</div></div>
        <div class="act"><button class="btn" data-u="${x.id}" data-a="name" style="padding:9px 14px">ثبت نام</button>
        <button class="mini del" data-u="${x.id}" data-a="rm" aria-label="حذف">${icon("trash")}</button></div></div>`).join("") : "";
    $("#unk").querySelectorAll("[data-u]").forEach(b => b.onclick = async () => {
      const i = c.unknown.findIndex(x => x.id === b.dataset.u), x = c.unknown[i]; if (!x) return;
      if (b.dataset.a === "rm") { c.unknown.splice(i, 1); trashAdd("unknown", "ناشناس", {cid: c.id, i, u: x}); return drawUnk(); }
      const v = await ask({title: "نام فرد", text: "اگر این نام قبلاً در فهرست باشد، نمونه‌ها به همان فرد اضافه می‌شود.", input: "", ok: "ثبت"});
      if (!v) return;
      const j = c.unknown.findIndex(y => y.id === x.id); if (j < 0) return;
      c.unknown.splice(j, 1); c.faces = c.faces || {};
      if (!c.people.includes(v)) c.people.push(v);
      c.faces[v] = [...(c.faces[v] || []), ...x.s].slice(0, 10);
      save(); draw(); toast(`«${v}» ثبت شد`);
    });
  };
  const draw = () => {
    drawUnk();
    $("#cnt").textContent = `${fa(c.people.length)} نفر`;
    $("#lst").innerHTML = list();
    $("#lst").querySelectorAll("[data-a]").forEach(b => b.onclick = async () => {
      const i = +b.dataset.i, n = c.people[i];
      if (b.dataset.a === "cam") return go(`#/c/${c.id}/face/${i}`);
      if (b.dataset.a === "ren") {
        const v = await ask({title: "نام", input: n, ok: "ذخیره"});
        if (v && v !== n) { if (c.people.includes(v)) return toast("این نام قبلاً هست"); c.people[i] = v; if (c.faces?.[n]) { c.faces[v] = c.faces[n]; delete c.faces[n]; }
          (c.sessions || []).forEach(s => { if (n in s.marks) { s.marks[v] = s.marks[n]; delete s.marks[n]; } }); save(); draw(); }
      } else {
        const fs = c.faces?.[n], marks = {};
        (c.sessions || []).forEach(s => { if (n in s.marks) { marks[s.id] = s.marks[n]; delete s.marks[n]; } });
        c.people.splice(i, 1); if (c.faces) delete c.faces[n];
        trashAdd("person", n, {cid: c.id, i, n, fs, marks}); draw();
      }
    });
  };
  const add = () => {
    const v = $("#nm").value.trim();
    if (!v) return;
    if (c.people.includes(v)) return toast("این نام قبلاً هست");
    c.people.push(v); save(); $("#nm").value = ""; draw(); $("#nm").focus();
  };
  page.querySelectorAll("[data-sm]").forEach(ch => ch.onclick = () => {
    const on = !ch.classList.contains("on");
    page.querySelectorAll("[data-sm]").forEach(x => x.classList.remove("on"));
    Face.stopCam(); $("#scan").innerHTML = "";
    if (on) { ch.classList.add("on"); scanPanel(c, $("#scan"), ch.dataset.sm, draw); }
  });
  $("#ad").onclick = add;
  $("#nm").onkeydown = e => { if (e.key === "Enter") add(); };
  draw();
}

/* ---------- تنظیمات و پشتیبان ---------- */
let deferredInstall = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; if (location.hash.includes("settings")) viewSettings(); });
function viewSettings() {
  setBar("تنظیمات", {back: "#/"});
  const th = [["system", "خودکار"], ["light", "روشن"], ["dark", "تاریک"]];
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  show(`<div class="section">ظاهر</div>
    <div class="chips">${th.map(([k, t]) => `<div class="chip ${S.settings.theme === k ? "on" : ""}" data-th="${k}">${t}</div>`).join("")}</div>
    <div class="section">هشدار غیبت: ردیف بعد از این تعداد غیبت قرمز می‌شود</div>
    <div class="chips">${[3, 4, 5, 6, 8, 10].map(n => `<div class="chip ${(S.settings.limit ?? 6) === n ? "on" : ""}" data-lim="${n}">${fa(n)}</div>`).join("")}</div>
    <div class="section">پشتیبان‌گیری</div>
    <div class="muted">داده‌ها فقط روی همین دستگاه و در مرورگر ذخیره می‌شوند. برای اطمینان گاهی پشتیبان بگیر.</div>
    <div class="row"><button class="btn" id="ex">دریافت پشتیبان</button><button class="btn soft" id="im">بازیابی از فایل</button></div>
    <input type="file" id="fi" accept="application/json,.json" hidden>
    <div class="section">نصب برنامه</div>
    ${deferredInstall ? `<button class="btn" id="inst">نصب روی این دستگاه</button>` :
      ios ? `<div class="muted">در آیفون: دکمهٔ اشتراک‌گذاری Safari ← «Add to Home Screen».</div>` :
      `<div class="muted">از منوی مرورگر گزینهٔ «نصب برنامه» یا «Add to Home screen» را بزن.</div>`}`);
  page.querySelectorAll("[data-th]").forEach(c => c.onclick = () => { S.settings.theme = c.dataset.th; save(); applyTheme(); viewSettings(); });
  page.querySelectorAll("[data-lim]").forEach(c => c.onclick = () => { S.settings.limit = +c.dataset.lim; save(); viewSettings(); });
  $("#ex").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], {type: "application/json"}));
    a.download = "attendance-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $("#im").onclick = () => $("#fi").click();
  $("#fi").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!Array.isArray(d.courses)) throw 0;
      if (!await ask({title: "بازیابی", text: "داده‌های فعلی با این پشتیبان جایگزین می‌شوند.", ok: "جایگزین کن", danger: true})) return;
      S = {v: 1, settings: {theme: "system"}, ...d}; save(); applyTheme(); toast("بازیابی شد"); go("#/");
    } catch (_) { toast("فایل پشتیبان معتبر نیست"); }
  };
  if (deferredInstall) $("#inst").onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; viewSettings(); };
}

/* ---------- شروع ---------- */
(async function init() {
  await Store.open();
  const d = await Store.get("state");
  if (d && Array.isArray(d.courses)) S = {v: 1, settings: {theme: "system"}, ...d};
  applyTheme();
  navigator.storage?.persist?.();                       // جلوگیری از پاک شدن خودکار داده‌ها
  addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
