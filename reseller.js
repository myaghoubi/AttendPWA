"use strict";
/* همکاری در فروش: همکار با کلید امضای خودش (نه کلید اصلی توسعه‌دهنده) برای دستگاه‌های دیگر کد می‌سازد.
   ظرفیت اولیه صفر است؛ توسعه‌دهنده با «کد ظرفیت» (گواهی امضاشده برای کلید همکار) آن را بالا می‌برد.
   فقط وقتی دستگاه خودش فعال باشد در دسترس است. کلید اصلی توسعه‌دهنده هرگز در برنامه نیست. */
const RES = {key: "", pub: "", total: 0, cert: "", issued: []};
async function resLoad() {
  let r = null;
  try { r = (await Store.get("reseller")) || JSON.parse(localStorage.getItem("att_reseller") || "null"); } catch (e) {}
  if (!r || !/^[0-9a-f]{64}$/.test(r.key || "")) r = {key: _toHex(crypto.getRandomValues(new Uint8Array(32))), total: 0, cert: "", issued: []};
  Object.assign(RES, {key: r.key, total: r.total || 0, cert: r.cert || "", issued: r.issued || []});
  RES.pub = _toHex(await edPub(_hex(RES.key)));
  await resSave();
}
async function resSave() {
  const o = {key: RES.key, total: RES.total, cert: RES.cert, issued: RES.issued};
  try { await Store.set("reseller", o); localStorage.setItem("att_reseller", JSON.stringify(o)); } catch (e) {}   // جدا از پشتیبان
}
const resLeft = () => Math.max(0, RES.total - RES.issued.length);
const resRequest = n => groups8(b32enc(_cat(_hex(RES.pub), Uint8Array.of(n))));
async function resApply(code) {                         // کد ظرفیت از توسعه‌دهنده
  const b = b32dec(String(code).toUpperCase().replace(/[^A-Z0-9]/g, ""));
  if (!b || b.length !== 66) return "bad";
  const total = (b[0] << 8) | b[1];
  if (!(await edVerify(MASTER, certMsg(RES.pub, total), b.slice(2)))) return "bad";
  if (total <= RES.total) return "old";
  RES.total = total; RES.cert = _toHex(b.slice(2)); await resSave(); return "ok";
}
async function resIssue(devRaw, name) {                 // کد فعال‌سازی برای دستگاه مشتری
  const dev = devRaw.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  if (dev.length !== 16) return {err: "شناسهٔ دستگاه معتبر نیست (۱۶ رقم/حرف)"};
  const id = fmtId(dev), old = RES.issued.find(x => x.id === id);
  if (old) return {code: old.code, again: true};          // همان شناسه دوباره: ظرفیت مصرف نمی‌شود
  if (!resLeft()) return {err: "ظرفیت تمام شده است؛ از توسعه‌دهنده ظرفیت بگیر"};
  const sig = await edSign(_hex(RES.key), devMsg(id));
  const code = groups8(b32enc(_cat(_hex(RES.pub), Uint8Array.of(RES.total >> 8, RES.total & 255), _hex(RES.cert), sig)));
  if (!(await checkCode(code, id))) return {err: "ساخت کد ناموفق بود (گواهی ظرفیت معتبر نیست)"};
  RES.issued.push({id, name: name || "", t: Date.now(), code}); await resSave();
  return {code};
}

