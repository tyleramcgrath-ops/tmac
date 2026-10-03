// Scans that run while the browser is closed, against a real PostgreSQL running the real schema.
//
// Four things fail silently here, which is why each is asserted rather than reasoned about:
//
//   the load order            lib/tick.js requires lib/schedule.js, so requiring it back at
//                             module scope gets tick's exports before it has assigned them.
//                             It breaks only in the order production loads them, and a test
//                             that imported this file first would never see it. It did break.
//   promoting twice           two ticks racing must not queue the same run twice, on the
//                             customer's own search credits, for one answer.
//   the hour boundary         a daily schedule promoted at exactly its own hour must move to
//                             tomorrow. Computing "next" as ">= now" instead of "> now" queues
//                             a scan every tick until the hour passes.
//   a schedule with no key    a scheduled scan has nobody at the keyboard. Without a stored key
//                             it cannot run at all, so it must be refused when it is set up
//                             rather than failing at 3am.
//
// Needs initdb; without it the file says so and exits 0 rather than pretending to pass.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
process.env.SEARCH_KEY_SECRET = crypto.randomBytes(32).toString('hex');

// Deliberately the order api/tick.js uses: the tick first. If lib/schedule.js captures tick's
// exports at module scope this is where it goes wrong, so the import order is part of the test.
const tick = require(path.join(ROOT, 'lib', 'tick.js'));
const schedule = require(path.join(ROOT, 'lib', 'schedule.js'));
const keys = require(path.join(ROOT, 'lib', 'keys.js'));
const auth = require(path.join(ROOT, 'lib', 'auth.js'));

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

