// The session itself.
//
//   GET    /api/auth/session   who the cookie belongs to and what they may see, or {user:null}
//   DELETE /api/auth/session   sign out
//
// A signed-out visitor is an ordinary state, not an error, so GET answers 200 either way.
const db = require('../../lib/db.js');
const auth = require('../../lib/auth.js');
const { access } = require('../../lib/access.js');
const stripe = require('../../lib/stripe.js');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    if (!process.env.DATABASE_URL) { res.status(200).json({ user: null, accounts: false }); return; }
    try {
      const user = await auth.sessionUser(db, auth.readCookie(req));
      if (!user) { res.status(200).json({ user: null, accounts: true, billing: stripe.configured() }); return; }
      res.status(200).json({
        accounts: true,
        billing: stripe.configured(),
        user: { email: user.email, plan: user.plan, planStatus: user.plan_status, since: user.created_at, hasBilling: !!user.stripe_customer_id },
        access: access(user),
      });
    } catch (e) {
      console.error('auth/session read failed:', e && e.message);
      res.status(500).json({ error: 'could not read the session' });
    }
    return;
  }

  if (req.method === 'DELETE' || req.method === 'POST') {
    // The row goes first: clearing only the cookie would leave a session id that still resolves.
    try { await auth.endSession(db, auth.readCookie(req)); } catch (e) { console.error('auth/session end failed:', e && e.message); }
    res.setHeader('set-cookie', auth.clearCookieHeader());
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'GET or DELETE.' });
};
