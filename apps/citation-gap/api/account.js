// /api/account — the account, and the search key it scans with.
//
//   GET    /api/account          who you are, what you are on, and the key's last four digits
//   POST   /api/account          { provider, key }  save a key, replacing any existing one
//   DELETE /api/account          forget the key (and, by trigger, stop the schedules)
//
// There is no pooled search credit anywhere in this product, on any tier: every scan runs on the
// customer's own SerpApi or Serper key. A watched scan takes it from the browser and never sends
// it here. A scheduled scan has no browser, so the key has to be held — and the pricing page
// makes four promises about how, which lib/keys.js keeps. The one this file is responsible for
// is the last: there is no route through here that returns the key. Not decrypted, not masked,
// not to the person who typed it. GET answers with last4, which is a column of its own.
const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const keys = require('../lib/keys.js');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  let user;
  try {
    user = await auth.sessionUser(db, auth.readCookie(req));
  } catch (e) {
    console.error('account: session lookup failed:', e && e.message);
    res.status(500).json({ error: 'Could not read the session.' });
    return;
  }
  if (!user) { res.status(401).json({ error: 'Sign in first.' }); return; }

  const who = { email: user.email, plan: user.plan, planStatus: user.plan_status, renewsAt: user.plan_renews_at };

  try {
    if (req.method === 'GET') {
      res.status(200).json({ user: who, key: await keys.describeKey(db, user.id) });
      return;
    }

    if (req.method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
      b = b || {};
      let out;
      try {
        out = await keys.storeKey(db, user.id, b.provider, b.key);
      } catch (e) {
        // A missing or malformed SEARCH_KEY_SECRET is a deployment fault, not the customer's.
        // Better to refuse the key than to store something we cannot decrypt later.
        if (/SEARCH_KEY_SECRET/.test(String(e && e.message))) {
          console.error('account: cannot store a key:', e.message);
          res.status(503).json({ error: 'Saved keys are not available right now.' });
          return;
        }
        throw e;
      }
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      res.status(200).json({ key: await keys.describeKey(db, user.id) });
      return;
    }

    if (req.method === 'DELETE') {
      const out = await keys.deleteKey(db, user.id);
      res.status(200).json({ deleted: out.deleted, key: null });
      return;
    }

    res.status(405).json({ error: 'GET, POST or DELETE.' });
  } catch (e) {
    console.error('account failed:', e && e.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
