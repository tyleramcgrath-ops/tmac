// /api/schedules — scans that run while the browser is closed.
//
//   GET    /api/schedules                  every schedule on this account
//   PUT    /api/schedules?project=<id>     { cadence, hourUtc, dayOfWeek }  set or replace one
//   DELETE /api/schedules?project=<id>     stop it
//
// Ownership is enforced inside every query in lib/schedule.js rather than checked here, so there
// is no path through this file that schedules or unschedules somebody else's site.
const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const store = require('../lib/store.js');
const schedule = require('../lib/schedule.js');
const keys = require('../lib/keys.js');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  let user;
  try {
    user = await auth.sessionUser(db, auth.readCookie(req));
  } catch (e) {
    console.error('schedules: session lookup failed:', e && e.message);
    res.status(500).json({ error: 'Could not read the session.' });
    return;
  }
  if (!user) { res.status(401).json({ error: 'Sign in first.' }); return; }

  const q = req.query || {};

  try {
    if (req.method === 'GET') {
      res.status(200).json({ schedules: await schedule.listSchedules(db, user.id) });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      if (!store.canPersist(user)) {
        res.status(402).json({
          error: 'Scheduled scans are part of Practice and Agency.',
          plan: user.plan
        });
        return;
      }
      if (!q.project) { res.status(400).json({ error: 'Which project?' }); return; }

      // A schedule with no key behind it is a promise the product cannot keep: the scan will run
      // with nobody at the keyboard and nothing to authenticate with. Better to refuse now, with
      // the reason, than to enqueue scans that fail at 3am.
      let key = null;
      try { key = await keys.keyForScan(db, user.id); } catch (e) { key = null; }
      if (!key) {
        res.status(400).json({
          error: 'Add your SerpApi or Serper key in Settings first — a scheduled scan runs on your key with nobody at the keyboard.'
        });
        return;
      }

      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
      const out = await schedule.setSchedule(db, user.id, q.project, b || {});
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      res.status(200).json({ schedule: out.schedule });
      return;
    }

    if (req.method === 'DELETE') {
      if (!q.project) { res.status(400).json({ error: 'Which project?' }); return; }
      res.status(200).json(await schedule.removeSchedule(db, user.id, q.project));
      return;
    }

    res.status(405).json({ error: 'GET, PUT or DELETE.' });
  } catch (e) {
    console.error('schedules failed:', e && e.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
