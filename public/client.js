const stripe = Stripe(
  'pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE'
);

const elements = stripe.elements();
const card = elements.create('card');
card.mount('#card-element');

const form       = document.getElementById('payment-form');
const resultBox  = document.getElementById('result');
const payButton  = form.querySelector('button');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultBox.textContent = '';
  payButton.disabled = true;

  // 1) إنشاء Token
  const { token, error } = await stripe.createToken(card);
  if (error) {
    resultBox.textContent = `Token error: ${error.message}`;
    payButton.disabled = false;
    return;
  }

  // 2) إرسال Token للسيرفر
  try {
    const res = await fetch('/create-charge', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ tokenId: token.id })
    });

    const data = await res.json();
    resultBox.textContent = JSON.stringify(data, null, 2);

  } catch (fetchErr) {
    resultBox.textContent = `Network error: ${fetchErr.message}`;
  } finally {
    payButton.disabled = false;
  }
});
