// خودکار ساخته می‌شود (pwa_release.py). RELEASES: فهرست فایل‌های تغییرکرده در هر نسخه، جدیدترین اول.
const APP_VERSION = "1.7.2";
const RELEASES = [
 {
  "v": "1.7.2",
  "date": "2026-11-13",
  "fa": "نسخهٔ آزمایشی بروزرسانی (بدون تغییر ظاهری)",
  "en": "Update-test release (no visible change)",
  "files": [
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.7.1",
  "date": "2026-11-13",
  "fa": "آیکون برنامهٔ اصلی؛ اطلاعات توسعه‌دهنده بعد از ۷ بار لمس لوگو",
  "en": "Main app icon; developer info appears after tapping the logo 7 times",
  "files": [
   "app.js",
   "icons/apple-touch-icon.png",
   "icons/icon-192.png",
   "icons/icon-512.png",
   "icons/maskable-512.png",
   "version.js"
  ]
 },
 {
  "v": "1.7.0",
  "date": "2026-11-13",
  "fa": "منوی ثابت در حالت افقی، زبان فارسی/انگلیسی، بروزرسانی داخل برنامه و انتخاب نام از فهرست افراد",
  "en": "Docked landscape menu, Persian/English language, in-app update and picking a name from the people list",
  "files": [
   "app.js",
   "face.js",
   "i18n.js",
   "index.html",
   "records.js",
   "settings.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 }
];
const APP_FILES = ["app.js", "face.js", "fonts/IRANSans-Bold.woff2", "fonts/IRANSans-Medium.woff2", "fonts/IRANSans-Regular.woff2", "i18n.js", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "index.html", "manifest.webmanifest", "moodle.js", "records.js", "settings.js", "style.css", "sw.js", "version.js"];
