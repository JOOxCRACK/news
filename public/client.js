// client.js – Stripe 3‑D Secure Flow (يُظهر الرد كامل في Console)
// ------------------------------------------------------------------
// 1) ضع مفتاحك العلني هنا ↓
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

// 2) Stripe Elements إعداد
const elements = stripe.elements();
const card     = elements.create("card", { classes:{ base:"p-2" } });
card.mount("#card-element");

// 3) عناصر الـ DOM
const form   = document.getElementById("payment-form");
const result = document.getElementById("payment-result");
const btn    = document.getElementById("card-button");
const ui     = { log:t=>result.textContent=t, lock:()=>btn.disabled=true, free:()=>btn.disabled=false };

// 4) عند إرسال النموذج
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  ui.lock();
  ui.log("⏳ إنشاء PaymentIntent…");

  // أ) إنشاء PaymentIntent على السيرفر (confirm:false)
  const body = new URLSearchParams({
    amount: 100,            // 1 € = 100 سنت (غيّر ما تشاء)
    currency: "eur",
    description: "Store Purchase"
  });

  let client_secret;
  try {
    const resRaw = await fetch("/create-payment-intent", {
      method : "POST",
      headers: { "Content-Type":"application/x-www-form-urlencoded" },
      body   : body.toString()
    });
    const resTxt = await resRaw.text();
    console.log("--- RAW PI Response ---\n"+resTxt);
    const resJson = JSON.parse(resTxt);
    if(resJson.error){
      ui.log("❌ "+resJson.error.message);
      ui.free();
      return;
    }
    client_secret = resJson.client_secret;
  } catch(err){
    ui.log("❌ فشل فى الحصول على PaymentIntent");
    console.error(err);
    ui.free();
    return;
  }

  // ب) تأكيد الدفع + 3‑D Secure إن لزم
  ui.log("🔄 تأكيد الدفع… (قد يطلب التحقق)");
  const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
    payment_method: {
      card,
      billing_details: {
        name : document.getElementById("cardholder-name").value,
        email: document.getElementById("email").value
      }
    }
  });

  // ج) عرض النتيجة
  if(error){
    console.dir(error, {depth:null});
    ui.log("❌ "+error.message);
  }else if(paymentIntent.status === "succeeded"){
    console.dir(paymentIntent, {depth:null});
    ui.log("✅ تم الدفع بنجاح!\nتحقق من Console للتفاصيل.");
  }else{
    console.dir(paymentIntent, {depth:null});
    ui.log("ℹ️ حالة الدفع: "+paymentIntent.status+" – تحقق من Console.");
  }
  ui.free();
});
