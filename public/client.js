// client.js – إرسال payment_method فقط، السيرفر يؤكّد off-session
// ---------------------------------------------------------------

// 1) ضع مفتاحك العلني الحقيقى هنا
const stripe = Stripe("pk_live_51MlYJuIu41iURIoc6pamDqtMP8Qrv2OcPWFe8CH4HEk5TYxT5qe0xaeI9cIUq9OmZn0Go8oRI3TWniEsx4vGiEYL00qoKPlNjw");

// 2) Stripe Elements
const elements = stripe.elements();
const card = elements.create("card", { classes: { base: "p-2" } });
card.mount("#card-element");

// 3) DOM helpers
const form   = document.getElementById("payment-form");
const output = document.getElementById("payment-result");
const button = document.getElementById("card-button");
const ui = {
  log : (t) => (output.textContent = t),
  lock: ()  => (button.disabled = true),
  free: ()  => (button.disabled = false)
};

// 4) Handle submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  ui.lock();
  ui.log("⏳ إنشاء payment_method…");

  /* أ) إنشاء PaymentMethod */
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

  /* ب) استدعاء السيرفر لتأكيد PaymentIntent */
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount: 100,                // 1 € (غيّره كما تريد)
    currency: "eur",
    description: "Store Purchase"
  });

  try {
    const resRaw = await fetch("/create-payment-intent", {
      method : "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body   : body.toString()
    });

    const raw = await resRaw.text();
    console.log("--- RAW PaymentIntent Response ---\\n" + raw);

    const data = JSON.parse(raw);

    /* ج) عرض نتيجة مختصرة */
    if (data.status === "succeeded") {
      ui.log("✅ تم الدفع بنجاح!");
    } else if (
      data.code === "authentication_required" ||
      data.decline_code === "authentication_required"
    ) {
      ui.log("⚠️ البطاقة تتطلب تحقق إضافي (3-D Secure) ولا يمكن إكمالها فى الخلفية.");
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
