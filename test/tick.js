// The job queue, against a real PostgreSQL running the real schema.
//
// What a scan produces is tested in test/scan-job.js, against the same fixtures the browser
// runs on. This file is about everything around that: claiming, banking, resuming, backing off
// and giving up. Those fail silently in the specific way queues do — the scan still finishes, or
// still doesn't, and nothing says which — so each is asserted against real rows:
//
//   two ticks take two jobs         SKIP LOCKED, or the same scan is run twice, on the
//                                   customer's own search credits, for no extra answer
//   a tick out of time loses a step SAVE after every step, or a killed function loses the scan
//                                   and the next attempt starts from the beginning, forever
//   a failure backs off and stops   or a job that cannot work retries until something notices
//   giving up says so on the scan   a scan that simply never finishes is the worst outcome for
//                                   the person waiting for it
//
// The scan steps are driven through an injected io, as lib/scan-job.js already allows, so this
// file needs no Chromium and no search provider: it is testing the queue, not the scan.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
process.env.SEARCH_KEY_SECRET = crypto.randomBytes(32).toString('hex');
const tick = require(path.join(ROOT, 'lib', 'tick.js'));
const keys = require(path.join(ROOT, 'lib', 'keys.js'));
const auth = require(path.join(ROOT, 'lib', 'auth.js'));
const pageImpl = require(path.join(ROOT, 'lib', 'page.impl.js'));

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

