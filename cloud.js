/* ذخیرهٔ ابری اختیاری (Supabase): ثبت‌نام با ایمیل، همگام‌سازی دروس/افراد/سوابق/چهره‌ها.
   فقط وقتی کاربر خودش فعال کند کار می‌کند؛ در غیر این صورت همه‌چیز فقط روی همین دستگاه می‌ماند.
   کلید زیر «کلید عمومی» است؛ امنیت داده را قواعد RLS در پایگاه‌داده (هر کاربر فقط ردیف‌های خودش) تأمین می‌کند.
   توکن مودل و تنظیمات دستگاه هرگز ارسال نمی‌شوند؛ فقط دروس (S.courses). */
const CLOUD_URL = "https://oqqkbvfsyglarrzqsaii.supabase.co";
const CLOUD_KEY = "sb_publishable_390XJxwQv3WlESkx03pZtw_O2rrjGrC";

const Cloud = {
  st: {on: false, asked: false, session: null, uid: null, map: {}, last: 0},   // در Store با کلید «cloud» ذخیره می‌شود
  busy: false, timer: null, msg: "", skipDirty: false,
  async load() { const d = await Store.get("cloud"); if (d) this.st = {...this.st, ...d}; },
  persist() { return Store.set("cloud", this.st); },
  hash(o) { const s = JSON.stringify(o); let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16) + ":" + s.length; },
  signedIn() { return !!(this.st.session && this.st.session.refresh_token); },
  email() { return this.st.session?.user?.email || ""; },

  /* ---- ارتباط با API ---- */
  async raw(path, {method = "GET", body, token, headers = {}} = {}) {
    const r = await fetch(CLOUD_URL + path, {method, headers: {apikey: CLOUD_KEY, "Content-Type": "application/json", ...(token ? {Authorization: "Bearer " + token} : {}), ...headers}, body: body === undefined ? undefined : JSON.stringify(body)});
    let j = null; const t = await r.text(); try { j = t ? JSON.parse(t) : null; } catch (_) {}
    if (!r.ok) { const e = new Error((j && (j.msg || j.message || j.error_description || j.error)) || ("HTTP " + r.status)); e.status = r.status; e.code = j && (j.error_code || j.code); throw e; }
    return j;
  },
  setSession(j) {
    if (!j || !j.access_token) return false;
    this.st.session = {access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)), user: j.user || this.st.session?.user};
    this.persist(); return true;
  },
  async token() {
    const s = this.st.session; if (!s) throw new Error("وارد حساب نشده‌ای");
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try { const j = await this.raw("/auth/v1/token?grant_type=refresh_token", {method: "POST", body: {refresh_token: s.refresh_token}}); this.setSession(j); return this.st.session.access_token; }
    catch (e) { if (e.status === 400 || e.status === 401 || e.status === 403) { this.st.session = null; this.persist(); } throw e; }
  },
  async api(path, opt = {}) { return this.raw(path, {...opt, token: await this.token()}); },
  errText(e) {
    const m = String(e.message || e);
    if (/Invalid login/i.test(m)) return "ایمیل یا گذرواژه اشتباه است";
    if (/Email not confirmed/i.test(m)) return "ایمیل هنوز تأیید نشده؛ لینک ارسال‌شده را باز کن";
    if (/already registered|already been registered/i.test(m)) return "این ایمیل قبلاً ثبت‌نام کرده؛ وارد شو";
    if (/Password should be|at least/i.test(m)) return "گذرواژه باید حداقل ۶ نویسه باشد";
    if (/valid email|invalid format|Unable to validate email/i.test(m)) return "ایمیل معتبر نیست";
    if (/rate limit|too many/i.test(m)) return "درخواست‌ها زیاد بود؛ کمی بعد دوباره تلاش کن";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "اتصال اینترنت برقرار نیست";
    return m;
  },

  /* ---- حساب ---- */
  async signUp(email, password) {
    const j = await this.raw("/auth/v1/signup?redirect_to=" + encodeURIComponent(this.back()), {method: "POST", body: {email, password}});
    if (j && j.access_token) { this.setSession(j); return {session: true}; }
    return {session: false};          // تأیید ایمیل لازم است
  },
  async signIn(email, password) { this.setSession(await this.raw("/auth/v1/token?grant_type=password", {method: "POST", body: {email, password}})); },
  async recover(email) { await this.raw("/auth/v1/recover?redirect_to=" + encodeURIComponent(this.back()), {method: "POST", body: {email}}); },
  async signOut() {
    try { if (this.st.session) await this.raw("/auth/v1/logout", {method: "POST", token: this.st.session.access_token}); } catch (_) {}
    this.st.session = null; this.st.on = false; this.persist();
  },
  uid() { return this.st.session?.user?.id; },
  back() { return location.origin + location.pathname; },          // آدرس برگشت بعد از زدن لینک ایمیل (باید در Redirect URLs سوپابیس مجاز باشد)
  /* برگشت از لینک ایمیل (تأیید ثبت‌نام یا بازنشانی گذرواژه): توکن‌ها در hash می‌آیند، مثل #access_token=…&type=signup */
  async fromHash() {
    const h = location.hash.replace(/^#\/?/, "");
    if (!/(^|&)(access_token|error)=/.test(h)) return false;
    const q = new URLSearchParams(h); history.replaceState(null, "", location.pathname + "#/cloud");
    if (q.get("error")) { setTimeout(() => toast(/expired|invalid/i.test(q.get("error_description") || "") ? "لینک منقضی شده یا نامعتبر است؛ دوباره تلاش کن" : (q.get("error_description") || "خطا").replace(/\+/g, " ")), 800); return true; }
    try {
      const at = q.get("access_token"), user = await this.raw("/auth/v1/user", {token: at});
      this.setSession({access_token: at, refresh_token: q.get("refresh_token"), expires_in: +q.get("expires_in") || 3600, user});
      const rec = q.get("type") === "recovery";
      setTimeout(async () => {
        if (rec) { const pw = await ask({title: "گذرواژهٔ جدید", text: "گذرواژهٔ جدید را بنویس (حداقل ۶ نویسه).", input: "", ok: "ذخیره"}); if (pw) { try { await this.api("/auth/v1/user", {method: "PUT", body: {password: pw}}); toast("گذرواژه تغییر کرد"); } catch (e) { toast(this.errText(e)); } } }
        else { toast("ایمیل تأیید شد"); if (!this.st.on && (await this.connect().catch(() => false))) toast("ذخیرهٔ ابری فعال شد"); }
        if (typeof viewCloud === "function" && location.hash === "#/cloud") viewCloud();
      }, 900);
    } catch (e) { setTimeout(() => toast(this.errText(e)), 800); }
    return true;
  },

  /* ---- همگام‌سازی ---- */
  dirty() {                                    // بعد از هر save() فراخوانی می‌شود
    if (this.skipDirty || !this.st.on || !this.signedIn()) return;
    clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(), 3000);
  },
  async list() { return this.api("/rest/v1/user_courses?select=course_id,deleted,updated_at&order=updated_at"); },
  async fetchOne(id) { const r = await this.api("/rest/v1/user_courses?select=data&course_id=eq." + encodeURIComponent(id)); return r && r[0] && r[0].data; },
  /* نوشتن با «قفل خوش‌بینانه»: فقط اگر ردیف سرور هنوز همان نسخه‌ای باشد که همین الان خواندیم (t). وگرنه خطای conflict */
  async put(id, data, deleted, t) {
    const clash = () => { const e = new Error("conflict"); e.conflict = true; return e; };
    let r;
    if (t) {
      r = await this.api(`/rest/v1/user_courses?user_id=eq.${encodeURIComponent(this.uid())}&course_id=eq.${encodeURIComponent(id)}&updated_at=eq.${encodeURIComponent(t)}&select=updated_at`,
        {method: "PATCH", headers: {Prefer: "return=representation"}, body: {data: data || {}, deleted: !!deleted}});
      if (!r || !r.length) throw clash();
    } else {
      try { r = await this.api("/rest/v1/user_courses?select=updated_at", {method: "POST", headers: {Prefer: "return=representation"}, body: [{user_id: this.uid(), course_id: id, data: data || {}, deleted: !!deleted}]}); }
      catch (e) { if (e.status === 409) throw clash(); throw e; }
    }
    return r && r[0] && r[0].updated_at;
  },
  applyLocal(fn) { this.skipDirty = true; try { fn(); } finally { this.skipDirty = false; } Store.set("state", S); },
  copyOf(c) { const x = JSON.parse(JSON.stringify(c)); x.id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); x.name = (x.name || "") + " (نسخهٔ سرور)"; return x; },

  /* mode: "merge" (پیش‌فرض)، "device" (سرور را با دستگاه جایگزین کن)، "server" (دستگاه را با سرور جایگزین کن) */
  async sync(mode = "merge", tries = 0) {
    if (this.busy || !this.st.on || !this.signedIn() || !navigator.onLine) return;
    this.busy = true; this.msg = "در حال همگام‌سازی…"; this.ui();
    let changedLocal = false, again = false;
    try {
      const remote = await this.list(), map = this.st.map, byId = new Map(remote.map(r => [r.course_id, r]));
      if (mode === "server") {                                              // دستگاه = سرور
        const keep = []; for (const r of remote) if (!r.deleted) { const d = await this.fetchOne(r.course_id); if (d && d.id) { keep.push(d); map[r.course_id] = {h: this.hash(d), t: r.updated_at}; } }
        this.applyLocal(() => { S.courses = keep; }); for (const k of Object.keys(map)) if (!keep.some(c => c.id === k)) delete map[k]; changedLocal = true;
      } else {
        if (mode === "device") for (const r of remote) if (!r.deleted && !S.courses.some(c => c.id === r.course_id)) { map[r.course_id] = {h: "", t: r.updated_at}; }   // با حذف سرور (در مرحلهٔ پایین)
        for (const r of remote) {
          const local = S.courses.find(c => c.id === r.course_id), m = map[r.course_id];
          if (r.deleted) { if (local && m && this.hash(local) === m.h) { this.applyLocal(() => { S.courses = S.courses.filter(c => c !== local); }); delete map[r.course_id]; changedLocal = true; } else if (local) map[r.course_id] = {h: "", t: r.updated_at}; continue; }
          if (!local) { if (mode === "device" || m) continue;                // m: همین‌جا حذف شده؛ در مرحلهٔ ارسال، حذف به سرور می‌رود
           const d = await this.fetchOne(r.course_id); if (d && d.id) { this.applyLocal(() => S.courses.push(d)); map[r.course_id] = {h: this.hash(d), t: r.updated_at}; changedLocal = true; } continue; }
          if (m && m.t === r.updated_at) continue;                          // سرور تغییری نکرده
          const lh = this.hash(local);
          if (m && lh === m.h) { const d = await this.fetchOne(r.course_id); if (d && d.id) { this.applyLocal(() => { S.courses[S.courses.indexOf(local)] = d; }); map[r.course_id] = {h: this.hash(d), t: r.updated_at}; changedLocal = true; } continue; }
          if (mode === "device") continue;                                  // دستگاه برنده است: در مرحلهٔ ارسال رویش نوشته می‌شود
          const d = await this.fetchOne(r.course_id);                       // هر دو تغییر کرده‌اند: چیزی گم نشود، نسخهٔ سرور به‌صورت درس جدا نگه داشته می‌شود
          if (d && d.id && this.hash(d) !== lh) { const cp = this.copyOf(d); this.applyLocal(() => S.courses.push(cp)); changedLocal = true; }
          map[r.course_id] = {h: "", t: r.updated_at};                      // بعد از ارسال، نسخهٔ دستگاه مرجع می‌شود
        }
      }
      // ارسال تغییرات دستگاه
      for (const c of S.courses) {
        const h = this.hash(c), m = map[c.id];
        if (m && m.h === h) continue;
        try { const t = await this.put(c.id, c, false, byId.get(c.id)?.updated_at); map[c.id] = {h, t}; } catch (e) { if (e.conflict) { again = true; continue; } throw e; }
      }
      // حذف‌ها (درسی که قبلاً همگام شده و حالا روی دستگاه نیست)، و در حالت «دستگاه»، درس‌های فقط-سروری
      for (const id of Object.keys(map)) if (!S.courses.some(c => c.id === id)) {
        const r = byId.get(id); if (r && r.deleted) { delete map[id]; continue; }
        try { await this.put(id, {}, true, r && r.updated_at); delete map[id]; } catch (e) { if (e.conflict) { again = true; continue; } throw e; }
      }
      this.st.last = Date.now(); this.msg = ""; await this.persist();
      if (again && tries < 3) { this.busy = false; return this.sync("merge", tries + 1); }
      if (changedLocal && typeof route === "function") route();
    } catch (e) { this.msg = "همگام‌سازی انجام نشد: " + this.errText(e); }
    this.busy = false; this.ui();
  },
  /* اتصال برای اولین بار: اگر هم روی دستگاه و هم روی سرور داده هست از کاربر می‌پرسد */
  async connect() {
    if (this.st.uid && this.st.uid !== this.uid()) { this.st.map = {}; }
    this.st.uid = this.uid();
    let remote = []; try { remote = (await this.list()).filter(r => !r.deleted); } catch (e) { throw e; }
    let mode = "merge";
    if (remote.length && S.courses.length && !Object.keys(this.st.map).length) {
      mode = await new Promise(res => {
        dlg.innerHTML = `<h2>اطلاعات هم روی دستگاه و هم روی سرور هست</h2><div class="muted">روی سرور ${fa(remote.length)} درس و روی این دستگاه ${fa(S.courses.length)} درس دارد. چه کنیم؟</div>
          <div class="col" style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
          <button class="btn" data-m="merge">ادغام (هر دو نگه داشته شود)</button>
          <button class="btn soft" data-m="server">جایگزینی اطلاعات دستگاه با سرور</button>
          <button class="btn soft" data-m="device">جایگزینی اطلاعات سرور با دستگاه</button>
          <button class="btn soft" data-m="">انصراف</button></div>`;
        dlg.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { dlg.close(); res(b.dataset.m); });
        dlg.oncancel = () => res(""); dlg.showModal();
      });
      if (!mode) return false;
    }
    this.st.on = true; await this.persist();
    await this.sync(mode); return true;
  },
  async disable() { clearTimeout(this.timer); this.st.on = false; await this.persist(); },
  async wipeServer() {               // همهٔ ردیف‌های این کاربر را حذف می‌کند (سابقهٔ حذف در سرور هم نمی‌ماند)
    await this.api("/rest/v1/user_courses?user_id=eq." + encodeURIComponent(this.uid()), {method: "DELETE"});
    this.st.map = {}; await this.persist();
  },
  ui() { if (location.hash === "#/cloud" && typeof viewCloud === "function" && !document.querySelector("dialog[open]") && !document.activeElement?.closest?.("#cl")) viewCloud(); },
  init() {
    addEventListener("online", () => this.sync()); addEventListener("visibilitychange", () => !document.hidden && this.sync());
    setInterval(() => !document.hidden && this.sync(), 120000);
    if (this.st.on) setTimeout(() => this.sync(), 1500);
  }
};

