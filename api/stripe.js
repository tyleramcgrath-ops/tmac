// /api/stripe — starting a subscription, and managing one.
//
//   POST /api/stripe?action=checkout  { plan }   → { url } to Stripe's hosted checkout
//   POST /api/stripe?action=portal                → { url } to Stripe's billing portal
//
// Neither of these grants anything. They hand back a URL; the plan is written only by
// /api/stripe-webhook, from an event Stripe signed. A customer who reaches the success page
// without paying has a nice redirect and no subscription.
const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const stripe = require('../lib/stripe.js');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST.' }); return; }

  if (!stripe.configured()) {
    res.status(503).json({ error: 'Billing is not switched on yet.' });
    return;
  }

  let user;
  try {
    user = await auth.sessionUser(db, auth.readCookie(req));
  } catch (e) {
    console.error('stripe: session lookup failed:', e && e.message);
    res.status(500).json({ error: 'Could not read the session.' });
    return;
  }
  if (!user) { res.status(401).json({ error: 'Sign in first.' }); return; }

  const origin = process.env.APP_ORIGIN
    || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host));
  const action = (req.query && req.query.action) || 'checkout';

  try {
    if (action === 'portal') {
      const out = await stripe.portalUrl(db, user, origin);
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      res.status(200).json(out);
      return;
    }

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    const plan = (b && b.plan) || '';
    if (plan !== 'practice' && plan !== 'agency') {
      res.status(400).json({ error: 'Which plan — practice or agency?' });
      return;
    }
    const out = await stripe.checkoutUrl(db, user, plan, origin);
    if (out.error) { res.status(out.status).json({ error: out.error }); return; }
    res.status(200).json(out);
  } catch (e) {
    // Stripe's own message goes to the log, not to the browser: it can name price ids and
    // account state that the customer has no business seeing.
    console.error('stripe failed:', e && e.message);
    res.status(502).json({ error: 'Could not reach the payment provider just now.' });
  }
};
