const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, description, payment_method } = req.body;

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      payment_method,
      confirm: true,
      off_session: true
    });

    res.json(intent);
  } catch (err) {
    res.json({ error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
