import express from 'express';
import Stripe  from 'stripe';
import dotenv  from 'dotenv';
import path    from 'path';
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
 * body = { tokenId, email }
 */
app.post('/create-charge', async (req, res) => {
  try {
    const { tokenId, email, currency = 'usd' } = req.body;
    if (!tokenId) return res.status(400).json({ error: { message: 'Missing tokenId' } });

    const charge = await stripe.charges.create({
      amount:    200,            // 2.00 USD
      currency,
      source:    tokenId,
      description: 'Demo $2 charge with billing details',
      receipt_email: email || undefined,
      metadata: { email }
    });

    // Risk check
    if (charge.outcome?.risk_level === 'highest') {
      await stripe.refunds.create({ charge: charge.id });
      return res.status(402).json({
        error: {
          message: 'High-risk transaction – refunded automatically.',
          risk_level: charge.outcome.risk_level
        },
        charge
      });
    }

    res.json(charge);

  } catch (err) {
    if (err.type === 'StripeCardError') {
      return res.status(402).json({
        error: {
          message: err.message,
          code:    err.code,
          decline_code: err.decline_code
        }
      });
    }
    console.error(err);
    res.status(500).json({ error: { message: 'Server error', raw: err.message } });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log('🚀 Server running on http://localhost:' + (process.env.PORT || 3000))
);
