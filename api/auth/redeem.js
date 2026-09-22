// GET /api/auth/redeem?token=...
//
// Arrived at by clicking a link in an email, so it answers with a redirect and a cookie rather
// than JSON. Every failure lands on the app with a reason in the query string; none of them say
// whether the token ever existed.
const db = require('../db.js');
const auth = require('../auth.impl.js');

module.exports = async function handler(req, res) {
  const token = (req.query && req.query.token) || '';
  const base = process.env.APP_ORIGIN || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host));

  let out;
  try {
    out = await auth.redeemLoginToken(db, token);
  } catch (e) {
    console.error('auth/redeem failed:', e && e.message);
    res.writeHead(302, { location: base + '/?signin=error' });
    res.end();
    return;
  }

  if (!out.ok) {
    // expired and already_used are worth telling apart — one means ask for another link, the
    // other means the link already worked and the session is probably open elsewhere.
    const why = out.reason === 'expired' ? 'expired'
              : out.reason === 'already_used' ? 'used'
              : 'invalid';
    res.writeHead(302, { location: base + '/?signin=' + why });
    res.end();
    return;
  }

  res.writeHead(302, {
    location: base + '/?signin=ok',
    'set-cookie': auth.cookieHeader(out.sessionId)
  });
  res.end();
};
