// client.js – طباعة الاستجابة كاملة فى Console بدون اختصار
//------------------------------------------------------------------
// ضع مفتاحك العلني بدلاً من pk_live_REPLACE_ME
const stripe = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE");

// 1) Stripe Elements
const elements = stripe.elements();
const card     = elements.create("card", { classes:{ base:"p-2" } });
card.mount("#card-element");

// 2) عناصر الواجهة
const form   = document.getElementById("payment-form");
const result = document.getElementById("payment-result");
const btn    = document.getElementById("card-button");
const logUI  = (txt)=> (result.textContent = txt);

form.addEventListener("submit", async e => {
  e.preventDefault();
  btn.disabled = true;
  logUI("⏳ إنشاء وسيلة الدفع…");

  // إنشاء payment_method
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type:"card", card,
    billing_details:{
      name : document.getElementById("cardholder-name").value,
      email: document.getElementById("email").value,
    }
  });

  if(error){ logUI("❌ "+error.message); btn.disabled=false; return; }

  // إرسال للباك-إند
  const body = new URLSearchParams({
    payment_method:paymentMethod.id,
    amount:100,
    currency:"eur",
    description:"Store Purchase",
    email:document.getElementById("email").value,
  });

  try{
    const res   = await fetch("/create-payment-intent",{
      method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:body.toString()
    });

    // ← نحصل على النصّ الخام ثم نطبعه قبل أى تحليل
    const raw  = await res.text();
    console.log("----- Stripe RAW Response -----\n"+raw);

    let data;
    try { data = JSON.parse(raw); }
    catch(parseErr){
      logUI("❌ فشل فى قراءة الرد");
      btn.disabled=false;
      return;
    }

    // إظهار النتيجة للمستخدم باختصار فقط
    if(data.error){
      logUI("❌ "+data.error.message);
    }else if(data.status === "succeeded"){
      logUI("✅ تم الدفع بنجاح");
    }else{
      logUI("ℹ️ تحقق من Console للتفاصيل");
    }
  }catch(err){
    logUI("❌ "+err.message);
  }finally{
    btn.disabled=false;
  }
});
