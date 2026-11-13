"use strict";
/* فعال‌سازی: کد = امضای Ed25519 (RFC 8032) روی «ATT1|شناسهٔ دستگاه». در برنامه فقط کلید عمومی هست؛
   کلید خصوصی نزد توسعه‌دهنده می‌ماند (ابزار تولید کد برنامهٔ اول همین کدها را برای این برنامه هم می‌سازد). */
const PUBKEY_HEX = "5f4c45d1ba50512f328178bb73112d35ed2f1add8be5f130a65c2b355b1242df";
const DEMO_MAX = 100;                                    // تعداد افراد هر درس بدون فعال‌سازی
const LIC_INFO = {phone: "09112755805", email: "mehdi.yaghoubi@gmail.com", card: "6219-8619-2206-1089", price: ""};   // price: مبلغ (تومان)؛ خالی = «مبلغ اعلام‌شده»

/* ---- Ed25519 (فقط راستی‌آزمایی) با BigInt ---- */
const _p = 2n ** 255n - 19n, _q = 2n ** 252n + 27742317777372353535851937790883648493n;
const _m = (a, m = _p) => ((a % m) + m) % m;
const _pw = (b, e, m) => { let r = 1n; b = _m(b, m); while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; };
const _inv = x => _pw(x, _p - 2n, _p);
const _d = _m(-121665n * _inv(121666n)), _I = _pw(2n, (_p - 1n) / 4n, _p);
const _add = (P, Q) => {
  const A = _m((P[1] - P[0]) * (Q[1] - Q[0])), B = _m((P[1] + P[0]) * (Q[1] + Q[0])), C = _m(2n * P[3] * Q[3] * _d), D = _m(2n * P[2] * Q[2]);
  const E = B - A, F = D - C, G = D + C, H = B + A;
  return [_m(E * F), _m(G * H), _m(F * G), _m(E * H)];
};
const _mul = (s, P) => { let Q = [0n, 1n, 1n, 0n]; while (s > 0n) { if (s & 1n) Q = _add(Q, P); P = _add(P, P); s >>= 1n; } return Q; };
const _eq = (P, Q) => _m(P[0] * Q[2] - Q[0] * P[2]) === 0n && _m(P[1] * Q[2] - Q[1] * P[2]) === 0n;
function _x(y, sign) {
  if (y >= _p) return null;
  const x2 = _m((y * y - 1n) * _inv(_d * y * y + 1n));
  if (x2 === 0n) return sign ? null : 0n;
  let x = _pw(x2, (_p + 3n) / 8n, _p);
  if (_m(x * x - x2) !== 0n) x = _m(x * _I);
  if (_m(x * x - x2) !== 0n) return null;
  if ((x & 1n) !== BigInt(sign)) x = _p - x;
  return x;
}
const _gy = _m(4n * _inv(5n)), _gx = _x(_gy, 0), _G = [_gx, _gy, 1n, _m(_gx * _gy)];
const _le = b => { let r = 0n; for (let i = b.length - 1; i >= 0; i--) r = (r << 8n) | BigInt(b[i]); return r; };
function _dec(s) {
  if (s.length !== 32) return null;
  let y = _le(s); const sign = Number(y >> 255n); y &= (1n << 255n) - 1n;
  const x = _x(y, sign); return x === null ? null : [x, y, 1n, _m(x * y)];
}
const _hex = h => Uint8Array.from(h.match(/../g).map(x => parseInt(x, 16)));
async function edVerify(pub, msg, sig) {
  try {
    const A = _dec(pub), R = _dec(sig.slice(0, 32));
    if (!A || !R || sig.length !== 64) return false;
    const s = _le(sig.slice(32)); if (s >= _q) return false;
    const buf = new Uint8Array(64 + msg.length); buf.set(sig.slice(0, 32)); buf.set(pub, 32); buf.set(msg, 64);
    const h = _m(_le(new Uint8Array(await crypto.subtle.digest("SHA-512", buf))), _q);
    return _eq(_mul(s, _G), _add(R, _mul(h, A)));
  } catch (e) { return false; }
}
function b32dec(str) {
  const al = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", out = []; let bits = 0, v = 0;
  for (const ch of str) { const i = al.indexOf(ch); if (i < 0) return null; v = (v << 5) | i; bits += 5; if (bits >= 8) { bits -= 8; out.push((v >> bits) & 255); } }
  return Uint8Array.from(out);
}
const _toHex = u => [...u].map(b => b.toString(16).padStart(2, "0")).join("");
const _sha = async b => new Uint8Array(await crypto.subtle.digest("SHA-512", b));
const _cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
const _utf = s => new TextEncoder().encode(s);
const _comp = P => { const zi = _inv(P[2]), x = _m(P[0] * zi), y = _m(P[1] * zi); let v = y | ((x & 1n) << 255n); const o = new Uint8Array(32); for (let i = 0; i < 32; i++) { o[i] = Number(v & 255n); v >>= 8n; } return o; };
const _le32 = v => { const o = new Uint8Array(32); for (let i = 0; i < 32; i++) { o[i] = Number(v & 255n); v >>= 8n; } return o; };
async function _expand(secret) { const h = await _sha(secret); let a = _le(h.slice(0, 32)); a &= (1n << 254n) - 8n; a |= (1n << 254n); return [a, h.slice(32)]; }
async function edPub(secret) { const [a] = await _expand(secret); return _comp(_mul(a, _G)); }
async function edSign(secret, msg) {                    // (برای «همکاری در فروش»: امضا با کلید خودِ همکار، نه کلید اصلی)
  const [a, prefix] = await _expand(secret), A = _comp(_mul(a, _G));
  const r = _m(_le(await _sha(_cat(prefix, msg))), _q), R = _comp(_mul(r, _G));
  const s = _m(r + _m(_le(await _sha(_cat(R, A, msg))), _q) * a, _q);
  return _cat(R, _le32(s));
}
function b32enc(u) {
  const al = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let out = "", bits = 0, v = 0;
  for (const b of u) { v = (v << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; out += al[(v >> bits) & 31]; } v &= (1 << bits) - 1; }
  if (bits) out += al[(v << (5 - bits)) & 31];
  return out;
}
const groups8 = s => s.match(/.{1,8}/g).join("-");
const devMsg = dev => _utf("ATT1|" + dev.replace(/-/g, "").trim().toUpperCase());
const certMsg = (pubHex, total) => _utf("RSL1|" + pubHex + "|" + total);
const MASTER = _hex(PUBKEY_HEX);
/* کد دو نوع است: ۶۴ بایت = امضای مستقیم توسعه‌دهنده؛ ۱۶۲ بایت = کد همکار فروش:
   کلید عمومی همکار(۳۲) + ظرفیت(۲) + گواهی توسعه‌دهنده برای آن کلید(۶۴) + امضای همکار روی شناسهٔ دستگاه(۶۴) */
