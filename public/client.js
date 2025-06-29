// client.js – إرسال payment_method للسيرفر (Confirm + Off-Session)
// --------------------------------------------------------------------

// 1) استبدل هذا المفتاح بمفتاحك العلني الحقيقي
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

// 2) Stripe Elements
const elements = stripe.elements();
const card     = elements.create("card", { classes: { base: "p-2" } });
card.mount("#card-element");

// 3) عناصر واجهة المستخدم
const form      = document.getElementById("payment-form");
const resultBox = document.getElementById("payment-result");
const payBtn    = document.getElementById("card-button");
const ui        = {
  log  : (t) => (resultBox.textContent = t),
  lock : ()  => (payBtn.disabled = true),
  free : ()  => (payBtn.disabled = false)
};

// 4) عند إرسال النموذج
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  ui.lock();
  ui.log("⏳ إنشاء payment_method…");

  // (أ) إنشاء payment_method بالاسم والإيميل
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: {
      name : document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value
    }
  });

  if (error) {
    ui.log("❌ " + error.message);
    ui.free();
    return;
  }

  // (ب) استدعاء السيرفر لتأكيد الدفع off_session
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount       : 100,      // مثال: 1 € = 100 سنت
    currency     : "eur",
    description  : "Store Purchase"
  });

  try {
    const res  = await fetch("/create-payment-intent", {
      method : "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body   : body.toString()
    });

    const raw  = await res.text();
    console.log("--- RAW PaymentIntent Response ---\n" + raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      ui.log("❌ فشل فى قراءة الرد");
      ui.free();
      return;
    }

    // (ج) عرض نتيجة مختصرة للمستخدم
    if (data.status === "succeeded") {
      ui.log("✅ تم الدفع بنجاح!");
    } else if (
      data.code === "authentication_required" ||
      data.decline_code === "authentication_required"
    ) {
      ui.log(
        "⚠️ البطاقة تتطلب تحقق إضافي (3-D Secure) ولا يمكن إكمالها فى الخلفية. يرجى تجربة بطاقة أخرى."
      );
    } else if (data.message) {
      ui.log("❌ " + data.message);
    } else {
      ui.log("❌ تم رفض البطاقة – كود: " + (data.decline_code || data.status));
    }
  } catch (err) {
    ui.log("❌ " + err.message);
  } finally {
    ui.free();
  }
});
