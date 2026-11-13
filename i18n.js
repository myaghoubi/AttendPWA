"use strict";
/* زبان رابط: فارسی (پیش‌فرض) / English. متن‌ها فارسی نوشته شده‌اند و در حالت انگلیسی هنگام نمایش ترجمه می‌شوند. */
const isEn = () => (typeof S !== "undefined" && S.settings?.lang) === "en";
const EN = {
"برگردان": "Undo", "تأیید": "OK", "انصراف": "Cancel", "نام جدید…": "New name…", "نام فرد": "Person's name", "ثبت": "Save",
"نام تازه بنویس یا یکی از افراد تعریف‌شده را بزن؛ نمونه‌ها به همان فرد اضافه می‌شود.": "Type a new name or tap an existing person; the face samples will be added to that person.",
"انتخاب از لیست": "Pick from list", "نام تازه بنویس یا از فهرست افراد انتخاب کن؛ نمونه‌ها به همان فرد اضافه می‌شود.": "Type a new name or pick from the people list; the samples will be added to that person.", "نام تازه ثبت می‌شود": "A new person will be created", "بازگشت": "Back", "منو": "Menu",
"درس": "Course", "فرد": "Person", "جلسه": "Session", "ناشناس": "Unknown", "حذف شد": "deleted",
"زمان بازیابی گذشته است": "Restore time has passed", "درس این مورد دیگر وجود ندارد": "The course of this item no longer exists", "بازیابی شد": "Restored",
"مودل آفلاین": "Moodle offline", "حضور و غیاب": "Attendance", "تنظیمات برنامه": "App settings", "شناسایی چهره": "Face recognition",
"تنظیمات اتصال به مودل": "Moodle connection settings", "فهرست دروس من": "My courses", "پشتیبان‌گیری و بازیابی از فایل": "Backup and restore from file",
"بازیابی": "Restore", "درباره ما": "About", "دروس": "Courses", "همگام‌سازی با مودل": "Sync with Moodle", "درس جدید": "New course", "نفر": "people",
"ویرایش نام": "Rename", "حذف": "Delete", "هنوز درسی نیست.": "No courses yet.", "با دکمهٔ + بالای صفحه یک درس بساز.": "Use the + button at the top to create a course.",
"ساخت": "Create", "نام درس": "Course name", "ذخیره": "Save", "حذف درس": "Delete course", "درس «": "Course “", "» با همهٔ افرادش حذف شود؟": "” and all its people will be deleted?",
"حضور در جلسات": "Attendance per session", "آخرین": "last", "حاضر": "Present", "تأخیر": "Late", "غایب": "Absent", "دانشجو": "Students",
"تعریف افراد": "People", "شناسایی حاضرین از روی دوربین یا عکس": "Recognise attendees from camera or photo", "سوابق حضور": "Attendance records",
"این درس به مودل وصل است": "This course is linked to Moodle", "هنوز وصل نیست": "Not linked yet",
"سامانه حضور و غیاب تصویری": "Visual Attendance System", "ایده‌پردازی و طراحی در پژوهشکدهٔ هوش مصنوعی دانشگاه گلستان": "Conceived and designed at the AI Research Institute, Golestan University",
"آبان": "Aban", "درباره توسعه‌دهنده": "About the developer", "مهدی یعقوبی": "Mehdi Yaghoubi", "گروه مهندسی کامپیوتر": "Department of Computer Engineering", "دانشگاه گلستان": "Golestan University",
"همکار توسعه": "Development partner", "دستیار هوش مصنوعی": "AI assistant",
"؟": "?", "نمونهٔ چهره": "face sample", "بدون نمونهٔ چهره": "No face sample", "هنوز کسی اضافه نشده.": "Nobody added yet.", "نام و نام خانوادگی": "Full name", "افزودن": "Add",
"دوربین زنده": "Live camera", "از عکس": "From photo", "ناشناس‌ها: نام بده تا به فهرست افراد اضافه شوند": "Unknown faces: give a name to add them to the people list",
"بدون نام": "Unnamed", "ثبت نام": "Set name", "ثبت شد": "saved", "نام": "Name", "این نام قبلاً هست": "This name already exists",
"بارگذاری کتابخانه…": "Loading library…", "تشخیص سریع": "Fast detector", "تشخیص دقیق": "Accurate detector", "نقاط چهره": "Face landmarks", "شناسایی": "Recognition", "بارگذاری مدل:": "Loading model:",
"این مرورگر دوربین را پشتیبانی نمی‌کند (یا صفحه با HTTPS باز نشده است).": "This browser does not support the camera (or the page is not opened over HTTPS).",
"ثبت نمونه از دوربین": "Capture sample from camera", "تعویض دوربین": "Switch camera", "افزودن از عکس": "Add from photo", "نمونه‌ها:": "Samples:", "از": "of",
"نمونه حذف شد": "Sample deleted", "حداکثر نمونه ثبت شده؛ یکی را حذف کن": "Maximum samples stored; delete one first", "نمونه ثبت شد": "Sample saved",
"در حال بارگذاری…": "Loading…", "بارگذاری مدل‌ها ناموفق بود (اینترنت بار اول لازم است)": "Loading the models failed (internet is needed the first time)", "اجازهٔ دوربین داده نشد": "Camera permission was not granted",
"چهره‌ای دیده نمی‌شود": "No face visible", "فقط یک نفر مقابل دوربین باشد": "Only one person in front of the camera", "روی کادر زرد بزن تا ثبت نام شود؛ روی کادر سبز بزن تا چهره به فرد دیگری نسبت داده شود.": "Tap a yellow box to register a name; tap a green box to assign the face to another person.", "حداکثر نمونه ثبت شده؛ چهره فقط به همین عکس نسبت داده شد": "Maximum samples stored; the face was assigned for this photo only", "روی کادر زرد بزن تا ثبت نام شود؛ روی کادر سبز بزن تا چهره به فرد دیگری نسبت داده شود؛ روی چهرهٔ بدون کادر بزن تا همان اطراف دوباره پردازش شود.": "Tap a yellow box to register a name; tap a green box to assign the face to another person; tap a face without a box to re-process that area.", "در حال جست‌وجوی چهره در این ناحیه…": "Searching this area for a face…", "چهرهٔ تازه در این ناحیه پیدا شد؛ روی کادر بزن.": "new face(s) found in this area; tap the box.", "چهره‌ای در این ناحیه پیدا نشد": "No face found in this area", "پردازش این ناحیه ناموفق بود": "Processing this area failed", "دانشجویان و جلسات هر درس": "Students and sessions per course", "دانشجو": "Students", "نمودار": "Chart", "عکس": "Photo", "در حال تشخیص عکس": "Detecting photo", "آماده؛ ثبت کن": "Ready; capture", "میلی‌ثانیه": "ms",
"در حال تشخیص…": "Detecting…", "در عکس بیش از یک چهره است؛ عکسی با یک نفر انتخاب کن": "The photo has more than one face; choose a photo with one person", "چهره‌ای در عکس پیدا نشد": "No face found in the photo",
"آزمایشی": "Trial", "نفر نمونهٔ چهره دارند.": "have face samples.", "اول از «تعریف افراد» نمونه ثبت کن.": "First add samples in “People”.",
"آستانه (کمتر = سخت‌گیرتر)": "Threshold (lower = stricter)", "ثبت جلسه در سوابق": "Save session to records", "نام ← کمترین فاصله": "Name ← smallest distance",
"غایب/دیده‌نشده:": "Absent/not seen:", "اول افراد را تعریف کن": "Define the people first", "ثبت جلسه": "Save session",
"هیچ‌کس شناسایی نشده؛ همه غایب ثبت شوند؟": "Nobody was recognised; record everyone as absent?", "جلسه ثبت شد": "Session saved", "پاک کردن فهرست": "Clear list",
"بارگذاری مدل‌ها ناموفق بود": "Loading the models failed", "چهره": "faces", "انتخاب یا گرفتن عکس کلاس": "Choose or take a class photo", "در حال بارگذاری مدل‌ها…": "Loading models…",
"انتخاب یا گرفتن عکس": "Choose or take a photo", "نفر شناخته‌شده": "known", "نمونهٔ تازه": "new samples", "ناشناس جدید": "new unknown",
"ثبت جلسه با چهره": "Session from faces", "جلسهٔ ساده": "Simple session", "جلسه اضافه شد": "Session added", "اول از «تعریف افراد» نام‌ها را وارد کن.": "First enter the names in “People”.",
"حضور": "Attendance", "فعالیت": "Activity", "تنبیه": "Penalty", "حاضرین": "Attendees", "صفر کردن ستاره‌ها و سکه‌ها": "Reset stars and coins", "صفر کردن تنبیه‌ها": "Reset penalties",
"مجاز": "limit", "خالی = غایب": "empty = absent", "صفر کردن": "Reset", "ستاره‌ها و سکه‌های همهٔ دانشجوها صفر شود؟": "Reset the stars and coins of all students?", "صفر کن": "Reset",
"تنبیه‌های همهٔ دانشجوها صفر شود؟": "Reset the penalties of all students?", "تغییر وضعیت یک خانه با لمس": "Tap a cell to change its status",
"لمس سرستون جلسه: تاریخ و حذف": "Tap a session header: date and delete", "کشیدن سرستون نام: تغییر عرض ستون (ذخیره می‌شود)": "Drag the name header: resize the column (saved)",
"حذف جلسه": "Delete session", "بستن": "Close", "ذخیره تاریخ": "Save date", "فعالیت (ستاره و سکه)": "Activity (stars and coins)", "تنبیه (رعدوبرق و ضربدر)": "Penalty (bolts and crosses)",
"به سقف رسیده است": "Limit reached", "ادغام با فرد تکراری": "Merge with duplicate", "تغییر نام": "Rename", "حذف این فرد": "Delete this person", "با همهٔ سوابقش حذف شود؟": "will be deleted with all records?",
"فرد دیگری برای ادغام نیست": "No other person to merge with", "کدام فرد تکراری در «": "Which duplicate person in “", "ادغام شود؟": "to merge?", "ادغام": "Merge",
"در «": "In “", "حذف می‌شود.": "will be deleted.", "ادغام شد": "Merged", "حضور هر دو جمع می‌شود و «": "attendance of both is combined and “",
"مهم‌ترین تنظیمات": "Key settings", "تشخیص چهره": "Face detection", "تصویر کوچک چهره": "Face thumbnail", "تعداد نمونهٔ چهره برای هر نفر": "Face samples per person",
"چند نمونه از هر نفر نگه داشته شود. بیشتر: شناسایی دقیق‌تر ولی کندتر.": "How many samples to keep per person. More: more accurate but slower.",
"سخت‌گیری شناسایی (فاصلهٔ مجاز)": "Recognition strictness (allowed distance)", "حداکثر فاصلهٔ دو چهره برای «همان شخص». کمتر: اشتباه کمتر ولی ناشناس بیشتر. پیش‌فرض ۰٫۵۰.": "Maximum distance between two faces to count as the same person. Lower: fewer mistakes but more unknowns. Default 0.50.",
"حد افزودن خودکار نمونه": "Auto-add sample limit", "وقتی فرد شناخته‌شده‌ای دوباره دیده می‌شود، فقط اگر فاصله کمتر از این باشد نمونهٔ تازه اضافه می‌شود.": "When a known person is seen again, a new sample is added only if the distance is below this.",
"نوار مبهم": "Ambiguity band", "چهره‌ای که کمی بیشتر از حد مجاز فاصله دارد نه شناخته می‌شود نه «بدون نام» تازه می‌سازد. صفر یعنی خاموش.": "A face slightly beyond the allowed distance is neither recognised nor turned into a new “Unnamed”. Zero means off.",
"تشخیص نمونهٔ تکراری": "Duplicate sample detection", "نمونه‌ای که از نمونه‌های قبلی همین قدر یا کمتر فرق دارد، تکراری حساب می‌شود و ذخیره نمی‌شود.": "A sample differing from existing ones by this much or less is a duplicate and is not stored.",
"حساسیت تشخیص": "Detection sensitivity", "حداقل اطمینان برای قبول چهره. کمتر: چهره‌های کوچک‌تر هم پیدا می‌شوند ولی کادر الکی بیشتر می‌شود.": "Minimum confidence to accept a face. Lower: smaller faces are found but more false boxes appear.",
"کوچک‌ترین چهره": "Smallest face", "چهره‌های کوچک‌تر از این اندازهٔ ضلع (پیکسل) نادیده گرفته می‌شوند (فقط در تعریف افراد).": "Faces smaller than this side length (pixels) are ignored (People page only).",
"اندازهٔ عکس برای تشخیص": "Photo size for detection", "ضلع بزرگ عکس پیش از تشخیص به این اندازه کوچک می‌شود. بیشتر: چهره‌های ریز بهتر پیدا می‌شوند ولی کندتر.": "The long side of the photo is scaled down to this before detection. More: tiny faces are found better but slower.",
"تشخیص دقیق برای عکس": "Accurate detection for photos", "برای عکس از مدل دقیق‌تر (SSD) استفاده می‌شود. خاموش: مدل سریع که برای گوشی‌های ضعیف بهتر است.": "Uses the more accurate model (SSD) for photos. Off: the fast model, better for weak phones.",
"اندازهٔ تصویر در دوربین زنده": "Image size in live camera", "بیشتر: چهره‌های دورتر هم دیده می‌شوند ولی کندتر. (مضرب ۳۲)": "More: farther faces are seen but slower. (multiple of 32)",
"فاصلهٔ تشخیص در دوربین زنده": "Detection interval in live camera", "مکث بین دو تشخیص پی‌درپی. بیشتر: باتری کمتر مصرف می‌شود.": "Pause between two detections. More: less battery use.",
"اندازهٔ تصویر چهره": "Face image size", "اندازهٔ مربع عکس کوچک چهره. بیشتر: شفاف‌تر ولی حجم بیشتر. فقط روی چهره‌های جدید اثر دارد.": "Size of the small face square. More: sharper but larger. Affects new faces only.",
"فاصلهٔ برش چهره": "Face crop margin", "برش چند برابر ضلع کادر چهره باشد. کم: فقط صورت؛ زیاد: مو و شانه هم. فقط چهره‌های جدید.": "Crop as a multiple of the face box side. Low: face only; high: hair and shoulders too. New faces only.",
"کیفیت عکس چهره": "Face image quality", "کیفیت فشرده‌سازی تصویر کوچک. بیشتر: حجم بیشتر. فقط چهره‌های جدید.": "Compression quality of the thumbnail. More: larger size. New faces only.",
"تنظیمات": "Settings", "ظاهر": "Appearance", "تیره": "Dark", "سیاه": "Black", "روشن": "Light", "سیستم": "System", "تقویم": "Calendar", "شمسی": "Jalali", "میلادی": "Gregorian",
"زبان": "Language", "فارسی": "فارسی",
"حد مجاز غیبت (بعد از آن ردیف قرمز می‌شود)": "Absence limit (the row turns red after it)", "تعداد ستون اجزای صفحه در حالت افقی": "Number of columns in landscape",
"تعداد مراحل برگرداندن حذف (۰ تا ۵؛ صفر یعنی خاموش)": "Undo-delete steps (0 to 5; zero means off)", "بخش‌ها": "Sections", "شناسایی و پردازش چهره": "Face recognition and processing", "اتصال به مودل": "Moodle connection",
"پشتیبان‌گیری": "Backup", "داده‌ها فقط روی همین دستگاه ذخیره می‌شوند. فایل پشتیبان شامل توکن مودل هم هست؛ آن را جای امن نگه دار.": "Data is stored only on this device. The backup file includes the Moodle token too; keep it safe.",
"دریافت پشتیبان": "Download backup", "بازیابی از فایل": "Restore from file", "نصب برنامه": "Install app", "نصب روی این دستگاه": "Install on this device",
"در آیفون: دکمهٔ اشتراک‌گذاری Safari ← «Add to Home Screen».": "On iPhone: Safari Share button → “Add to Home Screen”.",
"از منوی مرورگر گزینهٔ «نصب برنامه» یا «Add to Home screen» را بزن.": "Use “Install app” or “Add to Home screen” from the browser menu.",
"همهٔ اطلاعات فعلی (تنظیمات، دروس، افراد، سوابق) با این پشتیبان جایگزین می‌شود.": "All current data (settings, courses, people, records) will be replaced by this backup.",
"جایگزین کن": "Replace", "فایل پشتیبان معتبر نیست": "The backup file is not valid",
"هر پارامتر را با نوار تنظیم کن. نوارها فقط در محدودهٔ امن حرکت می‌کنند و تغییرها فوری ذخیره می‌شوند.": "Adjust each parameter with its slider. Sliders move only within a safe range and changes are saved immediately.",
"خاموش": "Off", "پیش‌فرض": "Default", "بازگشت همهٔ مقادیر به پیش‌فرض": "Reset all values to default", "به پیش‌فرض برگشت": "Reset to default",
"اتصال اختیاری به مودل (فقط اضافه می‌کند، هرگز چیزی حذف نمی‌کند).": "Optional Moodle connection (it only adds, never deletes anything).",
"اتصال برقرار نشد. آدرس را بررسی کن؛ یا سرور مودل اجازهٔ دسترسی مرورگر (CORS) را نداده است. در این صورت از مدیر سایت بخواه یا «آدرس واسط» را در تنظیمات مودل بنویس.": "Connection failed. Check the address; or the Moodle server does not allow browser access (CORS). Ask the site admin, or set a “proxy address” in the Moodle settings.",
"پاسخ نامعتبر از سرور (آدرس مودل درست است؟) —": "Invalid response from the server (is the Moodle address correct?) —", "توکن دریافت نشد": "No token received",
"مسدود (فقط افزودن مجاز است):": "Blocked (only adding is allowed):", "تاخیر": "Late", "دیر": "Late", "موجه": "Excused", "ستاره": "star", "ستاره‌ها": "stars", "سکه": "coin", "سکه‌ها": "coins", "رعدوبرق": "bolt", "ضربدر": "cross", "وضعیت": "Status",
"در جلسهٔ مودل تعریف نشده است": "not defined in the Moodle session", "پیوند: «": "Link: “", "ساخت درس در مودل: «": "Create course in Moodle: “", "ساخت درس در برنامه: «": "Create course in app: “",
"این درس هنوز به مودل وصل نیست؛ ابتدا درس‌ها را همگام کن.": "This course is not linked to Moodle yet; sync the courses first.", "افزودن به برنامه: «": "Add to app: “",
"هیچ دانشجویی به مودل وصل نیست؛ ابتدا «افراد» را همگام کن.": "No student is linked to Moodle; sync “People” first.", "پیوند و ادغام": "Link and merge", "به مودل": "to Moodle", "به برنامه": "to app",
"تفاوت وضعیت": "status differences", "مورد (ارسال وضعیت برنامه به مودل)": "items (send app status to Moodle)", "ارسال جلسه به مودل:": "Send session to Moodle:", "دریافت جلسه از مودل:": "Get session from Moodle:",
"فعالیت «حضور و غیاب» در مودل پیدا نشد؛ باید در مودل ساخته شود.": "The “Attendance” activity was not found in Moodle; it must be created there.", "ارسال به مودل ناموفق بود:": "Sending to Moodle failed:",
"فعالیت «حضور و غیاب» در مودل پیدا نشد": "The “Attendance” activity was not found in Moodle", "حضور در مودل هم ثبت شد": "Attendance was also saved in Moodle", "ثبت در مودل ناموفق بود:": "Saving in Moodle failed:",
"فعال": "On", "غیرفعال": "Off", "آدرس سایت مودل (مثلاً https://lms.example.ir)": "Moodle site address (e.g. https://lms.example.ir)", "نام کوتاه سرویس وب برای دریافت توکن (پیش‌فرض moodle_mobile_app)": "Web service short name for the token (default moodle_mobile_app)",
"توکن وب‌سرویس (یا با دکمهٔ زیر بگیر)": "Web service token (or get one with the button below)", "دریافت توکن با نام کاربری و رمز": "Get a token with username and password", "نام کاربری مودل": "Moodle username",
"رمز عبور (ذخیره نمی‌شود)": "Password (not stored)", "دریافت توکن": "Get token", "آدرس واسط (اختیاری، پیشرفته)": "Proxy address (optional, advanced)", "یا با {url}": "or with {url}",
"اگر سرور مودل هدر CORS نمی‌دهد، مرورگر اجازهٔ اتصال نمی‌دهد. مدیر سایت می‌تواند آن را فعال کند یا یک واسط CORS بگذار.": "If the Moodle server does not send CORS headers the browser blocks the connection. The site admin can enable it, or use a CORS proxy.",
"آزمایش اتصال": "Test connection", "همگام‌سازی فقط اضافه می‌کند؛ هیچ اطلاعاتی در هیچ‌کدام حذف نمی‌شود. بعد از اتصال، از صفحهٔ دروس و هر درس «همگام‌سازی با مودل» را بزن.": "Sync only adds; nothing is deleted on either side. After connecting, use “Sync with Moodle” on the courses page and in each course.",
"مدیر مودل باید این تابع‌ها را به «سرویس خارجی» توکن اضافه کند": "The Moodle admin must add these functions to the token's “external service”",
"آدرس، نام کاربری و رمز را وارد کن.": "Enter the address, username and password.", "در حال ارتباط با مودل…": "Connecting to Moodle…", "توکن دریافت شد. حالا «آزمایش اتصال» را بزن.": "Token received. Now press “Test connection”.",
"خطا:": "Error:", "ابتدا آدرس و توکن را وارد و ذخیره کن.": "Enter and save the address and token first.", "اتصال برقرار شد.": "Connected.", "سایت:": "Site:", "کاربر:": "User:",
"افزونهٔ حضور و غیاب مودل: فعال": "Moodle attendance plugin: active", "افزونهٔ حضور و غیاب مودل در این سرور دیده نشد": "The Moodle attendance plugin was not found on this server", "این تابع‌ها فعال نیستند:": "These functions are not enabled:",
"همگام‌سازی درس‌ها": "Sync courses", "همگام‌سازی افراد": "Sync people", "همگام‌سازی حضور و غیاب": "Sync attendance", "همگام‌سازی": "Sync", "اول اتصال به مودل را فعال و تنظیم کن.": "First enable and set up the Moodle connection.", "تنظیمات مودل": "Moodle settings",
"این درس به مودل وصل است ✓": "This course is linked to Moodle ✓", "این درس هنوز به مودل وصل نیست؛ اول «همگام‌سازی درس‌ها» را بزن.": "This course is not linked to Moodle yet; first press “Sync courses”.", "وصل": "linked",
"همگام‌سازی فقط اضافه می‌کند؛ هیچ اطلاعاتی حذف نمی‌شود.": "Sync only adds; nothing is deleted.", "همه‌چیز یکسان است؛ موردی برای همگام‌سازی نیست.": "Everything is identical; nothing to sync.", "موارد را انتخاب کن (فقط اضافه می‌شود)": "Choose items (only adds)",
"اعمال": "Apply", "در حال اعمال…": "Applying…", "مورد انجام شد.": "items done.", "مورد ناموفق:": "items failed:",
"ح": "P", "ت": "L", "م": "E",
"بروزرسانی برنامه": "Update app", "نسخه": "Version", "بررسی بروزرسانی": "Check for updates", "نسخهٔ شما به‌روز است": "You are up to date", "نسخهٔ جدید موجود است": "A new version is available", "دانلود و نصب": "Download and install",
"فایل‌های تغییر کرده": "Changed files", "در حال دانلود": "Downloading", "بروزرسانی انجام شد؛ برنامه دوباره باز می‌شود…": "Update done; reloading…", "بروزرسانی ناموفق بود (اینترنت؟):": "Update failed (internet?):", "در حال بررسی…": "Checking…",
"تاریخچهٔ نسخه‌ها": "Version history", "آفلاین یا سرور در دسترس نیست": "Offline or server unreachable", "نسخهٔ نصب‌شده": "Installed version", "فایل": "files",
};
const PERSIAN_L = "\\u0600-\\u06FF\\u200c";
const esc_re = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EN_RE = new RegExp(Object.keys(EN).sort((a, b) => b.length - a.length).map(k => {
  const L = /[؀-ۿ]/;
  return (L.test(k[0]) ? `(?<![${PERSIAN_L}])` : "") + esc_re(k) + (L.test(k[k.length - 1]) ? `(?![${PERSIAN_L}])` : "");
}).join("|"), "g");
const PUNCT = {"«": "“", "»": "”", "،": ",", "؟": "?", "٫": ".", "٪": "%", "؛": ";"};
const trStr = s => s.replace(EN_RE, m => EN[m]).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[«»،؟٫٪؛]/g, c => PUNCT[c]);
const TR_ATTR = ["placeholder", "aria-label", "title", "alt"];
function trWalk(n) {
  if (n.nodeType === 3) { const v = n.nodeValue; if (/[؀-ۿ]/.test(v)) { const r = trStr(v); if (r !== v) n.nodeValue = r; } return; }
  if (n.nodeType !== 1) return;
  const el = n.matches ? [n, ...n.querySelectorAll("[placeholder],[aria-label],[title],[alt]")] : [];
  for (const e of el) for (const a of TR_ATTR) { const v = e.getAttribute?.(a); if (v && /[؀-ۿ]/.test(v)) { const r = trStr(v); if (r !== v) e.setAttribute(a, r); } }
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) trWalk(t);
}
let trObs = null;
function applyLang() {
  const en = isEn(), h = document.documentElement;
  h.lang = en ? "en" : "fa"; h.dir = en ? "ltr" : "rtl";
  document.title = en ? "Attendance" : "حضور و غیاب";
  if (en && !trObs) {
    trObs = new MutationObserver(ms => {
      if (!isEn()) return;
      for (const m of ms) {
        if (m.type === "childList") m.addedNodes.forEach(trWalk);
        else if (m.type === "characterData") trWalk(m.target);
        else if (m.type === "attributes") trWalk(m.target);
      }
    });
    trObs.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: TR_ATTR});
  }
  if (en) trWalk(document.body);
}
