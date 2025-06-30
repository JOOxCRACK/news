// server.js – create PaymentIntent (manual) + client confirmation
//---------------------------------------------------------------
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

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* POST /create-payment-intent
   – ينشئ PaymentIntent (confirm:false) ويعيد client_secret للواجهة */
app.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      currency     = "usd",
      description  = "Store Purchase",
      payment_method,
      name, email, line1, city, postal_code, country
    } = req.body;

    if (!payment_method)
      return res.status(400).json({ error: "payment_method missing" });

    const params = {
      amount: Number(amount),
      currency,
      payment_method_types: ["card"],            // لا يقبل طرق Redirect
      description,
      payment_method,
      confirmation_method: "manual",
      confirm: false,                            // الـ client سيؤكد
      receipt_email: email,
      payment_method_options: {
        card: { request_three_d_secure: "automatic" }
      }
    };

    if (name && line1 && country) {
      params.shipping = {
        name,
        address: { line1, city, postal_code, country }
      };
    }

    const intent = await stripe.paymentIntents.create(params);

    res.json({
      id: intent.id,
      status: intent.status,
      client_secret: intent.client_secret
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
      type   : err.type,
      code   : err.code,
      decline_code : err.decline_code || null
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Server listening on", PORT));