async function checkCode(code, dev) {
  const sig = b32dec(String(code).toUpperCase().replace(/[^A-Z0-9]/g, ""));
  if (!sig) return false;
  if (sig.length === 64) return edVerify(MASTER, devMsg(dev), sig);
  if (sig.length !== 162) return false;
  const pub = sig.slice(0, 32), total = (sig[32] << 8) | sig[33];
  if (total < 1) return false;
  return (await edVerify(MASTER, certMsg(_toHex(pub), total), sig.slice(34, 98))) && edVerify(pub, devMsg(dev), sig.slice(98, 162));
}

/* ---- شناسهٔ دستگاه و وضعیت ---- */
const LIC = {id: "", code: "", ok: false, tamper: false};
const fmtId = h => h.toUpperCase().match(/.{4}/g).join("-");
async function licInit() {
  let id = "", code = "";
  try { id = (await Store.get("device")) || localStorage.getItem("att_device") || ""; code = (await Store.get("lic")) || localStorage.getItem("att_lic") || ""; } catch (e) {}
  if (!/^[0-9a-f]{16}$/.test(id)) { id = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, "0")).join(""); }
  try { await Store.set("device", id); localStorage.setItem("att_device", id); } catch (e) {}   // جدا از پشتیبان (پشتیبان کد را به دستگاه دیگر نمی‌برد)
  LIC.id = fmtId(id); LIC.code = code; LIC.ok = code ? await checkCode(code, LIC.id) : false;
}
const licensed = () => LIC.ok && !LIC.tamper;
async function licActivate(code) {
  if (!(await checkCode(code, LIC.id))) return false;
  LIC.code = code.trim(); LIC.ok = true;
  try { await Store.set("lic", LIC.code); localStorage.setItem("att_lic", LIC.code); } catch (e) {}
  return true;
}
function demoBlocks(count) {                            // true = مسدود (و پیام نشان داده می‌شود)
  if (licensed() || count <= (LIC.tamper ? 3 : Math.min(DEMO_MAX, 10))) return false;
  setTimeout(() => ask({title: "نسخهٔ آزمایشی", text: `نسخهٔ آزمایشی حداکثر ${fa(DEMO_MAX)} نفر در هر درس را پشتیبانی می‌کند. برای ادامه برنامه را فعال کن.`, ok: "فعال‌سازی"}).then(v => v && go("#/activate")), 120);        // کمی تأخیر: کلید Enter همان لحظه دکمهٔ دیالوگ را نزند
  return true;
}

