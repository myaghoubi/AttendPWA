"use strict";
/* تنظیمات برنامه: تم‌ها، ظاهر، حالت افقی، پارامترهای شناسایی چهره، پشتیبان‌گیری */
const DEFAULTS = {theme: "system", lang: "fa", landCharts: false, beep: true, cal: "jalali", limit: 6, landCols: 2, undoK: 1, nameW: 140, vp: {},
  md: {on: false, url: "", token: "", service: "moodle_mobile_app", proxy: "", user: null}};
function normSettings() {
  const old = S.settings || {};
  S.settings = Object.assign({}, DEFAULTS, old, {vp: Object.assign({}, old.vp), md: Object.assign({}, DEFAULTS.md, old.md)});
  S.settings.lang = S.settings.lang === "en" ? "en" : "fa"; S.settings.landCharts = !!S.settings.landCharts; S.settings.beep = S.settings.beep !== false;
  if (!["system", "dark", "black", "light"].includes(S.settings.theme)) S.settings.theme = "system";
  document.documentElement.style.setProperty("--lc", S.settings.landCols);
}
function applyTheme() {
  const t = S.settings?.theme || "system";
  const k = t === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
  document.documentElement.dataset.theme = k;
  const bar = getComputedStyle(document.documentElement).getPropertyValue("--bar").trim();
  document.querySelector('meta[name=theme-color]')?.setAttribute("content", bar || "#151b23");
}
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

/* ---------- پارامترهای شناسایی چهره (متناسب با مدل‌های face-api در مرورگر) ---------- */
// کلید: [پیش‌فرض، کمینه، بیشینه، گام، واحد، گروه]
const VSPEC = {
  max_faces: [5, 1, 10, 1, "", "main"],
  match_thr: [.50, .35, .65, .01, "d", "main"],
  add_below: [.42, .25, .55, .01, "d", "main"],
  unk_margin: [.06, 0, .15, .01, "d", "main"],
  dup: [.15, .05, .30, .01, "d", "main"],
  det_score: [.5, .3, .9, .05, "%", "det"],
  min_face: [50, 20, 150, 5, "px", "det"],
  photo_side: [1600, 640, 3200, 160, "px", "det"],
  photo_accurate: [true, 0, 1, 1, "bool", "det"],
  live_size: [416, 224, 608, 32, "", "det"],
  live_ms: [200, 100, 1000, 50, "ms", "det"],
  thumb_size: [96, 64, 160, 16, "px", "pic"],
  crop_k: [1.5, 1.1, 2.2, .1, "x", "pic"],
  jpeg: [.72, .5, .95, .05, "%", "pic"],
};
const VGROUPS = {main: "مهم‌ترین تنظیمات", det: "تشخیص چهره", pic: "تصویر کوچک چهره"};
const VTEXT = {
  max_faces: ["تعداد نمونهٔ چهره برای هر نفر", "چند نمونه از هر نفر نگه داشته شود. بیشتر: شناسایی دقیق‌تر ولی کندتر."],
  match_thr: ["سخت‌گیری شناسایی (فاصلهٔ مجاز)", "حداکثر فاصلهٔ دو چهره برای «همان شخص». کمتر: اشتباه کمتر ولی ناشناس بیشتر. پیش‌فرض ۰٫۵۰."],
  add_below: ["حد افزودن خودکار نمونه", "وقتی فرد شناخته‌شده‌ای دوباره دیده می‌شود، فقط اگر فاصله کمتر از این باشد نمونهٔ تازه اضافه می‌شود."],
  unk_margin: ["نوار مبهم", "چهره‌ای که کمی بیشتر از حد مجاز فاصله دارد نه شناخته می‌شود نه «بدون نام» تازه می‌سازد. صفر یعنی خاموش."],
  dup: ["تشخیص نمونهٔ تکراری", "نمونه‌ای که از نمونه‌های قبلی همین قدر یا کمتر فرق دارد، تکراری حساب می‌شود و ذخیره نمی‌شود."],
  det_score: ["حساسیت تشخیص", "حداقل اطمینان برای قبول چهره. کمتر: چهره‌های کوچک‌تر هم پیدا می‌شوند ولی کادر الکی بیشتر می‌شود."],
  min_face: ["کوچک‌ترین چهره", "چهره‌های کوچک‌تر از این اندازهٔ ضلع (پیکسل) نادیده گرفته می‌شوند (فقط در تعریف افراد)."],
  photo_side: ["اندازهٔ عکس برای تشخیص", "ضلع بزرگ عکس پیش از تشخیص به این اندازه کوچک می‌شود. بیشتر: چهره‌های ریز بهتر پیدا می‌شوند ولی کندتر."],
  photo_accurate: ["تشخیص دقیق برای عکس", "برای عکس از مدل دقیق‌تر (SSD) استفاده می‌شود. خاموش: مدل سریع که برای گوشی‌های ضعیف بهتر است."],
  live_size: ["اندازهٔ تصویر در دوربین زنده", "بیشتر: چهره‌های دورتر هم دیده می‌شوند ولی کندتر. (مضرب ۳۲)"],
  live_ms: ["فاصلهٔ تشخیص در دوربین زنده", "مکث بین دو تشخیص پی‌درپی. بیشتر: باتری کمتر مصرف می‌شود."],
  thumb_size: ["اندازهٔ تصویر چهره", "اندازهٔ مربع عکس کوچک چهره. بیشتر: شفاف‌تر ولی حجم بیشتر. فقط روی چهره‌های جدید اثر دارد."],
  crop_k: ["فاصلهٔ برش چهره", "برش چند برابر ضلع کادر چهره باشد. کم: فقط صورت؛ زیاد: مو و شانه هم. فقط چهره‌های جدید."],
  jpeg: ["کیفیت عکس چهره", "کیفیت فشرده‌سازی تصویر کوچک. بیشتر: حجم بیشتر. فقط چهره‌های جدید."],
};
function VP(k) {
  const [d, lo, hi, st, u] = VSPEC[k];
  if (u === "bool") return S.settings.vp?.[k] ?? d;
  const v = Number(S.settings.vp?.[k] ?? d);
  return Math.min(hi, Math.max(lo, isFinite(v) ? v : d));
}
function vpSet(k, v) {
  const [d, lo, hi, st, u] = VSPEC[k];
  if (u === "bool") v = !!v; else { v = Math.min(hi, Math.max(lo, +v)); v = Math.round(Math.round(v / st) * st * 1e6) / 1e6; }
  S.settings.vp[k] = v; save(); return v;
}
const fmtNum = (x, d = 2) => fa(Number(x).toFixed(d)).replace(".", isEn() ? "." : "٫");
function vpText(v, k) {
  const [d, , , st, u] = VSPEC[k];
  if (u === "bool") return "";
  if (u === "%") return fa(Math.round(v * 100)) + (isEn() ? "%" : "٪");
  if (u === "px") return fa(Math.round(v)) + " px";
  if (u === "ms") return fa(Math.round(v)) + " ms";
  if (u === "x") return fmtNum(v, 1) + " ×";
  if (u === "d") return fmtNum(v, 2);
  return fa(Number.isInteger(d) ? Math.round(v) : v);
}

