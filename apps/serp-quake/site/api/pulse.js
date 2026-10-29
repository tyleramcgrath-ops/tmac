// GET /api/pulse — the public needle: current magnitude, Richter's mood, a week
// of the 24h trace. No account needed; this is what the homepage shows live.
const feed = require('../lib/feed.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'GET.' }); return; }
  try {
    const p = feed.pulse(await feed.load());
    res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600');
    res.status(200).json(p);
  } catch (e) {
    console.error('pulse: feed failed:', e && e.message);
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'The seismograph feed is unreachable just now.' });
  }
};
