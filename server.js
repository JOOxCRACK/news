// server.js – Express + Stripe (يرجع الرد كامل)
//-------------------------------------------------------------
const express = require("express");
const stripe  = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const path = require("path");
const app  = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, description, payment_method, email } = req.body;

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      payment_method,
      confirm: true,
      off_session: true,
      metadata: { email }
    });

    res.json(intent);
  } catch (err) {
    // إرجاع كل تفاصيل الخطأ من Stripe
    res.status(400).json({
      message       : err.message,
      type          : err.type,
      code          : err.code,
      decline_code  : err.decline_code,
      payment_intent: err.payment_intent, // يحتوى last_payment_error وغيرها
      charge        : err.charge
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