/* ---------- ابزار رابط ---------- */
function sliderRow(val, lo, hi, step, onInput, onChange, fmt = v => fa(v)) {
  const w = document.createElement("div"); w.className = "srow";
  w.innerHTML = `<input type="range" min="${lo}" max="${hi}" step="${step}" value="${val}"><b>${fmt(val)}</b>`;
  const r = w.querySelector("input"), b = w.querySelector("b");
  r.oninput = () => { b.textContent = fmt(+r.value); onInput?.(+r.value); };
  r.onchange = () => onChange?.(+r.value);
  return w;
}
function sec(title, ...nodes) {                         // یک تنظیم = عنوان + کنترل (در حالت افقی تکه نمی‌شود)
  const d = document.createElement("div"); d.className = "setsec";
  const h = document.createElement("div"); h.className = "section"; h.textContent = title; d.appendChild(h);
  nodes.forEach(n => d.appendChild(n)); return d;
}
function chipsEl(opts, cur, pick) {
  const d = document.createElement("div"); d.className = "chips";
  d.innerHTML = opts.map(([k, t]) => `<div class="chip ${cur === k ? "on" : ""}" data-k="${k}">${t}</div>`).join("");
  d.querySelectorAll(".chip").forEach(c => c.onclick = () => pick(c.dataset.k));
  return d;
}

