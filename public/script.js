// script.js — Save card with SetupIntent (full verbose logging)
//------------------------------------------------------------
const stripe   = Stripe("pk_live_51PvfyTLeu8I62P1q8Z9yBnULxSB028krKqvecohGtnJdOAGxFRnawRSuLtuj0wndH539bLciwUXUMyj1NA5J0l9d00vfqBBVbE"); // <‑‑ replace with your public key
const elements = stripe.elements();
const card     = elements.create("card");
card.mount("#card-element");

const form = document.getElementById("payment-form");
const out  = document.getElementById("result");

// helper: log deeply without truncation
const logFull = (label, val) => {
  console.log(`\n===== ${label} =====`);
  if (typeof val === "string") console.log(val);
  else console.dir(val, { depth: null, maxArrayLength: null });
  console.log(`===== END ${label} =====\n`);
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.textContent = "⏳ Creating SetupIntent…";

  const fd = new FormData(form);
  const billing = { name: fd.get("name"), email: fd.get("email") };
  const address = {
    line1: fd.get("line1"),
    city : fd.get("city"),
    postal_code: fd.get("postal_code"),
    country: fd.get("country")
  };

  /* 1) طلب SetupIntent من السيرفر */
  const siRes = await fetch("/create-setup-intent", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ email: billing.email })
  });
  const siData = await siRes.json();
  logFull("SetupIntent response (server)", siData);
  if (!siData.client_secret) {
    out.textContent = "❌ Failed to create SetupIntent";
    return;
  }

  /* 2) confirmCardSetup */
  const { setupIntent, error } = await stripe.confirmCardSetup(siData.client_secret, {
    payment_method: {
      card,
      billing_details: { ...billing, address }
    }
  });

  if (error) {
    logFull("SetupIntent ERROR", error);
    out.textContent = "❌ " + error.message;
    return;
  }

  logFull("SetupIntent SUCCESS", setupIntent);
  out.textContent = `✅ Card saved! payment_method id → ${setupIntent.payment_method}`;
});
