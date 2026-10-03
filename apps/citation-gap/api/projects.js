// /api/projects — list, create, update, archive.
//
// One file serving four methods rather than a file per route, and `?id=` rather than a dynamic
// path segment, because Vercel bills a serverless function per .js file under api/ and the Hobby
// plan allows twelve (build.js counts them and refuses past that). A REST-shaped api/projects/[id].js
// would cost a second slot to express the same thing.
const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const store = require('../lib/store.js');

function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

module.exports = async function handler(req, res) {
  let user;
  try {
    user = await auth.sessionUser(db, auth.readCookie(req));
  } catch (e) {
    console.error('projects: session lookup failed:', e && e.message);
    res.status(500).json({ error: 'Could not read the session.' });
    return;
  }
  if (!user) { res.status(401).json({ error: 'Sign in first.' }); return; }

  const id = (req.query && req.query.id) || null;

  try {
    // Reading stays open to any signed-in account, including one whose subscription lapsed:
    // taking away the history someone paid to build up is not something a failed card should do.
    if (req.method === 'GET') {
      res.status(200).json({ projects: await store.listProjects(db, user.id) });
      return;
    }

    // Writing is what the plan buys.
    if (!store.canPersist(user)) {
      res.status(402).json({
        error: 'Saved projects are part of Practice and Agency. The free tier keeps its history in this browser.',
        plan: user.plan
      });
      return;
    }

    if (req.method === 'POST') {
      const out = await store.createProject(db, user, body(req));
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      res.status(201).json({ project: out.project });
      return;
    }

    if (req.method === 'PATCH') {
      if (!id) { res.status(400).json({ error: 'Which project?' }); return; }
      const out = await store.updateProject(db, user.id, id, body(req));
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      res.status(200).json({ project: out.project });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) { res.status(400).json({ error: 'Which project?' }); return; }
      const out = await store.archiveProject(db, user.id, id);
      if (out.error) { res.status(out.status).json({ error: out.error }); return; }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'GET, POST, PATCH or DELETE.' });
  } catch (e) {
    // A uuid that is not a uuid arrives here as a cast error. It is a malformed request, not a
    // server fault, and saying so beats a 500 that looks like an outage.
    if (/invalid input syntax for type uuid/.test(String(e && e.message))) {
      res.status(404).json({ error: 'No such project.' });
      return;
    }
    console.error('projects failed:', e && e.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
