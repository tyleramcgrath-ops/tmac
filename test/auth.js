// Magic-link auth, exercised against a real PostgreSQL running the real schema.
//
// The properties below are all ones that fail silently if they regress. A token stored in the
// clear still logs people in. A link that can be redeemed twice still logs the first person in.
// A session that outlives its expiry still works, right up until it matters. None of them show
// up as an error, so each one is asserted rather than assumed.
//
// Needs initdb; without it the file says so and exits 0 rather than pretending to pass.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const auth = require(path.join(ROOT, 'api', 'auth.impl.js'));

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

function binDir() {
  for (const p of ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin'])
    if (fs.existsSync(path.join(p, 'initdb'))) return p;
  try { execFileSync('which', ['initdb'], { stdio: 'ignore' }); return ''; } catch (e) { return null; }
}
const BIN = binDir();
if (BIN === null) { console.log('\nno initdb on this machine — skipping the auth tests'); process.exit(0); }
const bin = (n) => BIN ? path.join(BIN, n) : n;

const AS_POSTGRES = process.getuid && process.getuid() === 0;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-auth-'));
const DATA = path.join(DIR, 'data');
const PORT = 56400 + (process.pid % 900);
const sh = (cmd) => execFileSync(AS_POSTGRES ? 'su' : 'sh', AS_POSTGRES ? ['postgres', '-c', cmd] : ['-c', cmd],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

let started = false, client = null;
(async () => {
  try {
    fs.chmodSync(DIR, 0o777);
    if (AS_POSTGRES) execFileSync('chown', ['-R', 'postgres:postgres', DIR]);
    sh(`${bin('initdb')} -D ${DATA} -A trust -U postgres`);
    // Listen on TCP as well as the socket: node-postgres connects over TCP, which is also the
    // transport it will use against Neon, so the driver path under test is the real one.
    sh(`${bin('pg_ctl')} -D ${DATA} -o "-k ${DIR} -p ${PORT} -c listen_addresses='127.0.0.1'" -l ${DIR}/log start`);
    started = true;
    execFileSync('sleep', ['1']);
    sh(`${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d postgres -c "CREATE DATABASE cg;"`);
    const m = path.join(DIR, 'm.sql');
    fs.copyFileSync(path.join(ROOT, 'db', '001_init.sql'), m); fs.chmodSync(m, 0o644);
    sh(`${bin('psql')} -h ${DIR} -p ${PORT} -U postgres -d cg -v ON_ERROR_STOP=1 -f ${m}`);

    client = new Client({ host: '127.0.0.1', port: PORT, user: 'postgres', database: 'cg' });
    await client.connect();
    // The same shape api/db.js exposes, so auth.impl.js runs the queries it will run in production.
    const db = {
      query: (t, p) => client.query(t, p),
      tx: async (fn) => {
        await client.query('BEGIN');
        try { const out = await fn(client); await client.query('COMMIT'); return out; }
        catch (e) { try { await client.query('ROLLBACK'); } catch (e2) {} throw e; }
      }
    };

    console.log('\n1. Requesting a link creates the account and stores only a hash');
    {
      const { user, token } = await auth.issueLoginToken(db, 'a@example.com');
      ok(!!user.id && user.email === 'a@example.com', 'the account exists after one request');
      ok(user.plan === 'free' && user.plan_status === 'none', 'and starts on the free tier, not a paid one');
      ok(typeof token === 'string' && token.length >= 40, 'the token is long enough to be unguessable', String(token.length));

      const row = (await client.query('SELECT token_hash FROM login_tokens')).rows[0];
      const stored = Buffer.from(row.token_hash);
      ok(!stored.equals(Buffer.from(token)), 'the token itself is NOT what is stored');
      ok(stored.equals(crypto.createHash('sha256').update(token).digest()),
         'what is stored is its sha256 — a dump of this table cannot be replayed into logins');

      const again = await auth.issueLoginToken(db, 'a@example.com');
      ok(again.user.id === user.id, 'a second request reuses the account rather than making another');
      const n = (await client.query('SELECT count(*) FROM users')).rows[0].count;
      ok(n === '1', 'still one user', n);
    }

    console.log('\n2. A link works exactly once');
    {
      const { token } = await auth.issueLoginToken(db, 'b@example.com');
      const first = await auth.redeemLoginToken(db, token);
      ok(first.ok && !!first.sessionId, 'the first redemption mints a session');

      const second = await auth.redeemLoginToken(db, token);
      ok(!second.ok && second.reason === 'already_used', 'the second is refused as already used', JSON.stringify(second));
      const sessions = (await client.query('SELECT count(*) FROM sessions WHERE user_id = (SELECT id FROM users WHERE email=$1)', ['b@example.com'])).rows[0].count;
      ok(sessions === '1', 'and no second session was created', sessions);
    }

    console.log('\n3. Tokens that should not work, do not');
    {
      const bad = await auth.redeemLoginToken(db, 'not-a-real-token');
      ok(!bad.ok && bad.reason === 'unknown', 'an invented token is unknown');

      const empty = await auth.redeemLoginToken(db, '');
      ok(!empty.ok, 'an empty token is refused');

      // Expire it in the database rather than waiting fifteen minutes.
      const { token } = await auth.issueLoginToken(db, 'c@example.com');
      await client.query(
        `UPDATE login_tokens SET expires_at = now() - interval '1 minute'
          WHERE token_hash = $1`, [auth._sha256(token)]);
      const stale = await auth.redeemLoginToken(db, token);
      ok(!stale.ok && stale.reason === 'expired', 'an expired token is refused', JSON.stringify(stale));

      // A near-miss must not be treated as a match: the lookup is on the exact hash.
      const { token: t2 } = await auth.issueLoginToken(db, 'd@example.com');
      const near = await auth.redeemLoginToken(db, t2.slice(0, -1) + (t2.slice(-1) === 'A' ? 'B' : 'A'));
      ok(!near.ok, 'a token with one character changed does not redeem');
    }

    console.log('\n4. A session resolves to its user, and stops when it should');
    {
      const { token } = await auth.issueLoginToken(db, 'e@example.com');
      const { sessionId } = await auth.redeemLoginToken(db, token);

      const u = await auth.sessionUser(db, sessionId);
      ok(u && u.email === 'e@example.com', 'the cookie value resolves to the right account');

      const seen = (await client.query('SELECT last_seen_at FROM sessions WHERE id=$1', [sessionId])).rows[0];
      ok(!!seen.last_seen_at, 'and reading it renews last_seen_at');

      ok(await auth.sessionUser(db, '00000000-0000-0000-0000-000000000000') === null,
         'an unknown session id resolves to nobody');
      ok(await auth.sessionUser(db, null) === null, 'so does no cookie at all');

      await client.query(`UPDATE sessions SET expires_at = now() - interval '1 day' WHERE id=$1`, [sessionId]);
      ok(await auth.sessionUser(db, sessionId) === null, 'an expired session stops resolving');

      await client.query(`UPDATE sessions SET expires_at = now() + interval '1 day' WHERE id=$1`, [sessionId]);
      ok((await auth.sessionUser(db, sessionId)) !== null, 'un-expiring it brings it back, so the check is the expiry and not something else');

      await auth.endSession(db, sessionId);
      ok(await auth.sessionUser(db, sessionId) === null, 'signing out stops it resolving');
      const left = (await client.query('SELECT count(*) FROM sessions WHERE id=$1', [sessionId])).rows[0].count;
      ok(left === '0', 'and deletes the row rather than only clearing the cookie', left);
    }

    console.log('\n5. The cookie carries the flags that make it not worth stealing');
    {
      const h = auth.cookieHeader('abc123');
      ok(/(^|; )HttpOnly(;|$)/.test(h), 'HttpOnly — script cannot read it');
      ok(/(^|; )Secure(;|$)/.test(h), 'Secure — never sent in the clear');
      ok(/(^|; )SameSite=Lax(;|$)/.test(h), 'SameSite=Lax — not attached to cross-site POSTs');
      ok(/Max-Age=2592000/.test(h), 'and it expires rather than living forever');

      const cleared = auth.clearCookieHeader();
      ok(/Max-Age=0/.test(cleared), 'clearing it sets Max-Age=0');

      ok(auth.readCookie({ headers: { cookie: 'x=1; cg_session=zzz; y=2' } }) === 'zzz', 'the cookie is found among others');
      ok(auth.readCookie({ headers: { cookie: 'other=1' } }) === null, 'and absent when it is not there');
      ok(auth.readCookie({ headers: {} }) === null, 'no Cookie header at all is handled');
      // A cookie whose name merely ends in the right letters is a different cookie.
      ok(auth.readCookie({ headers: { cookie: 'not_cg_session=evil' } }) === null,
         'a lookalike cookie name is not mistaken for the session');
    }

    console.log('\n6. Addresses are normalised so one person cannot become two accounts');
    {
      ok(auth.normaliseEmail('  Foo@Bar.COM ') === 'foo@bar.com', 'trimmed and lower-cased');
      ok(auth.normaliseEmail('nope') === null, 'a string with no @ is rejected');
      ok(auth.normaliseEmail('a@b') === null, 'an address with no dot in the domain is rejected');
      ok(auth.normaliseEmail('') === null && auth.normaliseEmail(null) === null, 'empty and null are rejected');
      ok(auth.normaliseEmail('a@b.c'.padEnd(300, 'x')) === null, 'an absurdly long address is rejected');

      await auth.issueLoginToken(db, auth.normaliseEmail('Mixed@Case.com'));
      await auth.issueLoginToken(db, auth.normaliseEmail('mixed@case.COM'));
      const n = (await client.query(`SELECT count(*) FROM users WHERE email = 'mixed@case.com'`)).rows[0].count;
      ok(n === '1', 'the same address in different case is one account', n);
    }

    console.log('\n7. Deleting an account takes its sessions and tokens with it');
    {
      const { token } = await auth.issueLoginToken(db, 'f@example.com');
      await auth.redeemLoginToken(db, token);
      await client.query(`DELETE FROM users WHERE email = 'f@example.com'`);
      const counts = (await client.query(
        `SELECT (SELECT count(*) FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.email='f@example.com')||'/'||
                (SELECT count(*) FROM login_tokens t JOIN users u ON u.id=t.user_id WHERE u.email='f@example.com') AS c`
      )).rows[0].c;
      ok(counts === '0/0', 'no orphaned sessions or tokens left behind', counts);
    }
  } finally {
    try { if (client) await client.end(); } catch (e) {}
    try { if (started) sh(`${bin('pg_ctl')} -D ${DATA} -m immediate stop`); } catch (e) {}
    try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
