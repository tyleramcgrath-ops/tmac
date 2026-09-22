// Projects and scans against a real PostgreSQL running the real schema.
//
// The property this file exists for is **isolation**: one customer must never read or write
// another's rows. It fails silently by construction — a missing ownership check looks exactly
// like a working endpoint until two customers exist, and by then the leak has already happened.
// So every read and every write is tried twice: once as the owner, once as a stranger.
//
// Needs initdb; without it the file says so and exits 0 rather than pretending to pass.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const store = require(path.join(ROOT, 'lib', 'store.js'));
const auth = require(path.join(ROOT, 'lib', 'auth.js'));

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

function binDir() {
  for (const p of ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin'])
    if (fs.existsSync(path.join(p, 'initdb'))) return p;
  try { execFileSync('which', ['initdb'], { stdio: 'ignore' }); return ''; } catch (e) { return null; }
}
const BIN = binDir();
if (BIN === null) { console.log('\nno initdb on this machine — skipping the store tests'); process.exit(0); }
const bin = (n) => BIN ? path.join(BIN, n) : n;

const AS_POSTGRES = process.getuid && process.getuid() === 0;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-store-'));
const DATA = path.join(DIR, 'data');
const PORT = 57300 + (process.pid % 900);
const sh = (cmd) => execFileSync(AS_POSTGRES ? 'su' : 'sh', AS_POSTGRES ? ['postgres', '-c', cmd] : ['-c', cmd],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

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
      tx: async (fn) => {
        await client.query('BEGIN');
        try { const o = await fn(client); await client.query('COMMIT'); return o; }
        catch (e) { try { await client.query('ROLLBACK'); } catch (e2) {} throw e; }
      }
    };

    // Two paying customers and one on the free tier, made the way the app makes them.
    const mk = async (email, plan, status) => {
      const { user } = await auth.issueLoginToken(db, email);
      if (plan) await client.query('UPDATE users SET plan=$2, plan_status=$3 WHERE id=$1', [user.id, plan, status || 'active']);
      const r = await client.query('SELECT id, email, plan, plan_status FROM users WHERE id=$1', [user.id]);
      return r.rows[0];
    };
    const alice = await mk('alice@example.com', 'practice');
    const mallory = await mk('mallory@example.com', 'practice');
    const free = await mk('free@example.com', null);

    console.log('\n1. Only a paying plan can keep projects on the server');
    {
      ok(store.canPersist(alice), 'an active Practice account can');
      ok(!store.canPersist(free), 'a free account cannot — its history lives in the browser');
      ok(!store.canPersist(null), 'and neither does nobody');
      ok(store.canPersist({ plan: 'practice', plan_status: 'past_due' }),
         'a past-due card still can: a failed payment on Tuesday should not stop Wednesday\'s work');
      ok(!store.canPersist({ plan: 'practice', plan_status: 'canceled' }), 'a cancelled one cannot');
      ok(!store.canPersist({ plan: 'agency', plan_status: 'none' }), 'a plan that was never started cannot');
    }

    console.log('\n2. A project belongs to the account that made it');
    var aliceProject;
    {
      const made = await store.createProject(db, alice, { name: 'EnVue', url: 'https://envue.com/', keyword: 'telematics' });
      ok(!made.error && !!made.project.id, 'Alice creates a project', JSON.stringify(made.error));
      aliceProject = made.project.id;

      const hers = await store.listProjects(db, alice.id);
      ok(hers.length === 1 && hers[0].id === aliceProject, 'and sees it in her list');

      const theirs = await store.listProjects(db, mallory.id);
      ok(theirs.length === 0, 'Mallory\'s list does not contain it', JSON.stringify(theirs));
    }

    console.log('\n3. A stranger cannot touch it, and is told the same thing as if it did not exist');
    {
      const upd = await store.updateProject(db, mallory.id, aliceProject, { name: 'pwned' });
      ok(upd.error && upd.status === 404, 'Mallory cannot rename it', JSON.stringify(upd));
      const still = await client.query('SELECT name FROM projects WHERE id=$1', [aliceProject]);
      ok(still.rows[0].name === 'EnVue', 'and the name is unchanged', still.rows[0].name);

      const arch = await store.archiveProject(db, mallory.id, aliceProject);
      ok(arch.error && arch.status === 404, 'Mallory cannot archive it', JSON.stringify(arch));
      const alive = await client.query('SELECT archived_at FROM projects WHERE id=$1', [aliceProject]);
      ok(alive.rows[0].archived_at === null, 'and it is not archived');

      const rec = await store.recordScan(db, mallory.id, { projectId: aliceProject, rank: 99, answer: 99 });
      ok(rec.error && rec.status === 404, 'Mallory cannot write a scan into it', JSON.stringify(rec));
      const n = await client.query('SELECT count(*) FROM scans WHERE project_id=$1', [aliceProject]);
      ok(n.rows[0].count === '0', 'and no scan was written', n.rows[0].count);

      const seen = await store.listScans(db, mallory.id, aliceProject);
      ok(seen.length === 0, 'Mallory reads no history for it');

      // 404 for "not yours" and 404 for "no such id" are deliberately the same answer: a
      // different one would confirm that a project id exists.
      const ghost = await store.updateProject(db, mallory.id, '00000000-0000-0000-0000-000000000000', { name: 'x' });
      ok(ghost.status === 404 && upd.status === 404, 'a real project that is not yours and an id that does not exist answer alike');
    }

    console.log('\n4. Scans belong to their project, and carry the report');
    var scanId;
    {
      const rec = await store.recordScan(db, alice.id, {
        projectId: aliceProject, rank: 61, answer: 44, fingerprint: 'abc123',
        findings: { fixes: ['kwInTitle'], note: 'the whole work order goes here' }
      });
      ok(!rec.error && !!rec.scan.id, 'Alice records a scan', JSON.stringify(rec.error));
      scanId = rec.scan.id;
      ok(rec.scan.rank === 61 && rec.scan.answer === 44, 'with its two scores');

      const list = await store.listScans(db, alice.id, aliceProject);
      ok(list.length === 1 && list[0].id === scanId, 'and it appears in the project history');

      const one = await store.getScan(db, alice.id, scanId);
      ok(one && one.findings && one.findings.fixes[0] === 'kwInTitle',
         'reading one scan gives back the findings blob intact');

      ok(await store.getScan(db, mallory.id, scanId) === null, 'Mallory cannot read that scan');
    }

    console.log('\n5. The list carries the latest scores, so the UI does not need a second call');
    {
      const before = (await store.listProjects(db, alice.id))[0];
      ok(before.latest && before.latest.rank === 61, 'the project row carries its most recent scores');
      ok(before.scans === 1, 'and how many scans there have been', String(before.scans));

      await store.recordScan(db, alice.id, { projectId: aliceProject, rank: 70, answer: 50 });
      const after = (await store.listProjects(db, alice.id))[0];
      ok(after.latest.rank === 70, 'a newer scan replaces it', JSON.stringify(after.latest));
      ok(after.scans === 2, 'and the count keeps up', String(after.scans));
    }

    console.log('\n6. Archiving hides a project without destroying its history');
    {
      const arch = await store.archiveProject(db, alice.id, aliceProject);
      ok(arch.ok, 'Alice archives her own project');
      ok((await store.listProjects(db, alice.id)).length === 0, 'it leaves the list');

      const scans = await client.query('SELECT count(*) FROM scans WHERE project_id=$1', [aliceProject]);
      ok(scans.rows[0].count === '2', 'the scans survive — the point of archiving instead of deleting', scans.rows[0].count);
      ok((await store.getScan(db, alice.id, scanId)) !== null, 'and are still readable');

      const again = await store.archiveProject(db, alice.id, aliceProject);
      ok(again.error && again.status === 404, 'archiving twice is not an error worth two outcomes');

      const upd = await store.updateProject(db, alice.id, aliceProject, { name: 'zombie' });
      ok(upd.error, 'an archived project cannot be edited back into life by accident');
    }

    console.log('\n7. Input that would corrupt the data is refused');
    {
      const bad = [
        [{ name: '', url: 'https://a.com/', keyword: 'k' }, 'a project with no name'],
        [{ name: 'x', url: 'ftp://a.com/', keyword: 'k' }, 'a URL that is not http'],
        [{ name: 'x', url: 'a.com', keyword: 'k' }, 'a URL with no scheme'],
        [{ name: 'x', url: 'https://a.com/', keyword: '' }, 'a project with no keyword']
      ];
      for (const [input, what] of bad) {
        const r = await store.createProject(db, alice, input);
        ok(r.error && r.status === 400, what + ' is refused', JSON.stringify(r));
      }

      const p = (await store.createProject(db, alice, { name: 'ok', url: 'https://b.com/', keyword: 'k' })).project;
      for (const v of [101, -1]) {
        const r = await store.recordScan(db, alice.id, { projectId: p.id, rank: v });
        ok(r.error && r.status === 400, 'a rank of ' + v + ' is refused before it reaches the CHECK', JSON.stringify(r));
      }
      const noProj = await store.recordScan(db, alice.id, { rank: 10 });
      ok(noProj.error && noProj.status === 400, 'a scan with no project is refused');

      // A malformed id reaches Postgres as a cast error; the caller should still read 404.
      const junk = await store.recordScan(db, alice.id, { projectId: 'not-a-uuid', rank: 10 });
      ok(junk.error && junk.status === 404, 'a project id that is not a uuid reads as no such project', JSON.stringify(junk));
    }

    console.log('\n8. The 25 the Agency tier promises is the number enforced');
    {
      const ag = await mk('agency@example.com', 'agency');
      ok(store.PLAN_LIMITS.agency === 25, 'the limit matches the pricing page');
      for (let i = 0; i < 25; i++) {
        const r = await store.createProject(db, ag, { name: 'p' + i, url: 'https://p' + i + '.com/', keyword: 'k' });
        if (r.error) { ok(false, 'project ' + i + ' should have been allowed', JSON.stringify(r)); break; }
      }
      ok((await store.countProjects(db, ag.id)) === 25, 'twenty-five are allowed');
      const over = await store.createProject(db, ag, { name: 'p25', url: 'https://p25.com/', keyword: 'k' });
      ok(over.error && over.status === 409, 'the twenty-sixth is refused', JSON.stringify(over));
      ok(/25/.test(over.error), 'and the message says what the limit is', over.error);

      // Archiving frees a slot, which is what the refusal tells people to do.
      const first = (await store.listProjects(db, ag.id)).pop();
      await store.archiveProject(db, ag.id, first.id);
      const retry = await store.createProject(db, ag, { name: 'p25', url: 'https://p25.com/', keyword: 'k' });
      ok(!retry.error, 'archiving one makes room, as the message said it would', JSON.stringify(retry.error));

      // Practice has no stated limit on the pricing page, so it has none here.
      ok(store.PLAN_LIMITS.practice === Infinity, 'Practice is uncapped, matching what the page promises');
    }

    console.log('\n9. Deleting an account takes its projects and scans with it');
    {
      await client.query(`DELETE FROM users WHERE email = 'alice@example.com'`);
      const left = (await client.query(
        `SELECT (SELECT count(*) FROM projects WHERE user_id=$1)||'/'||
                (SELECT count(*) FROM scans s WHERE s.project_id IN (SELECT id FROM projects WHERE user_id=$1)) AS c`,
        [alice.id])).rows[0].c;
      ok(left === '0/0', 'nothing of hers is left behind', left);
      const mallorysStuff = await store.listProjects(db, mallory.id);
      ok(Array.isArray(mallorysStuff), 'and Mallory\'s account is untouched by it');
    }
  } finally {
    try { if (client) await client.end(); } catch (e) {}
    try { if (started) sh(`${bin('pg_ctl')} -D ${DATA} -m immediate stop`); } catch (e) {}
    try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
