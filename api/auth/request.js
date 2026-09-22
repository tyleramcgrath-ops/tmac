// POST /api/auth/request  { email }
//
// Always answers the same way. "We sent a link if that address has an account" is not politeness
// — differing responses turn this endpoint into a way to ask whether a given person is a
// customer, which is a disclosure the customer never agreed to.
const db = require('../db.js');
const auth = require('../auth.impl.js');
const mail = require('../mail.impl.js');

const SAME_ANSWER = { ok: true, message: 'If that address can sign in, a link is on its way.' };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const email = auth.normaliseEmail((body || {}).email);

  // A malformed address is the one case worth answering differently: it is the sender's own
  // typo, not information about anyone else.
  if (!email) { res.status(400).json({ error: 'That does not look like an email address.' }); return; }

  try {
    const { token } = await auth.issueLoginToken(db, email);
    const base = process.env.APP_ORIGIN || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host));
    await mail.sendLoginLink(email, base + '/api/auth/redeem?token=' + encodeURIComponent(token));
  } catch (e) {
    // Log for the operator, say nothing specific to the caller: the reason a send failed is
    // infrastructure detail, and an error that differs by address reintroduces the disclosure
    // the same-answer rule exists to prevent.
    console.error('auth/request failed:', e && e.message);
    res.status(500).json({ error: 'Could not send the link just now. Try again shortly.' });
    return;
  }

  res.status(200).json(SAME_ANSWER);
};