async function viewReseller() {
  setBar("همکاری در فروش", {back: "#/"});
  if (!licensed()) return show(`<div class="vcard"><b>همکاری در فروش</b><div class="muted">این بخش فقط بعد از فعال‌سازی برنامه روی همین دستگاه در دسترس است.</div><button class="btn" id="ga">فعال‌سازی برنامه</button></div>`), $("#ga").onclick = () => go("#/activate");
  if (!RES.pub) await resLoad();
  const L = LIC_INFO, left = resLeft(), cp = async (t, ok) => { try { await navigator.clipboard.writeText(t); toast(ok); } catch (e) { toast(t); } };
  const ltr = "dir=\"ltr\" style=\"word-break:break-all;user-select:all;font-weight:700;font-size:14px;background:var(--card2);border-radius:10px;padding:8px\"";
  const cardS = "display:flex;flex-direction:column;gap:8px;margin-top:10px", inp = "width:100%;box-shadow:none;background:var(--card2);font-size:16px";
  show(`<div class="vcard" style="${cardS.replace("margin-top:10px", "")}"><b>ظرفیت</b>
      <div style="display:flex;justify-content:space-around;text-align:center"><div><div style="font-size:26px;font-weight:700">${fa(RES.total)}</div><div class="muted">کل</div></div>
      <div><div style="font-size:26px;font-weight:700">${fa(RES.issued.length)}</div><div class="muted">استفاده‌شده</div></div>
      <div><div style="font-size:26px;font-weight:700;color:var(--${left ? "ok" : "danger"})">${fa(left)}</div><div class="muted">باقی‌مانده</div></div></div>
      <div class="muted">ظرفیت اولیه صفر است. برای افزایش آن از توسعه‌دهنده درخواست کن و کد ظرفیت را وارد کن.</div></div>
    <div class="vcard" style="${cardS}"><b>درخواست افزایش ظرفیت</b>
      <input type="number" id="rn" min="1" max="255" value="10" inputmode="numeric" style="${inp}" placeholder="تعداد">
      <button class="btn soft" id="rq">ساخت کد درخواست</button><div id="rqo"></div></div>
    <div class="vcard" style="${cardS}"><b>دریافت ظرفیت</b>
      <input type="text" id="gc" dir="ltr" placeholder="کد ظرفیت را اینجا بچسبان" autocomplete="off" autocapitalize="characters" style="${inp}">
      <button class="btn soft" id="ga2">ثبت کد ظرفیت</button></div>
    <div class="vcard" style="${cardS}"><b>تولید کد فعال‌سازی برای مشتری</b>
      <input type="text" id="di" dir="ltr" placeholder="شناسهٔ دستگاه مشتری (XXXX-XXXX-XXXX-XXXX)" autocomplete="off" autocapitalize="characters" style="${inp}">
      <input type="text" id="dn" placeholder="نام مشتری (اختیاری)" autocomplete="off" style="${inp}">
      <button class="btn" id="mk" ${left ? "" : "disabled"}>تولید کد</button><div id="mko"></div>
      ${left ? "" : `<div class="muted" style="color:var(--warn)">ظرفیت صفر است؛ اول ظرفیت بگیر.</div>`}
      <div class="muted">هر شناسهٔ تازه یک واحد ظرفیت مصرف می‌کند؛ دوباره گرفتن کد همان شناسه رایگان است. کد همکار فقط در برنامهٔ PWA معتبر است.</div></div>
    ${RES.issued.length ? `<div class="vcard" style="${cardS}"><b>کدهای ساخته‌شده</b>${[...RES.issued].reverse().map((x, i) => `<button class="btn soft" data-i="${RES.issued.length - 1 - i}" style="justify-content:flex-start;text-align:start;display:flex;flex-direction:column;align-items:flex-start;gap:0"><span dir="ltr">${x.id}</span><small class="muted">${esc(x.name || "—")} · ${esc(new Date(x.t).toLocaleDateString(isEn() ? "en-US" : "fa-IR"))}</small></button>`).join("")}</div>` : ""}
    <div class="muted" style="margin:10px 4px">اطلاعات این بخش (کلید همکار و ظرفیت) در پشتیبان نیست و با پاک شدن داده‌های مرورگر از بین می‌رود.</div>`);
  const showCode = (box, code, again) => {
    box.innerHTML = `<div class="muted">${again ? "این شناسه قبلاً کد گرفته است:" : "کد ساخته شد:"}</div><div ${ltr}>${code}</div><div class="row"><button class="btn soft" id="cc">کپی کد</button></div>`;
    $("#cc").onclick = () => cp(code, "کپی شد");
  };
  $("#rq").onclick = () => {
    const n = Math.max(1, Math.min(255, parseInt($("#rn").value) || 0)); if (!n) return toast("تعداد را وارد کن");
    const c = resRequest(n), box = $("#rqo");
    box.innerHTML = `<div class="muted">این کد را برای توسعه‌دهنده بفرست و در برابر آن «کد ظرفیت» بگیر:</div><div ${ltr}>${c}</div>
      <div class="row"><button class="btn soft" id="rc">کپی</button><a class="btn soft" style="text-align:center;text-decoration:none" href="sms:${L.phone}?body=${encodeURIComponent("درخواست ظرفیت همکاری: " + c)}">ارسال پیامک</a></div>`;
    $("#rc").onclick = () => cp(c, "کپی شد");
  };
  $("#ga2").onclick = async () => {
    const r = await resApply($("#gc").value);
    if (r === "ok") { toast("ظرفیت ثبت شد"); viewReseller(); } else toast(r === "old" ? "این کد قدیمی است یا قبلاً ثبت شده" : "کد ظرفیت برای این دستگاه معتبر نیست");
  };
  $("#mk").onclick = async () => {
    const r = await resIssue($("#di").value, $("#dn").value.trim());
    if (r.err) return toast(r.err);
    if (r.again) showCode($("#mko"), r.code, true); else { toast("کد ساخته شد"); await viewReseller(); showCode($("#mko"), r.code, false); }
  };
  document.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const x = RES.issued[+b.dataset.i]; $("#di").value = x.id; $("#dn").value = x.name; showCode($("#mko"), x.code, true); $("#mko").scrollIntoView({block: "nearest"}); });
}
