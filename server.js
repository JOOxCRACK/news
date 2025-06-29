// server.js – Stripe عبر بروكسي HTTP مخصّص (confirm + off_session)
// ---------------------------------------------------------------
// ⚠️ يفضَّل وضع STRIPE_SECRET_KEY و STRIPE_PROXY في متغيرات البيئة
//   STRIPE_PROXY مثال: http://user:pass@ip:port

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { HttpsProxyAgent } = require("https-proxy-agent");   // الإصدار الحديث ≥ v7
const app = express();

/* ---------- إعداد البروكسي ---------- */
const proxyUrl = process.env.STRIPE_PROXY ||
  "http://rigordimagiba49_gmail_com:HazeProxy123@la.residential.rayobyte.com:8000";
const agent = new HttpsProxyAgent(proxyUrl);

/* ---------- Stripe ---------- */
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  httpAgent: agent,   // كل طلب يمرّ عبر البروكسي
  networkRetries: 2,
  timeout: 30_000
});

/* ---------- إعداد Express ---------- */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ---------- POST /create-payment-intent ---------- */
app.post("/create-payment-intent", async (req, res) => {
  const {
    amount,
    currency = "eur",
    description = "Store Purchase",
    payment_method
  } = req.body;

  try {
    if (!payment_method)
      return res.status(400).json({ error: "payment_method missing" });

    const intent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency,
      description,
      payment_method,
      confirm: true,      // تأكيد فورى
      off_session: true   // يمنع 3-D Secure / redirect
    });

    res.json({
      id: intent.id,
      status: intent.status,
      charges: intent.charges.data
    });
  } catch (err) {
    res.status(400).json({
      message       : err.message,
      type          : err.type,
      code          : err.code,
      decline_code  : err.decline_code,
      payment_intent: err.payment_intent
    });
  }
});

/* ---------- تشغيل السيرفر ---------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server listening on", PORT));
