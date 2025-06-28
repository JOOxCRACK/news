// client.js – Stripe integration (اسم + إيميل + طباعة كاملة في Console)
// --------------------------------------------------------------
// 1) ضع مفتاحك العلني هنا
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

// 2) تهيئة Stripe Elements
const elements    = stripe.elements();
const cardElement = elements.create("card", { classes: { base: "p-2" } });
cardElement.mount("#card-element");

// 3) مراجع لعناصر النموذج
const form      = document.getElementById("payment-form");
const payBtn    = document.getElementById("card-button");
const resultBox = document.getElementById("payment-result");

const ui = {
  log  : (msg) => (resultBox.textContent = msg),
  lock : ()    => (payBtn.disabled = true),
  free : ()    => (payBtn.disabled = false),
};

// 4) إرسال النموذج
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  ui.lock();
  ui.log("⏳ إنشاء وسيلة الدفع…");

  // 4-أ) إنشاء payment_method
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card: cardElement,
    billing_details: {
      name : document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value,
    },
  });

  if (error) {
    ui.log("❌ " + error.message);
    console.error("Stripe createPaymentMethod error", error);
    ui.free();
    return;
  }

  // 4-ب) نطلب PaymentIntent من السيرفر
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount       : 100,          // 1 € = 100 سنت
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
    console.dir(data, { depth: null }); // 🔍 طباعة مفصلة فى الـ Console

    if (data.error) {
      ui.log("❌ " + data.error);
      ui.free();
      return;
    }

    // 4-ج) فحص النتيجة
    if (data.status === "succeeded") {
      ui.log("✅ تم الدفع بنجاح!\nانظر التفاصيل فى Console");
    } else {
      const decline = data.last_payment_error?.decline_code || data.last_payment_error?.code;
      let   message = data.last_payment_error?.message      || "تم رفض البطاقة";
      if (decline === "insufficient_funds") message = "❌ البطاقة لا تحتوي على رصيد كاف";
      if (decline === "lost_card")          message = "❌ البطاقة مفقودة";
      if (decline === "stolen_card")        message = "❌ البطاقة مسروقة";
      if (decline === "incorrect_cvc")      message = "❌ رمز CVC غير صحيح";
      if (decline === "expired_card")       message = "❌ انتهت صلاحية البطاقة";

      ui.log(message);
    }
  } catch (err) {
    ui.log("❌ " + err.message);
    console.error(err);
  } finally {
    ui.free();
  }
});
