// server.js – manual creation, client-side confirmation (Stripe JS)
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

// home page
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

/* POST /create-payment-intent
   - Creates PaymentIntent WITHOUT confirming
   - Client (Stripe.js) will confirm via confirmCardPayment */
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

    if (!payment_method)
      return res.status(400).json({ error: "payment_method missing" });

    const params = {
      amount: Number(amount),
      currency,
      payment_method_types: ["card"],
      description,
      payment_method,
      confirmation_method: "manual", // require client confirmation
      confirm: false,                // don't confirm server‑side
      receipt_email: email,
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic"
        }
      }
    };

    if (line1 && country && name) {
      params.shipping = {
        name,
        address: { line1, city, postal_code, country }
      };
    }

    const intent = await stripe.paymentIntents.create(params);

    res.json({ client_secret: intent.client_secret, id: intent.id, status: intent.status });
  } catch (err) {
    res.status(400).json({
      message: err.message,
      type: err.type,
      code: err.code,
      decline_code: err.decline_code || null
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Server listening on", PORT));
