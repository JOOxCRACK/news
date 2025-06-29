// client.js – sends full billing details to Stripe
// ------------------------------------------------------------
//  ضع مفتاحك العلني بدلاً من pk_live_REPLACE_ME
const stripe = Stripe("pk_live_51MlYJuIu41iURIoc6pamDqtMP8Qrv2OcPWFe8CH4HEk5TYxT5qe0xaeI9cIUq9OmZn0Go8oRI3TWniEsx4vGiEYL00qoKPlNjw");

/* ---------- Stripe Elements ---------- */
const elements = stripe.elements();
const card     = elements.create("card", { classes: { base: "p-2" } });
card.mount("#card-element");

/* ---------- Form helpers ---------- */
const form   = document.getElementById("payment-form");
const result = document.getElementById("payment-result");
const button = document.getElementById("card-button");
const ui = { log:t=>result.textContent=t, lock:()=>button.disabled=true, free:()=>button.disabled=false };

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  ui.lock(); ui.log("⏳ Creating payment method…");

  /* تجميع بيانات الفوترة */
  const billing = {
    name  : document.getElementById("cardholder-name").value,
    email : document.getElementById("email").value,
    address: {
      line1      : document.getElementById("address-line1").value,
      city       : document.getElementById("city").value,
      postal_code: document.getElementById("postal_code").value,
      country    : document.getElementById("country").value
    }
  };

  /* A) إنشاء PaymentMethod */
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: "card",
    card,
    billing_details: billing
  });

  if (error){ ui.log("❌ "+error.message); ui.free(); return; }

  /* B) إرسال للسيرفر للتأكيد */
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount: 100,            // 1 USD = 100 سنت
    currency: "usd",
    description: "Store Purchase"
  });

  try{
    const res = await fetch("/create-payment-intent", {
      method:"POST",
      headers:{ "Content-Type":"application/x-www-form-urlencoded" },
      body: body.toString()
    });

    const raw  = await res.text();
    console.log("--- RAW PaymentIntent Response ---\n"+raw);
    const data = JSON.parse(raw);

    if (data.status === "succeeded"){
      ui.log("✅ تمت العملية بنجاح!");
    } else if (data.decline_code === "authentication_required" || data.code === "authentication_required"){
      ui.log("⚠️ البطاقة تتطلب تحقق 3-D Secure. استخدم بطاقة أخرى.");
    } else if (data.message){
      ui.log("❌ "+data.message);
    } else {
      ui.log("❌ تم الرفض – الكود: "+(data.decline_code||data.status));
    }
  }catch(err){
    ui.log("❌ "+err.message);
  }finally{
    ui.free();
  }
});
