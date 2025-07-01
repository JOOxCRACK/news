// script.js — Save card with SetupIntent (full verbose logging)
//------------------------------------------------------------
const stripe   = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // <‑‑ replace with your public key
const elements = stripe.elements();
const card     = elements.create("card");
card.mount("#card-element");

const form = document.getElementById("payment-form");
const out  = document.getElementById("result");

// helper: log deeply without truncation
const logFull = (label, val) => {
  console.log(`\n===== ${label} =====`);
  if (typeof val === "string") console.log(val);
  else console.dir(val, { depth: null, maxArrayLength: null });
  console.log(`===== END ${label} =====\n`);
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "⏳ Creating PaymentMethod…";

  const fd = new FormData(form);
  const billing = { name: fd.get("name"), email: fd.get("email") };
  const address = {
    line1: fd.get("line1"),
    city : fd.get("city"),
    postal_code: fd.get("postal_code"),
    country: fd.get("country")
  };

  /* 1) إنشاء PaymentMethod */
  const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: { ...billing, address }
  });

  if (pmError) {
    logFull("PaymentMethod ERROR", pmError);
    out.textContent = "❌ " + pmError.message;
    return;
  }

  logFull("PaymentMethod SUCCESS", paymentMethod);

  /* 2) إرسال الـ PaymentMethod إلى السيرفر */
  out.textContent = "⏳ Sending PaymentMethod to server…";
  const res = await fetch("/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_method: paymentMethod.id })
  });
  const resData = await res.json();
  logFull("Server Response", resData);

  if (resData.error) {
    out.textContent = "❌ " + resData.error.message;
  } else {
    out.textContent = `✅ Payment ${resData.status}`;
  }
});
