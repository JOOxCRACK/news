import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

const app = express();
app.use(express.json());

// serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// POST /create-charge  → يشحن 2$
app.post('/create-charge', async (req, res) => {
  try {
    const { tokenId, currency = 'usd' } = req.body;
    if (!tokenId) return res.status(400).json({ error: 'Missing tokenId' });

    const charge = await stripe.charges.create({
      amount: 200,              // 2.00 USD
      currency,
      source: tokenId,
      description: 'Demo $2 charge'
    });

    // تحقّق من مستوى المخاطرة
    const risk = charge.outcome?.risk_level;
    if (risk === 'highest') {
      await stripe.refunds.create({ charge: charge.id });
      return res.status(402).json({
        error: 'High-risk transaction – refunded automatically.',
        charge
      });
    }

    // أعد كائن الـ Charge كامل
    res.json(charge);
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
