// The customer's search key, against a real PostgreSQL running the real schema.
//
// The pricing page makes four promises about this key, and a promise about a secret fails
// silently by construction: a key stored in plaintext, or one that can be read back out, looks
// exactly like a working feature. So each promise is tested as a property of the stored row
// rather than as a property of the code that wrote it.
//
//   encrypted at rest, with the secret outside the database   the bytes in the row must not
//                                                             contain the key, and a wrong
//                                                             secret must not decrypt them
//   only last4 is ever readable back                          describeKey must have no path to
//                                                             the plaintext
//   deleting it stops the schedules                           enforced by a trigger, so it is
//                                                             tested by deleting and looking
//   a tampered row fails rather than lying                     GCM authenticates; CBC would not
//
// Needs initdb; without it the file says so and exits 0 rather than pretending to pass.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
process.env.SEARCH_KEY_SECRET = crypto.randomBytes(32).toString('hex');
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
if (BIN === null) { console.log('\nno initdb on this machine — skipping the key tests'); process.exit(0); }
const bin = (n) => BIN ? path.join(BIN, n) : n;

const AS_POSTGRES = process.getuid && process.getuid() === 0;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-keys-'));
const DATA = path.join(DIR, 'data');
const PORT = 58300 + (process.pid % 900);
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
    const db = { query: (t, p) => client.query(t, p) };

    const mk = async (email) => {
      const { user } = await auth.issueLoginToken(db, email);
      await client.query(`UPDATE users SET plan='practice', plan_status='active' WHERE id=$1`, [user.id]);
      return user;
    };
    const alice = await mk('alice@example.com');
    const mallory = await mk('mallory@example.com');
    const KEY = 'serpapi_1234567890abcdefABCDEF9876';

    console.log('\n1. Encryption is real encryption, not encoding');
    {
      const e = keys.encrypt(KEY);
      ok(e.iv.length === keys.IV_BYTES, 'the iv is ' + keys.IV_BYTES + ' bytes, the size GCM is defined for', String(e.iv.length));
      ok(e.tag.length === keys.TAG_BYTES, 'and the tag is ' + keys.TAG_BYTES, String(e.tag.length));
      ok(keys.decrypt(e) === KEY, 'what goes in comes back out');
      ok(!e.ciphertext.toString('utf8').includes('serpapi'), 'the ciphertext does not contain the key');

      // Two encryptions of the same key must differ, or the ciphertext itself becomes a
      // fingerprint: identical rows would say "these two accounts share a key".
      const again = keys.encrypt(KEY);
      ok(!e.ciphertext.equals(again.ciphertext), 'encrypting the same key twice gives different bytes — the iv is per row');
      ok(!e.iv.equals(again.iv), 'because the iv is never reused');
    }

    console.log('\n2. A tampered row fails rather than decrypting to something plausible');
    {
      const e = keys.encrypt(KEY);
      const bent = Buffer.from(e.ciphertext); bent[0] ^= 0xff;
      let threw = false;
      try { keys.decrypt({ ciphertext: bent, iv: e.iv, tag: e.tag }); } catch (err) { threw = true; }
      ok(threw, 'a flipped bit in the ciphertext is rejected, not passed to a search provider');

      const bentTag = Buffer.from(e.tag); bentTag[0] ^= 0xff;
      let threw2 = false;
      try { keys.decrypt({ ciphertext: e.ciphertext, iv: e.iv, tag: bentTag }); } catch (err) { threw2 = true; }
      ok(threw2, 'and so is a flipped bit in the tag');
    }

    console.log('\n3. The secret lives outside the database');
    {
      const e = keys.encrypt(KEY);
      const was = process.env.SEARCH_KEY_SECRET;
      process.env.SEARCH_KEY_SECRET = crypto.randomBytes(32).toString('hex');
      let threw = false;
      try { keys.decrypt(e); } catch (err) { threw = true; }
      ok(threw, 'a database dump without the secret decrypts nothing');
      process.env.SEARCH_KEY_SECRET = was;

      delete process.env.SEARCH_KEY_SECRET;
      let refused = false;
      try { keys.encrypt(KEY); } catch (err) { refused = /SEARCH_KEY_SECRET/.test(err.message); }
      ok(refused, 'and with no secret set at all it refuses to store a key rather than storing it in the clear');
      process.env.SEARCH_KEY_SECRET = was;

      process.env.SEARCH_KEY_SECRET = 'too-short';
      let sized = false;
      try { keys.encrypt(KEY); } catch (err) { sized = /32 bytes/.test(err.message); }
      ok(sized, 'a secret of the wrong size is a configuration fault, not something to pad');
      process.env.SEARCH_KEY_SECRET = was;
    }

    console.log('\n4. Stored, the row keeps the promise the page makes');
    {
      const out = await keys.storeKey(db, alice.id, 'serpapi', KEY);
      ok(!out.error && out.last4 === KEY.slice(-4), 'Alice saves her key', JSON.stringify(out));

      const row = (await client.query('SELECT * FROM search_keys WHERE user_id=$1', [alice.id])).rows[0];
      ok(!!row, 'and it is on disk');
      ok(!row.ciphertext.toString('binary').includes(KEY), 'the stored bytes do not contain the key');
      ok(!JSON.stringify(row).includes(KEY.slice(0, 20)), 'nor does any other column');
      ok(row.iv.length === 12 && row.tag.length === 16, 'the schema\'s own length checks held', row.iv.length + '/' + row.tag.length);
      ok(row.last4 === KEY.slice(-4), 'last4 is the only readable part', row.last4);
    }

    console.log('\n5. There is no route from the stored key back to a response body');
    {
      const shown = await keys.describeKey(db, alice.id);
      const asJson = JSON.stringify(shown);
      ok(!asJson.includes(KEY), 'describeKey does not return the key');
      ok(!/ciphertext|\biv\b|tag/.test(asJson), 'nor the ciphertext, iv or tag — there is nothing to reassemble', asJson);
      ok(shown.last4 === KEY.slice(-4) && shown.provider === 'serpapi', 'it returns the four digits and the provider, which is what the UI shows');

      // The one function that does return plaintext, so that its callers are countable.
      const forScan = await keys.keyForScan(db, alice.id);
      ok(forScan.key === KEY && forScan.provider === 'serpapi', 'the scan job, and only the scan job, gets the key itself');
    }

    console.log('\n6. One key per account, and it is the account\'s own');
    {
      const second = 'serper_zzzzzzzzzzzzzzzzzzzz1111';
      await keys.storeKey(db, alice.id, 'serper', second);
      const n = (await client.query('SELECT count(*)::int AS n FROM search_keys WHERE user_id=$1', [alice.id])).rows[0].n;
      ok(n === 1, 'saving a new key replaces the old one rather than leaving both usable', String(n));
      const now = await keys.keyForScan(db, alice.id);
      ok(now.key === second && now.provider === 'serper', 'and the new one is what a scan would use');

      ok(await keys.keyForScan(db, mallory.id) === null, 'Mallory has no key of her own');
      ok(await keys.describeKey(db, mallory.id) === null, 'and cannot see that Alice has one');

      const junk = await keys.storeKey(db, mallory.id, 'serpapi', 'abc');
      ok(junk.error && junk.status === 400, 'something that is plainly not a key is refused', JSON.stringify(junk));
      const wrongProvider = await keys.storeKey(db, mallory.id, 'openai', KEY);
      ok(wrongProvider.error && wrongProvider.status === 400, 'and so is a provider we do not call', JSON.stringify(wrongProvider));
    }

    console.log('\n7. Deleting the key stops the schedules — by trigger, not by remembering to');
    {
      const proj = (await client.query(
        `INSERT INTO projects (user_id, name, url, keyword) VALUES ($1,'EnVue','https://envue.com/','telematics') RETURNING id`,
        [alice.id])).rows[0];
      await client.query(
        `INSERT INTO schedules (project_id, cadence, hour_utc, enabled, next_run_at)
         VALUES ($1,'daily',7,true, now() + interval '1 day')`, [proj.id]);
      const before = (await client.query('SELECT enabled FROM schedules WHERE project_id=$1', [proj.id])).rows[0].enabled;
      ok(before === true, 'Alice has a daily scan running');

      await keys.deleteKey(db, alice.id);
      const after = (await client.query('SELECT enabled FROM schedules WHERE project_id=$1', [proj.id])).rows[0].enabled;
      ok(after === false, 'deleting her key stops it — the schema does this, so no endpoint can forget to');
      ok(await keys.describeKey(db, alice.id) === null, 'and the key itself is gone');
      ok(await keys.keyForScan(db, alice.id) === null, 'including for the scan job');
    }

    console.log('\n8. A rejected key is recorded where the customer can see it');
    {
      await keys.storeKey(db, alice.id, 'serpapi', KEY);
      await keys.noteKeyResult(db, alice.id, 'SerpApi: Invalid API key');
      let shown = await keys.describeKey(db, alice.id);
      ok(/Invalid API key/.test(shown.lastError), 'a provider refusing the key is shown back, so it can be fixed', shown.lastError);
      ok(!JSON.stringify(shown).includes(KEY), 'and saying so still does not reveal the key');

      await keys.noteKeyResult(db, alice.id, null);
      shown = await keys.describeKey(db, alice.id);
      ok(!shown.lastError && !!shown.lastOkAt, 'a working scan clears it and stamps the time', JSON.stringify(shown));
    }

    console.log('\n9. Deleting the account takes the key with it');
    {
      await client.query(`DELETE FROM users WHERE id=$1`, [alice.id]);
      const left = (await client.query('SELECT count(*)::int AS n FROM search_keys WHERE user_id=$1', [alice.id])).rows[0].n;
      ok(left === 0, 'no ciphertext is left behind', String(left));
    }
  } finally {
    try { if (client) await client.end(); } catch (e) {}
    try { if (started) sh(`${bin('pg_ctl')} -D ${DATA} -m immediate stop`); } catch (e) {}
    try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
