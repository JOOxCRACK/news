// server.js – manual PaymentIntent flow (confirm=false, no proxy)
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

/* Create PaymentIntent without confirmation */
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

    if(!payment_method) return res.status(400).json({ error:"payment_method missing" });

    const addressFilled = line1 && country; // require at least street + country

    const intent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency,
      description,
      payment_method,
      confirmation_method: "manual",
      confirm: false,
      receipt_email: email,
      ...(addressFilled && {
        shipping: {
          name,
          address: {
            line1,
            city,
            postal_code,
            country
          }
        }
      }),
      payment_method_options: {
        card: { request_three_d_secure: "any" }
      }
    });

    res.json({ client_secret:intent.client_secret, id:intent.id, status:intent.status });
  } catch (err) {
    res.status(400).json({ message:err.message, code:err.code, type:err.type });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Server listening on", PORT));