/* ---- صفحهٔ فعال‌سازی ---- */
function viewActivate() {
  setBar("فعال‌سازی برنامه", {back: "#/"});
  const L = LIC_INFO, P = s => fa(s), ltr = s => `<b dir="ltr" style="unicode-bidi:isolate">${s}</b>`;
  const price = L.price ? `مبلغ ${fa(L.price)} تومان` : "مبلغ اعلام‌شده توسط توسعه‌دهنده";
  show(`<div class="vcard" style="display:flex;flex-direction:column;gap:8px">
      ${licensed() ? `<div style="color:var(--ok);font-weight:700">برنامه روی این دستگاه فعال است ✓</div>` : `<div style="color:var(--warn)">نسخهٔ آزمایشی: تا ${fa(DEMO_MAX)} نفر در هر درس. برای استفادهٔ کامل کد فعال‌سازی لازم است.</div>`}
      <div class="muted">شناسهٔ این دستگاه (برای دریافت کد بفرست):</div>
      <div dir="ltr" style="font-size:22px;font-weight:700;text-align:center;letter-spacing:1px;user-select:all">${LIC.id}</div>
      <div class="row"><button class="btn soft" id="cid" style="flex:1">کپی شناسه</button><a class="btn soft" id="sms" style="flex:1;text-align:center;text-decoration:none" href="sms:${L.phone}?body=${encodeURIComponent("شناسه: " + LIC.id)}">ارسال شناسه</a></div>
      ${licensed() ? "" : `<input type="text" id="lc" dir="ltr" placeholder="کد فعال‌سازی را اینجا بچسبان" autocomplete="off" autocapitalize="characters" style="width:100%;box-shadow:none;background:var(--card2)">
      <button class="btn" id="act">فعال‌سازی</button>`}
    </div>
    <div class="vcard" style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      <b>راهنمای دریافت کد فعال‌سازی</b>
      <div class="muted">۱) شناسهٔ بالا را با دکمهٔ «ارسال شناسه» (یا پیام‌رسان) برای شمارهٔ موبایل توسعه‌دهنده بفرست.<br>
      ۲) ${price} را به شمارهٔ کارت زیر واریز کن و تصویر رسید را همراه شناسه بفرست.<br>
      ۳) کد فعال‌سازی مخصوص همین دستگاه ساخته و به موبایل یا ایمیل تو فرستاده می‌شود؛ آن را در کادر بالا بچسبان و «فعال‌سازی» را بزن.</div>
      <div class="muted">شمارهٔ موبایل توسعه‌دهنده: <a href="tel:${L.phone}" dir="ltr" style="unicode-bidi:isolate">${P(L.phone)}</a></div>
      <div class="muted">ایمیل: <a href="mailto:${L.email}" dir="ltr" style="unicode-bidi:isolate">${L.email}</a></div>
      <div class="muted">شمارهٔ کارت (از چپ به راست):</div>
      <div dir="ltr" style="font-size:21px;font-weight:700;text-align:center;letter-spacing:1px">${P(L.card)}</div>
      <button class="btn soft" id="ccd">کپی شمارهٔ کارت</button>
      <div class="muted">کد فقط برای همین دستگاه معتبر است. اگر داده‌های مرورگر پاک شود یا برنامه روی دستگاه دیگری نصب شود، شناسه عوض می‌شود و کد تازه لازم است. پشتیبان‌گیری کد فعال‌سازی را جابه‌جا نمی‌کند.</div>
    </div>`);
  const cp = async (t, ok) => { try { await navigator.clipboard.writeText(t); toast(ok); } catch (e) { toast(t); } };
  $("#cid").onclick = () => cp(LIC.id, "شناسه کپی شد");
  $("#ccd").onclick = () => cp(L.card.replace(/-/g, ""), "شمارهٔ کارت کپی شد");
  if ($("#act")) $("#act").onclick = async () => {
    if (await licActivate($("#lc").value)) { toast("برنامه فعال شد"); route(); } else toast("کد برای این دستگاه معتبر نیست");
  };
}