/* ---------- صفحهٔ ذخیرهٔ ابری ---------- */
let clMode = "in";
function viewCloud() {
  setBar("ذخیرهٔ ابری", {back: "#/"});
  const C = Cloud, root = document.createElement("div"); root.className = "setgrid"; root.id = "cl";
  const when = C.st.last ? new Date(C.st.last).toLocaleString(isEn() ? "en-US" : "fa-IR") : "—";
  let h = `<div class="setsec"><div class="section">ذخیرهٔ ابری (اختیاری)</div>
    <div class="muted">به‌صورت پیش‌فرض همهٔ اطلاعات فقط روی همین دستگاه ذخیره می‌شود. اگر بخواهی، می‌توانی با ایمیل ثبت‌نام کنی تا دروس، افراد، سوابق حضور و چهره‌ها روی سرور هم ذخیره و روی دستگاه‌های دیگر در دسترس باشند. هر زمان بخواهی می‌توانی آن را خاموش کنی.</div></div>`;
  if (!C.signedIn()) {
    const up = clMode === "up";
    h += `<div class="setsec"><div class="section">${up ? "ثبت‌نام با ایمیل" : "ورود"}</div>
      <input type="email" id="cem" placeholder="ایمیل" dir="ltr" autocomplete="email" style="width:100%">
      <input type="password" id="cpw" placeholder="گذرواژه (حداقل ۶ نویسه)" dir="ltr" autocomplete="${up ? "new-password" : "current-password"}" style="width:100%;margin-top:8px">
      ${up ? `<label class="chk" style="display:flex;gap:8px;align-items:flex-start;margin-top:10px"><input type="checkbox" id="ccs" style="width:auto;margin-top:4px"><span class="muted">می‌دانم که اطلاعات دروس، نام افراد، سوابق حضور و تصاویر/ویژگی‌های چهرهٔ ثبت‌شده روی سرور ذخیره می‌شود و مسئولیت کسب رضایت افراد با من است.</span></label>` : ""}
      <div class="row" style="margin-top:10px"><button class="btn" id="cgo">${up ? "ثبت‌نام و فعال‌سازی" : "ورود و فعال‌سازی"}</button></div>
      <div class="row"><button class="btn soft" id="csw">${up ? "حساب دارم؛ ورود" : "حساب ندارم؛ ثبت‌نام"}</button>${up ? "" : `<button class="btn soft" id="crc">فراموشی گذرواژه</button>`}</div>
      <div class="muted" id="cmsg"></div></div>`;
  } else {
    h += `<div class="setsec"><div class="section">حساب</div>
      <div class="muted" dir="ltr" style="text-align:start">${esc(C.email())}</div>
      <label class="chk" style="display:flex;gap:10px;align-items:center;margin-top:10px"><input type="checkbox" id="con" ${C.st.on ? "checked" : ""} style="width:auto"><b>ذخیرهٔ اطلاعات روی سرور</b></label>
      <div class="muted">${C.st.on ? "فعال است. آخرین همگام‌سازی: " + esc(when) : "خاموش است؛ اطلاعات فقط روی همین دستگاه می‌ماند."}${C.msg ? `<br>${esc(C.msg)}` : ""}</div>
      <div class="row" style="margin-top:10px">${C.st.on ? `<button class="btn" id="csy">همگام‌سازی اکنون</button>` : ""}<button class="btn soft" id="cso">خروج از حساب</button></div>
      <div class="row"><button class="btn soft danger-t" id="cwp">حذف همهٔ اطلاعات من از سرور</button></div>
      <div class="muted" id="cmsg"></div></div>`;
  }
  root.innerHTML = h; show(""); page.appendChild(root);
  const msg = t => { const m = $("#cmsg"); if (m) m.textContent = t; };
  if (!C.signedIn()) {
    $("#csw").onclick = () => { clMode = clMode === "up" ? "in" : "up"; viewCloud(); };
    if ($("#crc")) $("#crc").onclick = async () => { const em = $("#cem").value.trim(); if (!em) return msg("ایمیل را بنویس"); try { await C.recover(em); msg("اگر این ایمیل ثبت‌نام کرده باشد، لینک بازنشانی ارسال شد."); } catch (e) { msg(C.errText(e)); } };
    $("#cgo").onclick = async () => {
      const em = $("#cem").value.trim(), pw = $("#cpw").value;
      if (!em || !pw) return msg("ایمیل و گذرواژه را بنویس");
      if (clMode === "up" && !$("#ccs").checked) return msg("برای ثبت‌نام باید تیک موافقت را بزنی");
      $("#cgo").disabled = true; msg("…");
      try {
        if (clMode === "up") { const r = await C.signUp(em, pw); if (!r.session) { msg("ثبت‌نام انجام شد. ایمیل خود را باز کن، لینک تأیید را بزن و سپس وارد شو."); clMode = "in"; $("#cgo").disabled = false; return; } }
        else await C.signIn(em, pw);
        if (await C.connect()) toast("ذخیرهٔ ابری فعال شد");
        viewCloud();
      } catch (e) { msg(C.errText(e)); $("#cgo").disabled = false; }
    };
  } else {
    $("#con").onchange = async e => { if (e.target.checked) { await C.connect().catch(x => toast(C.errText(x))); } else { await C.disable(); toast("ذخیرهٔ ابری خاموش شد؛ اطلاعات روی دستگاه می‌ماند"); } viewCloud(); };
    if ($("#csy")) $("#csy").onclick = () => C.sync();
    $("#cso").onclick = async () => { await C.signOut(); viewCloud(); toast("از حساب خارج شدی؛ اطلاعات روی دستگاه ماند"); };
    $("#cwp").onclick = async () => {
      if (!await ask({title: "حذف از سرور", text: "همهٔ دروس و اطلاعات تو روی سرور حذف می‌شود. اطلاعات روی این دستگاه می‌ماند و ذخیرهٔ ابری خاموش می‌شود.", ok: "حذف", danger: true})) return;
      try { await C.wipeServer(); await C.disable(); toast("اطلاعات سرور حذف شد"); } catch (e) { toast(C.errText(e)); } viewCloud();
    };
  }
}

/* پیشنهاد یک‌باره: کاربر انتخاب می‌کند اطلاعاتش کجا ذخیره شود */
async function cloudOffer() {
  if (Cloud.st.asked || Cloud.signedIn() || document.querySelector("dialog[open]")) return;
  Cloud.st.asked = true; await Cloud.persist();
  dlg.innerHTML = `<h2>اطلاعات کجا ذخیره شود؟</h2><div class="muted">می‌توانی اطلاعات (دروس، افراد، سوابق و چهره‌ها) را فقط روی همین دستگاه نگه داری، یا با ثبت‌نام با ایمیل روی سرور هم ذخیره کنی تا روی چند دستگاه در دسترس باشد. هر زمان از منوی «ذخیرهٔ ابری» می‌توانی تغییرش بدهی.</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px"><button class="btn" data-c="1">ثبت‌نام با ایمیل و ذخیره روی سرور</button><button class="btn soft" data-c="0">فقط روی این دستگاه</button></div>`;
  dlg.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { dlg.close(); if (b.dataset.c === "1") { clMode = "up"; go("#/cloud"); } });
  dlg.showModal();
}
