// client.js – sends full billing details to Stripe
// ------------------------------------------------------------
// Replace with your real pk_live key
const stripe = Stripe("pk_live_51MlYJuIu41iURIoc6pamDqtMP8Qrv2OcPWFe8CH4HEk5TYxT5qe0xaeI9cIUq9OmZn0Go8oRI3TWniEsx4vGiEYL00qoKPlNjw");

/* ---------- Stripe Elements ---------- */
const elements = stripe.elements();
const card     = elements.create("card", { classes: { base: "p-2" } });
card.mount("#card-element");

/* ---------- Form elements ---------- */
const form   = document.getElementById("payment-form");
const output = document.getElementById("payment-result");
const button = document.getElementById("card-button");
const ui     = {
  log : (t) => (output.textContent = t),
  lock: ()  => (button.disabled = true),
  free: ()  => (button.disabled = false)
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  ui.lock();
  ui.log("⏳ Creating payment method…");

  /* Gather billing inputs */
  const name   = document.getElementById("cardholder-name").value;
  const email  = document.getElementById("email").value;
  const line1  = document.getElementById("address-line1").value;
  const city   = document.getElementById("city").value;
  const postal = document.getElementById("postal_code").value;
  const country= document.getElementById("country").value; // 2‑letter ISO eg EG, US

  /* A) Create PaymentMethod with full billing details */
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: {
      name,
      email,
      address: {
        line1,
        city,
        postal_code: postal,
        country
      }
    }
  });

  if (error) {
    ui.log("❌ " + error.message);
    ui.free();
    return;
  }

  /* B) Send to backend to confirm */
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount: 100, // 1 USD (100 cents)
    currency: "usd",
    description: "Store Purchase",
    name,
    email,
    line1,
    city,
    postal_code,
    country
  });

  try {
    const res = await fetch("/create-payment-intent", {
      method : "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body   : body.toString()
    });

    const raw  = await res.text();
    console.log("--- RAW PaymentIntent Response ---\n" + raw);
    const data = JSON.parse(raw);

    if (data.status === "succeeded") {
      ui.log("✅ Payment succeeded!");
    } else if (data.decline_code === "authentication_required" || data.code === "authentication_required") {
      ui.log("⚠️ Card requires 3‑D Secure. Please use another card.");
    } else if (data.message) {
      ui.log("❌ " + data.message);
    } else {
      ui.log("❌ Declined: " + (data.decline_code || data.status));
    }
  } catch (err) {
    ui.log("❌ " + err.message);
  } finally {
    ui.free();
  }
});