/* ---------- صفحهٔ تنظیمات ---------- */
let deferredInstall = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; if (location.hash.includes("settings")) viewSettings(); });
function viewSettings() {
  setBar("تنظیمات", {back: "#/"});
  const s = S.settings, root = document.createElement("div"); root.className = "setgrid";
  const redo = () => { save(); const y = scrollY; viewSettings(); scrollTo(0, y); };
  root.appendChild(sec("ظاهر", chipsEl([["dark", "تیره"], ["black", "سیاه"], ["light", "روشن"], ["system", "سیستم"]], s.theme,
    k => { s.theme = k; applyTheme(); redo(); })));
  root.appendChild(sec("زبان", chipsEl([["fa", "فارسی"], ["en", "English"]], s.lang, k => { s.lang = k; save(); applyLang(); route(); })));
  root.appendChild(sec("صدای تیک هنگام شناسایی در دوربین زنده", chipsEl([["1", "با صدا"], ["0", "بی‌صدا"]], s.beep ? "1" : "0", k => { s.beep = k === "1"; if (s.beep) Beep.unlock(), Beep.tick(); redo(); })));
  root.appendChild(sec("تقویم", chipsEl([["jalali", "شمسی"], ["gregorian", "میلادی"]], s.cal, k => { s.cal = k; redo(); })));
  root.appendChild(sec("حد مجاز غیبت (بعد از آن ردیف قرمز می‌شود)", sliderRow(s.limit, 3, 8, 1, null, v => { s.limit = v; save(); })));
  root.appendChild(sec("تعداد ستون اجزای صفحه در حالت افقی", sliderRow(s.landCols, 1, 4, 1,
    v => document.documentElement.style.setProperty("--lc", v), v => { s.landCols = v; save(); })));
  root.appendChild(sec("تعداد مراحل برگرداندن حذف (۰ تا ۵؛ صفر یعنی خاموش)", sliderRow(s.undoK, 0, 5, 1, null, v => { s.undoK = v; save(); trashPurge(); })));
  const nav = (t, h) => { const b = document.createElement("button"); b.className = "btn soft"; b.textContent = t; b.onclick = () => go(h); return b; };
  root.appendChild(sec("بخش‌ها", nav("شناسایی و پردازش چهره", "#/vision"), nav("اتصال به مودل", "#/moodle")));
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  const bk = document.createElement("div"); bk.className = "setsec";
  bk.innerHTML = `<div class="section">پشتیبان‌گیری</div>
    <div class="muted">داده‌ها فقط روی همین دستگاه ذخیره می‌شوند. فایل پشتیبان شامل توکن مودل هم هست؛ آن را جای امن نگه دار.</div>
    <div class="row"><button class="btn" id="ex">دریافت پشتیبان</button><button class="btn soft" id="im">بازیابی از فایل</button></div>
    <input type="file" id="fi" accept="application/json,.json" hidden>`;
  root.appendChild(bk);
  root.appendChild(offlineSec());
  const ins = document.createElement("div"); ins.className = "setsec";
  ins.innerHTML = `<div class="section">نصب برنامه</div>` + (deferredInstall ? `<button class="btn" id="inst">نصب روی این دستگاه</button>` :
    ios ? `<div class="muted">در آیفون: دکمهٔ اشتراک‌گذاری Safari ← «Add to Home Screen».</div>` :
    `<div class="muted">از منوی مرورگر گزینهٔ «نصب برنامه» یا «Add to Home screen» را بزن.</div>`);
  root.appendChild(ins);
  show(""); page.appendChild(root);
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
      if (!await ask({title: "بازیابی", text: "همهٔ اطلاعات فعلی (تنظیمات، دروس، افراد، سوابق) با این پشتیبان جایگزین می‌شود.", ok: "جایگزین کن", danger: true})) return;
      if (d.courses.some(c => demoBlocks((c.people || []).length))) return;      // نسخهٔ آزمایشی: پشتیبان با بیش از سقف مجاز پذیرفته نمی‌شود
      S = {v: 1, ...d}; normSettings(); save(); applyTheme(); applyLang(); toast("بازیابی شد"); go("#/");
    } catch (_) { toast("فایل پشتیبان معتبر نیست"); }
  };
  if (deferredInstall) $("#inst").onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; viewSettings(); };
}

