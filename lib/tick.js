// Running a scan while nobody is watching.
//
// The browser drives a watched scan one call at a time, because a scan is roughly 25 calls —
// several of them headless Chromium loads — and no serverless function gets minutes. A scheduled
// scan has no browser to drive it, so something has to play that part on the server. That is
// this file, and the shape it takes is forced by two facts:
//
//   1. A function can be killed at any moment. So the job is saved after EVERY step, not at the
//      end. A tick that dies loses one step's work, never the scan.
//   2. A function has a wall-clock ceiling. So a tick works against a deadline and stops early,
//      leaving a job that is queued and due rather than a job that is half-done and lost.
//
// The scoring is not here. lib/scan-job.js runs the phases and score.js does the arithmetic —
// the same score.js the browser loads — because a scheduled scan and a watched scan disagreeing
// about a number is the exact failure this arrangement exists to prevent.
const job = require('./scan-job.js');
const schedule = require('./schedule.js');
const keys = require('./keys.js');
const store = require('./store.js');
const crypto = require('crypto');

const pageImpl = require('./page.impl.js');
const renderImpl = require('./render.impl.js');
const serpImpl = require('../api/serp.js');

// How long a tick is allowed to keep working before it banks what it has and returns. Vercel's
// ceiling is 60s; this leaves room to write the last step and answer the request.
const BUDGET_MS = Number(process.env.TICK_BUDGET_MS || 45000);
// A tick hands off to the next one by calling this endpoint again. The cap is what stops a
// wedged job from chaining invocations forever.
const MAX_HOPS = 40;
const BACKOFF_CAP_S = 300;
// How long a claim holds a job. Longer than a tick's budget, so a tick still working is
// never overtaken; short enough that a job orphaned by a killed function is picked up again
// while its customer is still waiting.
const LEASE_S = Math.ceil(BUDGET_MS / 1000) + 60;

// --- calling the scan endpoints without the network ----------------------
//
// page, render and serp are already written as (req, res) handlers. The tick calls them directly
// with a res that resolves a promise instead of writing a socket: no HTTP hop, no second cold
// start, no auth to arrange with itself, and — the part that actually matters on the Hobby plan
// — no extra serverless function. Every one of them answers with res.json(), including on
// failure, so resolving on json() catches both.
function invoke(handler, query) {
  return new Promise((resolve, reject) => {
    let answered = false;
    const res = {
      setHeader() { return res; },
      status() { return res; },
      json(body) { if (!answered) { answered = true; resolve(body); } return res; },
      end() { if (!answered) { answered = true; resolve({}); } return res; }
    };
    Promise.resolve(handler({ method: 'GET', query: query, headers: {} }, res))
      .then(() => { if (!answered) reject(new Error('handler finished without answering')); }, reject);
  });
}

// The customer's own key rides on every search. There is no pooled credit to fall back on, by
// design, so a job whose key has been deleted fails loudly rather than quietly spending ours.
function ioFor(searchKey, note) {
  const flag = note || (() => {});
  return {
    page: (q) => invoke(pageImpl, q),
    render: (q) => invoke(renderImpl, q),
    serp: async (q) => {
      const out = await invoke(serpImpl, Object.assign({}, q, { key: searchKey.key, provider: searchKey.provider }));
      // api/serp.js reports provider failures in the body rather than the status, so this is
      // where a rejected key becomes visible.
      if (out && out.error) flag(out.error); else flag(null);
      return out;
    }
  };
}

