const stripe = Stripe('pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE');

const payBtn = document.getElementById('pay-btn');
let elements;

// 1) جلب clientSecret من الخادم
(async () => {
  const res = await fetch('/create-payment-intent', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ amount: 1000 }) // 10 دولار
  });

  if (!res.ok) { alert('Server error'); return; }

  const { clientSecret } = await res.json();

  // 2) تركيب Payment Element
  elements = stripe.elements({ clientSecret });
  elements.create('payment').mount('#payment-element');
})();

// 3) تأكيد الدفع عند الضغط
payBtn.addEventListener('click', async () => {
  payBtn.disabled = true;
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: { return_url: window.location.origin + '/success.html' }
  });

  if (error) {
    alert(error.message);
    payBtn.disabled = false;
  }
});
