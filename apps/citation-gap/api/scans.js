// /api/scans — the history behind a project.
//
//   GET  /api/scans?project=<id>[&limit=]   the list, newest first
//   GET  /api/scans?id=<id>                 one scan, including its full findings blob
//   POST /api/scans                         record a finished scan
//
// Ownership is enforced inside every query in lib/store.js rather than checked here, so there is
// no path through this file that reads or writes someone else's rows.
const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const store = require('../lib/store.js');

module.exports = async function handler(req, res) {
  let user;
  try {
    user = await auth.sessionUser(db, auth.readCookie(req));
  } catch (e) {
    console.error('scans: session lookup failed:', e && e.message);
    res.status(500).json({ error: 'Could not read the session.' });
    return;
  }
  if (!user) { res.status(401).json({ error: 'Sign in first.' }); return; }

  const q = req.query || {};

  try {
    if (req.method === 'GET') {
      if (q.id) {
        const scan = await store.getScan(db, user.id, q.id);
        if (!scan) { res.status(404).json({ error: 'No such scan.' }); return; }
        res.status(200).json({ scan });
        return;
      }
      if (!q.project) { res.status(400).json({ error: 'Which project?' }); return; }
      res.status(200).json({ scans: await store.listScans(db, user.id, q.project, q.limit) });
      return;
    }

    if (req.method === 'POST') {
      if (!store.canPersist(user)) {
        res.status(402).json({
          error: 'Saved history is part of Practice and Agency. The free tier keeps its history in this browser.',
          plan: user.plan
        });
        return;
      }
      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
      const out = await store.recordScan(db, user.id, b || {});
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      res.status(201).json({ scan: out.scan });
      return;
    }

    res.status(405).json({ error: 'GET or POST.' });
  } catch (e) {
    if (/invalid input syntax for type uuid/.test(String(e && e.message))) {
      res.status(404).json({ error: 'No such scan.' });
      return;
    }
    console.error('scans failed:', e && e.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
