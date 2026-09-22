// POST /api/auth/logout — delete the session row, then clear the cookie.
//
// The row goes first. Clearing only the cookie would leave a session id that still resolves for
// anyone who copied it, which is the difference between signing out and appearing to.
const db = require('../../lib/db.js');
const auth = require('../../lib/auth.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  try {
    await auth.endSession(db, auth.readCookie(req));
  } catch (e) {
    console.error('auth/logout failed:', e && e.message);
  }
  // Clear the cookie either way: a caller who asked to sign out ends up signed out locally even
  // if the delete failed, and the row is already expired-bounded.
  res.setHeader('set-cookie', auth.clearCookieHeader());
  res.status(200).json({ ok: true });
};
