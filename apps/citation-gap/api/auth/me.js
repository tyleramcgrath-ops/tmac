// GET /api/auth/me — who the cookie belongs to, or null.
//
// 200 with {user: null} rather than 401: the front end asks this on load to decide what to
// render, and a signed-out visitor is an ordinary state, not an error.
const db = require('../db.js');
const auth = require('../auth.impl.js');

module.exports = async function handler(req, res) {
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
    console.error('auth/me failed:', e && e.message);
    res.status(500).json({ error: 'could not read the session' });
  }
};