/* ---- قفل ضد دست‌کاری: فایل‌های برنامه باید با فهرست هش امضاشدهٔ توسعه‌دهنده (integrity.js) بخوانند ----
   اگر کسی فایلی را ویرایش کند (مثلاً سقف نسخهٔ آزمایشی)، برنامه قفل می‌شود تا فایل‌ها بازیابی شوند. */
const _sha256 = async b => _toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", b)));
async function integrityCheck(force) {
  try {
    if (typeof INTEGRITY === "undefined") return setTamper(["integrity.js"]);
    const names = Object.keys(INTEGRITY.files).sort();
    const msg = _utf("INT1|" + names.map(n => n + "=" + INTEGRITY.files[n]).join("|"));
    if (!(await edVerify(MASTER, msg, _hex(INTEGRITY.sig)))) return setTamper(["integrity.js"]);
    const bad = [];
    for (const n of names) {
      let ok = false, net = false;
      try { ok = (await _sha256(await (await fetch(n)).arrayBuffer())) === INTEGRITY.files[n]; } catch (e) { net = true; }
      if (!ok && !net) {                                  // شاید فقط نسخهٔ قدیمیِ ذخیره‌شده است: یک بار مستقیم از سرور بگیر
        try { const r = await fetch(n + "?i=" + Date.now(), {cache: "reload"}); ok = r.ok && (await _sha256(await r.arrayBuffer())) === INTEGRITY.files[n]; if (ok && window.caches) { const c = await caches.open("attendance-files"); await c.put(new Request(n), await fetch(n + "?i=" + Date.now(), {cache: "reload"})); } }
        catch (e) { ok = true; }                          // آفلاین: تا اتصال بعدی قضاوت نمی‌کنیم
      }
      if (!ok) bad.push(n);
    }
    setTamper(bad);
  } catch (e) { /* خطای محیط: قفل نمی‌شود */ }
}
function setTamper(bad) {
  LIC.tamper = bad.length > 0;
  let o = document.getElementById("tamper");
  if (!bad.length) { o?.remove(); return; }
  if (!o) { o = document.createElement("div"); o.id = "tamper"; o.style.cssText = "position:fixed;inset:0;z-index:99;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center"; document.body.appendChild(o); }
  o.innerHTML = `<h2>فایل‌های برنامه تغییر کرده‌اند</h2><div class="muted">فایل‌های زیر با نسخهٔ رسمی نمی‌خوانند و برنامه قفل شده است. با «بازیابی فایل‌ها» دوباره از سرور رسمی گرفته می‌شوند.</div>
    <div dir="ltr" class="muted" style="font-size:12px">${bad.join(" · ")}</div><button class="btn" id="tfix">بازیابی فایل‌ها</button><div id="tmsg" class="muted"></div>`;
  document.getElementById("tfix").onclick = async () => {
    document.getElementById("tmsg").textContent = "در حال دانلود…";
    try { const c = await caches.open("attendance-files"); for (const n of bad) { const r = await fetch(n + "?i=" + Date.now(), {cache: "reload"}); if (r.ok) await c.put(new Request(n), r); } } catch (e) {}
    location.reload();
  };
}
