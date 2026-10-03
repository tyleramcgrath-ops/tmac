// The session itself.
//
//   GET    /api/auth/session   who the cookie belongs to, or null
//   DELETE /api/auth/session   end it
//
// GET answers 200 with {user:null} rather than 401: the front end asks this on load to decide
// what to render, and a signed-out visitor is an ordinary state, not an error.
const db = require('../../lib/db.js');
const auth = require('../../lib/auth.js');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const user = await auth.sessionUser(db, auth.readCookie(req));
      if (!user) { res.status(200).json({ user: null }); return; }
      res.status(200).json({
        user: {
          email: user.email,
          plan: user.plan,
          planStatus: user.plan_status,
          planRenewsAt: user.plan_renews_at,
          since: user.created_at
        }
      });
    } catch (e) {
      console.error('auth/session read failed:', e && e.message);
      res.status(500).json({ error: 'could not read the session' });
    }
    return;
  }

  // POST is accepted alongside DELETE because a sign-out can be fired from places that cannot
  // send a DELETE — a beacon on page unload, a plain form.
  if (req.method === 'DELETE' || req.method === 'POST') {
    // The row goes first. Clearing only the cookie would leave a session id that still resolves
    // for anyone who copied it, which is the difference between signing out and appearing to.
    try {
      await auth.endSession(db, auth.readCookie(req));
    } catch (e) {
      console.error('auth/session end failed:', e && e.message);
    }
    // Clear the cookie either way: a caller who asked to sign out ends up signed out locally even
    // if the delete failed, and the row is already expired-bounded.
    res.setHeader('set-cookie', auth.clearCookieHeader());
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'GET or DELETE.' });
};
