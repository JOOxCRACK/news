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
const __dirname  = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /create-charge
 * payload: { tokenId: "tok_...", currency?: "usd" }
 */
app.post('/create-charge', async (req, res) => {
  try {
    const { tokenId, currency = 'usd' } = req.body;
    if (!tokenId) {
      return res.status(400).json({ error: { message: 'Missing tokenId' } });
    }

    const charge = await stripe.charges.create({
      amount: 200,           // 2.00 USD
      currency,
      source: tokenId,
      description: 'Demo $2 charge'
    });

    // Risk check
    const risk = charge.outcome?.risk_level;
    if (risk === 'highest') {
      await stripe.refunds.create({ charge: charge.id });
      return res.status(402).json({
        error: {
          message: 'High-risk transaction – refunded automatically.',
          risk_level: risk
        },
        charge
      });
    }

    res.json(charge);

  } catch (err) {
    // Stripe card-error (declined، insufficient_funds، ... إلخ)
    if (err.type === 'StripeCardError') {
      return res.status(402).json({
        error: {
          message: err.message,
          code   : err.code,
          decline_code: err.decline_code,
          param  : err.param
        }
      });
    }

    // أي خطأ آخر
    console.error('Stripe/Server error:', err);
    res.status(500).json({ error: { message: 'Server error', raw: err.message } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
