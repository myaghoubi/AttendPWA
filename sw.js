// Service worker: برنامه یک‌بار دانلود می‌شود و بعد آفلاین کار می‌کند.
// بروزرسانی فایل‌ها از داخل برنامه («درباره ما ← بروزرسانی برنامه») و بر اساس version.js انجام می‌شود.
const VERSION = "1.11.1";   // با هر نسخه عوض می‌شود تا مرورگر service worker تازه را بگیرد
const CACHE = "attendance-files";
const FILES = ["./", "index.html", "version.js", "lib/qrcode.js", "i18n.js", "integrity.js", "activation.js", "reseller.js", "style.css", "app.js", "face.js", "settings.js", "moodle.js", "records.js", "fonts/IRANSans-Regular.woff2", "fonts/IRANSans-Medium.woff2", "fonts/IRANSans-Bold.woff2", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    for (const f of FILES) if (!(await c.match(f))) await c.add(new Request(f, {cache: "reload"}));   // فقط فایل‌هایی که هنوز نیستند
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.cache === "no-store" || e.request.cache === "reload") return;     // بررسی/دانلود بروزرسانی: مستقیم از شبکه
  // کتابخانه و مدل‌های تشخیص چهره (حدود ۱۳ مگابایت) بار اول که لازم شد دانلود و ذخیره می‌شوند
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match("./"))));
});
