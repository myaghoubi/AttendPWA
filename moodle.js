"use strict";
/* اتصال اختیاری به مودل (فقط اضافه می‌کند، هرگز چیزی حذف نمی‌کند).
   توجه: مرورگر فقط وقتی به مودل وصل می‌شود که سرور مودل هدر CORS بدهد (یا «آدرس واسط» تنظیم شود). */

/* ---------- یکسان‌سازی و شباهت نام ---------- */
const FIXMAP = {"ي": "ی", "ك": "ک", "ى": "ی", "ۀ": "ه", "ة": "ه", "أ": "ا", "إ": "ا", "ٱ": "ا", "آ": "ا", "ـ": "", "‌": " ", "‍": ""};
const nname = s => String(s || "").normalize("NFKC").replace(/[يكىۀةأإٱآـ‌‍]/g, c => FIXMAP[c])
  .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
  .toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let p = Array.from({length: n + 1}, (_, j) => j);
  for (let i = 1; i <= m; i++) { const q = [i]; for (let j = 1; j <= n; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; }
  return p[n];
}
const ratio = (a, b) => { const L = Math.max(a.length, b.length); return L ? 1 - lev(a, b) / L : 1; };
function nameSim(a, b) {
  const na = nname(a), nb = nname(b); if (!na || !nb) return 0; if (na === nb) return 1;
  const ta = na.split(" "), tb = nb.split(" ");
  let r = Math.max(ratio(na, nb), ratio([...ta].sort().join(" "), [...tb].sort().join(" ")));
  const nsb = nb.replace(/ /g, "");
  for (let k = 0; k < ta.length; k++) r = Math.max(r, ratio(ta.slice(k).concat(ta.slice(0, k)).join(""), nsb));
  const [sh, lo] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (sh.length >= 2 && sh.every(t => lo.includes(t))) r = Math.max(r, .9);
  return r;
}

/* ---------- کلاینت ---------- */
const mdc = () => S.settings.md;
class MdError extends Error {}
const MD = {
  site0: null, remarksOk: true,
  base() { let u = (mdc().url || "").trim().replace(/\/+$/, ""); if (u && !/^https?:\/\//i.test(u)) u = "https://" + u; return u; },
  wrap(url) { const p = (mdc().proxy || "").trim(); return !p ? url : p.includes("{url}") ? p.replace("{url}", encodeURIComponent(url)) : p + url; },
  flat(prefix, v, out) {
    if (Array.isArray(v)) v.forEach((x, i) => MD.flat(`${prefix}[${i}]`, x, out));
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => MD.flat(prefix ? `${prefix}[${k}]` : k, x, out));
    else out.push([prefix, v === true ? 1 : v === false ? 0 : v]);
  },
  async fetchJson(url, opt) {
    let r;
    try { r = await fetch(MD.wrap(url), opt); }
    catch (e) { throw new MdError("اتصال برقرار نشد. آدرس را بررسی کن؛ یا سرور مودل اجازهٔ دسترسی مرورگر (CORS) را نداده است. در این صورت از مدیر سایت بخواه یا «آدرس واسط» را در تنظیمات مودل بنویس."); }
    try { return await r.json(); } catch (e) { throw new MdError("پاسخ نامعتبر از سرور (آدرس مودل درست است؟) — " + r.status); }
  },
  async login(user, pass) {
    const q = new URLSearchParams({username: user, password: pass, service: mdc().service || "moodle_mobile_app"});
    const d = await MD.fetchJson(MD.base() + "/login/token.php?" + q);
    if (!d.token) throw new MdError(d.error || "توکن دریافت نشد");
    return d.token;
  },
  async call(fn, params = {}) {
    if (/delete|remove|unenrol|suspend/i.test(fn)) throw new MdError("مسدود (فقط افزودن مجاز است): " + fn);
    const pairs = [["wstoken", (mdc().token || "").trim()], ["wsfunction", fn], ["moodlewsrestformat", "json"]];
    MD.flat("", params, pairs);
    const body = new URLSearchParams(); pairs.forEach(([k, v]) => body.append(k, v));
    const out = await MD.fetchJson(MD.base() + "/webservice/rest/server.php", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body});
    if (out && !Array.isArray(out) && (out.exception || out.errorcode))
      throw new MdError(["errorcode", "exception", "message", "debuginfo"].map(k => out[k]).filter(Boolean).join(" | ") || "error");
    return out;
  },
  async site() { return MD.site0 || (MD.site0 = await MD.call("core_webservice_get_site_info")); },
  async has(fn) { return (await MD.site()).functions?.some(f => f.name === fn); },
  reset() { MD.site0 = null; },
};
const mdReady = () => mdc().on && MD.base() && (mdc().token || "").trim();

