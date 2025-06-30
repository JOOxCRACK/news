// public/script.js
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // ضع مفتاحك هنا
const elements = stripe.elements();
const cardElement = elements.create("card");
cardElement.mount("#card-element");

const form = document.getElementById("payment-form");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const name = formData.get("name");
  const email = formData.get("email");
  const line1 = formData.get("line1");
  const city = formData.get("city");
  const postal_code = formData.get("postal_code");
  const country = formData.get("country");

  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: "card",
    card: cardElement,
    billing_details: { name, email }
  });

  if (error) {
    result.textContent = "❌ Error creating payment method: " + error.message;
    return;
  }

  const res = await fetch("/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: 100,
      description: "Store Purchase",
      payment_method: paymentMethod.id,
      name,
      email,
      line1,
      city,
      postal_code,
      country
    })
  });

  const data = await res.json();

  if (data.error) {
    result.textContent = "❌ Error: " + JSON.stringify(data, null, 2);
    return;
  }

  const confirm = await stripe.confirmCardPayment(data.client_secret);
  if (confirm.error) {
    result.textContent = "❌ Confirmation error: " + confirm.error.message;
  } else {
    result.textContent = "✅ Payment successful! Status: " + confirm.paymentIntent.status;
  }
});
