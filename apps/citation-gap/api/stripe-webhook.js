// /api/stripe-webhook — the only thing in this codebase allowed to write a plan.
//
// Everything else about billing is cosmetic. A browser can be redirected to ?billing=done by
// anyone; this endpoint is the one place where what Stripe says is checked against a signature
// Stripe computed, so this is where the account's plan actually changes.
//
// bodyParser is off because the signature is over the exact bytes Stripe sent. Re-serialising a
// parsed object changes key order and whitespace, and the signature then never matches — which
// fails closed, but fails on every single event, so it is worth being explicit about.
const db = require('../lib/db.js');
const stripe = require('../lib/stripe.js');

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST.' }); return; }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Answering 503 rather than 200: a webhook that silently accepts unverifiable events while
    // unconfigured is worse than one that is plainly off, because Stripe stops retrying.
    res.status(503).json({ error: 'Billing is not switched on yet.' });
    return;
  }

  let body;
  try { body = await rawBody(req); }
  catch (e) { res.status(400).json({ error: 'Could not read the body.' }); return; }

  const check = stripe.verify(body, req.headers['stripe-signature'], secret);
  if (!check.ok) {
    // Deliberately terse to the caller and specific to the log. An unsigned POST here would be a
    // way to grant yourself a plan, so it is worth seeing in the log why one was refused.
    console.error('stripe-webhook rejected:', check.reason);
    res.status(400).json({ error: 'Bad signature.' });
    return;
  }

  try {
    const out = await stripe.applyEvent(db, check.event);
    // 200 tells Stripe to stop retrying. Anything it could not act on is still a 200 — an
    // unrecognised event type is not a failure, and retrying it forever helps nobody.
    res.status(200).json({ received: true, ...out });
  } catch (e) {
    // A 500 here is correct: Stripe retries, and a database that was briefly down should not
    // cost a customer the plan they paid for.
    console.error('stripe-webhook failed on', check.event && check.event.type, '-', e && e.message);
    res.status(500).json({ error: 'Could not record that event.' });
  }
};

// Order matters here and it bit once already: setting module.exports.config and *then* assigning
// module.exports replaces the object the config was attached to, so the flag silently vanishes
// and Vercel parses the body after all. Export the handler first, decorate it second.
module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
