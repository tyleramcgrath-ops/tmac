// GET /api/data — the full seismograph, for signed-in accounts on a trial or Pro.
const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const { access } = require('../lib/access.js');
const feed = require('../lib/feed.js');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') { res.status(405).json({ error: 'GET.' }); return; }
  if (!process.env.DATABASE_URL) { res.status(503).json({ error: 'Accounts are not switched on yet.' }); return; }

  let user;
  try { user = await auth.sessionUser(db, auth.readCookie(req)); }
  catch (e) { console.error('data: session lookup failed:', e && e.message); res.status(500).json({ error: 'Could not read the session.' }); return; }
  if (!user) { res.status(401).json({ error: 'Sign in first.' }); return; }
  const a = access(user);
  if (!a.full) { res.status(402).json({ error: 'Your free trial has ended.', access: a }); return; }

  try {
    res.status(200).json(await feed.load());
  } catch (e) {
    console.error('data: feed failed:', e && e.message);
    res.status(502).json({ error: 'The seismograph feed is unreachable just now.' });
  }
};
