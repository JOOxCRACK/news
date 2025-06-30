// script.js — يطبع الردود كاملة فى الـ Console ↙️
//-------------------------------------------------
const stripe   = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");    // ← غيّر المفتاح
const elements = stripe.elements();
const card     = elements.create("card");
card.mount("#card-element");

const form = document.getElementById("payment-form");
const out  = document.getElementById("result");

/* helper: طباعة مرتّبة فى الـ Console */
const logFull = (label, obj) =>
  console.log(`🟢 ${label}:`, JSON.parse(JSON.stringify(obj, null, 2)));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "⏳ Creating payment-method…";

  /* ⇢ 1) PaymentMethod */
  const fd = new FormData(form);
  const billing = { name: fd.get("name"), email: fd.get("email") };
  const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
    type: "card", card, billing_details: billing
  });

  if (pmErr) { out.textContent = "❌ "+pmErr.message; return; }
  logFull("PaymentMethod", paymentMethod);

  /* ⇢ 2) Backend - create & confirm PI */
  const payload = {
    amount : 100,
    payment_method: paymentMethod.id,
    ...Object.fromEntries(fd.entries())   // يمرر كل الحقول للسيرفر
  };

  const res  = await fetch("/create-payment-intent", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  logFull("Backend Response", data);

  if (data.error) { out.textContent = "❌ "+data.error; return; }

  /* ⇢ 3) لو Stripe احتاج redirect (3-D Secure) */
  if (data.next_action && data.next_action.type === "redirect_to_url") {
    out.textContent = "🔗 Redirecting for 3-D Secure…";
    window.location = data.next_action.redirect_to_url.url;
    return;
  }

  /* ⇢ 4) النتيجة (success/decline) */
  const pi = data;                       // backend يرجّع الـ PI المؤكد
  const charge = pi.charges?.data?.[0];  // أول عملية خصم
  const sellerMsg = charge?.outcome?.seller_message || "N/A";
  const reason    = charge?.outcome?.reason         || "none";

  logFull("Final PaymentIntent", pi);

  if (pi.status === "succeeded") {
    out.textContent = "✅ Payment succeeded!";
  } else {
    out.textContent = `❌ Declined: ${sellerMsg} (reason: ${reason})`;
  }
});
