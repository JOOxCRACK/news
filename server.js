// server.js – Stripe PaymentIntent (confirm + off_session) لإلغاء 3‑D Secure
// -------------------------------------------------------------------
const express    = require("express");
const stripe     = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const path       = require("path");
const app        = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());            // لقبول JSON أيضًا
app.use(express.static(path.join(__dirname, "public")));

// الصفحة الرئيسية
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/*
  POST /create-payment-intent
  – يستقبل amount, currency, description, payment_method
  – يؤكد الدفع مباشرة off_session (لا يفتح 3-D Secure)
*/
app.post("/create-payment-intent", async (req, res) => {
  const { amount, currency = "eur", description = "Store Purchase", payment_method } = req.body;
  try {
    if (!payment_method) {
      return res.status(400).json({ error: "payment_method missing" });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency,
      description,
      payment_method,
      confirm: true,       // تأكيد فورى
      off_session: true    // يمنع 3‑D Secure
    });

    res.json({
      id:            intent.id,
      status:        intent.status,
      charges:       intent.charges.data,
      client_secret: intent.client_secret
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
