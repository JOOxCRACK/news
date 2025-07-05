/* ---------- Stripe init ---------- */
const stripe = Stripe(
  'pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE'
);
const elements = stripe.elements();

/* ---------- Card element ---------- */
const card = elements.create('card', {
  style: {
    base: {
      fontSize: '15px',
      color: '#333',
      '::placeholder': { color: '#9ca3af' }
    },
    invalid: { color: '#e11d48' }
  }
});
card.mount('#card-element');

/* ---------- DOM refs ---------- */
const form      = document.getElementById('payment-form');
const resultBox = document.getElementById('result');
const button    = form.querySelector('button');

/* ---------- Submit handler ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultBox.textContent = '';
  button.disabled = true;

  /* collect billing details */
  const billingDetails = {
    name:            form.line1.form.name.value,
    address_line1:   form.line1.value,
    address_city:    form.city.value,
    address_state:   form.state.value,
    address_zip:     form.zip.value,
    address_country: form.country.value
  };
  const email = form.email.value;

  /* 1) create token */
  const { token, error } = await stripe.createToken(card, billingDetails);
  if (error) {
    resultBox.textContent = `❌ Token error: ${error.message}`;
    button.disabled = false;
    return;
  }

  /* 2) send to backend */
  try {
    const res = await fetch('/create-charge', {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify({ tokenId: token.id, email })
    });
    const data = await res.json();
    resultBox.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    resultBox.textContent = `🌐 Network error: ${err.message}`;
  } finally {
    button.disabled = false;
  }
});
