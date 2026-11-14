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
