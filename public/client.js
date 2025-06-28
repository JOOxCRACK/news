// client.js – إرسال payment_method فقط وعرض الرد الكامل (بدون redirect)
//------------------------------------------------------------------
// 1) استبدل المفتاح العلني بمفتاحك الحقيقي
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

// 2) إعداد Stripe Elements
const elements = stripe.elements();
const card     = elements.create("card", { classes:{ base:"p-2" } });
card.mount("#card-element");

// 3) عناصر واجهة المستخدم
const form   = document.getElementById("payment-form");
const result = document.getElementById("payment-result");
const btn    = document.getElementById("card-button");
const ui     = { log:t=>result.textContent=t, lock:()=>btn.disabled=true, free:()=>btn.disabled=false };

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  ui.lock();
  ui.log("⏳ إنشاء payment_method…");

  // أ) إنشاء وسيلة الدفع
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type:"card", card,
    billing_details:{
      name : document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value,
    }
  });

  if(error){ ui.log("❌ "+error.message); ui.free(); return; }

  // ب) طلب إنشاء/تأكيد PaymentIntent من السيرفر (confirm+off_session)
  const body = new URLSearchParams({
    payment_method: paymentMethod.id,
    amount: 100,                 // مثال: 1 € = 100 سنت
    currency: "eur",
    description: "Store Purchase"
  });

  try{
    const res  = await fetch("/create-payment-intent",{
      method : "POST",
      headers: { "Content-Type":"application/x-www-form-urlencoded" },
      body   : body.toString()
    });

    const raw  = await res.text();
    console.log("--- RAW PaymentIntent Response ---\n"+raw);

    let data;
    try{ data = JSON.parse(raw); }catch(parseErr){ ui.log("❌ فشل فى قراءة الرد"); ui.free(); return; }

    if(data.status === "succeeded"){
      ui.log("✅ تم الدفع بنجاح");
    }else if(data.code === "authentication_required" || data.decline_code === "authentication_required"){
      ui.log("⚠️ البطاقة تتطلب تحقق إضافي (3‑D Secure) ولا يمكن إكمالها فى الخلفية. جرب بطاقة أخرى.");
    }else if(data.error){
      ui.log("❌ "+data.error.message);
    }else{
      ui.log("❌ تم رفض البطاقة – كود: "+(data.decline_code||data.status));
    }
  }catch(err){
    ui.log("❌ "+err.message);
  }finally{
    ui.free();
  }
});
