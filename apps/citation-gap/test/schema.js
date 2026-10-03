// The schema gets a test for the same reason the deploy guard does: the two things it has to
// get right are things that fail silently. A claim query without SKIP LOCKED does not error —
// two ticks quietly do the same work twice. A key deletion that leaves a schedule enabled does
// not error either — it goes on running on a credential the customer believes they revoked.
//
// So this stands up a real PostgreSQL cluster in a temp directory, applies db/001_init.sql to
// it, and asserts against the actual database rather than against a description of one. It
// needs initdb on PATH; without it the file says so and exits 0 rather than pretending to pass.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (cond, name, extra) => { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

function binDir() {
  for (const p of ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin']) {
    if (fs.existsSync(path.join(p, 'initdb'))) return p;
  }
  try { execFileSync('which', ['initdb'], { stdio: 'ignore' }); return ''; } catch (e) { return null; }
}
const BIN = binDir();
if (BIN === null) {
  console.log('\nno initdb on this machine — skipping the schema tests (they need a real PostgreSQL)');
  process.exit(0);
}
const bin = (n) => BIN ? path.join(BIN, n) : n;

// initdb refuses to run as root, so when we are root the cluster runs as the postgres user and
// everything it touches has to be readable by them.
const AS_POSTGRES = process.getuid && process.getuid() === 0;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-schema-'));
const DATA = path.join(DIR, 'data');
const PORT = 55500 + (process.pid % 900);

