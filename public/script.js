// script.js — client: create PaymentMethod ثم يرسل للباك-إند فقط
//--------------------------------------------------------------
const stripe   = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // ← غيّرها
const elements = stripe.elements();
const card     = elements.create("card");
card.mount("#card-element");

const form   = document.getElementById("payment-form");
const out    = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "⏳ Creating payment method…";

  const fd = new FormData(form);
  const data = {
    name  : fd.get("name"),
    email : fd.get("email"),
    line1 : fd.get("line1"),
    city  : fd.get("city"),
    postal_code: fd.get("postal_code"),
    country: fd.get("country")
  };

  /* 1) PaymentMethod */
  const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: { name: data.name, email: data.email }
  });
  if (pmErr){ out.textContent = "❌ "+pmErr.message; return; }

  /* 2) Call backend (auto-confirm happens there) */
  const res  = await fetch("/create-payment-intent", {
    method :"POST",
    headers: { "Content-Type":"application/json" },
    body   : JSON.stringify({ amount: 100, ...data, payment_method: paymentMethod.id })
  });
  const json = await res.json();
  if (json.error){ out.textContent = "❌ "+json.error; return; }

  /* 3) Check result — if Stripe احتاج 3-D Secure سيرجع next_action */
  if (json.next_action && json.next_action.type === "redirect_to_url") {
    out.textContent = "🔗 Redirecting for 3-D Secure…";
    window.location = json.next_action.redirect_to_url.url; // نوجّه الزبون
  } else {
    out.textContent = json.status === "succeeded"
      ? "✅ Payment succeeded!"
      : "ℹ️ Status: "+json.status;
  }
});
