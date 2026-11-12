"use strict";
/* مرحلهٔ ۲: دوربین و تشخیص چهره (face-api، روی همین دستگاه؛ هیچ تصویری به جایی ارسال نمی‌شود) */
const Face = {
  ready: null, cam: null, loop: 0,
  load(set) {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      set("بارگذاری کتابخانه…");
      await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "lib/face-api.js"; s.onload = ok; s.onerror = () => no(new Error("lib")); document.head.appendChild(s); });
      const n = faceapi.nets, names = [["tinyFaceDetector", "تشخیص سریع"], ["ssdMobilenetv1", "تشخیص دقیق"], ["faceLandmark68Net", "نقاط چهره"], ["faceRecognitionNet", "شناسایی"]];
      for (const [k, t] of names) { set("بارگذاری مدل: " + t + "…"); await n[k].loadFromUri("models"); }
    })().catch(e => { this.ready = null; throw e; });
    return this.ready;
  },
  tiny: () => new faceapi.TinyFaceDetectorOptions({inputSize: 416, scoreThreshold: .5}),
  ssd: () => new faceapi.SsdMobilenetv1Options({minConfidence: .5}),
  async detect(src, accurate) {
    return faceapi.detectAllFaces(src, accurate ? this.ssd() : this.tiny()).withFaceLandmarks().withFaceDescriptors();
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
  const m = box.width * .25, x = Math.max(0, box.x - m), y = Math.max(0, box.y - m), w = box.width + 2 * m, h = box.height + 2 * m;
  const sw = src.videoWidth || src.naturalWidth || src.width, sh = src.videoHeight || src.naturalHeight || src.height;
  const side = Math.min(Math.max(w, h), sw, sh);
  const cx = Math.min(Math.max(x + w / 2 - side / 2, 0), sw - side), cy = Math.min(Math.max(y + h / 2 - side / 2, 0), sh - side);
  const c = document.createElement("canvas"); c.width = c.height = 96;
  c.getContext("2d").drawImage(src, cx, cy, side, side, 0, 0, 96, 96);
  return c.toDataURL("image/jpeg", .72);
};
const loadImg = file => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
const cameraBox = () => `<div class="cam"><video id="vd" playsinline muted></video><canvas id="ov"></canvas><div class="cam-msg" id="cm"></div></div>`;
function drawBoxes(cv, vw, vh, items) {               // items: [{box,label,ok}]
  cv.width = vw; cv.height = vh;
  const g = cv.getContext("2d"); g.clearRect(0, 0, vw, vh);
  const lw = Math.max(2, vw / 220); g.lineWidth = lw; const fs = Math.max(14, vw / 26); g.font = `bold ${fs}px sans-serif`; g.textBaseline = "top";
  for (const it of items) {
    const b = it.box, col = it.ok === false ? "#f59e0b" : "#22c55e";
    g.strokeStyle = col; g.strokeRect(b.x, b.y, b.width, b.height);
    if (it.label) {
      const w = g.measureText(it.label).width + 10, h = fs + 8;
      g.fillStyle = col; g.fillRect(b.x - lw / 2, b.y - h, w, h);
      g.fillStyle = "#0b1220"; g.fillText(it.label, b.x + 5, b.y - h + 4);
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
  c.faces = c.faces || {}; const MAX = 8;
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
  try { cm.textContent = "در حال بارگذاری…"; await Face.load(t => cm.textContent = t); } catch (e) { cm.textContent = "بارگذاری مدل‌ها ناموفق بود (اینترنت بار اول لازم است)"; return; }
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
      setTimeout(tick, 120);
    };
    tick();
  };
  $("#shot").onclick = () => last && add(last, vd);
  $("#flip").onclick = () => { facing = facing === "user" ? "environment" : "user"; run(); };
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

/* ---------- حضور و غیاب (آزمایشی: بدون ذخیره در سوابق) ---------- */
async function viewAttend(c) {
  c.faces = c.faces || {};
  setBar("حضور و غیاب", {back: "#/c/" + c.id, sub: c.name + " · آزمایشی", acc: "ok"});
  const gal = Face.gallery(c), enrolled = c.people.filter(n => (c.faces[n] || []).length).length;
  show(`<div class="muted">${fa(enrolled)} نفر از ${fa(c.people.length)} نفر نمونهٔ چهره دارند.${enrolled ? "" : " اول از «تعریف افراد» نمونه ثبت کن."}</div>
    <div class="chips"><div class="chip on" data-m="cam">دوربین زنده</div><div class="chip" data-m="photo">از عکس</div></div>
    <div id="mode"></div>
    <div class="row" style="align-items:center"><span class="muted">آستانه (کمتر = سخت‌گیرتر)</span><input type="range" id="thr" min="35" max="70" value="50" style="flex:1"><b id="tv">۰٫۵۰</b></div>
    <div class="section" id="sum"></div>
    <div class="row"><button class="btn" id="sv" style="flex:1">ثبت جلسه در سوابق</button></div><div id="res" style="display:flex;flex-direction:column;gap:8px"></div>`);
  let thr = .5; $("#thr").oninput = e => { thr = e.target.value / 100; $("#tv").textContent = fa(thr.toFixed(2)).replace(".", "٫"); };
  $("#thr").oninput({target: $("#thr")});
  const found = new Map();                                // نام ← کمترین فاصله
  const summary = () => {
    const miss = c.people.filter(n => !found.has(n));
    $("#sum").textContent = `حاضر: ${fa(found.size)} از ${fa(c.people.length)}`;
    $("#res").innerHTML = [...found].map(([n, d]) => `<div class="card" style="min-height:52px;cursor:default"><div class="avatar" style="width:36px;height:36px">${esc([...n][0])}</div><div class="txt"><div class="t">${esc(n)}</div></div><div class="muted">${fa(d.toFixed(2)).replace(".", "٫")}</div></div>`).join("") +
      (miss.length ? `<div class="muted">غایب/دیده‌نشده: ${esc(miss.join("، "))}</div>` : "");
  };
  summary();
  $("#sv").onclick = async () => {
    if (!c.people.length) return toast("اول افراد را تعریف کن");
    if (!found.size && !await ask({title: "ثبت جلسه", text: "هیچ‌کس شناسایی نشده؛ همه غایب ثبت شوند؟", ok: "ثبت"})) return;
    addSession(c, new Set(found.keys())); Face.stopCam(); toast("جلسه ثبت شد"); go(`#/c/${c.id}/records`);
  };
  const modeEl = $("#mode");
  async function camMode() {
    Face.stopCam(); modeEl.innerHTML = cameraBox() + `<div class="row"><button class="btn soft" id="flip" aria-label="تعویض دوربین">↻</button><button class="btn soft" id="clr" style="flex:1">پاک کردن فهرست</button></div><div class="muted" id="st"></div>`;
    const cm = $("#cm"), vd = $("#vd"), ov = $("#ov"), st = $("#st"); let facing = "environment";
    try { cm.textContent = "در حال بارگذاری…"; await Face.load(t => cm.textContent = t); } catch (e) { cm.textContent = "بارگذاری مدل‌ها ناموفق بود"; return; }
    const err = needSecure(); if (err) { cm.textContent = err; return; }
    const run = async () => {
      try { await Face.startCam(vd, facing); } catch (e) { cm.textContent = "اجازهٔ دوربین داده نشد"; return; }
      cm.textContent = ""; const token = ++Face.loop;
      const tick = async () => {
        if (token !== Face.loop) return;
        const t0 = performance.now();
        try {
          const r = await Face.detect(vd, false); if (token !== Face.loop) return;
          const items = r.map(x => { const m = Face.match(x.descriptor, gal, thr); if (m.name && (!found.has(m.name) || found.get(m.name) > m.dist)) found.set(m.name, m.dist); return {box: x.detection.box, label: m.name || "؟", ok: !!m.name}; });
          drawBoxes(ov, vd.videoWidth, vd.videoHeight, items); summary();
          st.textContent = `${fa(r.length)} چهره · ${fa(Math.round(performance.now() - t0))} میلی‌ثانیه`;
        } catch (e) {}
        setTimeout(tick, 150);
      };
      tick();
    };
    $("#flip").onclick = () => { facing = facing === "user" ? "environment" : "user"; run(); };
    $("#clr").onclick = () => { found.clear(); summary(); };
    run();
  }
  function photoMode() {
    Face.stopCam(); modeEl.innerHTML = `<div class="row"><button class="btn" id="pk" style="flex:1">انتخاب یا گرفتن عکس کلاس</button></div><input type="file" id="fi" accept="image/*" hidden><div class="photo"><canvas id="pc"></canvas></div><div class="muted" id="st"></div>`;
    $("#pk").onclick = () => $("#fi").click();
    $("#fi").onchange = async e => {
      const f = e.target.files[0]; if (!f) return; e.target.value = ""; const st = $("#st");
      try { st.textContent = "در حال بارگذاری مدل‌ها…"; await Face.load(t => st.textContent = t); } catch (er) { return st.textContent = "بارگذاری مدل‌ها ناموفق بود"; }
      st.textContent = "در حال تشخیص…"; const t0 = performance.now();
      const img = await loadImg(f), r = await Face.detect(img, true);
      let unknown = 0;
      const items = r.map(x => { const m = Face.match(x.descriptor, gal, thr); if (m.name) { if (!found.has(m.name) || found.get(m.name) > m.dist) found.set(m.name, m.dist); } else unknown++; return {box: x.detection.box, label: m.name || "؟", ok: !!m.name}; });
      const pc = $("#pc"); pc.width = img.naturalWidth; pc.height = img.naturalHeight;
      pc.getContext("2d").drawImage(img, 0, 0); const sc = document.createElement("canvas");
      drawBoxes(sc, img.naturalWidth, img.naturalHeight, items); pc.getContext("2d").drawImage(sc, 0, 0);
      summary(); st.textContent = `${fa(r.length)} چهره، ${fa(unknown)} ناشناس · ${fa(Math.round(performance.now() - t0))} میلی‌ثانیه`;
    };
  }
  page.querySelectorAll("[data-m]").forEach(ch => ch.onclick = () => {
    page.querySelectorAll("[data-m]").forEach(x => x.classList.toggle("on", x === ch));
    ch.dataset.m === "cam" ? camMode() : photoMode();
  });
  camMode();
}
