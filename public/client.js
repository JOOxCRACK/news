// client.js – manual PaymentIntent confirmation on-session
// --------------------------------------------------------
// Replace with your real public key
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

/* ---------- Stripe Elements ---------- */
const elements = stripe.elements();
const card = elements.create("card", { classes: { base: "p-2" } });
card.mount("#card-element");

/* ---------- UI helpers ---------- */
const form   = document.getElementById("payment-form");
const result = document.getElementById("payment-result");
const button = document.getElementById("card-button");
const ui = {
  log : (t)=> result.textContent = t,
  lock: ()=> button.disabled = true,
  free: ()=> button.disabled = false
};

form.addEventListener("submit", async e => {
  e.preventDefault();
  ui.lock(); ui.log("⏳ Creating PaymentMethod…");

  /* 1) Create PaymentMethod with billing details */
  const billing = {
    name  : document.getElementById("cardholder-name").value,
    email : document.getElementById("email").value,
    address:{
      line1      : document.getElementById("address-line1").value,
      city       : document.getElementById("city").value,
      postal_code: document.getElementById("postal_code").value,
      country    : document.getElementById("country").value
    }
  };

  const { error:pmErr, paymentMethod } = await stripe.createPaymentMethod({
    type:"card", card, billing_details: billing
  });
  if (pmErr){ ui.log("❌ "+pmErr.message); ui.free(); return; }

  ui.log("⏳ Creating PaymentIntent…");

  /* 2) Ask backend to create PaymentIntent (confirm:false) */
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount        : 100,         // 1 USD
    currency      : "usd",
    description   : "Store Purchase",
    ...billing
  });

  const res  = await fetch("/create-payment-intent", {
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body: body.toString()
  });
  const raw  = await res.text();
  console.log("--- PI CREATE Response ---\n"+raw);
  const pi   = JSON.parse(raw);
  console.dir(pi, {depth:null});

  if (!pi.client_secret){
    ui.log("❌ "+(pi.message || "Failed to create PI"));
    ui.free(); return;
  }

  ui.log("🔄 Confirming PaymentIntent…");
  /* 3) Confirm on-session (opens 3-D Secure if required) */
  const { error, paymentIntent } = await stripe.confirmCardPayment(pi.client_secret);

  if (error){
    ui.log("❌ "+error.message);
    console.dir(error, {depth:null});
  } else {
    ui.log(paymentIntent.status === "succeeded"
           ? "✅ Payment succeeded!"
           : `ℹ️ Status: ${paymentIntent.status}`);
    console.dir(paymentIntent, {depth:null});
  }
  ui.free();
});
