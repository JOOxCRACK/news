// server.js – automatic confirmation for PaymentIntent (no 3D Secure redirect)
// ----------------------------------------------------------------
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

app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

/* Create and immediately confirm PaymentIntent */
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

    if (!payment_method) return res.status(400).json({ error: "payment_method missing" });

    const intent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency,
      payment_method_types: ["card"],
      description,
      payment_method,
      confirmation_method: "automatic",
      confirm: true,
      receipt_email: email,
      ...(line1 && country && name) && {
        shipping: {
          name,
          address: {
            line1,
            city,
            postal_code,
            country
          }
        }
      },
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic" // only if issuer requires
        }
      }
      }
    });

    res.json({
      id: intent.id,
      status: intent.status,
      client_secret: intent.client_secret,
      next_action: intent.next_action || null
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
      type: err.type,
      code: err.code,
      decline_code: err.decline_code || null,
      payment_intent: err.payment_intent || null
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Server listening on", PORT));
