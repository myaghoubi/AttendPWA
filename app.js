"use strict";
/* حضور و غیاب — PWA، مرحلهٔ ۱: اسکلت، دروس، افراد، پشتیبان‌گیری */
const $ = s => document.querySelector(s);
const bar = $("#bar"), page = $("#page"), dlg = $("#dlg");
const ACCENTS = ["primary", "ok", "warn", "danger"];
const IC = {
  back: '<path d="M9 6l6 6-6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/>',
  sync: '<path d="M20 7v5h-5M4 17v-5h5M5.5 9A7 7 0 0 1 18 7.5L20 12M18.5 15A7 7 0 0 1 6 16.5L4 12"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
};
Object.assign(IC, {
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
  exit: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10"/>',
  bag: '<path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0"/>',
  chart: '<path d="M7 20V12M12 20V5M17 20v-9M4 20h16"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="10" r="2.5"/><path d="M7.5 17c.8-2.3 2.4-3.3 4.5-3.3s3.7 1 4.5 3.3"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c3 2.5 9 2.5 12 0v-4.5M22 9v6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14c2 .6 3.2 2.4 3.2 5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  down: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  undo: '<path d="M4 9h10a5 5 0 0 1 0 10H8M4 9l4-4M4 9l4 4"/>',
});
const icon = n => `<svg viewBox="0 0 24 24">${IC[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fa = n => isEn() ? String(n) : String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

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

function pickName(c, x) {                    // نام جدید بنویس یا از افراد تعریف‌شده انتخاب کن
  return new Promise(res => {
    const ppl = c.people, img = x?.s?.[0]?.t;
    dlg.innerHTML = `<h2 style="text-align:center">نام فرد</h2>
      ${img ? `<div style="display:flex;justify-content:center;margin:6px 0 10px"><img src="${img}" alt="" style="width:min(56vw,190px);aspect-ratio:1;object-fit:cover;border-radius:18px;box-shadow:var(--shadow)"></div>` : ""}
      <div class="muted" style="text-align:center">نام تازه بنویس یا از فهرست افراد انتخاب کن؛ نمونه‌ها به همان فرد اضافه می‌شود.</div>
      <div style="display:flex;gap:8px;margin-top:12px"><input type="text" id="dv" placeholder="نام جدید…" autocomplete="off" style="flex:1;min-width:0;box-shadow:none;background:var(--card2)">
      ${ppl.length ? `<button class="btn soft" id="pll" style="white-space:nowrap">انتخاب از لیست</button>` : ""}</div>
      <div id="pkl" style="display:none;flex-direction:column;gap:6px;max-height:34vh;overflow:auto;margin-top:10px"></div>
      <div class="row"><button class="btn soft" data-r="0">انصراف</button><button class="btn" data-r="1">ثبت</button></div>`;
    const done = v => { dlg.close(); res(v); };
    const inp = $("#dv"), pk = $("#pkl");
    const draw = () => {
      const q = inp.value.trim(), l = ppl.filter(n => !q || n.includes(q));
      pk.innerHTML = l.map(n => `<button class="btn soft" data-n="${esc(n)}" style="justify-content:flex-start;text-align:start;padding:9px 12px">${esc(n)}</button>`).join("");
      pk.querySelectorAll("[data-n]").forEach(b => b.onclick = () => done(b.dataset.n));
    };
    inp.oninput = () => { if (pk.style.display !== "none") draw(); };
    if ($("#pll")) $("#pll").onclick = () => { const on = pk.style.display === "none"; pk.style.display = on ? "flex" : "none"; if (on) { draw(); pk.scrollIntoView({block: "nearest"}); } };
    dlg.querySelectorAll("[data-r]").forEach(b => b.onclick = () => done(b.dataset.r === "1" ? inp.value.trim() : null));
    inp.onkeydown = e => { if (e.key === "Enter") done(inp.value.trim()); };
    dlg.oncancel = () => res(null);
    dlg.showModal();
  });
}

/* ---------- مسیریابی ---------- */
const go = h => { location.hash = h; };
function setBar(title, {back, sub, right = "", acc} = {}) {
  if (acc) { bar.dataset.acc = acc; bar.style.setProperty("--acc", `var(--${acc})`); bar.style.setProperty("--on-acc", `var(--on-${acc})`); }
  else { delete bar.dataset.acc; }
  bar.innerHTML = (back ? `<button class="ib" id="bk" aria-label="بازگشت">${icon("back")}</button>` : "") +
    `<h1>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}</h1>${right}<button class="ib" id="mn" aria-label="منو"><svg viewBox="0 0 24 24" class="ham" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/></svg></button>`;
  if (back) $("#bk").onclick = () => go(back);
  $("#mn").onclick = () => $("#drawer").classList.contains("open") ? closeMenu() : openMenu();
  $("#mn").classList.toggle("open", $("#drawer").classList.contains("open"));
}
function show(html) { page.innerHTML = html; page.classList.remove("page-in"); void page.offsetWidth; page.classList.add("page-in"); window.scrollTo(0, 0); }
const course = id => S.courses.find(c => c.id === id);

function route() {
  closeMenu(); renderDock();
  Face.stopCam();                                        // دوربین فقط در صفحهٔ خودش روشن است
  const p = location.hash.replace(/^#\/?/, "").split("/");
  if (p[0] === "c" && course(p[1])) {
    if (p[2] === "people") return viewPeople(course(p[1]));
    if (p[2] === "face") return viewEnroll(course(p[1]), +p[3]);
    if (p[2] === "attend") return viewAttend(course(p[1]));
    if (p[2] === "records") return viewRecords(course(p[1]));
    return viewCourse(course(p[1]));
  }
  if (p[0] === "activate") return viewActivate();
  if (p[0] === "reseller") return viewReseller();
  if (p[0] === "settings") return viewSettings();
  if (p[0] === "vision") return viewVision();
  if (p[0] === "about") return viewAbout();
  if (p[0] === "moodle") return p[1] === "sync" ? viewMdSync(p[2], p[3]) : viewMoodle();
  return viewCourses();
}

/* ---------- بازیابی حذف‌شده‌ها (یک ساعت) و منوی اصلی ---------- */
const HOLD = 3600e3;
const KIND = {course: "درس", person: "فرد", session: "جلسه", unknown: "ناشناس"};
function trashPurge() {
  const k = S.settings?.undoK ?? 1;
  S.trash = (S.trash || []).filter(e => Date.now() - e.t < HOLD);
  if (S.trash.length > k) S.trash = k ? S.trash.slice(-k) : [];
}
function trashAdd(kind, label, data) {
  const e = {id: uid(), kind, label, data, t: Date.now()}; (S.trash = S.trash || []).push(e); trashPurge(); save();
  renderDock();
  if (S.trash.includes(e)) toast(`«${label}» حذف شد`, () => trashRestore(e.id)); else toast(`«${label}» حذف شد`);
}
function trashRestore(id) {
  trashPurge(); const e = S.trash.find(x => x.id === id); if (!e) return toast("زمان بازیابی گذشته است");
  const d = e.data;
  if (e.kind === "course") S.courses.splice(Math.min(d.i, S.courses.length), 0, d.c);
  else {
    const c = course(d.cid || d.c);
    if (!c) return toast("درس این مورد دیگر وجود ندارد");
    if (e.kind === "person") {
      if (!c.people.includes(d.n) && demoBlocks(c.people.length + 1)) return;
      c.people.splice(Math.min(d.i, c.people.length), 0, d.n);
      if (d.fs) (c.faces = c.faces || {})[d.n] = d.fs;
      (c.sessions || []).forEach(s => { if (d.marks[s.id] !== undefined) s.marks[d.n] = d.marks[s.id]; });
    } else if (e.kind === "unknown") (c.unknown = c.unknown || []).splice(Math.min(d.i, c.unknown.length), 0, d.u);
    else (c.sessions = c.sessions || []).splice(Math.min(d.i, c.sessions.length), 0, d.s);
  }
  S.trash = S.trash.filter(x => x !== e); save(); closeMenu(); toast("بازیابی شد"); route();
}
function menuHtml() {
  trashPurge();
  const dr = $("#drawer"), left = S.trash.slice().reverse(), md = mdc();
  const ring = e => { const rem = Math.max(0, HOLD - (Date.now() - e.t)), m = Math.ceil(rem / 60000);
    return `<span class="ring" style="--p:${Math.round(rem / HOLD * 360)}deg"><i>${fa(m)}</i></span>`; };
  const item = (h, ic, ac, t, s = "") => `<button class="mi${cur(h)}" data-h="${h}"><span class="mico" style="--ac:var(--${ac})">${icon(ic)}</span><span class="mt">${t}${s ? `<small>${s}</small>` : ""}</span></button>`;
  const u = md.on && md.user;
  const who = u ? `<div class="mu"><b>${esc(u.fullname || "")}</b><small>${esc(u.username || "")}</small><small>${esc(u.sitename || "")}</small><small dir="ltr">${esc(u.siteurl || md.url || "")}</small></div>` : "";   // مودل قطع: کادر کاربر نیست
  const cur = h => (location.hash || "#/") === h ? " cur" : "";
  const hp = (location.hash || "#/").replace(/^#\/?/, "").split("/"), cc = hp[0] === "c" ? course(hp[1]) : null, sub = hp[2] || "";
  const tn = (h, ic, ac, t, on, lvl) => `<button class="mi tr tr${lvl}${on ? " cur" : ""}" data-h="${h}"><span class="mico" style="--ac:var(--${ac})">${icon(ic)}</span><span class="mt">${t}</span></button>`;
  const tree = cc ? `<div class="tree">${tn("#/c/" + cc.id, "book", cc.acc, esc(cc.name), !sub, 1)}<div class="tree">`
    + tn(`#/c/${cc.id}/people`, "users", "primary", "تعریف افراد", sub === "people" || sub === "face", 2)
    + tn(`#/c/${cc.id}/attend`, "cam", "ok", "حضور و غیاب", sub === "attend", 2)
    + tn(`#/c/${cc.id}/records`, "list", "warn", "سوابق حضور", sub === "records", 2)
    + (mdReady() ? tn(`#/moodle/sync/${cc.id}`, "sync", "primary", "همگام‌سازی با مودل", false, 2) : "") + `</div></div>` : "";
  dr.innerHTML = `<div class="scrim"></div><nav>
    <div class="nh">حضور و غیاب تصویری</div>${who}${who ? `<div class="hr"></div>` : ""}
    ${item("#/", "book", "primary", "فهرست دروس من")}${tree}<div class="hr"></div>
    ${item("#/settings", "sliders", "primary", "تنظیمات برنامه")}${item("#/vision", "scan", "ok", "شناسایی چهره")}${item("#/moodle", "cap", "warn", "تنظیمات اتصال به مودل")}
    ${item("#/settings", "down", "ok", "پشتیبان‌گیری و بازیابی از فایل")}
    ${left.length ? `<div class="section">بازیابی</div>` + left.map(e => `<button class="mi" data-r="${e.id}"><span class="mico" style="--ac:var(--danger)">${icon("undo")}</span><span class="mt">برگردان ${KIND[e.kind]}<small>${esc(e.label)}</small></span>${ring(e)}</button>`).join("") : ""}
    <div class="hr"></div>${item("#/activate", "key", licensed() ? "ok" : "warn", licensed() ? "برنامه فعال است ✓" : "فعال‌سازی برنامه")}${licensed() ? item("#/reseller", "bag", "primary", "همکاری در فروش") : ""}${item("#/about", "info", "primary", "درباره ما")}<button class="mi" id="mexit"><span class="mico" style="--ac:var(--danger)">${icon("exit")}</span><span class="mt">خروج</span></button>
    </nav>`;
  dr.querySelector(".scrim").onclick = closeMenu;
  dr.querySelector("#mexit").onclick = exitApp;
  dr.querySelectorAll("[data-h]").forEach(b => b.onclick = () => { closeMenu(); go(b.dataset.h); });
  dr.querySelectorAll("[data-r]").forEach(b => b.onclick = () => trashRestore(b.dataset.r));
}
async function exitApp() {
  closeMenu(); save();
  if (!(await ask({title: "خروج", text: "از برنامه خارج شوی؟", ok: "خروج", danger: true}))) return;
  window.close();                                       // مرورگر فقط پنجره‌هایی را که خودش باز کرده می‌بندد
  setTimeout(() => toast("این دستگاه خروج از برنامه را نمی‌پذیرد؛ برنامه را از فهرست برنامه‌های اخیر ببند"), 400);
}
const isLand = () => matchMedia("(orientation:landscape)").matches;
function openMenu() { menuHtml(); document.documentElement.style.setProperty("--bh", bar.offsetHeight + "px"); $("#drawer").classList.add("open"); document.body.classList.add("menu-open");
  const mn = $("#mn"), dr = $("#drawer"); dr.querySelector(".hamx")?.remove();
  if (mn && !isLand()) {                                // ضربدر بالای منو، دقیقاً جای دکمهٔ همبرگری
    const r = mn.getBoundingClientRect(), x = document.createElement("button");
    x.className = "hamx"; x.setAttribute("aria-label", "بستن منو"); x.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    x.innerHTML = mn.innerHTML; x.onclick = closeMenu; dr.appendChild(x);
    requestAnimationFrame(() => requestAnimationFrame(() => x.classList.add("open")));
  } else mn?.classList.add("open");
}
function renderDock() { if (isLand()) menuHtml(); }          // حالت افقی: منو همیشه سمت راست قفل است
matchMedia("(orientation:landscape)").addEventListener?.("change", () => { closeMenu(); if (isLand()) menuHtml(); if (/^(#\/?|#\/c\/[^/]+)$/.test(location.hash)) route(); });
setInterval(() => { if (isLand() && !document.hidden) menuHtml(); }, 30000);
function closeMenu() { $("#drawer").classList.remove("open"); document.body.classList.remove("menu-open"); $("#mn")?.classList.remove("open"); const x = $("#drawer .hamx"); if (x) { x.classList.remove("open"); setTimeout(() => x.remove(), 280); } }

/* ---------- دروس ---------- */
const chartsOn = () => !isLand() || S.settings.landCharts;               // عمودی: همیشه؛ افقی: فقط وقتی کلید نمودار روشن است
const chartBtn = () => `<button class="ib land-only${S.settings.landCharts ? " on" : ""}" id="cht" aria-label="نمودار">${icon("chart")}</button>`;
function bindChartBtn() { const b = $("#cht"); if (b) b.onclick = () => { S.settings.landCharts = !S.settings.landCharts; save(); route(); }; }
function coursesChart() {
  if (!S.courses.length) return "";
  const st = S.courses.map(c => [c.people.length, (c.sessions || []).length]), mx = Math.max(1, ...st.map(x => x[0]));
  const grp = S.courses.map((c, i) => { const [n, s] = st[i], h = Math.min(s * 6, 92), step = s ? h / s : 6;
    return `<div class="cc" style="--accent:var(--${c.acc})"><div class="ccb">
      <div class="cx"><em>${n ? fa(n) : fa(0)}</em><i class="sb" style="height:${n / mx * 100}%"></i></div>
      <div class="cx"><em>${fa(s)}</em><i class="sl" style="height:${h}px;--st:${step}px"></i></div></div><div class="cn">${esc(c.name)}</div></div>`; }).join("");
  return `<div class="chart full"><div class="ct">دانشجویان و جلسات هر درس</div>
    <div class="cl"><span><i class="sq" style="background:var(--muted)"></i>دانشجو</span><span><i class="sq sqL"></i>جلسه</span></div>
    <div class="cb cbc">${grp}</div></div>`;
}
function viewCourses() {
  setBar("دروس", {right: chartBtn() + (mdReady() ? `<button class="ib" id="msy" aria-label="همگام‌سازی با مودل">${icon("sync")}</button>` : "") + `<button class="ib" id="add" aria-label="درس جدید">${icon("plus")}</button>`});
  if ($("#msy")) $("#msy").onclick = () => go("#/moodle/sync/courses");
  $("#add").onclick = newCourse; bindChartBtn();
  show((chartsOn() ? coursesChart() : "") + (S.courses.length ? S.courses.map(c => `
    <div class="card" data-id="${c.id}" style="--accent:var(--${c.acc})">
      <div class="stripe"></div>
      <div class="txt"><div class="t">${esc(c.name)}</div><div class="s">${fa(c.people.length)} نفر</div></div>
      <div class="act"><button class="mini" data-a="ren" aria-label="ویرایش نام">${icon("edit")}</button>
      <button class="mini del" data-a="del" aria-label="حذف">${icon("trash")}</button></div>
    </div>`).join("") : `<div class="empty">هنوز درسی نیست.<br>با دکمهٔ + بالای صفحه یک درس بساز.</div>`));
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
  await fxRemove(page.querySelector(`.card[data-id="${c.id}"]`));
  S.courses.splice(i, 1); trashAdd("course", c.name, {c, i}); route();
}

/* ---------- صفحهٔ درس ---------- */
function sessionChart(c, last = 12) {
  const ss = [...(c.sessions || [])].sort((x, y) => x.t - y.t).slice(-last);
  if (!ss.length || !c.people.length) return "";
  const cnt = ss.map(s => { const o = {P: 0, L: 0, A: 0}; c.people.forEach(n => { const m = s.marks[n] || "A"; o[m === "E" ? "A" : m]++; }); return o; });
  const mx = Math.max(1, ...cnt.map(o => Math.max(o.P, o.L, o.A)));
  const bar = (n, k) => `<i class="b b${k}" style="height:${Math.round(n / mx * 100)}%"><em>${n ? fa(n) : ""}</em></i>`;
  return `<div class="chart full"><div class="ct">حضور در جلسات${(c.sessions || []).length > last ? ` · آخرین ${fa(last)} جلسه` : ""}</div>
    <div class="cl"><span><i class="sq bP"></i>حاضر</span><span><i class="sq bL"></i>تأخیر</span><span><i class="sq bA"></i>غایب</span><span>${fa(c.people.length)} دانشجو</span><span>${fa((c.sessions || []).length)} جلسه</span></div>
    <div class="cb">${cnt.map(o => `<div class="cg">${bar(o.P, "P")}${bar(o.L, "L")}${bar(o.A, "A")}</div>`).join("")}</div></div>`;
}
function viewCourse(c) {
  setBar(c.name, {back: "#/", acc: c.acc, right: chartBtn()}); bindChartBtn();
  const card = (key, t, s, acc) => `<button class="card" data-go="${key}" style="--accent:var(--${acc})">
    <div class="stripe"></div><div class="txt"><div class="t">${t}</div><div class="s">${s}</div></div></button>`;
  show((chartsOn() ? sessionChart(c) : "") + card("people", "تعریف افراد", `${fa(c.people.length)} نفر`, "primary") +
       card("attend", "حضور و غیاب", "شناسایی حاضرین از روی دوربین یا عکس", "ok") +
       card("records", "سوابق حضور", `${fa((c.sessions || []).length)} جلسه`, "warn") +
       (mdReady() ? card("msync", "همگام‌سازی با مودل", c.md?.id ? "این درس به مودل وصل است" : "هنوز وصل نیست", "primary") : ""));
  page.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go === "msync" ? `#/moodle/sync/${c.id}` : `#/c/${c.id}/${b.dataset.go}`));
}
const APP_URL = "https://myaghoubi.github.io/AttendPWA/";
function showQr() {                                    // کد QR نشانی برنامه (کاملاً آفلاین ساخته می‌شود)
  const q = qrcode(0, "M"); q.addData(APP_URL); q.make();
  dlg.innerHTML = `<h2 style="text-align:center">دانلود برنامه</h2>
    <div class="muted" style="text-align:center">این کد را با دوربین گوشی اسکن کن تا برنامه باز شود.</div>
    <div id="qrbox" style="background:#fff;border-radius:14px;padding:6px;margin:12px auto;width:min(78vw,280px)">${q.createSvgTag({cellSize: 4, margin: 2, scalable: true})}</div>
    <div dir="ltr" style="text-align:center;font-size:13px;word-break:break-all;user-select:all">${APP_URL}</div>
    <div class="row"><button class="btn soft" data-r="0">بستن</button><button class="btn" data-r="1">کپی نشانی</button></div>`;
  dlg.querySelector("svg").style.cssText = "width:100%;height:auto;display:block";
  dlg.querySelectorAll("button").forEach(b => b.onclick = async () => {
    if (b.dataset.r === "1") { try { await navigator.clipboard.writeText(APP_URL); toast("نشانی کپی شد"); } catch (e) { toast(APP_URL); } } else dlg.close();
  });
  dlg.oncancel = () => {}; dlg.showModal();
}
const relNote = r => (isEn() ? r.en : r.fa) || "";
function viewAbout() {
  setBar("درباره ما", {back: "#/"});
  const cur = RELEASES[0];
  show(`<div class="about">${logoHtml(96)}
    <h2>سامانه حضور و غیاب تصویری</h2>
    <p class="muted">ایده‌پردازی و طراحی در پژوهشکدهٔ هوش مصنوعی دانشگاه گلستان</p><p class="muted">آبان ۱۴۰۵</p>
    <div id="dev" hidden><div class="vcard" style="text-align:center"><b>درباره توسعه‌دهنده</b><div>مهدی یعقوبی</div><div class="muted">گروه مهندسی کامپیوتر</div><div class="muted">دانشگاه گلستان</div>
      <div class="muted" dir="ltr">mehdi.yaghoubi@gmail.com</div><div class="muted">همکار توسعه: Claude (Anthropic) · دستیار هوش مصنوعی</div></div></div>
    <button class="btn soft" id="qrb" style="width:100%;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px"><span class="mico" style="--ac:var(--primary)">${icon("qr")}</span>دانلود برنامه (کد QR)</button>
    <div class="vcard upd"><b>بروزرسانی برنامه</b>
      <div class="muted">نسخهٔ نصب‌شده: <span dir="ltr">${esc(APP_VERSION)}</span>${cur ? ` · <span dir="ltr">${esc(cur.date)}</span>` : ""}</div>
      ${cur ? `<div class="muted">${esc(relNote(cur))}</div>` : ""}
      <button class="btn" id="up">بررسی بروزرسانی</button><div id="us" class="muted"></div>
      <details><summary>تاریخچهٔ نسخه‌ها</summary>${RELEASES.map(r => `<div class="rel"><b dir="ltr">${esc(r.v)}</b> <span class="muted" dir="ltr">${esc(r.date)}</span>
        <div class="muted">${esc(relNote(r))}</div><div class="fl" dir="ltr">${r.files.map(esc).join(" · ")}</div></div>`).join("")}</details></div></div>`);
  $("#up").onclick = checkUpdate; logoPlay($("#lg"));
  $("#qrb").onclick = showQr;
  let taps = 0, tt = 0;                                  // ۷ بار لمس لوگو: اطلاعات توسعه‌دهنده
  $("#lg").onclick = () => {
    const now = Date.now(); taps = now - tt > 2500 ? 1 : taps + 1; tt = now;
    if (taps >= 7) { $("#dev").hidden = false; $("#dev").scrollIntoView({behavior: "smooth", block: "nearest"}); }
  };
}
async function checkUpdate() {
  const us = $("#us"), up = $("#up"); us.textContent = "در حال بررسی…"; up.disabled = true;
  let R;
  try {
    const t = await (await fetch("version.js?t=" + Date.now(), {cache: "no-store"})).text();
    R = new Function(t + ";return {v: APP_VERSION, rel: RELEASES, all: APP_FILES};")();
  } catch (e) { us.textContent = "آفلاین یا سرور در دسترس نیست"; up.disabled = false; return; }
  up.disabled = false;
  if (R.v === APP_VERSION) { us.textContent = "نسخهٔ شما به‌روز است"; return; }
  const i = R.rel.findIndex(r => r.v === APP_VERSION);
  const files = [...new Set(i >= 0 ? R.rel.slice(0, i).flatMap(r => r.files) : R.all)];
  us.innerHTML = `<b>نسخهٔ جدید موجود است: <span dir="ltr">${esc(R.v)}</span></b><div>${esc(relNote(R.rel[0]))}</div>
    <div>فایل‌های تغییر کرده (${fa(files.length)}):</div><div class="fl" dir="ltr">${files.map(esc).join(" · ")}</div>
    <button class="btn" id="go2" style="margin-top:8px">دانلود و نصب</button><div id="pg"></div>`;
  $("#go2").onclick = async () => {
    $("#go2").disabled = true; const pg = $("#pg"), got = [];
    try {
      for (const f of files) {
        if (f === "sw.js") continue;
        pg.textContent = `در حال دانلود ${fa(got.length + 1)}/${fa(files.length)}: ${f}`;
        const r = await fetch(f + "?v=" + encodeURIComponent(R.v), {cache: "reload"});
        if (!r.ok) throw new Error(f + " (" + r.status + ")");
        got.push([f, r.headers.get("content-type") || "", await r.blob()]);
      }
      const c = await caches.open("attendance-files");
      for (const [f, ct, b] of got) {                      // همه با هم نوشته می‌شوند تا نسخهٔ ناقص ایجاد نشود
        const mk = () => new Response(b, {headers: {"content-type": ct}});
        await c.put(new Request(f), mk()); if (f === "index.html") await c.put(new Request("./"), mk());
      }
      (await navigator.serviceWorker?.getRegistration())?.update();
      pg.textContent = "بروزرسانی انجام شد؛ برنامه دوباره باز می‌شود…"; setTimeout(() => location.reload(), 900);
    } catch (e) { pg.textContent = "بروزرسانی ناموفق بود (اینترنت؟): " + e.message; $("#go2").disabled = false; }
  };
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
      const v = await pickName(c, x);
      if (!v) return;
      const j = c.unknown.findIndex(y => y.id === x.id); if (j < 0) return;
      if (!c.people.includes(v) && demoBlocks(c.people.length + 1)) return;
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
        if (v && v !== n) { if (c.people.includes(v)) return toast("این نام قبلاً هست"); renamePerson(c, n, v); draw(); }
      } else {
        deletePerson(c, n); draw();
      }
    });
  };
  const add = () => {
    const v = $("#nm").value.trim();
    if (!v) return;
    if (c.people.includes(v)) return toast("این نام قبلاً هست");
    if (demoBlocks(c.people.length + 1)) return;
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

/* ---------- شروع ---------- */
(async function init() {
  await Store.open();
  const d = await Store.get("state");
  if (d && Array.isArray(d.courses)) S = {v: 1, ...d};
  normSettings(); applyTheme(); applyLang();
  await licInit();
  integrityCheck(); setInterval(integrityCheck, 600000); addEventListener("visibilitychange", () => !document.hidden && integrityCheck());
  navigator.storage?.persist?.();                       // جلوگیری از پاک شدن خودکار داده‌ها
  addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
