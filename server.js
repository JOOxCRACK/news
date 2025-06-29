// server.js – Stripe manual PaymentIntent (no proxy, no captcha)
const express    = require("express");
const bodyParser = require("body-parser");
const path       = require("path");
const stripe     = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  maxNetworkRetries: 2,
  timeout: 30000
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Home page
app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* POST /create-payment-intent
   – Creates PaymentIntent without confirming (on-session confirmation in client) */
app.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      description = "Store Purchase",
      payment_method,
      name,
      email,
      line1,
      city,
      postal_code,
      country
    } = req.body;

    if (!payment_method) {
      return res.status(400).json({ error: "payment_method missing" });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency,
      description,
      payment_method,
      confirmation_method: "manual",
      confirm: false,                 // confirm on client
      receipt_email: email,
      shipping: {
        name,
        address: { line1, city, postal_code, country }
      },
      payment_method_options: {
        card: { request_three_d_secure: "any" }
      }
    });

    res.json({
      client_secret: intent.client_secret,
      id: intent.id,
      status: intent.status
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
      type: err.type,
      code: err.code,
      decline_code: err.decline_code,
      payment_intent: err.payment_intent
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Server listening on", PORT));
