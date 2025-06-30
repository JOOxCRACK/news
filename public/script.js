// script.js – client-side Stripe flow (create PM → PI → confirm)
// --------------------------------------------------------------
const stripe   = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");   // ← حط مفتاحك العلني
const elements = stripe.elements();
const card     = elements.create("card");
card.mount("#card-element");

const form   = document.getElementById("payment-form");
const output = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  output.textContent = "⏳ Creating payment method...";

  const fd = new FormData(form);
  const data = {
    name  : fd.get("name"),
    email : fd.get("email"),
    line1 : fd.get("line1"),
    city  : fd.get("city"),
    postal: fd.get("postal_code"),
    country: fd.get("country")
  };

  /* 1) PaymentMethod */
  const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
    type:"card", card, billing_details:{ name:data.name, email:data.email }
  });
  if (pmErr){ output.textContent = "❌ "+pmErr.message; return; }

  /* 2) PaymentIntent via backend */
  const res = await fetch("/create-payment-intent", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      amount:100, currency:"usd", description:"Store Purchase",
      payment_method: paymentMethod.id, ...data
    })
  });
  const json = await res.json();
  if (json.error){ output.textContent = "❌ "+json.error; return; }

  /* 3) Confirm PaymentIntent */
  output.textContent = "🔄 Confirming payment...";
  const { error, paymentIntent } =
        await stripe.confirmCardPayment(json.client_secret);

  if (error){
    output.textContent = "❌ "+error.message;
  } else {
    output.textContent = paymentIntent.status === "succeeded"
      ? "✅ Payment succeeded!"
      : "ℹ️ Payment status: "+paymentIntent.status;
  }
});
