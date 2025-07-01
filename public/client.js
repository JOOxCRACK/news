const stripe = Stripe('pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE');

const elements = stripe.elements();
const card = elements.create('card');
card.mount('#card-element');

const form = document.getElementById('payment-form');
const resultBox = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultBox.textContent = 'Processing...';

  const { token, error } = await stripe.createToken(card);
  if (error) {
    resultBox.textContent = error.message;
    return;
  }

  const res = await fetch('/create-charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId: token.id, amount: 1000 })
  });

  const data = await res.json();
  resultBox.textContent = JSON.stringify(data, null, 2);
});
