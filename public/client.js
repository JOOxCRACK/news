// client.js – handles Stripe payment flow with detailed decline messages

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

const log = (txt) => (resultEl.textContent = txt);
const enableBtn = () => (payBtn.disabled = false);
const disableBtn = () => (payBtn.disabled = true);

// 4) Form submission handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  disableBtn();
  log("⏳ جارى إنشاء وسيلة الدفع…");

  // 4‑أ) Create payment method
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card: cardElement,
    billing_details: {
      name : document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value,
    },
  });

  if (error) {
    log("❌ " + error.message);
    enableBtn();
    return;
  }

  // 4‑ب) Send to backend (form‑urlencoded)
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount       : 100,           // 1 € = 100 سنت
    currency     : "eur",
    description  : "Store Purchase",
    email        : document.getElementById("email").value,
  });

  log("🔄 جارى الاتصال بالخادم…");
  try {
    const res  = await fetch("/create-payment-intent", {
      method : "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body   : body.toString(),
    });

    const data = await res.json();

    /*
      إذا API backend أرجع error
    */
    if (data.error) {
      log("❌ " + data.error);
      enableBtn();
      return;
    }

    /*
      Stripe PaymentIntent response – تحقق من الحالة والأخطاء
    */
    if (data.status === "succeeded") {
      log("✅ تم الدفع بنجاح!\n\n" + JSON.stringify(data, null, 2));
    } else {
      // حاول قراءة كود الرفض التفصيلي
      const decline = data.last_payment_error?.decline_code || data.last_payment_error?.code;
      const msg     = data.last_payment_error?.message || "تم رفض البطاقة";
      let humanMsg  = msg;
      if (decline === "insufficient_funds") humanMsg = "❌ البطاقة لا تحتوي على رصيد كاف";
      if (decline === "lost_card")          humanMsg = "❌ البطاقة مفقودة";
      if (decline === "stolen_card")        humanMsg = "❌ البطاقة مسروقة";
      if (decline === "incorrect_cvc")      humanMsg = "❌ رمز CVC غير صحيح";
      if (decline === "expired_card")       humanMsg = "❌ انتهت صلاحية البطاقة";

      log(humanMsg + "\n\nالتفاصيل:\n" + JSON.stringify(data, null, 2));
    }
  } catch (err) {
    log("❌ " + err.message);
  } finally {
    enableBtn();
  }
});
