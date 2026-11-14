"use strict";
/* مرحلهٔ ۲: دوربین و تشخیص چهره (face-api، روی همین دستگاه؛ هیچ تصویری به جایی ارسال نمی‌شود) */
/* نوار پیشرفت: مدل‌ها و کتابخانه (حدود ۱۴ مگابایت) بار اول با نوار پیشرفت دانلود و در حافظهٔ آفلاین ذخیره می‌شوند */
const CACHE_NAME = "attendance-files";
function prog(el) {
  return (t, f) => {
    if (!el.querySelector(".pg")) el.innerHTML = `<div class="pgt"></div><div class="pg"><i></i></div>`;
    el.querySelector(".pgt").textContent = t; if (f != null) el.querySelector(".pg i").style.width = Math.round(f * 100) + "%";
  };
}
const mb = b => fa((b / 1048576).toFixed(1)).replace(".", isEn() ? "." : "٫");
const Heavy = {
  files: () => typeof HEAVY_FILES !== "undefined" ? HEAVY_FILES : [],
  size: f => (typeof FILE_SIZES !== "undefined" && FILE_SIZES[f]) || 0,
  // دانلود فایل‌ها با نوار پیشرفت و ذخیره در حافظهٔ آفلاین. force=true: حتی اگر قبلاً ذخیره شده دوباره بگیر
  async fetchAll(list, cb, force) {
    if (!window.caches) return;
    const c = await caches.open(CACHE_NAME), total = list.reduce((s, f) => s + (this.size(f) || 1), 0); let done = 0;
    for (const f of list) {
      const sz = this.size(f) || 1;
      if (!force && await c.match(f)) { done += sz; cb(done / total, done, total, f); continue; }
      const r = await fetch(f + (force ? "?r=" + Date.now() : ""), {cache: "reload"});
      if (!r.ok) throw new Error(f + " (" + r.status + ")");
      const chunks = []; let got = 0;
      if (r.body?.getReader) {
        const rd = r.body.getReader();
        for (;;) { const {done: d, value} = await rd.read(); if (d) break; chunks.push(value); got += value.length; cb(Math.min(1, (done + got) / total), done + got, total, f); }
      } else chunks.push(new Uint8Array(await r.arrayBuffer()));
      await c.put(new Request(f), new Response(new Blob(chunks), {headers: {"content-type": r.headers.get("content-type") || ""}}));
      done += sz; cb(done / total, done, total, f);
    }
  },
  async status(list) {
    if (!window.caches) return {n: 0, all: list.length};
    const c = await caches.open(CACHE_NAME); let n = 0;
    for (const f of list) if (await c.match(f)) n++;
    return {n, all: list.length};
  },
};
const Face = {
  ready: null, cam: null, loop: 0,
  subs: new Set(), last: null,
  load(set) {
    this.subs.add(set);                                      // چند صفحه می‌توانند هم‌زمان پیشرفت یک بارگذاری را ببینند
    if (this.ready) { if (this.last) set(...this.last); return this.ready; }
    const say = set; set = (t, f) => { this.last = [t, f]; this.subs.forEach(s => { try { s(t, f); } catch (_) {} }); };
    this.ready = (async () => {
      try { await Heavy.fetchAll(Heavy.files(), (f, d, tot) => set(`دانلود مدل‌ها و کتابخانه: ${fa(Math.round(f * 100))}٪ (${mb(d)} از ${mb(tot)} مگابایت)`, f)); }
      catch (e) { throw new Error("download"); }
      set("بارگذاری کتابخانه…", 1);
      await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "lib/face-api.js"; s.onload = ok; s.onerror = () => no(new Error("lib")); document.head.appendChild(s); });
      const n = faceapi.nets, names = [["tinyFaceDetector", "تشخیص سریع"], ["ssdMobilenetv1", "تشخیص دقیق"], ["faceLandmark68Net", "نقاط چهره"], ["faceRecognitionNet", "شناسایی"]];
      for (const [k, t] of names) { set("بارگذاری مدل: " + t + "…"); await n[k].loadFromUri("models"); }
      this.last = null; this.subs.clear();
    })().catch(e => { this.ready = null; this.last = null; this.subs.clear(); throw e; });
    return this.ready;
  },
  tiny: () => new faceapi.TinyFaceDetectorOptions({inputSize: VP("live_size"), scoreThreshold: VP("det_score")}),
  ssd: () => new faceapi.SsdMobilenetv1Options({minConfidence: VP("det_score")}),
  async detect(src, accurate) {
    return faceapi.detectAllFaces(src, accurate && VP("photo_accurate") ? this.ssd() : this.tiny()).withFaceLandmarks().withFaceDescriptors();
  },
  async detectRegion(img, tx, ty, boxes) {                 // پردازش مجدد اطراف یک نقطه (برای چهره‌های جاافتاده)
    const W = img.width, H = img.height, side = Math.min(Math.min(W, H), Math.max(160, Math.max(W, H) * 0.38));
    const sx = Math.min(Math.max(tx - side / 2, 0), W - side), sy = Math.min(Math.max(ty - side / 2, 0), H - side), Z = 512;
    const cv = document.createElement("canvas"); cv.width = cv.height = Z;
    cv.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, Z, Z);
    const sc = Math.max(.15, VP("det_score") - .25);
    let r = await faceapi.detectAllFaces(cv, new faceapi.SsdMobilenetv1Options({minConfidence: sc})).withFaceLandmarks().withFaceDescriptors();
    if (!r.length) r = await faceapi.detectAllFaces(cv, new faceapi.TinyFaceDetectorOptions({inputSize: 608, scoreThreshold: sc})).withFaceLandmarks().withFaceDescriptors();
    const k = side / Z, out = [];
    for (const d of r) {
      const b = d.detection.box, box = {x: sx + b.x * k, y: sy + b.y * k, width: b.width * k, height: b.height * k};
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      if (boxes.some(o => cx > o.x && cx < o.x + o.width && cy > o.y && cy < o.y + o.height)) continue;     // قبلاً کادر دارد
      out.push({detection: {box, score: d.detection.score}, descriptor: d.descriptor, _d: Math.hypot(cx - tx, cy - ty)});
    }
    return out.sort((a, b) => a._d - b._d);
  },
  gallery(c) {
    const g = [];
    for (const n of c.people) for (const s of (c.faces?.[n] || [])) g.push({name: n, d: new Float32Array(s.d)});
    return g;
  },
  match(d, gal, thr) {
    let best = null, bd = 9;
    for (const g of gal) { const x = faceapi.euclideanDistance(d, g.d); if (x < bd) { bd = x; best = g.name; } }
    return bd <= thr ? {name: best, dist: bd} : {name: null, dist: bd};
  },
  async startCam(video, facing) {
    this.stopCam();
    this.cam = await navigator.mediaDevices.getUserMedia({audio: false, video: {facingMode: facing, width: {ideal: 960}, height: {ideal: 720}}});
    video.srcObject = this.cam; video.muted = true; video.setAttribute("playsinline", "");
    await video.play();
  },
  stopCam() {
    this.loop++;
    if (this.cam) { this.cam.getTracks().forEach(t => t.stop()); this.cam = null; }
  },
};
const thumbOf = (src, box) => {                      // مربع کوچک اطراف چهره برای نمایش
  const m = box.width * (VP("crop_k") - 1) / 2, x = Math.max(0, box.x - m), y = Math.max(0, box.y - m), w = box.width + 2 * m, h = box.height + 2 * m;
  const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
  const side = Math.min(Math.max(w, h), sw, sh);
  const cx = Math.min(Math.max(x + w / 2 - side / 2, 0), sw - side), cy = Math.min(Math.max(y + h / 2 - side / 2, 0), sh - side);
  const z = VP("thumb_size"), c = document.createElement("canvas"); c.width = c.height = z;
  c.getContext("2d").drawImage(src, cx, cy, side, side, 0, 0, z, z);
  return c.toDataURL("image/jpeg", VP("jpeg"));
};
const loadImg = file => new Promise((ok, no) => {            // عکس را به اندازهٔ مجاز کوچک می‌کند (یک canvas برمی‌گرداند)
  const i = new Image();
  i.onload = () => {
    const k = Math.min(1, VP("photo_side") / Math.max(i.naturalWidth, i.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(i.naturalWidth * k); c.height = Math.round(i.naturalHeight * k);
    c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(i.src); ok(c);
  };
  i.onerror = no; i.src = URL.createObjectURL(file);
});
const cameraBox = () => `<div class="cam"><video id="vd" playsinline muted></video><canvas id="ov"></canvas><div class="cam-msg" id="cm"></div></div>`;
function drawBoxes(cv, vw, vh, items) {               // items: [{box,label,ok}]
  cv.width = vw; cv.height = vh;
  const g = cv.getContext("2d"); g.clearRect(0, 0, vw, vh);
  const lw = Math.max(2, vw / 220); g.lineWidth = lw; const fs = Math.max(14, vw / 26); g.font = `bold ${fs}px IRANSans, sans-serif`; g.textBaseline = "top";
  for (const it of items) {
    const b = it.box, col = it.ok === false ? "#f59e0b" : "#22c55e";
    g.strokeStyle = col; g.strokeRect(b.x, b.y, b.width, b.height);
    if (it.ok === true && it.label) {            // فقط بالای کادر سبز: نام با فونت ریز
      const f2 = Math.max(9, vw / 70); g.font = `${f2}px IRANSans, sans-serif`;
      const w = g.measureText(it.label).width + 6, h = f2 + 4;
      g.fillStyle = col; g.fillRect(b.x - lw / 2, b.y - h, w, h);
      g.fillStyle = "#0b1220"; g.fillText(it.label, b.x + 3, b.y - h + 2);
    }
  }
}
function needSecure() {
  return navigator.mediaDevices?.getUserMedia ? "" : "این مرورگر دوربین را پشتیبانی نمی‌کند (یا صفحه با HTTPS باز نشده است).";
}

/* ---------- ثبت نمونهٔ چهرهٔ یک فرد ---------- */
async function viewEnroll(c, idx) {
  const name = c.people[idx];
  if (name === undefined) return go("#/c/" + c.id + "/people");
  c.faces = c.faces || {}; const MAX = VP("max_faces");
  setBar("نمونهٔ چهره", {back: `#/c/${c.id}/people`, sub: name, acc: "primary"});
  show(`${cameraBox()}
    <div class="row"><button class="btn" id="shot" disabled style="flex:1">ثبت نمونه از دوربین</button>
      <button class="btn soft" id="flip" aria-label="تعویض دوربین">↻</button></div>
    <div class="row"><button class="btn soft" id="pick" style="flex:1">افزودن از عکس</button></div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="muted" id="st"></div><div class="section" id="sh"></div><div class="thumbs" id="th"></div>`);
  const cm = $("#cm"), st = $("#st"), vd = $("#vd"), ov = $("#ov");
  const draw = () => {
    const l = c.faces[name] || [];
    $("#sh").textContent = `نمونه‌ها: ${fa(l.length)} از ${fa(MAX)}`;
    $("#th").innerHTML = l.map((s, i) => `<div class="th"><img src="${s.t}" alt=""><button data-i="${i}" aria-label="حذف">×</button></div>`).join("");
    $("#th").querySelectorAll("button").forEach(b => b.onclick = () => { const x = (c.faces[name] || []).splice(+b.dataset.i, 1); save(); draw(); toast("نمونه حذف شد", () => { c.faces[name].splice(+b.dataset.i, 0, x[0]); save(); draw(); }); });
    $("#shot").dataset.full = l.length >= MAX ? "1" : "";
  };
  draw();
  const add = (det, src) => {
    if ((c.faces[name] || []).length >= MAX) return toast("حداکثر نمونه ثبت شده؛ یکی را حذف کن");
    (c.faces[name] = c.faces[name] || []).push({d: Array.from(det.descriptor), t: thumbOf(src, det.detection.box)});
    save(); draw(); toast("نمونه ثبت شد");
  };
  try { cm.textContent = "در حال بارگذاری…"; await Face.load(prog(cm)); } catch (e) { cm.textContent = "بارگذاری مدل‌ها ناموفق بود (اینترنت بار اول لازم است)"; return; }
  let facing = "user", last = null, token = ++Face.loop;
  const run = async () => {
    const err = needSecure(); if (err) { cm.textContent = err; return; }
    try { await Face.startCam(vd, facing); } catch (e) { cm.textContent = "اجازهٔ دوربین داده نشد"; return; }
    cm.textContent = ""; token = ++Face.loop;
    const tick = async () => {
      if (token !== Face.loop) return;
      const t0 = performance.now();
      try {
        const r = await Face.detect(vd, false);
        if (token !== Face.loop) return;
        last = r.length === 1 ? r[0] : null;
        drawBoxes(ov, vd.videoWidth, vd.videoHeight, r.map(x => ({box: x.detection.box, ok: r.length === 1})));
        $("#shot").disabled = !last;
        st.textContent = r.length === 0 ? "چهره‌ای دیده نمی‌شود" : r.length > 1 ? "فقط یک نفر مقابل دوربین باشد" : "آماده؛ ثبت کن  ·  " + fa(Math.round(performance.now() - t0)) + " میلی‌ثانیه";
      } catch (e) {}
      setTimeout(tick, VP("live_ms"));
    };
    tick();
  };
  $("#shot").onclick = () => last && add(last, vd);
  $("#flip").onclick = () => { Beep.unlock(); facing = facing === "user" ? "environment" : "user"; run(); };
  $("#pick").onclick = () => $("#fi").click();
  $("#fi").onchange = async e => {
    const f = e.target.files[0]; if (!f) return; e.target.value = "";
    st.textContent = "در حال تشخیص…";
    const img = await loadImg(f), r = await Face.detect(img, true);
    if (r.length !== 1) return st.textContent = r.length ? "در عکس بیش از یک چهره است؛ عکسی با یک نفر انتخاب کن" : "چهره‌ای در عکس پیدا نشد";
    st.textContent = ""; add(r[0], img);
  };
  run();
}

/* چند عکس: تب‌ها + swipe بین عکس‌ها */
function photoShots(pc, tabs, onShow) {
  const o = {list: [], i: -1};
  o.show = (i, dir = 0) => {
    if (i < 0 || i >= o.list.length) return; o.i = i; onShow(o.list[i]); o.draw();
    if (dir && pc.animate) pc.animate([{opacity: .25, transform: `translateX(${dir * 36}px)`}, {opacity: 1, transform: "none"}], 200);
  };
  o.draw = () => {
    tabs.hidden = o.list.length < 2;
    tabs.innerHTML = o.list.map((s, k) => `<button class="tab${k === o.i ? " on" : ""}" data-k="${k}">عکس ${fa(k + 1)} <small>${fa(s.faces.length)}</small></button>`).join("");
    tabs.querySelectorAll("[data-k]").forEach(b => b.onclick = () => o.show(+b.dataset.k, +b.dataset.k > o.i ? -1 : 1));
    tabs.querySelector(".on")?.scrollIntoView({block: "nearest", inline: "center"});
  };
  let x0 = 0, y0 = 0, on = false;
  pc.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; on = true; });
  pc.addEventListener("pointerup", e => {
    if (!on) return; on = false;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy) && o.list.length > 1) {      // فارسی: swipe به راست = عکس بعدی
      const next = isEn() ? dx < 0 : dx > 0; o.show(o.i + (next ? 1 : -1), next ? -1 : 1) ; pc._sw = 1; setTimeout(() => pc._sw = 0, 400);
    }
  });
  pc.style.touchAction = "pan-y";
  return o;
}

