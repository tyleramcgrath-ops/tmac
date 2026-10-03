// Billing, against a real PostgreSQL running the real schema.
//
// One sentence governs this whole file, and it is already written into db/001_init.sql: the
// success redirect is not proof of payment. A browser can be sent to ?billing=done by anyone.
// So every assertion below is really the same assertion — that the only path to a paid plan runs
// through a signature Stripe computed.
//
// The failures here are quiet and expensive:
//
//   a clobbered bodyParser flag   module.exports.config set before module.exports is assigned
//                                 vanishes, Vercel parses the body, and the signature is then
//                                 computed over re-serialised JSON and never matches. It fails
//                                 closed — on every event, forever. It happened while writing this.
//   a replayed event              a captured webhook resent after a cancellation would restore
//                                 the plan, unless the timestamp is checked.
//   past_due treated as cancelled a failed payment on Tuesday must not throw away Wednesday's
//                                 work; Stripe retries for days.
//   an unsigned POST              would be a way to grant yourself a plan, which is the single
//                                 most valuable thing an attacker could do to this app.
//
// Needs initdb; without it the file says so and exits 0 rather than pretending to pass.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const stripe = require(path.join(ROOT, 'lib', 'stripe.js'));
const auth = require(path.join(ROOT, 'lib', 'auth.js'));
const store = require(path.join(ROOT, 'lib', 'store.js'));

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

const SECRET = 'whsec_' + crypto.randomBytes(16).toString('hex');
function signed(payload, opts) {
  const body = JSON.stringify(payload);
  const t = (opts && opts.t) || Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', (opts && opts.secret) || SECRET).update(t + '.' + body).digest('hex');
  return { body, header: 't=' + t + ',v1=' + sig };
}

function binDir() {
  for (const p of ['/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin'])
    if (fs.existsSync(path.join(p, 'initdb'))) return p;
  try { execFileSync('which', ['initdb'], { stdio: 'ignore' }); return ''; } catch (e) { return null; }
}
const BIN = binDir();
if (BIN === null) { console.log('\nno initdb on this machine — skipping the billing tests'); process.exit(0); }
const bin = (n) => BIN ? path.join(BIN, n) : n;