function binDir() {
  for (const p of ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin'])
    if (fs.existsSync(path.join(p, 'initdb'))) return p;
  try { execFileSync('which', ['initdb'], { stdio: 'ignore' }); return ''; } catch (e) { return null; }
}
const BIN = binDir();
if (BIN === null) { console.log('\nno initdb on this machine — skipping the tick tests'); process.exit(0); }
const bin = (n) => BIN ? path.join(BIN, n) : n;

const AS_POSTGRES = process.getuid && process.getuid() === 0;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-tick-'));
const DATA = path.join(DIR, 'data');
const PORT = 59300 + (process.pid % 600);
const sh = (cmd) => execFileSync(AS_POSTGRES ? 'su' : 'sh', AS_POSTGRES ? ['postgres', '-c', cmd] : ['-c', cmd],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// --- a scan with no web in it --------------------------------------------
//
// Enough prose to clear the 300-word competitor floor, parsed by the real parser so the objects
// the job handles are the shape it will see in production.
const PROSE = '<p>' + 'Fleet telematics prose about GPS tracking, ELD compliance and driver safety for fleets. '.repeat(30) + '</p>';
const pageHtml = (name) => '<!doctype html><html><head><title>' + name + ' telematics</title>'
  + '<meta name="description" content="Fleet telematics for ' + name + '"></head><body><main>'
  + '<h1>' + name + ' fleet telematics</h1><h2>Why fleets choose ' + name + '</h2>'
  + '<h3>Pricing</h3>' + PROSE + '</main></body></html>';

function fakeIo(opts) {
  const o = opts || {};
  const seen = { page: 0, serp: 0, render: 0 };
  const io = {
    page: async (q) => {
      seen.page++;
      if (o.pageFails) throw new Error('the internet is on fire');
      return pageImpl.parse(pageHtml(new URL(q.url).hostname), q.url, q.keyword);
    },
    serp: async (q) => {
      seen.serp++;
      return {
        organic: [1, 2, 3, 4].map((i) => ({ position: i, url: 'https://comp' + i + '.com/page', domain: 'comp' + i + '.com' })),
        paa: ['what is telematics'], aiOverview: null, features: []
      };
    },
    render: async () => { seen.render++; return { innerText: 'Fleet telematics for fleets', parsed: null, gate: { state: 'ok' } }; }
  };
  io.seen = seen;
  return io;
}

// Leftover work from an earlier section would be claimed by the next one's ticks, and every
// assertion about "the job" would then be about somebody else's. Sections that reason about a
// single job clear the queue first.
async function clearQueue(client) {
  await client.query(`DELETE FROM scan_jobs WHERE state <> 'done'`);
}

// Drain the queue the way a chain of ticks does, with a step cap so a wedged job fails the test
// rather than hanging it.
async function drain(db, io, cap) {
  let ticks = 0, last = null;
  while (ticks < (cap || 60)) {
    last = await tick.runOnce(db, { io: io });
    ticks++;
    if (!last.claimed) break;
    if (last.state === 'done' || last.state === 'failed') break;
  }
  return { ticks: ticks, last: last };
}

let started = false, client = null, client2 = null;
(async () => {
  try {
    fs.chmodSync(DIR, 0o777);
    if (AS_POSTGRES) execFileSync('chown', ['-R', 'postgres:postgres', DIR]);
    sh(`${bin('initdb')} -D ${DATA} -A trust -U postgres`);
    sh(`${bin('pg_ctl')} -D ${DATA} -o "-k ${DIR} -p ${PORT} -c listen_addresses='127.0.0.1'" -l ${DIR}/log start`);
    started = true;
    execFileSync('sleep', ['1']);
    sh(`${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d postgres -c "CREATE DATABASE cg;"`);
    const m = path.join(DIR, 'm.sql');
    fs.copyFileSync(path.join(ROOT, 'db', '001_init.sql'), m); fs.chmodSync(m, 0o644);
    sh(`${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d cg -v ON_ERROR_STOP=1 -f ${m}`);

    const connect = async () => {
      const c = new Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'cg' });
      await c.connect(); return c;
    };
    const shim = (c) => ({
      query: (t, p) => c.query(t, p),
      tx: async (fn) => {
        await c.query('BEGIN');
        try { const o = await fn(c); await c.query('COMMIT'); return o; }
        catch (e) { try { await c.query('ROLLBACK'); } catch (e2) {} throw e; }
      }
    });
    client = await connect(); client2 = await connect();
    const db = shim(client), db2 = shim(client2);

    // api/tick.js reaches for lib/db.js, which reads DATABASE_URL when its pool is first used.
    // Pointing it at this same database is what lets section 10 exercise the real endpoint.
    process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:' + PORT + '/cg';
    var endpoint = require(path.join(ROOT, 'api', 'tick.js'));

    const mk = async (email, plan) => {
      const { user } = await auth.issueLoginToken(db, email);
      if (plan) await client.query(`UPDATE users SET plan=$2, plan_status='active' WHERE id=$1`, [user.id, plan]);
      return (await client.query('SELECT id, email, plan, plan_status FROM users WHERE id=$1', [user.id])).rows[0];
    };
    const project = async (u, name) => (await client.query(
      `INSERT INTO projects (user_id, name, url, keyword) VALUES ($1,$2,$3,'telematics') RETURNING id`,
      [u.id, name, 'https://' + name + '.com/'])).rows[0].id;

    const alice = await mk('alice@example.com', 'practice');
    const mallory = await mk('mallory@example.com', 'practice');
    const free = await mk('free@example.com', null);
    const aliceProject = await project(alice, 'envue');
    const malloryProject = await project(mallory, 'rival');
    const freeProject = await project(free, 'broke');
    await keys.storeKey(db, alice.id, 'serpapi', 'serpapi_1234567890abcdefABCD');
    await keys.storeKey(db, mallory.id, 'serpapi', 'serpapi_0987654321zyxwvutsZYXW');

    console.log('\n1. Queueing a scan needs a plan, a key, and a project of your own');
    {
      const noPlan = await tick.enqueue(db, free, { projectId: freeProject });
      ok(noPlan.status === 402, 'the free tier is told this is a paid feature rather than queued and ignored', JSON.stringify(noPlan));

      const noKey = await tick.enqueue(db, { id: free.id, plan: 'practice', plan_status: 'active' }, { projectId: freeProject });
      ok(noKey.status === 400 && /key/i.test(noKey.error),
         'a paying account with no saved key is told to add one — there is no pooled credit to fall back on', JSON.stringify(noKey));

      const notHers = await tick.enqueue(db, alice, { projectId: malloryProject });
      ok(notHers.status === 404, 'Alice cannot queue a scan against Mallory\'s project', JSON.stringify(notHers));
      const orphans = (await client.query('SELECT count(*)::int AS n FROM scans WHERE project_id=$1', [malloryProject])).rows[0].n;
      ok(orphans === 0, 'and the refusal left no scan row behind on it', String(orphans));

      const nonsense = await tick.enqueue(db, alice, { projectId: 'not-a-uuid' });
      ok(nonsense.status === 404, 'an id that is not an id reads as "no such project", not as a crash', JSON.stringify(nonsense));

      const none = await tick.enqueue(db, alice, {});
      ok(none.status === 400, 'and a request with no project at all is a bad request');
    }

    console.log('\n2. A queued scan is one scan row and one job, created together');
    var firstScan;
    {
      const out = await tick.enqueue(db, alice, { projectId: aliceProject, depth: 4, nq: 2 });
      ok(!out.error && !!out.scan.id, 'Alice queues a scan', JSON.stringify(out.error));
      firstScan = out.scan.id;

      const s = (await client.query('SELECT * FROM scans WHERE id=$1', [firstScan])).rows[0];
      ok(s.finished_at === null && s.rank_score === null, 'the scan is open, with no score on it yet');
      ok(s.trigger === 'manual', 'and recorded as something a person asked for');

      const j = (await client.query('SELECT * FROM scan_jobs WHERE scan_id=$1', [firstScan])).rows[0];
      ok(!!j && j.state === 'queued' && j.step === 'target_page', 'the job is queued at the first step', JSON.stringify(j && j.step));
      ok(j.payload.config.url === 'https://envue.com/' && j.payload.config.keyword === 'telematics',
         'carrying the project\'s own url and keyword, not whatever the caller sent', JSON.stringify(j.payload.config));
      ok(j.payload.config.depth === 4 && j.payload.config.nq === 2, 'and the depth it was asked for');
    }

    console.log('\n3. Ticks drive it to a finished scan');
    {
      const io = fakeIo();
      const run = await drain(db, io);
      ok(run.last.state === 'done', 'the job reaches done', JSON.stringify(run.last));
      ok(run.last.steps > 8, 'over more steps than there are phases — the fan-out really is spread across them',
         run.last.steps + ' steps');

      const s = (await client.query('SELECT * FROM scans WHERE id=$1', [firstScan])).rows[0];
      ok(s.finished_at !== null, 'the scan is closed');
      ok(Number.isInteger(s.rank_score) && Number.isInteger(s.answer_score),
         'with both scores written to their own columns, where a chart can read them', s.rank_score + '/' + s.answer_score);
      ok(!!s.fingerprint, 'and a page fingerprint for the reuse path');
      ok(s.findings && Array.isArray(s.findings.fixes), 'the full report survived the round trip through jsonb',
         s.findings && typeof s.findings);
      ok(s.error === null, 'and nothing is recorded as having gone wrong');

      const j = (await client.query('SELECT state, locked_by FROM scan_jobs WHERE scan_id=$1', [firstScan])).rows[0];
      ok(j.state === 'done' && j.locked_by === null, 'the job is done and holds no lock', JSON.stringify(j));

      const again = await tick.runOnce(db, { io: io });
      ok(again.claimed === false, 'and an empty queue claims nothing rather than re-running it', JSON.stringify(again));

      const ok2 = await keys.describeKey(db, alice.id);
      ok(!!ok2.lastOkAt, 'a scan that worked stamps the key as working', JSON.stringify(ok2.lastOkAt));
    }

    console.log('\n4. Two ticks at once take two different jobs');
    {
      await clearQueue(client);
      const a = await tick.enqueue(db, alice, { projectId: aliceProject, depth: 4, nq: 1 });
      const b = await tick.enqueue(db, mallory, { projectId: malloryProject, depth: 4, nq: 1 });
      ok(!a.error && !b.error, 'two scans are waiting');

      // Two connections, claiming at the same moment. Without SKIP LOCKED one blocks on the
      // other's row and then takes the same job the moment it is released.
      const [c1, c2] = await Promise.all([tick.claim(db, crypto.randomUUID()), tick.claim(db2, crypto.randomUUID())]);
      ok(c1 && c2, 'both ticks claim something', JSON.stringify([!!c1, !!c2]));
      ok(c1.id !== c2.id, 'and it is not the same job twice — SKIP LOCKED sent them to different rows',
         c1 && c2 ? c1.id + ' vs ' + c2.id : '');
      ok(c1.user_id !== c2.user_id, 'each carrying the owner whose key it will spend');

      // A third tick, arriving while both are still leased, finds nothing rather than
      // overtaking one of them. This is the half SKIP LOCKED alone does not cover: the claim is
      // one auto-committed statement, so by now neither row is locked — only leased.
      const third = await tick.claim(db, crypto.randomUUID());
      ok(third === null, 'a third tick finds nothing to do while both leases are live', JSON.stringify(third && third.id));

      // An expired lease is how a job orphaned by a killed function comes back.
      await client.query(`UPDATE scan_jobs SET locked_at = now() - ($1 || ' seconds')::interval WHERE id=$2`,
        [String(tick.LEASE_S + 60), c1.id]);
      const rescued = await tick.claim(db, crypto.randomUUID());
      ok(rescued && rescued.id === c1.id,
         'once a lease expires the job is claimable again — which is what rescues one whose function was killed',
         JSON.stringify(rescued && rescued.id));
    }

    console.log('\n5. A tick out of time banks what it has instead of losing it');
    {
      await clearQueue(client);
      const queued = await tick.enqueue(db, alice, { projectId: aliceProject, depth: 4, nq: 1 });
      const io = fakeIo();
      // A budget of zero is the extreme case: the claim alone has already spent the tick.
      const none = await tick.runOnce(db, { io: io, budgetMs: 0 });
      ok(none.claimed && none.steps === 1,
         'a tick with no time left still does one step — having claimed the job, it moves it', JSON.stringify(none));
      const after = (await client.query('SELECT state, attempts, run_after <= now() AS due, step FROM scan_jobs WHERE id=$1', [none.id])).rows[0];
      ok(after.state === 'queued' && after.due === true, 'then leaves it queued and due right away', JSON.stringify(after));
      ok(after.step === 'serp_head', 'with the step it finished banked, not thrown away', after.step);
      ok(after.attempts === 0, 'and the attempt refunded — running out of clock is not the job failing', String(after.attempts));

      // Now one step at a time, which is what a function being killed after each step looks
      // like. A budget of a millisecond often expires before the step even starts, so plenty of
      // these ticks do nothing at all — which is itself the case worth surviving.
      let ticks = 0, steps = [];
      while (ticks < 500) {
        const out = await tick.runOnce(db, { io: io, budgetMs: 1 });
        ticks++;
        if (!out.claimed) break;
        steps.push(out.steps);
        if (out.state === 'done') break;
      }
      const j = (await client.query(`SELECT state FROM scan_jobs WHERE scan_id=$1`, [queued.scan.id])).rows[0];
      ok(j.state === 'done', 'a scan run one step per tick still finishes', JSON.stringify(j));
      ok(Math.max.apply(null, steps) === 1, 'and no tick did more than the one step it had time for',
         'worst was ' + Math.max.apply(null, steps));
      ok(ticks >= 8, 'having taken one tick per step to get there', ticks + ' ticks');
      const s5 = (await client.query('SELECT finished_at FROM scans WHERE id=$1', [queued.scan.id])).rows[0];
      ok(s5.finished_at !== null, 'and the answer is the same one a single tick would have written');
    }

    console.log('\n6. A failing step backs off, and eventually gives up out loud');
    {
      await clearQueue(client);
      const q = await tick.enqueue(db, alice, { projectId: aliceProject, depth: 4, nq: 1 });
      const broken = fakeIo({ pageFails: true });

      const first = await tick.runOnce(db, { io: broken });
      ok(first.state === 'queued' && /on fire/.test(first.error), 'the first failure is worth another go', JSON.stringify(first));
      const j1 = (await client.query('SELECT attempts, last_error, run_after > now() AS later FROM scan_jobs WHERE scan_id=$1', [q.scan.id])).rows[0];
      ok(j1.attempts === 1 && j1.later === true, 'it is put back with a wait in front of it', JSON.stringify(j1));
      ok(/on fire/.test(j1.last_error), 'and the reason is kept where an operator can see it');

      const straightAway = await tick.runOnce(db, { io: broken });
      ok(straightAway.claimed === false, 'a job waiting out its backoff is not claimed again immediately');

      // Walk it to the edge rather than sitting through the backoff.
      await client.query(`UPDATE scan_jobs SET attempts = max_attempts - 1, run_after = now() WHERE scan_id=$1`, [q.scan.id]);
      const lastGo = await tick.runOnce(db, { io: broken });
      ok(lastGo.state === 'failed', 'the last attempt gives up rather than retrying forever', JSON.stringify(lastGo));

      const s = (await client.query('SELECT finished_at, error FROM scans WHERE id=$1', [q.scan.id])).rows[0];
      ok(s.finished_at !== null && /on fire/.test(s.error || ''),
         'and the scan is closed with the reason on it — not left open forever', JSON.stringify(s));
      const idle = await tick.runOnce(db, { io: broken });
      ok(idle.claimed === false, 'a failed job is not picked up again');
    }

    console.log('\n7. A job whose key is gone fails at once rather than retrying twenty times');
    {
      await clearQueue(client);
      const q = await tick.enqueue(db, mallory, { projectId: malloryProject, depth: 4, nq: 1 });
      await keys.deleteKey(db, mallory.id);
      const out = await tick.runOnce(db, { io: fakeIo() });
      ok(out.state === 'failed' && /key/i.test(out.error),
         'waiting will not bring the key back, so it does not wait', JSON.stringify(out));
      const s = (await client.query('SELECT error FROM scans WHERE id=$1', [q.scan.id])).rows[0];
      ok(/Settings/.test(s.error || ''), 'and the scan says what to do about it', s.error);
    }

    console.log('\n8. Deleting the project takes its scans and its queued work with it');
    {
      await clearQueue(client);
      const q = await tick.enqueue(db, alice, { projectId: aliceProject, depth: 4, nq: 1 });
      await client.query('DELETE FROM projects WHERE id=$1', [aliceProject]);
      const left = (await client.query(
        `SELECT (SELECT count(*)::int FROM scans WHERE id=$1) AS s,
                (SELECT count(*)::int FROM scan_jobs WHERE scan_id=$1) AS j`, [q.scan.id])).rows[0];
      ok(left.s === 0 && left.j === 0, 'no scan and no job survive the project', JSON.stringify(left));
      const idle = await tick.runOnce(db, { io: fakeIo() });
      ok(idle.claimed === false, 'so no tick goes looking for work that has no owner', JSON.stringify(idle));
    }

    console.log('\n9. The hand-off between ticks cannot run away');
    {
      const was = process.env.TICK_BASE_URL;
      process.env.TICK_BASE_URL = 'http://127.0.0.1:1';   // refuses connections, which is the point
      ok(await tick.nudge(tick.MAX_HOPS, 'secret') === false, 'a chain that has gone on too long stops itself');
      ok(await tick.nudge(0, '') === false, 'and with no secret to present there is nothing to hand off to');
      ok(await tick.nudge(0, 'secret') === true, 'an ordinary hand-off is attempted, and a dead endpoint is not an error',
         'the next tick starting is the only thing that matters here');
      if (was === undefined) delete process.env.TICK_BASE_URL; else process.env.TICK_BASE_URL = was;
    }
    console.log('\n10. The endpoint itself cannot be triggered by a stranger');
    {
      // /api/tick with no cookie is a machine that fetches arbitrary URLs and spends a
      // customer's search credits on request. Everything below is about who may ask it to.
      const call = (req) => new Promise((resolve) => {
        const res = { _code: 0, setHeader() { return res; }, status(c) { res._code = c; return res; },
                      json(b) { resolve({ code: res._code, body: b }); return res; } };
        Promise.resolve(endpoint(req, res)).catch((e) => resolve({ code: 0, body: { thrown: String(e) } }));
      });
      const post = (extra) => Object.assign({ method: 'POST', query: {}, headers: {}, body: {} }, extra);
      const wasSecret = process.env.CRON_SECRET;

      delete process.env.CRON_SECRET;
      const unset = await call(post({ headers: { 'x-cron-secret': 'anything' } }));
      ok(unset.code === 503, 'with no secret configured it refuses to run rather than running for anyone', JSON.stringify(unset));

      process.env.CRON_SECRET = 'sssssssssssssssssssssssssssssss1';
      ok((await call(post())).code === 401, 'presenting nothing is refused');
      ok((await call(post({ headers: { 'x-cron-secret': 'wrong' } }))).code === 401, 'a wrong secret of a different length is refused');
      ok((await call(post({ headers: { 'x-cron-secret': 'sssssssssssssssssssssssssssssss2' } }))).code === 401,
         'and one of the right length that is still wrong');
      ok((await call({ method: 'DELETE', query: {}, headers: {} })).code === 405, 'and a method that is neither is not a way in');

      const asCron = await call({ method: 'GET', query: {}, headers: { authorization: 'Bearer sssssssssssssssssssssssssssssss1' } });
      ok(asCron.code === 200 && asCron.body.claimed === false,
         'Vercel\'s own scheduler, which calls with GET and a bearer token, gets through to an empty queue', JSON.stringify(asCron));

      // The enqueue half is the other way round: a session, never the secret.
      const enq = await call(post({ query: { action: 'enqueue' }, headers: { 'x-cron-secret': 'sssssssssssssssssssssssssssssss1' } }));
      ok(enq.code === 401, 'and the cron secret does not let anyone queue a scan on somebody\'s account', JSON.stringify(enq));
      const enqGet = await call({ method: 'GET', query: { action: 'enqueue' }, headers: {} });
      ok(enqGet.code === 405, 'queueing is a POST, so it cannot be done by following a link');

      if (wasSecret === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = wasSecret;
    }
  } finally {
    try { if (client) await client.end(); } catch (e) {}
    try { if (client2) await client2.end(); } catch (e) {}
    try { if (started) sh(`${bin('pg_ctl')} -D ${DATA} -m immediate stop`); } catch (e) {}
    try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