/* ---------- لمس روی عکس پردازش‌شده (مشترک بین «حضور و غیاب» و «تعریف افراد») ----------
   لمس کادر = ثبت نام / تغییر فرد؛ لمس جای دیگر = پردازش مجدد اطراف همان نقطه برای پیدا کردن چهرهٔ جاافتاده */
function bindPhotoTap(pc, c, h) {
  let busy = false;
  pc.onclick = async e => {
    if (pc._sw) return;
    const img = h.img(); if (!img || busy) return;
    const rc = pc.getBoundingClientRect(), x = (e.clientX - rc.left) * pc.width / rc.width, y = (e.clientY - rc.top) * pc.height / rc.height;
    const hit = h.faces().filter(f => x >= f.box.x && x <= f.box.x + f.box.width && y >= f.box.y && y <= f.box.y + f.box.height).sort((p, q) => p.box.width - q.box.width)[0];
    if (hit) {
      const th = thumbOf(img, hit.box), v = await pickName(c, {s: [{t: th}]});
      if (!v || v === hit.name) return;
      return h.assign(hit, v, th);
    }
    busy = true; h.msg("در حال جست‌وجوی چهره در این ناحیه…");
    try {
      const r = await Face.detectRegion(img, x, y, h.faces().map(f => f.box));
      r.forEach(d => h.absorb(d)); h.redraw();
      h.msg(r.length ? `${fa(r.length)} چهرهٔ تازه در این ناحیه پیدا شد؛ روی کادر بزن.` : "چهره‌ای در این ناحیه پیدا نشد");
    } catch (er) { h.msg("پردازش این ناحیه ناموفق بود"); }
    busy = false;
  };
}

