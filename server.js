// server.js — Save card with SetupIntent (using dotenv, full logging)
//------------------------------------------------------------
require("dotenv").config();
const express = require("express");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(express.static("public"));
app.use(express.json());

app.post("/create-setup-intent", async (req, res) => {
  try {
    const { email } = req.body;

    const customer = await stripe.customers.create({
      email
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      usage: "off_session"
    });

    console.dir(setupIntent, { depth: null });
    res.send({ client_secret: setupIntent.client_secret });
  } catch (err) {
    console.dir(err, { depth: null });
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
