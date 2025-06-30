// script.js — FULL verbose console logging (no truncation)
//------------------------------------------------------------
const stripe   = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // <‑‑ replace with your public key
const elements = stripe.elements();
const card     = elements.create("card");
card.mount("#card-element");

const form = document.getElementById("payment-form");
const out  = document.getElementById("result");

// helper: log any value without truncation
const logFull = (label, val) => {
  console.log(`\n===== ${label} =====`);
  if (typeof val === "string") {
    console.log(val);
  } else {
    console.dir(val, { depth: null, maxArrayLength: null });
  }
  console.log(`===== END ${label} =====\n`);
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "⏳ Creating payment method…";

  const fd = new FormData(form);
  const billing = { name: fd.get("name"), email: fd.get("email") };
  const address = {
    line1 : fd.get("line1"),
    city  : fd.get("city"),
    postal_code: fd.get("postal_code"),
    country: fd.get("country")
  };

  const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
    type: "card", card, billing_details: { ...billing, address }
  });
  if (pmErr) {
    logFull("PaymentMethod ERROR", pmErr);
    out.textContent = "❌ " + pmErr.message;
    return;
  }
  logFull("PaymentMethod", paymentMethod);

  const payload = {
    amount: 100,
    currency: "usd",
    description: "Store Purchase",
    payment_method: paymentMethod.id,
    ...billing,
    ...address
  };
  logFull("Payload to backend", payload);

  const res = await fetch("/create-payment-intent", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(payload)
  });

  const raw = await res.text();
  logFull("Backend RAW response", raw);

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    data = { parse_error: e.message };
  }
  logFull("Backend Parsed JSON", data);

  if (data.error) {
    logFull("Stripe Error Detail", data);
    out.textContent = "❌ " + (data.error.message || JSON.stringify(data, null, 2));
    return;
  }

  if (data.next_action && data.next_action.type === "redirect_to_url") {
    out.textContent = "🔗 Redirecting for 3‑D Secure…";
    window.location.href = data.next_action.redirect_to_url.url;
    return;
  }

  const pi = data;
  logFull("Final PaymentIntent", pi);

  const charge = pi.charges?.data?.[0];
  const seller = charge?.outcome?.seller_message || "N/A";
  const reason = charge?.outcome?.reason         || "none";
  const status = charge?.outcome?.network_status || "unknown";
  const decline_code = charge?.outcome?.risk_level || "n/a";
  const fullResponse = JSON.stringify(pi, null, 2);

  if (pi.status === "succeeded") {
    out.textContent = "✅ Payment succeeded!";
  } else {
    out.textContent = `❌ Declined: ${seller}\nReason: ${reason}\nStatus: ${status}\nRisk Level: ${decline_code}\n\nFull Charge Response:\n${fullResponse}`;
  }
});
