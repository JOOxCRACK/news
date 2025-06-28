// client.js – handles Stripe payment flow

// 1) Replace with your real publishable key
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

// 2) Stripe Elements setup
const elements = stripe.elements();
const cardElement = elements.create("card", {
  classes: { base: "p-2" }
});
cardElement.mount("#card-element");

// 3) Helper elements
const form = document.getElementById("payment-form");
const resultEl = document.getElementById("payment-result");
const payBtn = document.getElementById("card-button");

const log = (txt) => (resultEl.textContent = txt);

// 4) Form submission handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  payBtn.disabled = true;
  log("⏳ جارى إنشاء وسيلة الدفع…");

  // 4‑أ) Create payment method with billing details
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card: cardElement,
    billing_details: {
      name: document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value,
    },
  });

  if (error) {
    log("❌ " + error.message);
    payBtn.disabled = false;
    return;
  }

  // 4‑ب) Send to backend to create PaymentIntent
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount: 100, // 1 € = 100 سنت
    currency: "eur",
    description: "Store Purchase",
    email: document.getElementById("email").value,
  });

  log("🔄 جارى الاتصال بالخادم…");
  try {
    const res = await fetch("/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();

    if (data.error) {
      log("❌ " + data.error);
      payBtn.disabled = false;
      return;
    }

    // 4‑ج) Payment succeeded — عرض كامل الاستجابة فى الـ <pre>
    log("✅ تم الدفع بنجاح!\n\n" + JSON.stringify(data, null, 2));
  } catch (err) {
    log("❌ " + err.message);
  } finally {
    payBtn.disabled = false;
  }
});
