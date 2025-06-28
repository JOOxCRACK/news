// client.js
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // Replace with your real pk_live
const elements = stripe.elements();
const card = elements.create("card");
card.mount("#card-element");

const log = txt => (document.getElementById("payment-result").textContent = txt);
const btn = document.getElementById("card-button");
const form = document.getElementById("payment-form");

form.addEventListener("submit", async e => {
  e.preventDefault();
  btn.disabled = true;
  log("⏳ Creating payment_method...");

  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: {
      name: document.getElementById("cardholder-name").value
    }
  });

  if (error) {
    log("❌ " + error.message);
    btn.disabled = false;
    return;
  }

  const res = await fetch("/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      payment_method: paymentMethod.id,
      amount: 100, // You can change this
      currency: "eur",
      description: "Product Purchase"
    })
  });

  const data = await res.json();
  if (data.error) {
    log("❌ " + data.error.message);
    btn.disabled = false;
  } else {
    log("✅ Payment success!");
  }
});
