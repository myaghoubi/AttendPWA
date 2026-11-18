/* افکت‌های کلی مثل برنامهٔ اصلی: کادر یا دکمه‌ای که لمس شد به دیالوگ تبدیل می‌شود (رشد + محو شدن؛ برای صفحه افکتی نیست).
   لمس آخر را نگه می‌دارد؛ اگر کمتر از ۱.۵ ثانیه بعد دیالوگی باز شود، افکت اجرا می‌شود. */
const FX = {tap: null, DUR: 320};
(() => {
  const reduce = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  const col = () => getComputedStyle(document.documentElement);
  document.addEventListener("pointerdown", e => {
    FX.tap = null;
    const t = e.target.closest && e.target.closest("button,a,.card,.vcard,.tile,[data-id],[data-i],[data-n],.mi,.menu-item,li");
    if (!t || t.closest("dialog,#bar,.ib,#drawer .scrim")) return;
    const r = t.getBoundingClientRect();
    if (r.width < 30 || r.height < 30 || r.width > innerWidth * .98 && r.height > innerHeight * .8) return;
    FX.tap = {el: t, r, t: Date.now(), danger: !!t.closest(".del,.btn.danger,.danger")};
  }, true);
  const take = () => { const k = FX.tap; FX.tap = null; return k && Date.now() - k.t < 1500 ? k : null; };
  const rectOf = r => ({left: r.left, top: r.top, width: r.width, height: r.height});
  const base = k => {
    if (k.danger) return col().getPropertyValue("--danger").trim() || "#dc2626";
    const bg = getComputedStyle(k.el).backgroundColor;
    return bg && bg !== "rgba(0, 0, 0, 0)" ? bg : (col().getPropertyValue("--card").trim() || "#fff");
  };
  // کادر لمس‌شده (با تصویرش) از اندازهٔ خودش به اندازهٔ مقصد می‌رود
  function overlay(k, to, radiusTo, endColor, fadeAfter) {
    const o = document.createElement("div"), r = k.r;
    o.style.cssText = `position:fixed;z-index:2147483000;pointer-events:none;overflow:hidden;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;background:${base(k)};border-radius:14px;margin:0`;
    const c = k.el.cloneNode(true); c.removeAttribute("id");
    c.style.cssText += `;position:absolute;left:0;top:0;width:${r.width}px;height:${r.height}px;margin:0;pointer-events:none;transition:none;animation:none`;
    o.appendChild(c); document.body.appendChild(o);
    const d = FX.DUR, ease = "cubic-bezier(.65,0,.35,1)";
    const a = o.animate([{left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: "14px", background: base(k)},
      {left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px", borderRadius: radiusTo, background: endColor}], {duration: d, easing: ease, fill: "forwards"});
    c.animate([{opacity: 1}, {opacity: 0, offset: .5}, {opacity: 0}], {duration: d, fill: "forwards"});
    const end = () => o.remove();
    a.onfinish = () => fadeAfter ? o.animate([{opacity: 1}, {opacity: 0}], {duration: 160, fill: "forwards"}).onfinish = end : end();
    a.oncancel = end; setTimeout(end, d + 400);
    return o;
  }
  // ----- دیالوگ
  const origShow = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function () {
    origShow.call(this);
    if (reduce()) return;
    const k = take(), d = this, r = d.getBoundingClientRect();
    if (FX.onDialog) { const h = FX.onDialog; FX.onDialog = null; try { h(d); } catch (_) {} }
    const ox = k ? k.r.left + k.r.width / 2 - r.left : r.width / 2, oy = k ? k.r.top + k.r.height / 2 - r.top : r.height / 2;
    d.style.transformOrigin = `${ox}px ${oy}px`;
    const a = d.animate([{transform: `scale(${k ? .3 : .9})`, opacity: 0}, {transform: "scale(1)", opacity: 1}],
      {duration: k ? FX.DUR : 180, easing: "cubic-bezier(.65,0,.35,1)"});
    a.onfinish = a.oncancel = () => { d.style.transformOrigin = ""; };
    d.animate([{opacity: 0}, {opacity: 0, offset: .15}, {opacity: 1}], {duration: k ? FX.DUR : 180, pseudoElement: "::backdrop"});
    if (k) {
      d.style.visibility = "hidden";                         // خود دیالوگ از میانهٔ افکت دیده شود
      setTimeout(() => { d.style.visibility = ""; }, FX.DUR * .18);
      overlay(k, r, "20px", col().getPropertyValue("--card").trim() || "#fff", false);
    }
  };
})();
// حذف: کارت از کنار می‌رود و کوچک می‌شود، بعد فهرست دوباره ساخته می‌شود
function fxRemove(el) {
  if (!el || matchMedia("(prefers-reduced-motion:reduce)").matches) return Promise.resolve();
  const dir = document.documentElement.dir === "ltr" ? 1 : -1, h = el.getBoundingClientRect().height;
  el.style.overflow = "hidden";
  const a = el.animate([{transform: "none", opacity: 1, height: h + "px", marginBottom: getComputedStyle(el).marginBottom},
    {transform: `translateX(${dir * 40}%)`, opacity: 0, height: h + "px", offset: .6, marginBottom: getComputedStyle(el).marginBottom},
    {transform: `translateX(${dir * 40}%)`, opacity: 0, height: "0px", marginBottom: "0px", paddingTop: "0px", paddingBottom: "0px"}],
    {duration: 360, easing: "ease-in-out", fill: "forwards"});
  return new Promise(r => { a.onfinish = r; a.oncancel = r; setTimeout(r, 600); });
}
/* لوگوی برنامه (مثل برنامهٔ اصلی): قاب‌ها بسته و باز می‌شوند، نشان سبز ظاهر و تیک کشیده می‌شود */
function logoHtml(size) {
  const br = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(() => `<path fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  return `<svg id="lg" class="applogo" viewBox="0 0 100 100" width="${size}" height="${size}" style="overflow:visible;-webkit-tap-highlight-color:transparent;user-select:none">
    <rect width="100" height="100" rx="20" fill="var(--primary)"/>${br}
    <circle cx="50" cy="38" r="12" fill="#fff"/><path d="M31 78V73Q31 54 50 54Q69 54 69 73V78Z" fill="#fff"/>
    <circle class="lb" cx="80" cy="20" r="0" fill="var(--ok)"/><path class="lc" d="M71 20L78 27.6L90 12.8" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`;
}
function logoPlay(svg) {
  if (!svg) return;
  const set = (k, badge, chk, op) => {
    svg.style.opacity = op;
    svg.querySelectorAll("path[fill=none]:not(.lc)").forEach((p, i) => {
      const [sx, sy] = [[-1, -1], [1, -1], [-1, 1], [1, 1]][i], half = 35 * k, ln = 17, cx = 50 + half * sx, cy = 50 + half * sy;
      p.setAttribute("d", `M${cx - sx * ln} ${cy}L${cx} ${cy}L${cx} ${cy - sy * ln}`);
    });
    svg.querySelector(".lb").setAttribute("r", 20 * badge);
    svg.querySelector(".lc").style.strokeDashoffset = 1 - chk;
  };
  const seg = [[.35, "op", 0, 1, 1.3, 1.3], [.35, "k", 1.3, .85], [.3, "k", .85, 1.12], [.2, "k", 1.12, 1.0], [.3, "b", 0, 1], [.3, "c", 0, 1]];
  const ease = (t, m) => m === "in" ? t * t * (3 - 2 * t) : 1 - (1 - t) * (1 - t);       // نرم برای k، خروج برای بقیه
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return set(1, 1, 1, 1);
  const total = seg.reduce((s, x) => s + x[0], 0) * 1000, t0 = performance.now();
  svg._run = (svg._run || 0) + 1; const my = svg._run;
  const frame = now => {
    if (svg._run !== my || !svg.isConnected) return;
    let t = Math.min((now - t0) / 1000, total / 1000), k = 1.3, b = 0, c = 0, op = 0, acc = 0;
    seg.forEach(([d, n, a, z]) => {
      const f = Math.max(0, Math.min(1, (t - acc) / d)); acc += d;
      if (n === "op") op = ease(f, "out"); else if (n === "k" && f > 0) k = a + (z - a) * ease(f, "in"); else if (n === "b") b = ease(f, "out"); else if (n === "c") c = ease(f, "out");
    });
    set(k, b, c, op);
    if (t < total / 1000) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
/* ژست‌های کشیدن (swipe):
   ۱) صفحهٔ خالی در حالت عمودی: فارسی راست→چپ، انگلیسی چپ→راست ⇒ منوی اصلی باز می‌شود.
   ۲) کادر درس: راست→چپ ⇒ کادر هم‌رنگ نوار با نام درس و ورود به درس؛ چپ→راست ⇒ کادر قرمز «حذف» و دیالوگ حذف. */
(() => {
  const reduce = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  const EASE = "cubic-bezier(.65,0,.35,1)";
  let st = null, swipedAt = 0;
  const sg = () => document.documentElement.dir === "ltr" ? -1 : 1;   // فارسی: چپ→راست حذف؛ انگلیسی برعکس
  const skip = t => {
    if (!t || !t.closest) return true;
    if (t.closest("input,textarea,select,dialog,#drawer,canvas,video,.tb,[data-noswipe],#bar")) return true;
    for (let e = t; e && e !== document.body; e = e.parentElement) {
      const o = getComputedStyle(e).overflowX;
      if ((o === "auto" || o === "scroll") && e.scrollWidth > e.clientWidth + 2) return true;
    }
    return false;
  };
  document.addEventListener("click", e => { if (Date.now() - swipedAt < 450) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener("pointerdown", e => {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (document.querySelector("dialog[open]")) return;
    const card = e.target.closest && e.target.closest(".sw>.card");
    if (card) { st = {k: "card", card, x: e.clientX, y: e.clientY, dx: 0, on: false, id: e.pointerId}; return; }
    st = null;
  }, true);
  let ts = null;
  document.addEventListener("touchstart", e => {
    ts = null;
    if (e.touches.length !== 1 || st || skip(e.target) || document.querySelector("dialog[open]") || e.target.closest(".sw") || matchMedia("(orientation:landscape)").matches) return;
    ts = {x: e.touches[0].clientX, y: e.touches[0].clientY};
  }, {capture: true, passive: true});
  document.addEventListener("touchend", e => {
    const s = ts; ts = null; if (!s || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
    if ((document.documentElement.dir === "ltr" ? 1 : -1) * dx > 80 && Math.abs(dx) > Math.abs(dy) * 2 && !$("#drawer").classList.contains("open")) openMenu();
  }, {capture: true, passive: true});
  document.addEventListener("pointermove", e => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y; st.dx = dx;
    if (st.k !== "card") return;
    if (!st.on) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { st = null; return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      st.on = true; const sw = st.card.parentElement; st.w = st.card.offsetWidth; st.sw = sw;
      st.rv = document.createElement("div"); st.rv.className = "rv"; sw.insertBefore(st.rv, st.card);
      try { st.card.setPointerCapture(e.pointerId); } catch (_) {}
      st.card.style.transition = "none";
    }
    const m = st.w * .5, v = Math.max(-m, Math.min(m, dx)); st.v = v;
    st.card.style.transform = `translateX(${v}px)`;
    const del = v * sg() > 0, rv = st.rv, left = v > 0;
    if (rv.dataset.m !== (del ? "d" : "o") + (left ? "l" : "r")) {
      rv.dataset.m = (del ? "d" : "o") + (left ? "l" : "r"); const jc = left ? "flex-start" : "flex-end";
      if (del) { rv.style.cssText = "background:var(--danger);color:var(--on-danger);justify-content:" + jc; rv.innerHTML = `<span class="ri">${icon("trash")}<span>${isEn() ? "Delete" : "حذف"}</span></span>`; }
      else { rv.style.cssText = "background:var(--accent,var(--primary));color:#0b1220;justify-content:" + jc; rv.innerHTML = `<span class="rn"></span>`; rv.firstChild.style.setProperty("--d", document.documentElement.dir); rv.firstChild.textContent = st.card.querySelector(".t").textContent; }
    }
    rv.style.setProperty("--d", document.documentElement.dir);
    rv.style.display = "flex";
  }, true);
  const back = (s, drop) => {
    const c = s.card; c.style.transition = "transform .22s ease"; c.style.transform = "";
    setTimeout(() => { c.style.transition = ""; if (drop) s.rv?.remove(); }, 240);
  };
  const end = e => {
    const s = st; if (!s || e.pointerId !== s.id) return; st = null;
    if (s.k === "page") {
      const dy = e.clientY - s.y, open = (document.documentElement.dir === "ltr" ? 1 : -1) * s.dx > 80;
      if (e.type === "pointerup" && open && Math.abs(s.dx) > Math.abs(dy) * 2 && typeof openMenu === "function" && !$("#drawer").classList.contains("open")) openMenu();
      return;
    }
    if (!s.on) return;
    swipedAt = Date.now();
    const v = s.v || 0, th = s.w * .3, id = s.sw.dataset.id;
    if (e.type !== "pointerup" || Math.abs(v) < th) return back(s, true);
    if (v * sg() < 0) {                                   // ورود به درس با افکت
      const r = s.card.getBoundingClientRect(), r0 = s.sw.getBoundingClientRect();
      const col = getComputedStyle(s.card).getPropertyValue("--accent") && getComputedStyle(s.rv).backgroundColor;
      const br = bar.getBoundingClientRect();
      const vis = Math.abs(v), vl = v < 0 ? r0.right - vis : r0.left;      // فقط بخشی که دیده می‌شود
      const o = document.createElement("div"); o.className = "swfx";
      o.style.cssText = `position:fixed;z-index:2147483000;left:${vl}px;top:${r0.top}px;width:${vis}px;height:${r0.height}px;background:${col};border-radius:18px;color:#0b1220;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;overflow:hidden;pointer-events:none`;
      o.textContent = s.card.querySelector(".t").textContent; document.body.appendChild(o);
      s.card.style.transition = "transform .18s ease"; s.card.style.transform = `translateX(${v < 0 ? -s.w : s.w}px)`;
      const fin = () => { go("#/c/" + id); setTimeout(() => { o.animate([{opacity: 1}, {opacity: 0}], {duration: 220, fill: "forwards"}).onfinish = () => o.remove(); }, 60); };
      if (reduce()) { fin(); return; }
      o.animate([{left: vl + "px", top: r0.top + "px", width: vis + "px", height: r0.height + "px", borderRadius: "18px"},
        {left: br.left + "px", top: br.top + "px", width: br.width + "px", height: br.height + "px", borderRadius: "0px"}], {duration: 320, easing: EASE, fill: "forwards"}).onfinish = fin;
      o.style.fontSize = "22px"; const tx = o.firstChild; if (tx && o.animate) { const sp = document.createElement("span"); sp.textContent = o.textContent; o.textContent = ""; o.appendChild(sp); sp.animate([{opacity: 1}, {opacity: 0, offset: .6}, {opacity: 0}], {duration: 320, fill: "forwards"}); }
    } else {                                              // حذف: دیالوگ از کادر درس بزرگ می‌شود، کادر قرمز به دکمهٔ حذف تبدیل می‌شود، کادر درس برمی‌گردد
      const r0 = s.sw.getBoundingClientRect(), rr = {left: v > 0 ? r0.left : r0.right - Math.abs(v), top: r0.top, width: Math.abs(v), height: r0.height}, c = typeof course === "function" ? course(id) : null;
      FX.tap = {el: s.card, r: r0, t: Date.now(), danger: false};
      FX.onDialog = d => {
        s.card.style.transition = "none"; s.card.style.transform = "";           // برای اینکه همان کادرِ سر جایش به دیالوگ تبدیل شود
        queueMicrotask(() => { s.card.style.transform = `translateX(${v}px)`; void s.card.offsetWidth; back(s, false); });
        const btn = d.querySelector(".btn.danger"); if (!btn || reduce()) { s.rv.remove(); return; }
        const br = btn.getBoundingClientRect(), rad = getComputedStyle(btn).borderRadius;
        btn.style.visibility = "hidden";
        const o = document.createElement("div"); o.setAttribute("popover", "manual");
        o.style.cssText = `position:fixed;inset:auto;margin:0;padding:0;border:0;overflow:hidden;pointer-events:none;background:var(--danger);left:${rr.left}px;top:${rr.top}px;width:${rr.width}px;height:${rr.height}px;border-radius:18px`;
        document.body.appendChild(o); try { o.showPopover(); } catch (_) {}
        s.rv.remove();
        const a = o.animate([{left: rr.left + "px", top: rr.top + "px", width: rr.width + "px", height: rr.height + "px", borderRadius: "18px"},
          {left: br.left + "px", top: br.top + "px", width: br.width + "px", height: br.height + "px", borderRadius: rad}], {duration: FX.DUR, easing: EASE, fill: "forwards"});
        const fin = () => { btn.style.visibility = ""; o.remove(); };
        a.onfinish = a.oncancel = fin; setTimeout(fin, FX.DUR + 500);
      };
      Promise.resolve(c && delCourse(c)).then(() => { FX.onDialog = null; back(s, true); });
    }
  };
  document.addEventListener("pointerup", end, true);
  document.addEventListener("pointercancel", end, true);
})();