/* ---------- حضور و غیاب (آزمایشی: بدون ذخیره در سوابق) ---------- */
async function viewAttend(c) {
  c.faces = c.faces || {};
  setBar("حضور و غیاب", {back: "#/c/" + c.id, sub: c.name + " · آزمایشی", acc: "ok"});
  let gal = Face.gallery(c); const enrolled = c.people.filter(n => (c.faces[n] || []).length).length;
  show(`<div class="muted">${fa(enrolled)} نفر از ${fa(c.people.length)} نفر نمونهٔ چهره دارند.${enrolled ? "" : " اول از «تعریف افراد» نمونه ثبت کن."}</div>
    <div class="chips"><div class="chip on" data-m="cam">دوربین زنده</div><div class="chip" data-m="photo">از عکس</div></div>
    <div id="mode"></div>
    <div class="row" style="align-items:center"><span class="muted">آستانه (کمتر = سخت‌گیرتر)</span><input type="range" id="thr" min="35" max="70" value="${Math.round(VP("match_thr") * 100)}" style="flex:1"><b id="tv">۰٫۵۰</b></div>
    <div class="section" id="sum"></div>
    <div class="row"><button class="btn" id="sv" style="flex:1">ثبت جلسه در سوابق</button></div><div id="res" style="display:flex;flex-direction:column;gap:8px"></div>`);
  let thr = VP("match_thr"); $("#thr").oninput = e => { thr = e.target.value / 100; $("#tv").textContent = fa(thr.toFixed(2)).replace(".", "٫"); };
  $("#thr").oninput({target: $("#thr")});
  const found = new Map();                                // نام ← کمترین فاصله
  const gone = new Set(), alias = new Map();                // زنده: حذف‌شده‌ها و «نام قدیم ← نام اصلاح‌شده»
  const thumb = new Map();                                // نام ← تصویر کوچک چهرهٔ شناسایی‌شده
  const crop = (src, b) => {                              // برش مربعی دور چهره (با کمی حاشیه) از ویدیو یا تصویر
    try {
      const w = src.videoWidth || src.width, h = src.videoHeight || src.height, m = .25, s = Math.max(b.width, b.height) * (1 + m * 2);
      const cx = b.x + b.width / 2, cy = b.y + b.height / 2, x0 = Math.max(0, cx - s / 2), y0 = Math.max(0, cy - s / 2), sw = Math.min(s, w - x0), sh = Math.min(s, h - y0);
      const c = document.createElement("canvas"); c.width = c.height = 96; const g = c.getContext("2d");
      g.drawImage(src, x0, y0, sw, sh, 0, 0, 96, 96); return c.toDataURL("image/jpeg", .8);
    } catch (e) { return null; }
  };
  const keep = (n, d, src, box) => { if (!thumb.has(n) || (found.get(n) ?? 9) - d > .03) { const t = crop(src, box); if (t) thumb.set(n, t); } };
  const summary = () => {
    const miss = c.people.filter(n => !found.has(n));
    $("#sum").textContent = `حاضر: ${fa(found.size)} از ${fa(c.people.length)}`;
    $("#res").innerHTML = [...found].map(([n, d]) => `<div class="card" style="min-height:52px;cursor:default">${thumb.has(n) ? `<img src="${thumb.get(n)}" alt="" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none">` : `<div class="avatar" style="width:36px;height:36px">${esc([...n][0])}</div>`}<div class="txt"><div class="t">${esc(n)}</div><div class="s">${fa(d.toFixed(2)).replace(".", "٫")}</div></div><div class="act"><button class="mini" data-ren="${esc(n)}" aria-label="تغییر نام">${icon("edit")}</button><button class="mini del" data-del="${esc(n)}" aria-label="حذف از فهرست">${icon("trash")}</button></div></div>`).join("") +
      (miss.length ? `<div class="muted">غایب/دیده‌نشده: ${esc(miss.join("، "))}</div>` : "");
  };
  summary();
  let onDrop = n => {}, onMove = (a, b) => {};                // حالت فعال (زنده یا عکس) این‌ها را تنظیم می‌کند
  $("#res").onclick = async e => {
    const d = e.target.closest("[data-del]"), r = e.target.closest("[data-ren]");
    if (d) { const n = d.dataset.del; found.delete(n); thumb.delete(n); onDrop(n); summary(); toast(`«${n}» از فهرست حاضرین برداشته شد`); }
    if (r) {
      const a = r.dataset.ren, b = await pickPerson(c, a, thumb.get(a)); if (!b || b === a) return;
      const da = found.get(a), db = found.get(b);
      found.delete(a); if (db === undefined || da < db) found.set(b, da);
      const ta = thumb.get(a); thumb.delete(a); if (ta && (db === undefined || da < db || !thumb.has(b))) thumb.set(b, ta);
      onMove(a, b); summary(); toast(`«${a}» ← «${b}»`);
    }
  };
  $("#sv").onclick = async () => {
    if (!c.people.length) return toast("اول افراد را تعریف کن");
    if (!found.size && !await ask({title: "ثبت جلسه", text: "هیچ‌کس شناسایی نشده؛ همه غایب ثبت شوند؟", ok: "ثبت"})) return;
    const ns = addSession(c, new Set(found.keys())); Face.stopCam(); toast("جلسه ثبت شد"); mdAutoSession(c, ns); go(`#/c/${c.id}/records`);
  };
  const modeEl = $("#mode");
  async function camMode() {
    Beep.unlock(); Face.stopCam();
    onDrop = n => gone.add(n); onMove = (a, b) => { for (const [k, v] of alias) if (v === a) alias.set(k, b); alias.set(a, b); gone.delete(b); }; modeEl.innerHTML = cameraBox() + `<div class="row"><button class="btn soft" id="flip" aria-label="تعویض دوربین">↻</button><button class="btn soft" id="clr" style="flex:1">پاک کردن فهرست</button></div><div class="muted" id="st"></div>`;
    const cm = $("#cm"), vd = $("#vd"), ov = $("#ov"), st = $("#st"); let facing = "environment";
    try { cm.textContent = "در حال بارگذاری…"; await Face.load(prog(cm)); } catch (e) { cm.textContent = "بارگذاری مدل‌ها ناموفق بود"; return; }
    if (!vd.isConnected) return;                           // کاربر در همین حین به حالت «عکس» رفته است
    const err = needSecure(); if (err) { cm.textContent = err; return; }
    const run = async () => {
      try { await Face.startCam(vd, facing); } catch (e) { cm.textContent = "اجازهٔ دوربین داده نشد"; return; }
      cm.textContent = ""; const token = ++Face.loop;
      const tick = async () => {
        if (token !== Face.loop) return;
        const t0 = performance.now();
        try {
          const r = await Face.detect(vd, false); if (token !== Face.loop) return;
          let fresh = 0;
          const items = r.map(x => { const m = Face.match(x.descriptor, gal, thr); if (m.name && alias.has(m.name)) m.name = alias.get(m.name); if (m.name && gone.has(m.name)) return {box: x.detection.box, label: m.name, ok: true}; if (m.name && !found.has(m.name)) fresh++; if (m.name) { keep(m.name, m.dist, vd, x.detection.box); if (!found.has(m.name) || found.get(m.name) > m.dist) found.set(m.name, m.dist); } return {box: x.detection.box, label: m.name || "؟", ok: !!m.name}; });
          drawBoxes(ov, vd.videoWidth, vd.videoHeight, items); summary(); if (fresh) Beep.tick(fresh);
          st.textContent = `${fa(r.length)} چهره · ${fa(Math.round(performance.now() - t0))} میلی‌ثانیه`;
        } catch (e) {}
        setTimeout(tick, VP("live_ms"));
      };
      tick();
    };
    $("#flip").onclick = () => { facing = facing === "user" ? "environment" : "user"; run(); };
    $("#clr").onclick = () => { found.clear(); thumb.clear(); gone.clear(); alias.clear(); summary(); };
    run();
  }
  function photoMode() {
    Face.stopCam(); modeEl.innerHTML = `<div class="row"><button class="btn" id="pk" style="flex:1">انتخاب یا گرفتن عکس کلاس</button></div><input type="file" id="fi" accept="image/*" multiple hidden><div class="tabs" id="tb" hidden></div><div class="photo"><canvas id="pc"></canvas></div><div class="muted" id="st"></div><div class="muted" id="hint" hidden>روی کادر زرد بزن تا ثبت نام شود؛ روی کادر سبز بزن تا چهره به فرد دیگری نسبت داده شود؛ روی چهرهٔ بدون کادر بزن تا همان اطراف دوباره پردازش شود.</div>`;
    const srcOf = new Map(); let faces = [], curImg = null;
    const shots = photoShots($("#pc"), $("#tb"), s => { curImg = s.img; faces = s.faces; redraw(); });      // نام ← مجموعهٔ چهره‌هایی که او را «حاضر» کرده‌اند
    const mark = (n, f, img) => { (srcOf.get(n) || srcOf.set(n, new Set()).get(n)).add(f); if (img) keep(n, f.dist, img, f.box); if (!found.has(n) || found.get(n) > f.dist) found.set(n, f.dist); };
    const redraw = () => {
      const pc = $("#pc"); pc.width = curImg.width; pc.height = curImg.height;
      pc.getContext("2d").drawImage(curImg, 0, 0); const sc = document.createElement("canvas");
      drawBoxes(sc, curImg.width, curImg.height, faces.map(f => ({box: f.box, label: f.name || "؟", ok: !!f.name}))); pc.getContext("2d").drawImage(sc, 0, 0);
    };
    $("#pk").onclick = () => $("#fi").click();
    const assign = async (hit, v, th) => {
      if (!c.people.includes(v) && demoBlocks(c.people.length + 1)) return;
      if (!c.people.includes(v)) c.people.push(v);
      const l = (c.faces[v] = c.faces[v] || []);
      if (l.length < VP("max_faces")) l.push({d: Array.from(hit.d), t: th}); else toast("حداکثر نمونه ثبت شده؛ چهره فقط به همین عکس نسبت داده شد");
      if (hit.name) { const s = srcOf.get(hit.name); if (s) { s.delete(hit); if (!s.size) { srcOf.delete(hit.name); found.delete(hit.name); thumb.delete(hit.name); } } }
      hit.name = v; hit.dist = 0; thumb.delete(v); mark(v, hit, curImg);
      gal = Face.gallery(c); save(); redraw(); summary(); toast(`«${v}» ثبت شد`);
    };
    bindPhotoTap($("#pc"), c, {img: () => curImg, faces: () => faces, assign, redraw, msg: s => $("#st").textContent = s,
      absorb: d => { const m = Face.match(d.descriptor, gal, thr), f = {box: d.detection.box, d: d.descriptor, name: m.name, dist: m.dist}; faces.push(f); if (m.name) mark(m.name, f, curImg); summary(); shots.draw(); return f; }});
    onDrop = n => { (srcOf.get(n) || []).forEach(f => { f.name = null; f.dist = 9; }); srcOf.delete(n); shots.draw(); };
    onMove = (a, b) => { const s = srcOf.get(a); srcOf.delete(a); if (!s) return; const t = srcOf.get(b) || srcOf.set(b, new Set()).get(b); s.forEach(f => { f.name = b; t.add(f); }); shots.draw(); };
    $("#fi").onchange = async e => {
      const fs = [...e.target.files]; if (!fs.length) return; e.target.value = ""; const st = $("#st");
      try { st.textContent = "در حال بارگذاری مدل‌ها…"; await Face.load(prog(st)); } catch (er) { return st.textContent = "بارگذاری مدل‌ها ناموفق بود"; }
      const first = shots.list.length; let total = 0, nu = 0; const t0 = performance.now();
      for (let k = 0; k < fs.length; k++) {
        st.textContent = fs.length > 1 ? `در حال تشخیص عکس ${fa(k + 1)} از ${fa(fs.length)}…` : "در حال تشخیص…";
        const img = await loadImg(fs[k]), r = await Face.detect(img, true), fl = [];
        r.forEach(x => { const m = Face.match(x.descriptor, gal, thr), f = {box: x.detection.box, d: x.descriptor, name: m.name, dist: m.dist}; fl.push(f); if (m.name) mark(m.name, f, img); else nu++; });
        shots.list.push({img, faces: fl}); total += r.length;
      }
      shots.show(first); $("#hint").hidden = false; summary();
      st.textContent = `${fa(fs.length)} عکس · ${fa(total)} چهره، ${fa(nu)} ناشناس · ${fa(Math.round(performance.now() - t0))} میلی‌ثانیه`;
    };
  }
  page.querySelectorAll("[data-m]").forEach(ch => ch.onclick = () => {
    page.querySelectorAll("[data-m]").forEach(x => x.classList.toggle("on", x === ch));
    ch.dataset.m === "cam" ? camMode() : photoMode();
  });
  camMode();
}


/* ---------- ثبت چهره در صفحهٔ «تعریف افراد»: شناخته‌شده‌ها نمونه می‌گیرند، ناشناس‌ها «بدون نام» می‌شوند ---------- */
const SCAN = {get thr() { return VP("match_thr"); }, get addBelow() { return VP("add_below"); }, get dup() { return VP("dup"); }, get max() { return VP("max_faces"); }};
function scanPanel(c, host, mode, onChange) {
  c.faces = c.faces || {}; c.unknown = c.unknown || [];
  const stat = {known: new Set(), added: 0, fresh: 0};
  host.innerHTML = (mode === "cam" ? cameraBox() + `<div class="row"><button class="btn soft" id="flip" aria-label="تعویض دوربین">↻</button></div>`
    : `<div class="row"><button class="btn" id="pk" style="flex:1">انتخاب یا گرفتن عکس</button></div><input type="file" id="fi" accept="image/*" multiple hidden><div class="tabs" id="tb" hidden></div><div class="photo"><canvas id="pc"></canvas></div>`) +
    `<div class="muted" id="st"></div>`;
  const st = host.querySelector("#st");
  const minDist = (d, list) => list.reduce((m, s) => Math.min(m, faceapi.euclideanDistance(d, new Float32Array(s.d))), 9);
  // همهٔ هویت‌ها: افراد (با نام) و ناشناس‌ها
  const identify = d => {
    let best = null, bd = 9;
    for (const n of c.people) for (const s of (c.faces[n] || [])) { const x = faceapi.euclideanDistance(d, new Float32Array(s.d)); if (x < bd) { bd = x; best = {kind: "p", n}; } }
    for (const u of c.unknown) for (const s of u.s) { const x = faceapi.euclideanDistance(d, new Float32Array(s.d)); if (x < bd) { bd = x; best = {kind: "u", u}; } }
    return {best, bd};
  };
  // یک چهره را پردازش می‌کند؛ برچسب برمی‌گرداند
  const handle = (det, src, force) => {
    const d = Array.from(det.descriptor), box = det.detection.box;
    if (!force && (det.detection.score < Math.min(.95, VP("det_score") + .1) || box.width < VP("min_face"))) return {label: "…", ok: false, kind: "?"};
    const {best, bd} = identify(det.descriptor), sample = () => ({d, t: thumbOf(src, box)});
    if (best && bd <= SCAN.thr) {
      if (best.kind === "p") {
        stat.known.add(best.n);
        const l = c.faces[best.n] || (c.faces[best.n] = []);
        let smp = null;
        if (bd <= SCAN.addBelow && l.length < SCAN.max && minDist(det.descriptor, l) > SCAN.dup) { smp = sample(); l.push(smp); stat.added++; save(); onChange(); }
        return {label: best.n, ok: true, kind: "p", name: best.n, smp};
      }
      const l = best.u.s;
      let smp = null;
      if (l.length < SCAN.max && minDist(det.descriptor, l) > SCAN.dup) { smp = sample(); l.push(smp); save(); onChange(); }
      return {label: "بدون نام " + fa(c.unknown.indexOf(best.u) + 1), ok: false, kind: "u", u: best.u, smp};
    }
    if (best && bd <= SCAN.thr + VP("unk_margin")) return {label: "؟", ok: false, kind: "?"};     // مبهم: نه اضافه کن نه ناشناس تازه بساز
    const u = {id: uid(), s: [sample()]}; c.unknown.push(u); stat.fresh++; save(); onChange();
    return {label: "بدون نام " + fa(c.unknown.length), ok: false, kind: "u", u, smp: u.s[0]};
  };
  const report = extra => st.textContent = `${fa(stat.known.size)} نفر شناخته‌شده · ${fa(stat.added)} نمونهٔ تازه · ${fa(stat.fresh)} ناشناس جدید${extra ? " · " + extra : ""}`;
  if (mode === "photo") {
    const hint = document.createElement("div"); hint.className = "muted"; hint.hidden = true;
    hint.textContent = "روی کادر زرد بزن تا ثبت نام شود؛ روی کادر سبز بزن تا چهره به فرد دیگری نسبت داده شود؛ روی چهرهٔ بدون کادر بزن تا همان اطراف دوباره پردازش شود.";
    host.appendChild(hint);
    let faces = [], curImg = null;
    const pc = host.querySelector("#pc");
    const redraw = () => {
      pc.width = curImg.width; pc.height = curImg.height; pc.getContext("2d").drawImage(curImg, 0, 0);
      const sc = document.createElement("canvas"); drawBoxes(sc, curImg.width, curImg.height, faces.map(f => ({box: f.box, label: f.label, ok: f.ok}))); pc.getContext("2d").drawImage(sc, 0, 0);
    };
    const absorb = (x, force) => { const h = handle(x, curImg, force); const f = {box: x.detection.box, d: x.descriptor, ...h}; faces.push(f); shots.draw(); return f; };
    const shots = photoShots(pc, host.querySelector("#tb"), s => { curImg = s.img; faces = s.faces; redraw(); });
    const assign = async (hit, v, th) => {
      if (!c.people.includes(v) && demoBlocks(c.people.length + 1)) return;
      if (!c.people.includes(v)) c.people.push(v);
      const l = (c.faces[v] = c.faces[v] || []), room = () => l.length < SCAN.max;
      if (hit.kind === "p" && hit.smp) { const o = c.faces[hit.name] || [], i = o.indexOf(hit.smp); if (i >= 0) o.splice(i, 1); }
      let smp = null;
      if (hit.kind === "u" && hit.u) {                       // کل خوشهٔ ناشناس به همین فرد می‌پیوندد
        const u = hit.u; c.unknown = c.unknown.filter(x => x !== u);
        for (const s of u.s) if (room()) l.push(s);
        smp = hit.smp; faces.forEach(f => { if (f.u === u) { Object.assign(f, {kind: "p", name: v, label: v, ok: true, u: null}); } });
      } else {
        smp = hit.smp || {d: Array.from(hit.d), t: th}; if (room()) l.push(smp);
      }
      Object.assign(hit, {kind: "p", name: v, label: v, ok: true, u: null, smp});
      save(); onChange(); redraw(); toast(`«${v}» ثبت شد`);
    };
    bindPhotoTap(pc, c, {img: () => curImg, faces: () => faces, assign, redraw, msg: s => st.textContent = s, absorb: d => { const f = absorb(d, true); onChange(); return f; }});
    host.querySelector("#pk").onclick = () => host.querySelector("#fi").click();
    host.querySelector("#fi").onchange = async e => {
      const fs = [...e.target.files]; if (!fs.length) return; e.target.value = "";
      try { st.textContent = "در حال بارگذاری مدل‌ها…"; await Face.load(prog(st)); } catch (er) { return st.textContent = "بارگذاری مدل‌ها ناموفق بود"; }
      const first = shots.list.length; let total = 0; const t0 = performance.now();
      for (let k = 0; k < fs.length; k++) {
        st.textContent = fs.length > 1 ? `در حال تشخیص عکس ${fa(k + 1)} از ${fa(fs.length)}…` : "در حال تشخیص…";
        const img = await loadImg(fs[k]), r = await Face.detect(img, true), fl = [];
        r.forEach(x => { const h = handle(x, img, false); fl.push({box: x.detection.box, d: x.descriptor, ...h}); });
        shots.list.push({img, faces: fl}); total += r.length;
      }
      shots.show(first); hint.hidden = false;
      report(`${fa(fs.length)} عکس · ${fa(total)} چهره · ${fa(Math.round(performance.now() - t0))} میلی‌ثانیه`);
    };
    return;
  }
  const cm = host.querySelector("#cm"), vd = host.querySelector("#vd"), ov = host.querySelector("#ov");
  let facing = "user";
  (async () => {
    try { cm.textContent = "در حال بارگذاری…"; await Face.load(prog(cm)); } catch (e) { cm.textContent = "بارگذاری مدل‌ها ناموفق بود"; return; }
    const err = needSecure(); if (err) { cm.textContent = err; return; }
    const run = async () => {
      try { await Face.startCam(vd, facing); } catch (e) { cm.textContent = "اجازهٔ دوربین داده نشد"; return; }
      cm.textContent = ""; const token = ++Face.loop;
      const tick = async () => {
        if (token !== Face.loop) return;
        const t0 = performance.now();
        try {
          const r = await Face.detect(vd, false); if (token !== Face.loop) return;
          drawBoxes(ov, vd.videoWidth, vd.videoHeight, r.map(x => { const h = handle(x, vd); return {box: x.detection.box, label: h.label, ok: h.ok}; }));
          report(`${fa(r.length)} چهره · ${fa(Math.round(performance.now() - t0))} میلی‌ثانیه`);
        } catch (e) {}
        setTimeout(tick, VP("live_ms"));
      };
      tick();
    };
    host.querySelector("#flip").onclick = () => { facing = facing === "user" ? "environment" : "user"; run(); };
    run();
  })();
}

/* صدای کوتاه «تیک» وقتی فردی در دوربین زنده تازه شناسایی شد (WebAudio؛ بدون فایل صوتی) */
const Beep = {ctx: null, last: 0,
  unlock() { try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === "suspended") this.ctx.resume(); } catch (e) {} },
  tick(n = 1) {
    if (S.settings?.beep === false) return;
    const c = this.ctx; if (!c || c.state !== "running" || Date.now() - this.last < 350) return; this.last = Date.now();
    const t = c.currentTime;
    [[1046, 0], [1568, .09]].forEach(([fr, d]) => {                  // دو نت کوتاه بالا رونده (مثل تیک تأیید)
      const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.25, t + d + .01); g.gain.exponentialRampToValueAtTime(.001, t + d + .16);
      o.connect(g); g.connect(c.destination); o.start(t + d); o.stop(t + d + .18);
    });
  }};

