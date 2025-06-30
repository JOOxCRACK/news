// script.js — full verbose logging to console
//-------------------------------------------------
const stripe   = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // <-- replace with your publishable key
const elements = stripe.elements();
const card     = elements.create("card");
card.mount("#card-element");

const form = document.getElementById("payment-form");
const out  = document.getElementById("result");

/* helper to log any object or raw text fully */
const logFull = (label, value) => {
  console.log(`\n===== ${label} =====`);
  if (typeof value === "string") {
    console.log(value);
  } else {
    console.log(JSON.stringify(value, null, 2)); // pretty‑print JSON
  }
  console.log("===== END " + label + " =====\n");
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "⏳ Creating payment method…";

  /* collect billing fields */
  const fd = new FormData(form);
  const billing = {
    name : fd.get("name"),
    email: fd.get("email")
  };
  const address = {
    line1 : fd.get("line1"),
    city  : fd.get("city"),
    postal_code: fd.get("postal_code"),
    country: fd.get("country")
  };

  /* 1) Create PaymentMethod */
  const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: {...billing}
  });
  if (pmErr) { out.textContent = "❌ " + pmErr.message; logFull("PaymentMethod error", pmErr); return; }
  logFull("PaymentMethod", paymentMethod);

  /* 2) Call backend to create+confirm PI */
  const body = JSON.stringify({
    amount: 100,
    currency: "usd",
    description: "Store Purchase",
    payment_method: paymentMethod.id,
    ...billing,
    ...address
  });

  const resp = await fetch("/create-payment-intent", {
    method : "POST",
    headers: { "Content-Type":"application/json" },
    body
  });

  const raw = await resp.text();
  logFull("Backend raw response", raw);

  let data;
  try { data = JSON.parse(raw); } catch(e){ data = { parse_error:e.message }; }
  logFull("Backend parsed JSON", data);

  if (data.error) { out.textContent = "❌ " + data.message; return; }

  /* 3) Handle next_action or final status */
  if (data.next_action && data.next_action.type === "redirect_to_url") {
    out.textContent = "🔗 Redirecting for 3‑D Secure…";
    window.location = data.next_action.redirect_to_url.url;
    return;
  }

  if (data.status === "succeeded") {
    out.textContent = "✅ Payment succeeded!";
  } else {
    const seller = data.charges?.data?.[0]?.outcome?.seller_message || "Unknown";
    const reason = data.charges?.data?.[0]?.outcome?.reason || "none";
    out.textContent = `❌ Declined: ${seller} (reason: ${reason})`;
  }
});