const AS_POSTGRES = process.getuid && process.getuid() === 0;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-stripe-'));
const DATA = path.join(DIR, 'data');
const PORT = 61300 + (process.pid % 400);
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
    process.env.DATABASE_URL = 'postgresql://postgres@127.0.0.1:' + PORT + '/cg';
    const db = { query: (t, p) => client.query(t, p) };

    process.env.STRIPE_PRICE_PRACTICE = 'price_practice_test';
    process.env.STRIPE_PRICE_AGENCY = 'price_agency_test';

    const { user: alice } = await auth.issueLoginToken(db, 'alice@example.com');
    const CUST = 'cus_alice_test';
    await client.query('UPDATE users SET stripe_customer_id=$2 WHERE id=$1', [alice.id, CUST]);
    const planOf = async () => (await client.query(
      'SELECT plan, plan_status, plan_renews_at FROM users WHERE id=$1', [alice.id])).rows[0];

    console.log('\n1. The webhook handler keeps its raw-body flag');
    {
      // module.exports.config set before module.exports is assigned is silently discarded, the
      // body gets parsed, and the signature is then computed over re-serialised JSON — so it
      // never matches, on every event, forever. This is here because it happened.
      const hook = require(path.join(ROOT, 'api', 'stripe-webhook.js'));
      ok(typeof hook === 'function', 'the module exports a handler');
      ok(hook.config && hook.config.api && hook.config.api.bodyParser === false,
         'and still carries bodyParser:false, so the signature is checked over the bytes Stripe sent',
         JSON.stringify(hook.config));
    }

    console.log('\n2. Only a signature Stripe could have produced is accepted');
    {
      const evt = { type: 'ping', data: { object: {} } };
      const good = signed(evt);
      ok(stripe.verify(good.body, good.header, SECRET).ok, 'a correctly signed payload verifies');

      ok(!stripe.verify(good.body + ' ', good.header, SECRET).ok,
         'one extra byte in the body breaks it');
      ok(!stripe.verify(good.body, good.header, 'whsec_someone_elses').ok,
         'and so does the wrong signing secret');
      ok(!stripe.verify(good.body, '', SECRET).ok, 'an unsigned POST is refused');
      ok(!stripe.verify(good.body, 't=abc,v1=zz', SECRET).ok, 'so is a malformed header');
      ok(!stripe.verify(good.body, 'v1=' + 'a'.repeat(64), SECRET).ok, 'and one with no timestamp');

      // Replay: the signature stays valid forever without a timestamp check, so a captured
      // request could be resent after a cancellation to restore the plan.
      const old = signed(evt, { t: Math.floor(Date.now() / 1000) - (stripe.TOLERANCE_S + 60) });
      const r = stripe.verify(old.body, old.header, SECRET);
      ok(!r.ok && /tolerance/.test(r.reason), 'an old signature is refused however valid it is', r.reason);

      // A short signature must not throw: timingSafeEqual on unequal lengths raises, and the
      // exception would escape as a 500 rather than a clean rejection.
      let threw = false;
      try { stripe.verify(good.body, 't=' + Math.floor(Date.now() / 1000) + ',v1=abc', SECRET); }
      catch (e) { threw = true; }
      ok(!threw, 'a truncated signature is rejected, not thrown on');
    }

    console.log('\n3. A subscription event is what moves the plan');
    {
      const sub = (status, price, extra) => ({
        type: 'customer.subscription.updated',
        data: { object: Object.assign({
          customer: CUST, status: status,
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
          items: { data: [{ price: { id: price } }] }
        }, extra || {}) }
      });

      await stripe.applyEvent(db, sub('active', 'price_practice_test'));
      let p = await planOf();
      ok(p.plan === 'practice' && p.plan_status === 'active', 'an active subscription sets the plan',
         JSON.stringify(p));
      ok(p.plan_renews_at !== null, 'and records when it renews');
      ok(store.canPersist(await rowFor(alice.id)), 'so the account can now keep things on the server');

      await stripe.applyEvent(db, sub('past_due', 'price_practice_test'));
      p = await planOf();
      ok(p.plan === 'practice' && p.plan_status === 'past_due', 'a failed payment goes past_due', JSON.stringify(p));
      ok(store.canPersist(await rowFor(alice.id)),
         'and keeps working — a failed payment on Tuesday must not throw away Wednesday\'s work');

      await stripe.applyEvent(db, sub('active', 'price_agency_test'));
      p = await planOf();
      ok(p.plan === 'agency', 'upgrading moves the plan with the price', p.plan);

      await stripe.applyEvent(db, { type: 'customer.subscription.deleted',
        data: { object: { customer: CUST, status: 'canceled', items: { data: [] } } } });
      p = await planOf();
      ok(p.plan_status === 'canceled', 'cancelling sets the status');
      ok(p.plan === 'agency', 'but keeps the plan name, so the account page can say which one ended', p.plan);
      ok(p.plan_renews_at === null, 'and clears the renewal date');
      ok(!store.canPersist(await rowFor(alice.id)), 'and the account stops persisting');
    }

    console.log('\n4. Events it cannot place change nothing');
    {
      const before = await planOf();
      const out = await stripe.applyEvent(db, { type: 'customer.subscription.updated',
        data: { object: { customer: 'cus_nobody', status: 'active', items: { data: [] } } } });
      ok(out.skipped, 'a customer this app has never seen is skipped, not guessed at', JSON.stringify(out));
      const after = await planOf();
      ok(JSON.stringify(before) === JSON.stringify(after), 'and nobody else\'s plan moved');

      const ignored = await stripe.applyEvent(db, { type: 'invoice.created', data: { object: {} } });
      ok(ignored.ignored, 'an event type this app does not act on is acknowledged and dropped',
         JSON.stringify(ignored));
    }

    console.log('\n5. Checkout is a URL, not a grant');
    {
      // No STRIPE_SECRET_KEY is set in this test, so the endpoint must refuse rather than
      // half-work. That is also the state production is in until the key is added.
      delete process.env.STRIPE_SECRET_KEY;
      ok(!stripe.configured(), 'with no secret key, billing reports itself as off');
      ok(stripe.priceFor('practice') === 'price_practice_test', 'prices come from the environment, not the code');
      ok(stripe.priceFor('nonsense') === '', 'and an unknown plan has no price');
      ok(stripe.planForPrice('price_agency_test') === 'agency', 'a price maps back to its plan');
      ok(stripe.planForPrice('price_someone_elses') === null, 'and an unknown price maps to nothing');

      ok(stripe.planStatusFor('trialing') === 'active', 'a trial counts as active');
      ok(stripe.planStatusFor('unpaid') === 'past_due', 'unpaid is past_due, not cancelled');
      ok(stripe.planStatusFor('incomplete_expired') === 'canceled', 'and an abandoned checkout is cancelled');
    }

    async function rowFor(id) {
      return (await client.query('SELECT id, plan, plan_status FROM users WHERE id=$1', [id])).rows[0];
    }
  } finally {
    try { if (client) await client.end(); } catch (e) {}
    try { if (started) sh(`${bin('pg_ctl')} -D ${DATA} -m immediate stop`); } catch (e) {}
    try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
