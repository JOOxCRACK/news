/****************************************************************
 * client.js (مع حقل الإيميل)
 ****************************************************************/

const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // ← استبدل بمفتاحك العلني

// 1) تهيئة Stripe Elements
const elements = stripe.elements();
const card = elements.create("card");
card.mount("#card-element");

// 2) عناصر DOM
const log  = txt => (document.getElementById("payment-result").textContent = txt);
const btn  = document.getElementById("card-button");
const form = document.getElementById("payment-form");

// 3) عند إرسال النموذج
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  btn.disabled = true;
  log("⏳ Creating payment_method…");

  // 3-أ) إنشاء payment_method بالاسم والإيميل
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: {
      name : document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value           // ← إضافة الإيميل
    }
  });

  if (error) {
    log("❌ " + error.message);
    btn.disabled = false;
    return;
  }

  // 3-ب) إرسال البيانات إلى الخادم
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount        : 100,          // 1 € = 100 سنت (عدّل كما تريد)
    currency      : "eur",
    description   : "Product Purchase",
    email         : document.getElementById("email").value     // ← إرسال الإيميل
  });

  const res  = await fetch("/create-payment-intent", {
    method : "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body   : body.toString()
  });

  const data = await res.json();
  if (data.error) {
    log("❌ " + data.error.message);
    btn.disabled = false;
  } else {
    log("✅ Payment success!");
  }
});
