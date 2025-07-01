const stripe = Stripe(
  'pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE'
);

const elements = stripe.elements();
const card     = elements.create('card');
card.mount('#card-element');

const form      = document.getElementById('payment-form');
const resultBox = document.getElementById('result');
const button    = form.querySelector('button');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultBox.textContent = '';
  button.disabled = true;

  // Gather billing details from form
  const billing = {
    name:   document.getElementById('name').value,
    address_line1: document.getElementById('line1').value,
    address_city:  document.getElementById('city').value,
    address_state: document.getElementById('state').value,
    address_zip:   document.getElementById('zip').value,
    address_country: document.getElementById('country').value
  };
  const email = document.getElementById('email').value;

  // 1) Create token with billing details
  const { token, error } = await stripe.createToken(card, billing);
  if (error) {
    resultBox.textContent = `Token error: ${error.message}`;
    button.disabled = false;
    return;
  }

  // 2) Send token & email to backend
  try {
    const res = await fetch('/create-charge', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ tokenId: token.id, email })
    });
    const data = await res.json();
    resultBox.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    resultBox.textContent = `Network error: ${err.message}`;
  } finally {
    button.disabled = false;
  }
});