function sh(cmd) {
  const full = AS_POSTGRES ? ['su', 'postgres', '-c', cmd] : ['sh', '-c', cmd];
  return execFileSync(full[0], full.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function psql(sql, db) {
  const f = path.join(DIR, 'q' + Math.random().toString(36).slice(2) + '.sql');
  fs.writeFileSync(f, sql); fs.chmodSync(f, 0o644);
  try {
    return { out: sh(`${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d ${db || 'cg'} -At -v ON_ERROR_STOP=1 -f ${f}`), code: 0 };
  } catch (e) {
    return { out: (e.stdout || '') + (e.stderr || ''), code: e.status || 1 };
  }
}
// Does this statement get rejected? Used for every CHECK constraint below: a constraint that is
// present but not enforced looks identical to one that works until bad data arrives.
const rejects = (sql) => psql('BEGIN; ' + sql + ' ROLLBACK;').code !== 0;

let started = false;
try {
  fs.chmodSync(DIR, 0o777);
  if (AS_POSTGRES) execFileSync('chown', ['-R', 'postgres:postgres', DIR]);
  sh(`${bin('initdb')} -D ${DATA} -A trust -U postgres`);
  sh(`${bin('pg_ctl')} -D ${DATA} -o "-k ${DIR} -p ${PORT} -c listen_addresses=''" -l ${DIR}/log start`);
  started = true;
  execFileSync('sleep', ['1']);
  sh(`${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d postgres -c "CREATE DATABASE cg;"`);

  console.log('\n1. The migration applies to a real PostgreSQL');
  {
    const src = path.join(DIR, 'm.sql');
    fs.copyFileSync(path.join(ROOT, 'db', '001_init.sql'), src); fs.chmodSync(src, 0o644);
    let code = 0, out = '';
    try { out = sh(`${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d cg -v ON_ERROR_STOP=1 -f ${src}`); }
    catch (e) { code = 1; out = (e.stdout || '') + (e.stderr || ''); }
    ok(code === 0, 'db/001_init.sql applies with ON_ERROR_STOP', out.slice(0, 400));
    const t = psql("SELECT count(*) FROM information_schema.tables WHERE table_schema='public';");
    ok(t.out.trim() === '9', 'it creates the nine tables', t.out.trim());
  }

  console.log('\n2. Two ticks firing at once take two different jobs');
  {
    psql(`INSERT INTO users (id,email) VALUES ('11111111-1111-1111-1111-111111111111','a@example.com');
          INSERT INTO projects (id,user_id,name,url,keyword) VALUES
            ('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','p1','https://a.com/','k'),
            ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','p2','https://b.com/','k');
          INSERT INTO scans (id,project_id,trigger) VALUES
            ('33333333-3333-3333-3333-333333333331','22222222-2222-2222-2222-222222222221','schedule'),
            ('33333333-3333-3333-3333-333333333332','22222222-2222-2222-2222-222222222222','schedule');
          INSERT INTO scan_jobs (scan_id) VALUES
            ('33333333-3333-3333-3333-333333333331'),('33333333-3333-3333-3333-333333333332');`);

    const CLAIM = `UPDATE scan_jobs SET locked_by=gen_random_uuid(), locked_at=now(), attempts=attempts+1, state='running'
      WHERE id = (SELECT id FROM scan_jobs
                   WHERE state IN ('queued','running') AND run_after <= now()
                     AND (locked_at IS NULL OR locked_at < now() - interval '2 minutes')
                   ORDER BY run_after FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING id;`;
    const held = path.join(DIR, 'hold.sql');
    fs.writeFileSync(held, `BEGIN;\n${CLAIM}\nSELECT pg_sleep(3);\nCOMMIT;\n`); fs.chmodSync(held, 0o644);

    // One claimer holds its row inside an open transaction while the other runs. Its output goes
    // to a file rather than a pipe: the synchronous sleeps below block Node's event loop, so a
    // piped stdout would not drain until after we had already read it.
    const aFile = path.join(DIR, 'a.out');
    const cmd = `${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d cg -At -f ${held} > ${aFile} 2>&1`;
    const args = AS_POSTGRES ? ['postgres', '-c', cmd] : ['-c', cmd];
    spawn(AS_POSTGRES ? 'su' : 'sh', args, { stdio: 'ignore' });
    execFileSync('sleep', ['1']);            // let A take its row and still be holding it
    const b = psql(`BEGIN; ${CLAIM} COMMIT;`);
    execFileSync('sleep', ['4']);            // A's transaction outlives B's by design

    const idOf = (s) => (String(s).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/) || [])[0];
    const aOut = fs.existsSync(aFile) ? fs.readFileSync(aFile, 'utf8') : '';
    const aId = idOf(aOut), bId = idOf(b.out);
    ok(!!aId, 'the first claimer takes a job', aOut.slice(0, 200));
    ok(!!bId, 'the second claimer takes one too instead of blocking on the first', b.out.slice(0, 200));
    ok(aId && bId && aId !== bId, 'and it is a different job — SKIP LOCKED, not a queue of one', aId + ' vs ' + bId);
  }

  console.log('\n3. A claimer with nothing available gets nothing, and stale locks come back');
  {
    // Both jobs are now locked and fresh, so a third claimer must come away empty rather than
    // wait: a tick that blocks burns its 60 seconds holding a lock it cannot use.
    const c = psql(`UPDATE scan_jobs SET locked_by=gen_random_uuid(), locked_at=now()
      WHERE id = (SELECT id FROM scan_jobs
                   WHERE state IN ('queued','running') AND run_after <= now()
                     AND (locked_at IS NULL OR locked_at < now() - interval '2 minutes')
                   ORDER BY run_after FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id;`);
    ok(/UPDATE 0/.test(c.out) || !/[0-9a-f]{8}-/.test(c.out), 'nothing due means nothing claimed', c.out.slice(0, 200));

    // An invocation that died mid-step leaves its lock behind; the staleness window is what
    // stops that job being stranded forever.
    psql(`UPDATE scan_jobs SET locked_at = now() - interval '5 minutes';`);
    const d = psql(`UPDATE scan_jobs SET locked_by=gen_random_uuid(), locked_at=now()
      WHERE id = (SELECT id FROM scan_jobs
                   WHERE state IN ('queued','running') AND run_after <= now()
                     AND (locked_at IS NULL OR locked_at < now() - interval '2 minutes')
                   ORDER BY run_after FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id;`);
    ok(/[0-9a-f]{8}-/.test(d.out), 'a job whose invocation died is reclaimed after the staleness window', d.out.slice(0, 200));
  }

  console.log('\n4. Deleting the stored key stops the schedules, as the FAQ promises');
  {
    psql(`INSERT INTO search_keys (user_id,provider,ciphertext,iv,tag,last4)
          VALUES ('11111111-1111-1111-1111-111111111111','serpapi','\\x00'::bytea,
                  '\\x000000000000000000000000'::bytea,'\\x00000000000000000000000000000000'::bytea,'ab12');
          INSERT INTO schedules (project_id,cadence,day_of_week,hour_utc,next_run_at)
          VALUES ('22222222-2222-2222-2222-222222222221','weekly',1,3,now());`);
    const before = psql(`SELECT count(*) FROM schedules WHERE enabled;`).out.trim();
    ok(before === '1', 'a schedule is enabled to begin with', before);
    psql(`DELETE FROM search_keys WHERE user_id='11111111-1111-1111-1111-111111111111';`);
    const after = psql(`SELECT count(*) FROM schedules WHERE enabled;`).out.trim();
    ok(after === '0', 'deleting the key disables it, enforced by the database not by remembering to', after);
    ok(psql(`SELECT count(*) FROM projects;`).out.trim() === '2',
       'the projects and their history survive — the key goes, the work does not');
  }

  console.log('\n5. The columns that carry promises reject what would break them');
  {
    const u = "'11111111-1111-1111-1111-111111111111'";
    ok(rejects(`INSERT INTO users (email) VALUES ('A@Example.com');`),
       'email is case-insensitively unique, so one person cannot become two accounts');
    ok(rejects(`INSERT INTO users (email,plan) VALUES ('x@y.com','enterprise');`),
       'an unknown plan is rejected rather than stored and puzzled over later');
    ok(rejects(`INSERT INTO search_keys (user_id,provider,ciphertext,iv,tag,last4) VALUES (${u},'serpapi','\\x00','\\x0000','\\x00000000000000000000000000000000','ab12');`),
       'a GCM iv that is not 12 bytes is rejected');
    ok(rejects(`INSERT INTO search_keys (user_id,provider,ciphertext,iv,tag,last4) VALUES (${u},'serpapi','\\x00','\\x000000000000000000000000','\\x0000','ab12');`),
       'a GCM tag that is not 16 bytes is rejected');
    ok(rejects(`INSERT INTO search_keys (user_id,provider,ciphertext,iv,tag,last4) VALUES (${u},'serpapi','\\x00','\\x000000000000000000000000','\\x00000000000000000000000000000000','abcdef');`),
       'last4 is exactly four characters — it is the only part of the key anyone sees');
    ok(rejects(`INSERT INTO scan_jobs (scan_id,step) VALUES ('33333333-3333-3333-3333-333333333331','invent_something');`),
       'a step outside the eight phases is rejected, so a typo cannot strand a job');
    ok(rejects(`INSERT INTO scan_jobs (scan_id,cursor) VALUES ('33333333-3333-3333-3333-333333333331',-1);`),
       'a negative cursor is rejected');
    ok(rejects(`INSERT INTO schedules (project_id,cadence,hour_utc,next_run_at) VALUES ('22222222-2222-2222-2222-222222222222','weekly',3,now());`),
       'a weekly schedule with no day is not a schedule');
    ok(rejects(`INSERT INTO scans (project_id,trigger,rank_score) VALUES ('22222222-2222-2222-2222-222222222221','manual',101);`),
       'a score outside 0-100 is rejected');
    ok(rejects(`INSERT INTO scan_jobs (scan_id) VALUES ('33333333-3333-3333-3333-333333333331');`),
       'a scan cannot have two jobs racing each other');
  }

  console.log('\n6. Deleting a user leaves nothing of theirs behind');
  {
    psql(`DELETE FROM users WHERE id='11111111-1111-1111-1111-111111111111';`);
    const counts = psql(`SELECT (SELECT count(*) FROM projects)||'/'||(SELECT count(*) FROM scans)||'/'||
                                (SELECT count(*) FROM scan_jobs)||'/'||(SELECT count(*) FROM schedules)||'/'||
                                (SELECT count(*) FROM search_keys);`).out.trim();
    ok(counts === '0/0/0/0/0', 'projects, scans, jobs, schedules and keys all go with the account', counts);
  }
} finally {
  try { if (started) sh(`${bin('pg_ctl')} -D ${DATA} -m immediate stop`); } catch (e) {}
  try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {}
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
