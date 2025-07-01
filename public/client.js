// public/client.js
const stripe = Stripe(import.meta.env
  ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY          // لو بتستخدم أدوات Build مثل Vite
  : 'pk_live_*********************');                    // أو اكتب المفتاح مباشرةً مؤقتًا

const form      = document.getElementById('payment-form');
const payBtn    = document.getElementById('pay-btn');
let elements;   // سننشئه بعد الحصول على clientSecret

// ── الخطوة 1: اطلب clientSecret من خادمك ────────────────
(async () => {
  const res = await fetch('/create-payment-intent', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ amount: 1000 }) // ← 10 دولار
  });
  const { clientSecret } = await res.json();

  // ── الخطوة 2: أنشئ Payment Element ───────────────────
  elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');
})();

// ── الخطوة 3: عند الضغط على Pay ─────────────────────────
payBtn.addEventListener('click', async () => {
  payBtn.disabled = true;
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: window.location.origin + '/success.html'
    }
  });

  if (error) {
    alert(error.message);
    payBtn.disabled = false;
  }
});