// --- queueing -------------------------------------------------------------
//
// One scan row and one job row, in one transaction: a scan that exists with no job would sit
// unfinished forever, and a job with no scan has nowhere to put an answer. The ownership check
// is the INSERT ... SELECT, as everywhere else — the rows are only created when the project
// belongs to the caller, in the statement that creates them.
async function enqueue(db, user, input) {
  const projectId = input && input.projectId;
  if (!projectId) return { error: 'Which project?', status: 400 };
  if (!store.canPersist(user)) {
    return { error: 'Scans that run without your browser open are part of Practice and Agency.', status: 402 };
  }
  let key;
  try { key = await keys.keyForScan(db, user.id); }
  catch (e) { return { error: 'Your saved key could not be read. Add it again in Settings.', status: 500 }; }
  if (!key) {
    return { error: 'Add your SerpApi or Serper key in Settings first — a scan that runs without you still runs on your key.', status: 400 };
  }

  const depth = Math.min(Math.max(Number(input.depth) || 10, 3), 20);
  const nq = Math.min(Math.max(Number(input.nq) == null ? 6 : Number(input.nq), 0), 10);
  const trigger = input.trigger === 'schedule' ? 'schedule' : 'manual';

  try {
    return await db.tx(async (c) => {
      const s = await c.query(
        `INSERT INTO scans (project_id, trigger)
         SELECT p.id, $2 FROM projects p
          WHERE p.id = $1 AND p.user_id = $3 AND p.archived_at IS NULL
         RETURNING id, project_id, started_at`,
        [projectId, trigger, user.id]
      );
      if (!s.rows.length) return { error: 'No such project.', status: 404 };
      const scan = s.rows[0];
      const cfg = await c.query('SELECT url, keyword FROM projects WHERE id = $1', [scan.project_id]);
      const p = cfg.rows[0];
      const config = { url: p.url, keyword: p.keyword, depth: depth, nq: nq, brand: input.brand || '' };
      await c.query(
        `INSERT INTO scan_jobs (scan_id, step, cursor, payload)
         VALUES ($1, 'target_page', 0, $2::jsonb)`,
        [scan.id, JSON.stringify({ config: config })]
      );
      return { scan: { id: scan.id, projectId: scan.project_id, startedAt: scan.started_at, state: 'queued' } };
    });
  } catch (e) {
    if (/invalid input syntax for type uuid/.test(String(e && e.message))) {
      return { error: 'No such project.', status: 404 };
    }
    throw e;
  }
}

// --- claiming -------------------------------------------------------------
//
// Two ticks firing at the same moment must take two different jobs, or one scan is run twice on
// the customer's own search credits for no extra answer. Two things arrange that, and both are
// needed:
//
//   FOR UPDATE SKIP LOCKED   keeps two claims racing inside the same instant off the same row.
//                            On its own it is not enough: the claim is one auto-committed
//                            statement, so the lock is gone the moment it returns.
//   the lease                is what holds the row afterwards. A job being worked on is
//                            'running' with a fresh locked_at, and a running job is only
//                            claimable once its lease has expired.
//
// The lease is also the recovery path. A function killed mid-step leaves its job 'running' with
// nobody working it; after LEASE_S it becomes claimable again and resumes from its banked step.
// That is the only thing that rescues such a job, so the lease has to be longer than a tick's
// budget and short enough that a customer is not left waiting.
//
// The attempt is counted at claim time rather than on failure, so a job that hard-kills the
// function every time still walks its way to max_attempts instead of being retried forever.
async function claim(db, lockId) {
  const r = await db.query(
    `UPDATE scan_jobs j
        SET state = 'running', locked_by = $1, locked_at = now(),
            attempts = j.attempts + 1, updated_at = now()
      WHERE j.id = (
        SELECT id FROM scan_jobs
         WHERE state IN ('queued','running')
           AND run_after <= now()
           AND (state = 'queued' OR locked_at IS NULL OR locked_at < now() - ($2 || ' seconds')::interval)
         ORDER BY run_after
         LIMIT 1
         FOR UPDATE SKIP LOCKED)
     RETURNING j.id, j.scan_id, j.step, j.cursor, j.payload, j.attempts, j.max_attempts`,
    [lockId, String(LEASE_S)]
  );
  if (!r.rows.length) return null;
  const j = r.rows[0];
  const who = await db.query(
    `SELECT p.user_id FROM scans s JOIN projects p ON p.id = s.project_id WHERE s.id = $1`,
    [j.scan_id]
  );
  if (!who.rows.length) {
    // Belt and braces. Deleting a project cascades through scans to scan_jobs, so a claimed job
    // should always have an owner — test/tick.js checks that cascade. But a job with nobody to
    // bill and nobody to tell must not be retried until max_attempts either, so if the cascade
    // is ever changed this fails it at once rather than spinning.
    await db.query(`UPDATE scan_jobs SET state='failed', last_error=$2, updated_at=now() WHERE id=$1`,
      [j.id, 'the project this scan belonged to is gone']);
    return null;
  }
  j.user_id = who.rows[0].user_id;
  return j;
}

