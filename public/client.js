// client.js – Stripe with detailed console logging

// 1) Replace with your real publishable key
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

// 2) Stripe Elements setup
const elements = stripe.elements();
const cardElement = elements.create("card", { classes: { base: "p-2" } });
cardElement.mount("#card-element");

// 3) Helper elements
const form     = document.getElementById("payment-form");
const resultEl = document.getElementById("payment-result");
const payBtn   = document.getElementById("card-button");

const logUI = (txt) => (resultEl.textContent = txt);
const enableBtn  = () => (payBtn.disabled = false);
const disableBtn = () => (payBtn.disabled = true);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  disableBtn();
  logUI("⏳ جارى إنشاء وسيلة الدفع…");

  // A) Create payment method
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card: cardElement,
    billing_details: {
      name : document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value,
    },
  });

  if (error) {
    logUI("❌ " + error.message);
    console.error("Stripe createPaymentMethod error", error);
    enableBtn();
    return;
  }

  // B) Call backend to create PaymentIntent
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount       : 100,
    currency     : "eur",
    description  : "Store Purchase",
    email        : document.getElementById("email").value,
  });

  try {
    const res  = await fetch("/create-payment-intent", {
      method : "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body   : body.toString(),
    });

    const data = await res.json();
    console.dir(data, { depth: null }); // طباعة كل المستويات دون طيّ // ⬅️ Full JSON visible فقط في F12

    if (data.error) {
      logUI("❌ " + data.error);
      enableBtn();
      return;
    }

    if (data.status === "succeeded") {
      logUI("✅ تم الدفع بنجاح!
شاهد التفاصيل في الـ Console (F12)");
    } else {
      const decline = data.last_payment_error?.decline_code || data.last_payment_error?.code;
      let humanMsg  = data.last_payment_error?.message || "تم رفض البطاقة";
      if (decline === "insufficient_funds") humanMsg = "❌ البطاقة لا تحتوي على رصيد كاف";
      if (decline === "lost_card")          humanMsg = "❌ البطاقة مفقودة";
      if (decline === "stolen_card")        humanMsg = "❌ البطاقة مسروقة";
      if (decline === "incorrect_cvc")      humanMsg = "❌ رمز CVC غير صحيح";
      if (decline === "expired_card")       humanMsg = "❌ انتهت صلاحية البطاقة";

      logUI(humanMsg);
    }
  } catch (err) {
    logUI("❌ " + err.message);
    console.error(err);
  } finally {
    enableBtn();
  }
});
