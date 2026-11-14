// خودکار ساخته می‌شود (pwa_release.py). RELEASES: فهرست فایل‌های تغییرکرده در هر نسخه، جدیدترین اول.
const APP_VERSION = "1.13.6";
const RELEASES = [
 {
  "v": "1.13.6",
  "date": "2026-11-14",
  "fa": "اسکرول‌بار نازک و هم‌رنگ تم؛ عکس پروفایل مودل در منو",
  "en": "Thin theme-coloured scrollbars; Moodle profile picture in menu",
  "files": [
   "app.js",
   "integrity.js",
   "moodle.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.13.5",
  "date": "2026-11-14",
  "fa": "فهرست شناسایی‌شده: حذف موردی و تغییر نام با لیست کشویی افراد",
  "en": "Recognised list: remove single entries and rename using a drop-down of people",
  "files": [
   "face.js",
   "i18n.js",
   "integrity.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.13.4",
  "date": "2026-11-14",
  "fa": "تصویر چهرهٔ شناسایی‌شده کنار نام در فهرست حاضرین (دوربین زنده و عکس)",
  "en": "Recognised face thumbnail next to the name in the present list (live camera and photo)",
  "files": [
   "face.js",
   "integrity.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.13.3",
  "date": "2026-11-14",
  "fa": "صدای تیک هنگام شناسایی فرد در دوربین زنده (قابل خاموش شدن در تنظیمات)",
  "en": "Tick sound when a person is recognised on live camera (can be muted in Settings)",
  "files": [
   "face.js",
   "i18n.js",
   "integrity.js",
   "settings.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.13.2",
  "date": "2026-11-14",
  "fa": "منوی درختی: فهرست همهٔ درس‌ها؛ عبارت بلند تک‌خطی با ...",
  "en": "Tree menu lists all courses; long labels truncated with ellipsis",
  "files": [
   "app.js",
   "integrity.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.13.1",
  "date": "2026-11-14",
  "fa": "حذف فضای خالی بالای منوی اصلی در حالت عمودی",
  "en": "Remove empty space at the top of the portrait menu",
  "files": [
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.13.0",
  "date": "2026-11-14",
  "fa": "منو: درخت صفحات درس زیر «فهرست دروس من»، حذف کادر مودل قطع، عنوان تصویری، فضای بالای منوی افقی",
  "en": "Menu: course page tree under My courses, hide offline Moodle card, new title, tighter landscape top",
  "files": [
   "app.js",
   "integrity.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.12.5",
  "date": "2026-11-14",
  "fa": "«بازیابی فایل‌ها» همهٔ فایل‌های برنامه و integrity را تازه می‌کند",
  "en": "Restore button refreshes all app files and integrity",
  "files": [
   "activation.js",
   "integrity.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.12.4",
  "date": "2026-11-14",
  "fa": "بازگشت سقف نسخهٔ آزمایشی به ۱۰ و integrity رسمی",
  "en": "Restore demo limit to 10, official integrity",
  "files": [
   "activation.js",
   "integrity.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.12.3",
  "date": "2026-11-14",
  "fa": "منوی اصلی اسلایدی از کنار (فارسی از راست، انگلیسی از چپ)",
  "en": "Main menu slides from the side (RTL from right, LTR from left)",
  "files": [
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.12.2",
  "date": "2026-11-14",
  "fa": "افکت ساخته شدن لوگو در درباره ما؛ منو از بالا روی نوار می‌آید",
  "en": "About logo build animation; menu drops from the top over the bar",
  "files": [
   "app.js",
   "fx.js",
   "integrity.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.12.1",
  "date": "2026-11-13",
  "fa": "حذف افکت صفحهٔ بعد، فاصلهٔ کمتر گزینه‌های منو، افکت دکمهٔ همبرگری",
  "en": "Removed page-open effect, tighter menu items, hamburger morph",
  "files": [
   "app.js",
   "fx.js",
   "integrity.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.12.0",
  "date": "2026-11-13",
  "fa": "افکت باز شدن دیالوگ/صفحه و حذف درس مانند برنامهٔ اصلی",
  "en": "Open/close effects for dialogs, pages and course delete like the main app",
  "files": [
   "app.js",
   "fx.js",
   "index.html",
   "integrity.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.11.2",
  "date": "2026-11-13",
  "fa": "بستن راه‌های دور زدن سقف ۱۰ نفر (بازیابی پشتیبان، سطل بازیافت، ناشناس)",
  "en": "Close demo-limit bypasses (backup restore, trash undo, unknown faces)",
  "files": [
   "app.js",
   "integrity.js",
   "settings.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.11.1",
  "date": "2026-11-13",
  "fa": "بهبود ظاهر کادر عدد در همکاری در فروش",
  "en": "Better number box in sales partnership",
  "files": [
   "integrity.js",
   "reseller.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.11.0",
  "date": "2026-11-13",
  "fa": "قفل ضد دست‌کاری: فایل‌های برنامه با هش امضاشدهٔ توسعه‌دهنده راستی‌آزمایی می‌شوند",
  "en": "Anti-tamper lock: app files are verified against a developer-signed hash list",
  "files": [
   "activation.js",
   "app.js",
   "i18n.js",
   "index.html",
   "integrity.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.10.0",
  "date": "2026-11-13",
  "fa": "همکاری در فروش: همکار فعال‌شده با کلید امضای خودش برای دیگران کد می‌سازد؛ ظرفیت اولیه صفر و افزایش با کد ظرفیت ادمین",
  "en": "Sales partnership: an activated partner signs codes for others with their own key; initial capacity zero, raised by an admin capacity code",
  "files": [
   "activation.js",
   "app.js",
   "i18n.js",
   "index.html",
   "reseller.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.9.4",
  "date": "2026-11-13",
  "fa": "درباره ما: کادر بروزرسانی تمام‌عرض و فاصلهٔ کمتر خطوط؛ گزینهٔ خروج در منو",
  "en": "About page: full-width update card and tighter lines; Exit item in the menu",
  "files": [
   "app.js",
   "i18n.js",
   "style.css",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.9.3",
  "date": "2026-11-13",
  "fa": "تغییر نشانی کد QR برنامه",
  "en": "Changed the app QR code address",
  "files": [
   "app.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.9.2",
  "date": "2026-11-13",
  "fa": "دکمهٔ دانلود برنامه با کد QR در «درباره ما»",
  "en": "Download-app QR code button on the About page",
  "files": [
   "app.js",
   "i18n.js",
   "index.html",
   "lib/qrcode.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.9.1",
  "date": "2026-11-13",
  "fa": "تغییر شمارهٔ موبایل و شمارهٔ کارت توسعه‌دهنده",
  "en": "Updated developer mobile and card numbers",
  "files": [
   "activation.js",
   "sw.js",
   "version.js"
  ]
 },
 {
  "v": "1.9.0",
  "date": "2026-11-13",
  "fa": "فعال‌سازی برنامه با کد Ed25519 (سازگار با ابزار تولید کد برنامهٔ اول)، صفحهٔ فعال‌سازی با اطلاعات توسعه‌دهنده و محدودیت نسخهٔ آزمایشی",
  "en": "App activation with Ed25519 code (compatible with the first app's code generator), activation page with developer contact details and demo limit",
  "files": [
   "activation.js",
   "app.js",
   "face.js",
   "i18n.js",
   "index.html",
   "moodle.js",
   "sw.js",
   "version.js"
  ]
 },
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
const APP_FILES = ["activation.js", "app.js", "face.js", "fonts/IRANSans-Bold.woff2", "fonts/IRANSans-Medium.woff2", "fonts/IRANSans-Regular.woff2", "fx.js", "i18n.js", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "index.html", "integrity.js", "lib/face-api.js", "lib/qrcode.js", "manifest.webmanifest", "models/face_landmark_68_model-weights_manifest.json", "models/face_landmark_68_model.bin", "models/face_recognition_model-weights_manifest.json", "models/face_recognition_model.bin", "models/ssd_mobilenetv1_model-weights_manifest.json", "models/ssd_mobilenetv1_model.bin", "models/tiny_face_detector_model-weights_manifest.json", "models/tiny_face_detector_model.bin", "moodle.js", "records.js", "reseller.js", "settings.js", "style.css", "sw.js", "version.js"];
const FILE_SIZES = {"fx.js": 7692, "i18n.js": 36484, "sw.js": 2092, "app.js": 34596, "face.js": 38427, "style.css": 22534, "settings.js": 16797, "index.html": 1285, "activation.js": 14940, "integrity.js": 1101, "reseller.js": 8845, "moodle.js": 25502, "manifest.webmanifest": 571, "records.js": 12782, "icons/maskable-512.png": 27288, "icons/icon-192.png": 11349, "icons/apple-touch-icon.png": 8699, "icons/icon-512.png": 29936, "models/face_recognition_model.bin": 6444032, "models/face_landmark_68_model.bin": 356840, "models/tiny_face_detector_model.bin": 193321, "models/ssd_mobilenetv1_model-weights_manifest.json": 28233, "models/tiny_face_detector_model-weights_manifest.json": 3219, "models/face_recognition_model-weights_manifest.json": 19615, "models/ssd_mobilenetv1_model.bin": 5616957, "models/face_landmark_68_model-weights_manifest.json": 8485, "fonts/IRANSans-Bold.woff2": 29688, "fonts/IRANSans-Medium.woff2": 28916, "fonts/IRANSans-Regular.woff2": 31320, "lib/qrcode.js": 56694, "lib/face-api.js": 1333943};   // بایت؛ برای نوار پیشرفت دانلود
const HEAVY_FILES = ["lib/face-api.js", "lib/qrcode.js", "models/face_landmark_68_model-weights_manifest.json", "models/face_landmark_68_model.bin", "models/face_recognition_model-weights_manifest.json", "models/face_recognition_model.bin", "models/ssd_mobilenetv1_model-weights_manifest.json", "models/ssd_mobilenetv1_model.bin", "models/tiny_face_detector_model-weights_manifest.json", "models/tiny_face_detector_model.bin"];   // کتابخانه و مدل‌های تشخیص چهره