// Saving after every step is what makes a kill survivable: the worst case is that the step just
// finished is repeated, and every step is safe to repeat — they read the web and write the
// payload, never the other way round.
async function bank(db, id, out) {
  await db.query(
    `UPDATE scan_jobs SET step=$2, cursor=$3, payload=$4::jsonb, updated_at=now() WHERE id=$1`,
    [id, out.step, out.cursor, JSON.stringify(out.payload)]
  );
}

async function finish(db, j, result) {
  await db.tx(async (c) => {
    await c.query(
      `UPDATE scans SET finished_at = now(), rank_score = $2, answer_score = $3,
              fingerprint = $4, findings = $5::jsonb, error = NULL
        WHERE id = $1`,
      [j.scan_id, result.rank, result.answer, result.fingerprint || null, JSON.stringify(result.findings)]
    );
    await c.query(`UPDATE scan_jobs SET state='done', locked_by=NULL, updated_at=now() WHERE id=$1`, [j.id]);
  });
}

// A failure is either worth another go or it is not, and attempts is what decides. Giving up
// writes the reason onto the scan itself, because a scan that simply never finishes is the
// worst thing to hand someone who is waiting for it.
async function stumble(db, j, err) {
  const msg = String((err && err.message) || err).slice(0, 500);
  if (j.attempts >= j.max_attempts) {
    await db.tx(async (c) => {
      await c.query(`UPDATE scan_jobs SET state='failed', last_error=$2, locked_by=NULL, updated_at=now() WHERE id=$1`,
        [j.id, msg]);
      await c.query(`UPDATE scans SET finished_at = now(), error = $2 WHERE id = $1`, [j.scan_id, msg]);
    });
    return { state: 'failed', error: msg };
  }
  const wait = Math.min(Math.pow(2, j.attempts), BACKOFF_CAP_S);
  await db.query(
    `UPDATE scan_jobs SET state='queued', last_error=$2, locked_by=NULL,
            run_after = now() + ($3 || ' seconds')::interval, updated_at=now()
      WHERE id=$1`,
    [j.id, msg, String(wait)]
  );
  return { state: 'queued', error: msg, retryIn: wait };
}

