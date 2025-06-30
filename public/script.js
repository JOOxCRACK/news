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
    // console.dir shows objects deeply with no truncation
    console.dir(val, { depth: null, maxArrayLength: null });
  }
  console.log(`===== END ${label} =====\n`);
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "⏳ Creating payment method…";

  // collect billing data
  const fd = new FormData(form);
  const billing = { name: fd.get("name"), email: fd.get("email") };
  const address = {
    line1 : fd.get("line1"),
    city  : fd.get("city"),
    postal_code: fd.get("postal_code"),
    country: fd.get("country")
  };

  /* 1) create PaymentMethod */
  const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
    type: "card", card, billing_details: billing
  });
  if (pmErr) {
    logFull("PaymentMethod ERROR", pmErr);
    out.textContent = "❌ " + pmErr.message;
    return;
  }
  logFull("PaymentMethod", paymentMethod);

  /* 2) call backend */
  const payload = { amount: 100, currency: "usd", description: "Store Purchase", payment_method: paymentMethod.id, ...billing, ...address };
  logFull("Payload to backend", payload);

  const res = await fetch("/create-payment-intent", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(payload)
  });
  const raw = await res.text();
  logFull("Backend RAW response", raw);

  let data;
  try { data = JSON.parse(raw); } catch (e) { data = { parse_error: e.message }; }
  logFull("Backend Parsed JSON", data);

  if (data.error) {
    out.textContent = "❌ " + (data.message || "Payment failed");
    return;
  }

  /* 3) handle 3‑D Secure redirect */
  if (data.next_action && data.next_action.type === "redirect_to_url") {
    out.textContent = "🔗 Redirecting for 3‑D Secure…";
    window.location.href = data.next_action.redirect_to_url.url;
    return;
  }

  /* 4) final status / charge outcome */
  const pi = data;
  logFull("Final PaymentIntent", pi);

  const charge = pi.charges?.data?.[0];
  const seller = charge?.outcome?.seller_message || "N/A";
  const reason = charge?.outcome?.reason         || "none";

  if (pi.status === "succeeded") {
    out.textContent = "✅ Payment succeeded!";
  } else {
    out.textContent = `❌ Declined: ${seller} (reason: ${reason})`;
  }
});
