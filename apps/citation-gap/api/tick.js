// /api/tick — the thing that moves a scan along when no browser is doing it.
//
//   POST /api/tick?action=enqueue   { projectId }   queue a scan  (session cookie)
//   POST /api/tick                  { hops }        do a tick     (CRON_SECRET)
//   GET  /api/tick                                  do a tick     (CRON_SECRET, Vercel's cron)
//
// Two callers with nothing in common share one endpoint because Vercel's Hobby plan allows
// twelve serverless functions per deployment and this is worth one of them, not two. They are
// kept apart by the only thing that matters: the enqueue path needs a signed-in user and can
// never run a job, and the run path needs the cron secret and can never be reached by a cookie.
//
// The run path is guarded because it is a machine that will fetch arbitrary URLs and spend a
// customer's search credits on request. Without CRON_SECRET set there is no safe way to answer
// it, so it answers 503 rather than opening.
const crypto = require('crypto');
const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const tick = require('../lib/tick.js');

// Constant-time, and length-safe: comparing buffers of different lengths throws rather than
// returning false, which would leak the length through the error.
function secretOk(given) {
  const want = process.env.CRON_SECRET;
  if (!want || !given) return false;
  const a = Buffer.from(String(given)), b = Buffer.from(want);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function presentedSecret(req) {
  const h = req.headers || {};
  const bearer = /^Bearer\s+(.+)$/i.exec(h.authorization || '');
  return h['x-cron-secret'] || (bearer ? bearer[1] : '');
}

function bodyOf(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // Vercel's scheduler calls with GET and a bearer token; the hand-off between ticks and the
  // enqueue path both use POST. Anything else is neither.
  if (req.method !== 'POST' && req.method !== 'GET') { res.status(405).json({ error: 'POST.' }); return; }

  const q = req.query || {};
  const body = req.method === 'POST' ? bodyOf(req) : {};

  if (q.action === 'enqueue') {
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST.' }); return; }
    let user;
    try { user = await auth.sessionUser(db, auth.readCookie(req)); }
    catch (e) {
      console.error('tick: session lookup failed:', e && e.message);
      res.status(500).json({ error: 'Could not read the session.' });
      return;
    }
    if (!user) { res.status(401).json({ error: 'Sign in first.' }); return; }
    try {
      const out = await tick.enqueue(db, user, body);
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      // Kick the queue rather than waiting for the next cron: the customer is looking at a
      // spinner. If there is no secret to kick with, the scan still runs on the next tick.
      await tick.nudge(0, process.env.CRON_SECRET);
      res.status(202).json(out);
    } catch (e) {
      console.error('tick: enqueue failed:', e && e.message);
      res.status(500).json({ error: 'Could not queue the scan.' });
    }
    return;
  }

  if (!process.env.CRON_SECRET) {
    res.status(503).json({ error: 'The job runner is not configured.' });
    return;
  }
  if (!secretOk(presentedSecret(req))) { res.status(401).json({ error: 'No.' }); return; }

  const hops = Number(body.hops) || 0;
  try {
    const out = await tick.runOnce(db, {});
    // An empty queue ends the chain; anything else keeps it moving. The hop cap inside nudge()
    // is what stops a job that fails instantly from chaining invocations indefinitely.
    if (out.more) out.handedOff = await tick.nudge(hops, process.env.CRON_SECRET);
    res.status(200).json(Object.assign({ hops: hops }, out));
  } catch (e) {
    console.error('tick failed:', e && e.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
