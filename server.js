// server.js — إنشاء SetupIntent لحفظ البطاقة
//-------------------------------------------------
require("dotenv").config();          // لو لديك ملف .env
const express    = require("express");
const bodyParser = require("body-parser");
const path       = require("path");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  maxNetworkRetries: 2,
  timeout: 30000,
});

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* POST /create-setup-intent
   يُنشئ SetupIntent جديد ويُرجع client_secret (وفى حالة وجود e-mail يُنشئ Customer) */
app.post("/create-setup-intent", async (req, res) => {
  try {
    const { email } = req.body;

    const customer = email
      ? await stripe.customers.create({ email })
      : null;

    const intent = await stripe.setupIntents.create({
      customer: customer?.id,
      payment_method_types: ["card"],
    });

    res.json({
      client_secret: intent.client_secret,
      customer_id  : customer?.id || null,
    });
  } catch (err) {
    // إرجاع الخطأ الخام بالكامل لعرضه فى الـ Console
    res.status(400).json(err.raw || err);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server listening on ${PORT}`));
