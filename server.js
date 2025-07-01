import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Create charge
app.post('/create-charge', async (req, res) => {
  try {
    const { tokenId, amount, currency = 'usd' } = req.body;
    if (!tokenId) return res.status(400).json({ error: 'Missing tokenId' });

    const charge = await stripe.charges.create({
      amount,
      currency,
      source: tokenId,
      description: 'Demo charge from /create-charge',
    });

    const risk = charge.outcome?.risk_level;
    if (risk === 'highest') {
      await stripe.refunds.create({ charge: charge.id });
      return res.status(402).json({ error: 'High-risk transaction – refunded automatically.' });
    }

    res.json({ chargeId: charge.id, status: charge.status, risk });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