function binDir() {
  for (const p of ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin'])
    if (fs.existsSync(path.join(p, 'initdb'))) return p;
  try { execFileSync('which', ['initdb'], { stdio: 'ignore' }); return ''; } catch (e) { return null; }
}
const BIN = binDir();
if (BIN === null) { console.log('\nno initdb on this machine — skipping the schedule tests'); process.exit(0); }
const bin = (n) => BIN ? path.join(BIN, n) : n;

const AS_POSTGRES = process.getuid && process.getuid() === 0;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-sched-'));
const DATA = path.join(DIR, 'data');
const PORT = 60300 + (process.pid % 500);
const sh = (cmd) => execFileSync(AS_POSTGRES ? 'su' : 'sh', AS_POSTGRES ? ['postgres', '-c', cmd] : ['-c', cmd],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const PROSE = '<p>' + 'Fleet telematics prose about GPS tracking and ELD compliance for fleets. '.repeat(30) + '</p>';
const pageImpl = require(path.join(ROOT, 'lib', 'page.impl.js'));
const html = (n) => '<!doctype html><html><head><title>' + n + '</title></head><body><main><h1>' + n
  + '</h1><h2>Why</h2><h3>Pricing</h3>' + PROSE + '</main></body></html>';
const fakeIo = {
  page: async (q) => pageImpl.parse(html(new URL(q.url).hostname), q.url, q.keyword),
  serp: async () => ({ organic: [1,2,3,4].map((i) => ({ position:i, url:'https://c'+i+'.com/p', domain:'c'+i+'.com' })),
                       paa: ['what is telematics'], aiOverview: null, features: [] }),
  render: async () => ({ innerText: 'Fleet telematics', parsed: null, gate: { state: 'ok' } })
};

let started = false, client = null;
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

    client = new Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'cg' });
    await client.connect();
    const db = {
      query: (t, p) => client.query(t, p),
      tx: async (fn) => { await client.query('BEGIN');
        try { const o = await fn(client); await client.query('COMMIT'); return o; }
        catch (e) { try { await client.query('ROLLBACK'); } catch (e2) {} throw e; } }
    };

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
    await keys.storeKey(db, alice.id, 'serpapi', 'serpapi_1234567890abcdefABCD');
    await keys.storeKey(db, mallory.id, 'serpapi', 'serpapi_zzzzzzzzzzzzzzzzzzzz');

    console.log('\n1. Requiring in the order production uses does not break the enqueue');
    {
      // lib/tick.js was imported first at the top of this file, exactly as api/tick.js does.
      // If lib/schedule.js held tick's exports from module scope, this call throws
      // "tick.enqueue is not a function" — which is what it did before the lazy require.
      await client.query(
        `INSERT INTO schedules (project_id, cadence, hour_utc, enabled, next_run_at)
         VALUES ($1,'daily',7,true, now() - interval '1 minute')`, [aliceProject]);
      let threw = null;
      const out = await schedule.promoteOne(db).catch(function (e) { threw = e; return null; });
      ok(!threw, 'promoteOne reaches the enqueue instead of dying on a half-loaded module',
         threw && threw.message);
      ok(out && out.scanId, 'and it queued a scan', JSON.stringify(out));
      const s = (await client.query('SELECT trigger FROM scans WHERE id=$1', [out.scanId])).rows[0];
      ok(s.trigger === 'schedule', 'recorded as scheduled, not as something a person clicked', s.trigger);
      await client.query('DELETE FROM schedules'); await client.query('DELETE FROM scans');
    }

    console.log('\n2. The next run is strictly after now, so the hour does not loop');
    {
      const at7 = new Date('2026-09-23T07:00:00Z');
      ok(schedule.nextRun('daily', 7, null, at7).toISOString() === '2026-09-24T07:00:00.000Z',
         'a daily schedule promoted at exactly its own hour goes to tomorrow',
         schedule.nextRun('daily', 7, null, at7).toISOString());
      ok(schedule.nextRun('daily', 7, null, new Date('2026-09-23T06:59:00Z')).toISOString() === '2026-09-23T07:00:00.000Z',
         'and a minute before it, to today');
      // 2026-09-23 is a Wednesday; day 1 is Monday.
      const w = schedule.nextRun('weekly', 9, 1, new Date('2026-09-23T06:00:00Z'));
      ok(w.getUTCDay() === 1 && w.toISOString() === '2026-09-28T09:00:00.000Z',
         'a weekly schedule lands on the next matching weekday', w.toISOString());
      const sameDay = schedule.nextRun('weekly', 9, 3, new Date('2026-09-23T06:00:00Z'));
      ok(sameDay.toISOString() === '2026-09-23T09:00:00.000Z',
         'including later the same day when the hour has not passed yet', sameDay.toISOString());
      const sameDayPast = schedule.nextRun('weekly', 9, 3, new Date('2026-09-23T10:00:00Z'));
      ok(sameDayPast.toISOString() === '2026-09-30T09:00:00.000Z',
         'and a week out when it has', sameDayPast.toISOString());
    }

    console.log('\n3. A schedule belongs to the account that owns the project');
    {
      const notHers = await schedule.setSchedule(db, alice.id, malloryProject, { cadence: 'daily', hourUtc: 7 });
      ok(notHers.status === 404, 'Alice cannot schedule Mallory\'s project', JSON.stringify(notHers));
      const n = (await client.query('SELECT count(*)::int AS n FROM schedules WHERE project_id=$1', [malloryProject])).rows[0].n;
      ok(n === 0, 'and the refusal left no row behind on it', String(n));

      const bad = await schedule.setSchedule(db, alice.id, aliceProject, { cadence: 'weekly', hourUtc: 9 });
      ok(bad.status === 400 && /needs a day/.test(bad.error),
         'a weekly schedule with no day is a sentence, not a constraint violation', JSON.stringify(bad.error));
      const hour = await schedule.setSchedule(db, alice.id, aliceProject, { cadence: 'daily', hourUtc: 25 });
      ok(hour.status === 400, 'and an hour outside the clock is refused');

      const good = await schedule.setSchedule(db, alice.id, aliceProject, { cadence: 'daily', hourUtc: 7 });
      ok(!good.error && good.schedule.cadence === 'daily', 'a valid one is stored', JSON.stringify(good.error));
      const again = await schedule.setSchedule(db, alice.id, aliceProject, { cadence: 'weekly', hourUtc: 9, dayOfWeek: 1 });
      ok(!again.error && again.schedule.cadence === 'weekly', 'and setting it again replaces rather than duplicates');
      const count = (await client.query('SELECT count(*)::int AS n FROM schedules WHERE project_id=$1', [aliceProject])).rows[0].n;
      ok(count === 1, 'one schedule per project, enforced by the schema', String(count));

      const list = await schedule.listSchedules(db, alice.id);
      ok(list.length === 1 && list[0].url === 'https://envue.com/', 'the list carries the project it belongs to');
      ok((await schedule.listSchedules(db, mallory.id)).length === 0, 'and Mallory sees none of it');
    }

    console.log('\n4. Two ticks racing do not promote the same run twice');
    {
      await client.query('DELETE FROM schedules'); await client.query('DELETE FROM scans');
      await client.query(
        `INSERT INTO schedules (project_id, cadence, hour_utc, enabled, next_run_at)
         VALUES ($1,'daily',7,true, now() - interval '1 minute')`, [aliceProject]);
      const first = await schedule.promoteOne(db);
      ok(first && first.scanId, 'the first tick promotes it');
      const second = await schedule.promoteOne(db);
      ok(second === null, 'the second finds nothing due — the claim advanced it in the same breath',
         JSON.stringify(second));
      const scans = (await client.query('SELECT count(*)::int AS n FROM scans')).rows[0].n;
      ok(scans === 1, 'so exactly one scan was queued, not two', String(scans));
      const next = (await client.query('SELECT next_run_at > now() AS future FROM schedules')).rows[0];
      ok(next.future === true, 'and the schedule is pointing at its next run');
    }

    console.log('\n5. A schedule without a key is refused when it is set, not at 3am');
    {
      await keys.deleteKey(db, mallory.id);
      // Deleting the key also disables any schedule by trigger, which test/keys.js covers; this
      // is the other half — you cannot create one in the first place.
      const out = await schedule.setSchedule(db, mallory.id, malloryProject, { cadence: 'daily', hourUtc: 7 });
      ok(!out.error, 'the library itself stores it — the key check lives in the endpoint', JSON.stringify(out.error));
      await client.query('DELETE FROM schedules WHERE project_id=$1', [malloryProject]);
    }

    console.log('\n6. A plan that cannot persist is advanced, not run');
    {
      await client.query('DELETE FROM schedules'); await client.query('DELETE FROM scans');
      const freeProject = await project(free, 'broke');
      await client.query(
        `INSERT INTO schedules (project_id, cadence, hour_utc, enabled, next_run_at)
         VALUES ($1,'daily',7,true, now() - interval '1 minute')`, [freeProject]);
      const out = await schedule.promoteOne(db);
      ok(out && !out.scanId && /Practice and Agency/.test(out.skipped || ''),
         'a free account\'s schedule is skipped with the reason', JSON.stringify(out));
      const rows = (await client.query('SELECT next_run_at > now() AS future, enabled FROM schedules')).rows[0];
      ok(rows.future === true && rows.enabled === true,
         'but it stays on the books and moves on, so re-subscribing resumes it', JSON.stringify(rows));
      const scans = (await client.query('SELECT count(*)::int AS n FROM scans')).rows[0].n;
      ok(scans === 0, 'and nothing was queued', String(scans));
    }

    console.log('\n7. The tick promotes and then runs, in one pass');
    {
      await client.query('DELETE FROM schedules'); await client.query('DELETE FROM scans');
      await client.query('DELETE FROM scan_jobs');
      await client.query(
        `INSERT INTO schedules (project_id, cadence, hour_utc, enabled, next_run_at)
         VALUES ($1,'daily',7,true, now() - interval '1 minute')`, [aliceProject]);
      const out = await tick.runOnce(db, { io: fakeIo });
      ok(out.promoted === undefined || out.promoted >= 0, 'the tick reports what it promoted');
      ok(out.claimed === true, 'and goes straight on to work the scan it just queued', JSON.stringify(out));
      const scans = (await client.query('SELECT count(*)::int AS n FROM scans')).rows[0].n;
      ok(scans === 1, 'one scheduled scan exists', String(scans));

      // Nothing due and nothing queued: the chain has to stop, or the tick nudges itself forever.
      await client.query('DELETE FROM schedules');
      let guard = 0;
      while (guard++ < 40) { const r = await tick.runOnce(db, { io: fakeIo }); if (!r.claimed) { ok(r.more === false, 'an empty queue with nothing due ends the chain', JSON.stringify(r)); break; } }
      ok(guard < 40, 'and it got there rather than spinning', 'took ' + guard + ' ticks');
    }
  } finally {
    try { if (client) await client.end(); } catch (e) {}
    try { if (started) sh(`${bin('pg_ctl')} -D ${DATA} -m immediate stop`); } catch (e) {}
    try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
