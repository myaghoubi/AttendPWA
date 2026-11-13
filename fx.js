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
