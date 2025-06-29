// server.js – Stripe عبر بروكسي HTTP مخصّص (confirm + off_session)

const express    = require("express");
const bodyParser = require("body-parser");
const path       = require("path");
const ProxyAgent = require("https-proxy-agent");

// بيانات البروكسي المُرسَلة من المستخدم ↓
const proxyUrl = "http://rigordimagiba49_gmail_com:HazeProxy123@la.residential.rayobyte.com:8000";
const agent    = new ProxyAgent(proxyUrl);

// Stripe مع تعيين httpAgent بالبروكسي
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  httpAgent: agent,
  networkRetries: 2,
  timeout: 30000 // 30s
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

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
      confirm: true,
      off_session: true
    });

    res.json({ id: intent.id, status: intent.status, charges: intent.charges.data });
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
