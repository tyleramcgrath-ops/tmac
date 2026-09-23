// The magic link, both halves.
//
//   POST /api/auth/link          { email }   ask for a link
//   GET  /api/auth/link?token=   (from the email)  redeem it, set the cookie, land in the app
//
// These were two functions until the Hobby plan's twelve-function ceiling started to bite. They
// belong together anyway: they are the two ends of one token's life, and the POST is what writes
// the URL the GET answers — keeping them in one file means the path can never drift between them.
const db = require('../../lib/db.js');
const auth = require('../../lib/auth.js');
const mail = require('../../lib/mail.js');

// Always the same answer. "A link is on its way if that address can sign in" is not politeness —
// differing responses turn this into a way to ask whether a given person is a customer, which is
// a disclosure the customer never agreed to.
const SAME_ANSWER = { ok: true, message: 'If that address can sign in, a link is on its way.' };

const originOf = (req) => process.env.APP_ORIGIN
  || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host));

async function request(req, res) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const email = auth.normaliseEmail((body || {}).email);

  // A malformed address is the one case worth answering differently: it is the sender's own typo,
  // not information about anyone else.
  if (!email) { res.status(400).json({ error: 'That does not look like an email address.' }); return; }

  try {
    const { token } = await auth.issueLoginToken(db, email);
    await mail.sendLoginLink(email, originOf(req) + '/api/auth/link?token=' + encodeURIComponent(token));
  } catch (e) {
    // Log for the operator, say nothing specific to the caller: the reason a send failed is
    // infrastructure detail, and an error that differs by address reintroduces the disclosure
    // the same-answer rule exists to prevent.
    console.error('auth/link request failed:', e && e.message);
    res.status(500).json({ error: 'Could not send the link just now. Try again shortly.' });
    return;
  }
  res.status(200).json(SAME_ANSWER);
}

async function redeem(req, res) {
  const token = (req.query && req.query.token) || '';
  const base = originOf(req);

  let out;
  try {
    out = await auth.redeemLoginToken(db, token);
  } catch (e) {
    console.error('auth/link redeem failed:', e && e.message);
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
}

module.exports = async function handler(req, res) {
  if (req.method === 'POST') return request(req, res);
  // Anything else arrives by someone clicking a link in their mail client, which only ever GETs.
  if (req.method === 'GET') return redeem(req, res);
  res.status(405).json({ error: 'POST to ask for a link, GET to redeem one.' });
};
