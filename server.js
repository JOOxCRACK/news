// server.js – إنشاء PaymentIntent بدون off_session (يدعم 3-D Secure)
const express     = require("express");
const stripe      = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser  = require("body-parser");
const path        = require("path");
const app         = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, description } = req.body;

    // confirm:false → نسمح بالتحقق 3-D Secure فى الواجهة
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      payment_method_types: ["card"],
      confirm: false,
    });

    res.json({ client_secret: intent.client_secret });
  } catch (err) {
    res.status(400).json({
      message       : err.message,
      type          : err.type,
      code          : err.code,
      decline_code  : err.decline_code,
      payment_intent: err.payment_intent,
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server listening on", PORT));