/* انتخاب یک فرد از فهرست کشویی افراد درس (برای اصلاح نام در فهرست حاضرین) */
function pickPerson(c, cur, img) {
  return new Promise(res => {
    dlg.innerHTML = `<h2 style="text-align:center">تغییر نام فرد</h2>
      ${img ? `<div style="display:flex;justify-content:center;margin:6px 0 10px"><img src="${img}" alt="" style="width:min(40vw,140px);aspect-ratio:1;object-fit:cover;border-radius:18px;box-shadow:var(--shadow)"></div>` : ""}
      <div class="muted" style="text-align:center">«${esc(cur)}» را به چه کسی تغییر بدهم؟</div>
      <select id="ps" style="width:100%;margin-top:12px;padding:12px;border-radius:12px;border:0;background:var(--card2);color:inherit;font:inherit;font-size:16px">${c.people.filter(n => n !== cur).map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")}</select>
      <div class="row"><button class="btn soft" data-r="0">انصراف</button><button class="btn" data-r="1">تغییر</button></div>`;
    const done = v => { dlg.close(); res(v); };
    dlg.querySelectorAll("[data-r]").forEach(b => b.onclick = () => done(b.dataset.r === "1" ? ($("#ps").value || null) : null));
    dlg.oncancel = () => res(null); dlg.showModal();
  });
}