// --- one tick -------------------------------------------------------------
//
// Claim one job, work it until the deadline or until it is done, banking after each step.
async function runOnce(db, opts) {
  const o = opts || {};
  const deadline = Date.now() + (o.budgetMs == null ? BUDGET_MS : o.budgetMs);

  // Due schedules become queued scans here rather than on a cron of their own: Hobby allows one
  // cron a day, which is no use to an hourly schedule, and the tick already chains itself along.
  // A schedule that falls due is picked up by whichever tick runs next.
  let promoted = [];
  if (o.promote !== false) {
    try { promoted = await schedule.promoteDue(db, o.promoteLimit); }
    catch (e) { console.error('tick: promoting schedules failed:', e && e.message); }
  }

  const j = await claim(db, o.lockId || crypto.randomUUID());
  // Work queued a moment ago still counts as work: a tick that promoted a scan and then found
  // nothing to claim must keep the chain alive, or the scan it just queued waits for the cron.
  if (!j) return { claimed: false, more: promoted.length > 0, promoted: promoted.length };

  let key;
  try { key = await keys.keyForScan(db, j.user_id); }
  catch (e) { return Object.assign({ claimed: true, id: j.id }, await stumble(db, j, e)); }
  if (!key) {
    // Deleting the key stops the schedules by trigger; a job already queued when it went is
    // handled here. Not retryable: waiting will not bring the key back.
    j.attempts = j.max_attempts;
    return Object.assign({ claimed: true, id: j.id },
      await stumble(db, j, new Error('no search key on this account — add one in Settings and run the scan again')));
  }

  let keyErr = null;
  // opts.io is the test seam, the same one lib/scan-job.js takes: it lets the queue machinery be
  // driven against a fixture server without a real Chromium or a real search provider. Nothing
  // in production passes it, so the key lookup above still runs either way.
  const io = o.io || ioFor(key, (e) => { keyErr = e || null; });

  let cur = { step: j.step, cursor: j.cursor, payload: j.payload || {} };
  let steps = 0;
  try {
    // At least one step, always. The deadline is measured from the top of the invocation, so a
    // slow claim can eat the whole budget before the first step — and a tick that claims a job,
    // does nothing and puts it back has spent a database round trip to move the queue zero
    // places. Having claimed it, work it once, then check the clock.
    do {
      const out = await job.stepOnce(cur, io, null);
      steps++;
      cur = { step: out.step, cursor: out.cursor, payload: out.payload };
      if (out.done) {
        await finish(db, j, out.result);
        // A scan that reached the end is proof the key worked, so the stamp does not depend on
        // having noticed a particular call succeed.
        await keys.noteKeyResult(db, j.user_id, null).catch(() => {});
        return { claimed: true, id: j.id, scanId: j.scan_id, steps: steps, state: 'done', more: true };
      }
      await bank(db, j.id, out);
    } while (Date.now() < deadline);
  } catch (e) {
    await bank(db, j.id, cur).catch(() => {});
    if (keyErr) await keys.noteKeyResult(db, j.user_id, keyErr).catch(() => {});
    return Object.assign({ claimed: true, id: j.id, scanId: j.scan_id, steps: steps },
      await stumble(db, j, e), { more: true });
  }

  // Out of time with work left. Put it back due immediately and let the next tick take it; the
  // attempt is refunded because running out of clock is not the job failing.
  await db.query(
    `UPDATE scan_jobs SET state='queued', locked_by=NULL, run_after=now(),
            attempts = GREATEST(attempts - 1, 0), updated_at=now() WHERE id=$1`, [j.id]);
  if (keyErr) await keys.noteKeyResult(db, j.user_id, keyErr).catch(() => {});
  return { claimed: true, id: j.id, scanId: j.scan_id, steps: steps, state: 'queued', more: true };
}

// Handing off to the next tick. Vercel's Hobby cron runs once a day, which is no use for a job
// measured in minutes, so a tick that leaves work behind calls the endpoint again itself. The
// hop count is the stop: without it a job that fails instantly would chain invocations until
// something else noticed.
async function nudge(hops, secret) {
  if (!secret) return false;
  if (hops >= MAX_HOPS) return false;
  const base = process.env.TICK_BASE_URL
    || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : '');
  if (!base) return false;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2000);
    // Not awaited to completion — the point is only that the next invocation starts. Aborting
    // the client after two seconds does not cancel the function that is already running.
    await fetch(base.replace(/\/$/, '') + '/api/tick', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cron-secret': secret },
      body: JSON.stringify({ hops: hops + 1 }),
      signal: ctl.signal
    }).catch(() => {});
    clearTimeout(t);
    return true;
  } catch (e) { return false; }
}

module.exports = { enqueue, claim, bank, finish, stumble, runOnce, nudge, invoke, ioFor,
                   BUDGET_MS, MAX_HOPS, BACKOFF_CAP_S, LEASE_S };
