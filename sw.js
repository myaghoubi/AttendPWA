// Service worker: برنامه یک‌بار دانلود می‌شود و بعد آفلاین کار می‌کند.
// با هر تغییر فایل‌ها، شمارهٔ VERSION را بالا ببرید تا کاربران نسخهٔ جدید را بگیرند.
const VERSION = "v2";
const CACHE = "attendance-" + VERSION;
const FILES = ["./", "index.html", "style.css", "app.js", "face.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // کتابخانه و مدل‌های تشخیص چهره (حدود ۱۳ مگابایت) بار اول که لازم شد دانلود و ذخیره می‌شوند
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match("./"))));
});
