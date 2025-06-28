// server.js – Stripe PaymentIntent بدون hCaptcha (confirm=false)
// --------------------------------------------------------------
const express    = require("express");
const stripe     = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const path       = require("path");
const app        = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());           // لقبول JSON أيضًا
app.use(express.static(path.join(__dirname, "public")));

// صفحة البداية
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/*
  Endpoint: /create-payment-intent
  – يستقبل amount و currency و description و (اختياري) payment_method
  – confirm=false بحيث التأكيد و3-D Secure يتمّان في الواجهة عبر Stripe.js
*/
app.post("/create-payment-intent", async (req, res) => {
  const { amount, currency, description, payment_method } = req.body;
  try {
    const params = {
      amount:              Number(amount),
      currency:            currency || "usd",
      description:         description || "Store Purchase",
      payment_method_types:["card"],
      confirm:             false          // نترك التأكيد للـ Frontend
    };
    if (payment_method) params.payment_method = payment_method;

    const intent = await stripe.paymentIntents.create(params);

    res.json({
      id:            intent.id,
      client_secret: intent.client_secret,
      status:        intent.status
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server listening on", PORT));



