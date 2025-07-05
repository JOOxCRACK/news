/* ============================
   Stripe initialisation
   ============================ */
const stripe = Stripe(
  'pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE'
);

/* ---------- Elements ---------- */
const elements = stripe.elements();
const card = elements.create('card', {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: 'inherit',
      '::placeholder': { color: '#aab7c4' }
    },
    invalid: { color: '#fa755a' }
  }
});
card.mount('#card-element');

/* ---------- DOM refs ---------- */
const form      = document.getElementById('payment-form');
const resultBox = document.getElementById('result');
const button    = form.querySelector('button');

/* ============================
   Handle submit
   ============================ */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultBox.textContent = '';
  button.disabled = true;

  /* Gather billing details from the form */
  const billingDetails = {
    name:            form.querySelector('#name').value,
    address_line1:   form.querySelector('#line1').value,
    address_city:    form.querySelector('#city').value,
    address_state:   form.querySelector('#state').value,
    address_zip:     form.querySelector('#zip').value,
    address_country: form.querySelector('#country').value
  };
  const email = form.querySelector('#email').value;

  /* 1) Create Stripe token with billing details */
  const { token, error } = await stripe.createToken(card, billingDetails);

  if (error) {
    resultBox.textContent = `❌ Token error: ${error.message}`;
    button.disabled = false;
    return;
  }

  /* 2) Send token & email to backend for a $2 charge */
  try {
    const response = await fetch('/create-charge', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ tokenId: token.id, email })
    });

    const data = await response.json();
    resultBox.textContent = JSON.stringify(data, null, 2);
  } catch (networkErr) {
    resultBox.textContent = `🌐 Network error: ${networkErr.message}`;
  } finally {
    button.disabled = false;
  }
});