/* ---------- درس‌ها / افراد / حضور ---------- */
const ATT_NAME = "حضور و غیاب";
const mdl = c => (c.md = c.md || {id: null, att: null, users: {}, sess: {}});
async function mdCourses() {
  const s = await MD.site();
  return (await MD.call("core_enrol_get_users_courses", {userid: s.userid})).map(x => ({id: x.id, name: x.fullname || x.shortname}));
}
async function mdStudents(cid) {
  const s = await MD.site(), list = await MD.call("core_enrol_get_enrolled_users", {courseid: cid});
  const isStu = u => !u.roles || !u.roles.length ? u.id !== s.userid : u.roles.some(r => (r.shortname || "") === "student");
  return list.filter(isStu).map(u => ({id: u.id, name: u.fullname || ((u.firstname || "") + " " + (u.lastname || "")).trim()}));
}
async function attInstance(cid) {
  const mods = (await MD.call("core_course_get_contents", {courseid: cid})).flatMap(sec => (sec.modules || []).filter(m => m.modname === "attendance"));
  const key = nname(ATT_NAME);
  return (mods.find(m => nname(m.name).includes(key)) || mods[0])?.instance ?? null;
}
const KEYS = {P: ["present", "حاضر"], L: ["late", "تأخیر", "تاخیر", "دیر"], E: ["excus", "موجه"], A: ["absent", "غایب"]};
async function mdSession(sid) {
  const d = await MD.call("mod_attendance_get_session", {sessionid: sid});
  const ss = d.statusset;
  let sts = d.statuses || d.status || [];
  const keep = sts.filter(x => String(x.deleted || 0) === "0" && String(x.visible ?? 1) !== "0" && (ss == null || x.setnumber == null || String(x.setnumber) === String(ss)));
  sts = keep.length ? keep : sts;
  const codes = {};
  for (const s of sts) { const a = String(s.acronym || "").trim().toUpperCase(); if (KEYS[a] && !codes[a]) codes[a] = +s.id; }
  for (const [c, words] of Object.entries(KEYS)) {
    if (codes[c]) continue;
    for (const s of sts) { const desc = String(s.description || "").toLowerCase(); if (!Object.values(codes).includes(+s.id) && words.some(w => desc.includes(w))) { codes[c] = +s.id; break; } }
  }
  const rest = sts.filter(s => !Object.values(codes).includes(+s.id)).sort((a, b) => (+a.grade || 0) - (+b.grade || 0));
  if (!codes.A && rest.length) codes.A = +rest.shift().id;
  if (!codes.P && rest.length) codes.P = +rest.pop().id;
  const id2 = Object.fromEntries(Object.entries(codes).map(([k, v]) => [v, k])), grade = Object.fromEntries(sts.map(s => [+s.id, +s.grade || 0]));
  const marks = {};
  for (const x of d.attendance_log || []) {
    const st = +x.statusid || 0; if (!st || x.studentid == null) continue;
    marks[+x.studentid] = id2[st] || (grade[st] > 0 ? "P" : "A");
  }
  return {id: sid, ts: d.sessdate, marks, codes, sets: sts.map(s => s.id).join(","), ss};
}
async function mdSessions(attid, known) {
  const ids = [];
  if (await MD.has("mod_attendance_get_sessions")) for (const s of await MD.call("mod_attendance_get_sessions", {attendanceid: attid})) ids.push(+s.id);
  for (const k of known) if (!ids.includes(+k)) ids.push(+k);
  const out = [];
  for (const id of ids) { try { out.push(await mdSession(id)); } catch (e) {} }
  return out;
}
function remarkOf(c, name) {
  const tot = d => { const v = d?.[name] || {}; return (v.coins || 0) * 5 + (v.stars || 0); };
  const s = tot(c.act), b = tot(c.pen);
  return s || b ? `ستاره: ${s} · رعدوبرق: ${b}` : "";
}
async function sendMarks(c, r, marks) {                 // marks: {نام: P/A/L/E}
  const m = mdl(c), taker = (await MD.site()).userid;
  const sets = [r.sets]; if (r.ss != null && r.ss !== "") sets.push(String(r.ss));
  for (const [n, code] of Object.entries(marks)) {
    const uid_ = m.users[n]; if (uid_ == null) continue;
    const sid = r.codes[code]; if (sid == null) throw new MdError(`وضعیت ${code} در جلسهٔ مودل تعریف نشده است`);
    const rem = remarkOf(c, n);
    const extra = MD.remarksOk && rem ? [{remarks: rem}, {}] : [{}];
    let last = null;
    for (const ex of extra) {
      for (const st of sets) {
        try { await MD.call("mod_attendance_update_user_status", {sessionid: r.id, studentid: uid_, takenbyid: taker, statusid: sid, statusset: st, ...ex}); last = null; break; }
        catch (e) { last = `${e.message}\n[sessionid=${r.id} studentid=${uid_} statusid=${sid}(${code}) statusset=${st}]`; }
      }
      if (last === null) { if (!Object.keys(ex).length && extra.length === 2) MD.remarksOk = false; break; }
    }
    if (last) throw new MdError(last);
  }
}
const dayKey = t => { const d = new Date(t); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const dateLabel = t => sLabel({t});

/* ---------- طرح همگام‌سازی ---------- */
async function planCourses() {
  const remote = await mdCourses(), items = [], used = new Set();
  for (const c of S.courses) {
    const lk = remote.find(r => r.id === c.md?.id);
    if (lk) { used.add(lk.id); continue; }
    let best = null, bs = 0; for (const r of remote) { if (used.has(r.id)) continue; const x = nameSim(c.name, r.name); if (x > bs) { bs = x; best = r; } }
    if (best && bs >= .85) { used.add(best.id); items.push({on: true, kind: "link", text: `پیوند: «${c.name}» = «${best.name}»`, c, r: best}); }
    else items.push({on: false, kind: "push", text: `ساخت درس در مودل: «${c.name}»`, c});
  }
  for (const r of remote) if (!used.has(r.id)) items.push({on: true, kind: "pull", text: `ساخت درس در برنامه: «${r.name}»`, r});
  return items;
}
async function applyCourses(items) {
  let ok = 0; const err = [];
  for (const it of items) if (it.on) {
    try {
      if (it.kind === "link") mdl(it.c).id = it.r.id;
      else if (it.kind === "pull") { S.courses.push({id: uid(), name: it.r.name, acc: ACCENTS[S.courses.length % ACCENTS.length], people: [], md: {id: it.r.id, att: null, users: {}, sess: {}}}); }
      else if (it.kind === "push") { const res = await MD.call("core_course_create_courses", {courses: [{fullname: it.c.name, shortname: it.c.name.slice(0, 40) + "-" + uid().slice(-4), categoryid: 1}]}); mdl(it.c).id = res[0].id; }
      ok++;
    } catch (e) { err.push(`${it.text}: ${e.message}`); }
  }
  save(); return {ok, err};
}
async function planPeople(c) {
  const m = mdl(c); if (!m.id) throw new MdError("این درس هنوز به مودل وصل نیست؛ ابتدا درس‌ها را همگام کن.");
  const remote = await mdStudents(m.id), items = [], usedN = new Set(), usedR = new Set(Object.values(m.users));
  for (const [n, id] of Object.entries(m.users)) if (c.people.includes(n)) usedN.add(n);
  for (const r of remote) {
    if (usedR.has(r.id)) continue;
    let best = null, bs = 0; for (const n of c.people) { if (usedN.has(n)) continue; const x = nameSim(n, r.name); if (x > bs) { bs = x; best = n; } }
    if (best && bs >= .85) { usedN.add(best); items.push({on: true, kind: "link", text: `پیوند: «${best}» = «${r.name}»`, n: best, r}); }
    else items.push({on: true, kind: "pull", text: `افزودن به برنامه: «${r.name}»`, r});
  }
  return items;
}
async function applyPeople(c, items) {
  let ok = 0, stop = false; const err = [], m = mdl(c);
  for (const it of items) if (it.on) {
    try {
      if (it.kind === "link") m.users[it.n] = it.r.id;
      else if (stop || (stop = demoBlocks(c.people.length + 1))) continue;       // نسخهٔ آزمایشی: سقف تعداد
      else { let n = it.r.name, k = 2; while (c.people.includes(n)) n = `${it.r.name} (${k++})`; c.people.push(n); m.users[n] = it.r.id; }
      ok++;
    } catch (e) { err.push(`${it.text}: ${e.message}`); }
  }
  save(); return {ok, err};
}
const nameOfUser = (c, id) => Object.entries(mdl(c).users).find(([, v]) => v === id)?.[0];
async function planAttendance(c) {
  const m = mdl(c); if (!m.id) throw new MdError("این درس هنوز به مودل وصل نیست؛ ابتدا درس‌ها را همگام کن.");
  if (!Object.keys(m.users).length) throw new MdError("هیچ دانشجویی به مودل وصل نیست؛ ابتدا «افراد» را همگام کن.");
  m.att = m.att || await attInstance(m.id);
  const known = Object.values(m.sess), remote = m.att ? await mdSessions(m.att, known) : [], items = [], used = new Set();
  const loc = [...(c.sessions || [])].sort((a, b) => a.t - b.t);
  const diff = (s, r) => {
    const to_m = {}, to_l = {}, conf = {};
    for (const [n, uid_] of Object.entries(m.users)) {
      if (!c.people.includes(n)) continue;
      const lm = s.marks[n] || "A", rm = r.marks[uid_];
      if (rm === undefined) to_m[n] = lm;
      else if (lm === "A" && rm !== "A") to_l[n] = rm;
      else if (lm !== rm && lm !== "A") conf[n] = lm;
    }
    return {to_m, to_l, conf};
  };
  for (const s of loc) {
    let r = remote.find(x => +x.id === +m.sess[s.id]);
    if (!r) r = remote.find(x => !used.has(x.id) && !Object.values(m.sess).includes(x.id) && x.ts && dayKey(x.ts * 1000) === dayKey(s.t));
    if (r) {
      used.add(r.id); const d = diff(s, r), nm = Object.keys(d.to_m).length, nl = Object.keys(d.to_l).length, nc = Object.keys(d.conf).length;
      const linked = +m.sess[s.id] === +r.id;
      if (!linked || nm || nl) items.push({on: true, kind: "merge", s, r, ...d, text: `${linked ? "ادغام" : "پیوند و ادغام"} حضور ${dateLabel(s.t)}: به مودل ${fa(nm)}، به برنامه ${fa(nl)}`});
      if (nc) items.push({on: false, kind: "conf", s, r, to_m: d.conf, text: `تفاوت وضعیت ${dateLabel(s.t)}: ${fa(nc)} مورد (ارسال وضعیت برنامه به مودل)`});
    } else items.push({on: true, kind: "push", s, text: `ارسال جلسه به مودل: ${dateLabel(s.t)}`});
  }
  for (const r of remote) if (!used.has(r.id) && !Object.values(m.sess).includes(r.id) && r.ts)
    items.push({on: true, kind: "pull", r, text: `دریافت جلسه از مودل: ${dateLabel(r.ts * 1000)}`});
  return items;
}
async function applyAttendance(c, items) {
  const m = mdl(c); let ok = 0; const err = [];
  for (const it of items) if (it.on) {
    try {
      if (it.kind === "merge" || it.kind === "conf") {
        m.sess[it.s.id] = it.r.id;
        if (Object.keys(it.to_m).length) await sendMarks(c, it.r, it.to_m);
        for (const [n, code] of Object.entries(it.to_l || {})) it.s.marks[n] = code;
      } else if (it.kind === "push") {
        const att = m.att || (m.att = await attInstance(m.id));
        if (!att) throw new MdError("فعالیت «حضور و غیاب» در مودل پیدا نشد؛ باید در مودل ساخته شود.");
        const res = await MD.call("mod_attendance_add_session", {attendanceid: att, description: dateLabel(it.s.t), sessiontime: Math.round(it.s.t / 1000), duration: 3600, groupid: 0, addcalendarevent: 0});
        const sid = +(res.sessionid ?? res), r = await mdSession(sid), marks = {};
        for (const n of c.people) if (m.users[n] != null) marks[n] = it.s.marks[n] || "A";
        await sendMarks(c, r, marks); m.sess[it.s.id] = sid;
      } else if (it.kind === "pull") {
        const s = {id: uid(), t: it.r.ts * 1000, marks: {}};
        c.people.forEach(n => s.marks[n] = "A");
        for (const [uid_, code] of Object.entries(it.r.marks)) { const n = nameOfUser(c, +uid_); if (n) s.marks[n] = code; }
        (c.sessions = c.sessions || []).push(s); m.sess[s.id] = it.r.id;
      }
      ok++;
    } catch (e) { err.push(`${it.text}: ${e.message}`); }
  }
  save(); return {ok, err};
}

/* ---------- ارسال خودکار بعد از هر لمس / ثبت جلسه ---------- */
const mdTimers = {};
function mdAfterTap(c, s) {
  if (!mdReady() || !c.md?.id || !c.md.sess?.[s.id]) return;
  clearTimeout(mdTimers[s.id]);
  mdTimers[s.id] = setTimeout(async () => {
    try { const r = await mdSession(c.md.sess[s.id]), marks = {}; for (const n of c.people) if (c.md.users[n] != null) marks[n] = s.marks[n] || "A"; await sendMarks(c, r, marks); }
    catch (e) { toast("ارسال به مودل ناموفق بود: " + String(e.message).slice(0, 80)); }
  }, 1500);
}
async function mdAutoSession(c, s) {
  if (!mdReady() || !c.md?.id || !Object.keys(c.md.users || {}).length) return;
  try {
    const att = c.md.att || (c.md.att = await attInstance(c.md.id)); if (!att) return toast("فعالیت «حضور و غیاب» در مودل پیدا نشد");
    const res = await MD.call("mod_attendance_add_session", {attendanceid: att, description: dateLabel(s.t), sessiontime: Math.round(s.t / 1000), duration: 3600, groupid: 0, addcalendarevent: 0});
    const sid = +(res.sessionid ?? res), r = await mdSession(sid), marks = {};
    for (const n of c.people) if (c.md.users[n] != null) marks[n] = s.marks[n] || "A";
    await sendMarks(c, r, marks); c.md.sess[s.id] = sid; save(); toast("حضور در مودل هم ثبت شد");
  } catch (e) { toast("ثبت در مودل ناموفق بود: " + String(e.message).slice(0, 80)); }
}

/* ---------- صفحهٔ تنظیمات مودل ---------- */
function viewMoodle() {
  setBar("اتصال به مودل", {back: "#/settings"});
  const m = mdc();
  show(`<div class="setgrid">
    <div class="setsec"><div class="section">وضعیت</div>
      <div class="tgl" id="mon"><i class="${m.on ? "on" : ""}"></i><span>${m.on ? "فعال" : "غیرفعال"}</span></div></div>
    <div class="setsec"><div class="section">آدرس سایت مودل (مثلاً https://lms.example.ir)</div><input type="url" id="mu" value="${esc(m.url)}" dir="ltr" autocomplete="off"></div>
    <div class="setsec"><div class="section">نام کوتاه سرویس وب برای دریافت توکن (پیش‌فرض moodle_mobile_app)</div><input type="text" id="ms" value="${esc(m.service)}" dir="ltr"></div>
    <div class="setsec"><div class="section">توکن وب‌سرویس (یا با دکمهٔ زیر بگیر)</div><input type="text" id="mt" value="${esc(m.token)}" dir="ltr" autocomplete="off"></div>
    <div class="setsec"><div class="section">دریافت توکن با نام کاربری و رمز</div>
      <input type="text" id="mun" placeholder="نام کاربری مودل" dir="ltr" autocomplete="off"><input type="password" id="mpw" placeholder="رمز عبور (ذخیره نمی‌شود)" dir="ltr" autocomplete="off">
      <button class="btn soft" id="mgt">دریافت توکن</button></div>
    <div class="setsec"><div class="section">آدرس واسط (اختیاری، پیشرفته)</div>
      <input type="text" id="mp" value="${esc(m.proxy)}" dir="ltr" placeholder="https://… یا با {url}">
      <div class="muted vd">اگر سرور مودل هدر CORS نمی‌دهد، مرورگر اجازهٔ اتصال نمی‌دهد. مدیر سایت می‌تواند آن را فعال کند یا یک واسط CORS بگذار.</div></div>
    <div class="setsec full"><button class="btn" id="mtest">آزمایش اتصال</button><div class="muted vd" id="mres" style="white-space:pre-wrap;margin-top:8px"></div>
      <div class="muted vd">همگام‌سازی فقط اضافه می‌کند؛ هیچ اطلاعاتی در هیچ‌کدام حذف نمی‌شود. بعد از اتصال، از صفحهٔ دروس و هر درس «همگام‌سازی با مودل» را بزن.</div>
      <div class="muted vd">مدیر مودل باید این تابع‌ها را به «سرویس خارجی» توکن اضافه کند: core_webservice_get_site_info، core_enrol_get_users_courses، core_enrol_get_enrolled_users، core_course_get_contents، mod_attendance_get_session(s)، mod_attendance_add_session، mod_attendance_update_user_status.</div></div>
  </div>`);
  const sv = () => { m.url = $("#mu").value.trim(); m.service = $("#ms").value.trim() || "moodle_mobile_app"; m.token = $("#mt").value.trim(); m.proxy = $("#mp").value.trim(); MD.reset(); save(); };
  ["#mu", "#ms", "#mt", "#mp"].forEach(i => $(i).onchange = sv);
  $("#mon").onclick = () => { sv(); m.on = !m.on; save(); viewMoodle(); };
  const res = $("#mres");
  $("#mgt").onclick = async () => {
    sv(); const u = $("#mun").value.trim(), p = $("#mpw").value;
    if (!m.url || !u || !p) return res.textContent = "آدرس، نام کاربری و رمز را وارد کن.";
    res.textContent = "در حال ارتباط با مودل…";
    try { m.token = await MD.login(u, p); $("#mt").value = m.token; $("#mpw").value = ""; MD.reset(); save(); res.textContent = "توکن دریافت شد. حالا «آزمایش اتصال» را بزن."; }
    catch (e) { res.textContent = "خطا: " + e.message; }
  };
  $("#mtest").onclick = async () => {
    sv(); if (!m.url || !m.token) return res.textContent = "ابتدا آدرس و توکن را وارد و ذخیره کن.";
    res.textContent = "در حال ارتباط با مودل…";
    try {
      MD.reset(); const s = await MD.site(), fns = new Set((s.functions || []).map(f => f.name));
      m.user = {fullname: s.fullname, username: s.username, sitename: s.sitename, siteurl: s.siteurl, userid: s.userid, pic: s.userpictureurl || ""}; save();
      const need = ["core_enrol_get_users_courses", "core_enrol_get_enrolled_users", "core_course_get_contents", "mod_attendance_get_session", "mod_attendance_add_session", "mod_attendance_update_user_status"];
      const miss = need.filter(f => !fns.has(f));
      res.textContent = `اتصال برقرار شد.\nسایت: ${s.sitename}\nکاربر: ${s.fullname} (${s.username})\n` +
        (fns.has("mod_attendance_get_session") ? "افزونهٔ حضور و غیاب مودل: فعال" : "افزونهٔ حضور و غیاب مودل در این سرور دیده نشد") +
        (miss.length ? "\nاین تابع‌ها فعال نیستند: " + miss.join("، ") : "");
    } catch (e) { res.textContent = "خطا: " + e.message; }
  };
}

/* ---------- صفحهٔ همگام‌سازی ---------- */
async function viewMdSync(what, sub) {
  const c = what !== "courses" ? S.courses.find(x => x.id === what) : null;
  const title = what === "courses" ? "همگام‌سازی درس‌ها" : c ? (sub === "people" ? "همگام‌سازی افراد" : sub === "att" ? "همگام‌سازی حضور و غیاب" : "همگام‌سازی با مودل") : "همگام‌سازی";
  setBar(title, {back: c ? (sub ? `#/moodle/sync/${c.id}` : `#/c/${c.id}`) : "#/", sub: c?.name, acc: c?.acc});
  if (!mdReady()) return show(`<div class="empty">اول اتصال به مودل را فعال و تنظیم کن.</div><button class="btn full" onclick="go('#/moodle')">تنظیمات مودل</button>`);
  if (c && !sub) {
    const m = mdl(c);
    return show(`<div class="muted">${m.id ? "این درس به مودل وصل است ✓" : "این درس هنوز به مودل وصل نیست؛ اول «همگام‌سازی درس‌ها» را بزن."}</div>
      <button class="btn soft" onclick="go('#/moodle/sync/courses')">همگام‌سازی درس‌ها</button>
      <button class="btn" onclick="go('#/moodle/sync/${c.id}/people')">همگام‌سازی افراد (${fa(Object.keys(m.users).length)} وصل)</button>
      <button class="btn" onclick="go('#/moodle/sync/${c.id}/att')">همگام‌سازی حضور و غیاب</button>
      <div class="muted vd">همگام‌سازی فقط اضافه می‌کند؛ هیچ اطلاعاتی حذف نمی‌شود.</div>`);
  }
  show(`<div class="muted">در حال ارتباط با مودل…</div>`);
  let items;
  try { items = what === "courses" ? await planCourses() : sub === "people" ? await planPeople(c) : await planAttendance(c); }
  catch (e) { return show(`<div class="muted" style="white-space:pre-wrap">خطا: ${esc(e.message)}</div>`); }
  if (!items.length) return show(`<div class="empty">همه‌چیز یکسان است؛ موردی برای همگام‌سازی نیست.</div>`);
  show(`<div class="section">موارد را انتخاب کن (فقط اضافه می‌شود)</div><div id="pl" class="plan"></div><button class="btn" id="ap">اعمال</button>`);
  $("#pl").innerHTML = items.map((it, i) => `<label class="pi"><input type="checkbox" data-i="${i}" ${it.on ? "checked" : ""}><span>${esc(it.text)}</span></label>`).join("");
  $("#pl").querySelectorAll("input").forEach(k => k.onchange = () => items[+k.dataset.i].on = k.checked);
  $("#ap").onclick = async () => {
    $("#ap").disabled = true; $("#ap").textContent = "در حال اعمال…";
    const r = await (what === "courses" ? applyCourses(items) : sub === "people" ? applyPeople(c, items) : applyAttendance(c, items));
    show(`<div class="muted">${fa(r.ok)} مورد انجام شد.${r.err.length ? `\n${fa(r.err.length)} مورد ناموفق:` : ""}</div>${r.err.length ? `<div class="muted vd" style="white-space:pre-wrap">${esc(r.err.join("\n\n"))}</div>` : ""}`);
    page.firstElementChild.style.whiteSpace = "pre-wrap";
  };
}