/* ---------- صفحهٔ شناسایی و پردازش چهره ---------- */
function viewVision() {
  setBar("شناسایی و پردازش چهره", {back: "#/settings"});
  const root = document.createElement("div"); root.className = "setgrid";
  const intro = document.createElement("div"); intro.className = "muted full";
  intro.textContent = "هر پارامتر را با نوار تنظیم کن. نوارها فقط در محدودهٔ امن حرکت می‌کنند و تغییرها فوری ذخیره می‌شوند.";
  root.appendChild(intro);
  let last = null;
  for (const k of Object.keys(VSPEC)) {
    const [d, lo, hi, st, u, g] = VSPEC[k];
    if (g !== last) { last = g; const h = document.createElement("div"); h.className = "gh full"; h.textContent = VGROUPS[g]; root.appendChild(h); }
    const card = document.createElement("div"); card.className = "vcard";
    card.innerHTML = `<div class="vh"><b>${VTEXT[k][0]}</b><span class="vv"></span></div>`;
    const vv = card.querySelector(".vv");
    if (u === "bool") {
      const t = document.createElement("div"); t.className = "tgl"; const on = VP(k);
      t.innerHTML = `<i class="${on ? "on" : ""}"></i><span>${on ? "روشن" : "خاموش"}</span>`;
      t.onclick = () => { vpSet(k, !VP(k)); viewVision(); };
      card.appendChild(t);
    } else {
      vv.textContent = vpText(VP(k), k);
      card.appendChild(sliderRow(VP(k), lo, hi, st, x => vv.textContent = vpText(x, k), x => vpSet(k, x), () => ""));
      const r = document.createElement("div"); r.className = "vr";
      r.innerHTML = `<span>${vpText(lo, k)}</span><span>پیش‌فرض ${vpText(d, k)}</span><span>${vpText(hi, k)}</span>`;
      card.appendChild(r);
    }
    const ds = document.createElement("div"); ds.className = "muted vd"; ds.textContent = VTEXT[k][1]; card.appendChild(ds);
    root.appendChild(card);
  }
  const rb = document.createElement("button"); rb.className = "btn soft full"; rb.textContent = "بازگشت همهٔ مقادیر به پیش‌فرض";
  rb.onclick = () => { S.settings.vp = {}; save(); viewVision(); toast("به پیش‌فرض برگشت"); };
  root.appendChild(rb);
  show(""); page.appendChild(root);
}

/* دانلود کامل برنامه (شامل کتابخانه و مدل‌ها) برای کار کاملاً آفلاین */
function offlineSec() {
  const all = (typeof APP_FILES !== "undefined" ? APP_FILES : []), heavy = Heavy.files();
  const tot = all.reduce((s, f) => s + (Heavy.size(f) || 0), 0), hv = heavy.reduce((s, f) => s + Heavy.size(f), 0);
  const inner = document.createElement("div"); inner.className = "vcard"; inner.style.cssText = "display:flex;flex-direction:column;gap:8px";
  inner.innerHTML = `<div class="muted">همهٔ فایل‌های برنامه، شامل کتابخانه و مدل‌های تشخیص چهره (${mb(hv)} مگابایت از ${mb(tot)})، در حافظهٔ گوشی ذخیره می‌شود تا برنامه بدون اینترنت کار کند.</div>
    <div class="muted" id="ost"></div><div id="opg"></div>
    <div class="row"><button class="btn soft" id="ofl" style="flex:1">دانلود همهٔ فایل‌ها</button><button class="btn soft" id="ohv" style="flex:1">فقط مدل‌ها و کتابخانه</button></div>`;
  const wrap = sec("دانلود برنامه برای کار آفلاین", inner);
  const upd = async () => { const s = await Heavy.status(all); inner.querySelector("#ost").textContent = s.n >= s.all ? `همهٔ فایل‌ها ذخیره شده است ✓ (${fa(s.all)} فایل)` : `${fa(s.n)} از ${fa(s.all)} فایل ذخیره شده است`; };
  upd();
  const run = async (list, force) => {
    const bs = inner.querySelectorAll("button"), st = prog(inner.querySelector("#opg")); bs.forEach(b => b.disabled = true);
    try {
      await Heavy.fetchAll(list, (f, d, t, n) => st(`${fa(Math.round(f * 100))}٪ (${mb(d)} از ${mb(t)} مگابایت) · ${n}`, f), force);
      inner.querySelector("#opg").innerHTML = ""; toast("دانلود کامل شد؛ برنامه آفلاین کار می‌کند");
    } catch (e) { inner.querySelector("#opg").innerHTML = ""; toast("دانلود ناموفق بود (اینترنت؟): " + e.message); }
    bs.forEach(b => b.disabled = false); upd();
  };
  inner.querySelector("#ofl").onclick = () => run(all.filter(f => f !== "sw.js"), true);
  inner.querySelector("#ohv").onclick = () => run(heavy, false);
  return wrap;
}
