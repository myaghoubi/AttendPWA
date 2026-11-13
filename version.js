// خودکار ساخته می‌شود (pwa_release.py). RELEASES: فهرست فایل‌های تغییرکرده در هر نسخه، جدیدترین اول.
const APP_VERSION = "1.8.1";
const RELEASES = [
 {
  "v": "1.8.1",
  "date": "2026-11-13",
  "fa": "دانلود کامل برنامه (با مدل‌ها و کتابخانه) در تنظیمات و نوار پیشرفت دانلود مدل‌ها",
  "en": "Full offline download (with models and library) in Settings and a progress bar when downloading the models",
  "files": [
   "face.js",
   "i18n.js",
   "settings.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.8.0",
  "date": "2026-11-13",
  "fa": "نمودار صفحهٔ اول (دانشجو و جلسه هر درس) با کلید نمودار در حالت افقی؛ انتخاب چند عکس با تب و swipe در تعریف افراد و حضور و غیاب",
  "en": "Home-page chart (students and sessions per course) with a landscape chart switch; multiple photos with tabs and swipe on People and Attendance",
  "files": [
   "app.js",
   "face.js",
   "i18n.js",
   "settings.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.7.7",
  "date": "2026-11-13",
  "fa": "لمس کادر زرد/سبز در «تعریف افراد» هم؛ لمس بیرون از کادرها = پردازش مجدد اطراف نقطه برای پیدا کردن چهرهٔ جاافتاده (در هر دو صفحه)",
  "en": "Tap yellow/green boxes on the People page too; tapping outside boxes re-processes the area to find missed faces (both pages)",
  "files": [
   "face.js",
   "i18n.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.7.6",
  "date": "2026-11-13",
  "fa": "آیکون برای همهٔ گزینه‌های منوی اصلی",
  "en": "Icons for all main-menu items",
  "files": [
   "app.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.7.5",
  "date": "2026-11-13",
  "fa": "حالت افقی: منو در فارسی سمت راست و در انگلیسی سمت چپ",
  "en": "Landscape: menu docked on the right in Persian and on the left in English",
  "files": [
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.7.4",
  "date": "2026-11-13",
  "fa": "حضور و غیاب از عکس: لمس کادر زرد = ثبت نام موردی، لمس کادر سبز = انتساب چهره به فرد دیگر",
  "en": "Attendance from photo: tap a yellow box to name the face, tap a green box to reassign it to another person",
  "files": [
   "app.js",
   "face.js",
   "i18n.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.7.3",
  "date": "2026-11-13",
  "fa": "دیالوگ ثبت نام: عکس بزرگ بالای دیالوگ و دکمهٔ انتخاب از لیست افراد",
  "en": "Name dialog: large photo on top and a pick-from-list button",
  "files": [
   "app.js",
   "i18n.js",
   "sw.js",
   "version.js"
  ]
 },
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
const APP_FILES = ["app.js", "face.js", "fonts/IRANSans-Bold.woff2", "fonts/IRANSans-Medium.woff2", "fonts/IRANSans-Regular.woff2", "i18n.js", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "index.html", "lib/face-api.js", "manifest.webmanifest", "models/face_landmark_68_model-weights_manifest.json", "models/face_landmark_68_model.bin", "models/face_recognition_model-weights_manifest.json", "models/face_recognition_model.bin", "models/ssd_mobilenetv1_model-weights_manifest.json", "models/ssd_mobilenetv1_model.bin", "models/tiny_face_detector_model-weights_manifest.json", "models/tiny_face_detector_model.bin", "moodle.js", "records.js", "settings.js", "style.css", "sw.js", "version.js"];
const FILE_SIZES = {"i18n.js": 28357, "sw.js": 2017, "app.js": 28271, "face.js": 32656, "style.css": 18945, "settings.js": 16298, "index.html": 1106, "moodle.js": 25330, "manifest.webmanifest": 571, "records.js": 12782, "icons/maskable-512.png": 27288, "icons/icon-192.png": 11349, "icons/apple-touch-icon.png": 8699, "icons/icon-512.png": 29936, "models/face_recognition_model.bin": 6444032, "models/face_landmark_68_model.bin": 356840, "models/tiny_face_detector_model.bin": 193321, "models/ssd_mobilenetv1_model-weights_manifest.json": 28233, "models/tiny_face_detector_model-weights_manifest.json": 3219, "models/face_recognition_model-weights_manifest.json": 19615, "models/ssd_mobilenetv1_model.bin": 5616957, "models/face_landmark_68_model-weights_manifest.json": 8485, "fonts/IRANSans-Bold.woff2": 29688, "fonts/IRANSans-Medium.woff2": 28916, "fonts/IRANSans-Regular.woff2": 31320, "lib/face-api.js": 1333943};   // بایت؛ برای نوار پیشرفت دانلود
const HEAVY_FILES = ["lib/face-api.js", "models/face_landmark_68_model-weights_manifest.json", "models/face_landmark_68_model.bin", "models/face_recognition_model-weights_manifest.json", "models/face_recognition_model.bin", "models/ssd_mobilenetv1_model-weights_manifest.json", "models/ssd_mobilenetv1_model.bin", "models/tiny_face_detector_model-weights_manifest.json", "models/tiny_face_detector_model.bin"];   // کتابخانه و مدل‌های تشخیص چهره
