'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const { access } = require('../lib/access');
const feed = require('../lib/feed');
const stripe = require('../lib/stripe');

// A stand-in for lib/db.js that answers the two queries auth.sessionUser makes.
function fakeDb(users, sessions) {
  return {
    async query(text, params) {
      if (/UPDATE sessions/.test(text)) {
        const s = sessions[params[0]];
        return { rows: s ? [{ user_id: s }] : [] };
      }
      if (/FROM users WHERE id/.test(text)) return { rows: users[params[0]] ? [users[params[0]]] : [] };
      throw new Error('unexpected query: ' + text);
    },
  };
}

function withDb(db, fn) {
  const file = require.resolve('../lib/db.js');
  const saved = require.cache[file];
  require.cache[file] = { id: file, filename: file, loaded: true, exports: db };
  for (const k of Object.keys(require.cache)) if (k.includes(path.join('site', 'api'))) delete require.cache[k];
  return Promise.resolve(fn()).finally(() => { if (saved) require.cache[file] = saved; else delete require.cache[file]; });
}

function call(handler, { method = 'GET', cookie, query = {}, body } = {}) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      getHeader(k) { return this.headers[k.toLowerCase()]; },
      status(c) { this.statusCode = c; return this; },
      json(o) { resolve({ status: this.statusCode, body: o, headers: this.headers }); return this; },
      writeHead(c, h) { this.statusCode = c; Object.assign(this.headers, h || {}); },
      end() { resolve({ status: this.statusCode, headers: this.headers }); },
    };
    handler({ method, headers: cookie ? { cookie: 'sq_session=' + cookie } : {}, query, body }, res);
  });
}

const DAY = 864e5;

test('access: trial for 7 days, then Pro only; past_due keeps access, canceled does not', () => {
  const now = Date.parse('2026-11-01T00:00:00Z');
  const fresh = { plan: 'free', plan_status: 'none', created_at: new Date(now - 2 * DAY).toISOString() };
  assert.equal(access(fresh, now).level, 'trial');
  assert.equal(access(fresh, now).daysLeft, 5);
  assert.equal(access({ ...fresh, created_at: new Date(now - 8 * DAY).toISOString() }, now).full, false);
  const old = { created_at: new Date(now - 90 * DAY).toISOString(), plan: 'pro' };
  assert.equal(access({ ...old, plan_status: 'active' }, now).level, 'pro');
  assert.equal(access({ ...old, plan_status: 'past_due' }, now).full, true);
  assert.equal(access({ ...old, plan_status: 'canceled' }, now).full, false);
  assert.equal(access(null).full, false);
});

test('pulse exposes the needle and mood only, not the instrument', () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'demo-data.json'), 'utf8'));
  const p = feed.pulse(data);
  assert.ok(p.magnitude > 7);
  assert.equal(p.mood, 'panic');
  assert.ok(p.quake && p.quake.peak > 7);
  assert.ok(Array.isArray(p.spark) && p.spark.length > 10);
  assert.equal(p.stations, undefined);
  assert.equal(p.sweeps, undefined);
  assert.equal(feed.moodOf(1.9).mood, 'zen');
  assert.equal(feed.moodOf(4).mood, 'alert');
  assert.equal(feed.moodOf(6).mood, 'nervous');
});

test('feed caches, and serves the last good copy when the source fails', async () => {
  delete globalThis.__serpQuakeFeed;
  let calls = 0;
  const ok = async () => { calls++; return { ok: true, json: async () => ({ n: calls }) }; };
  const bad = async () => { calls++; return { ok: false, status: 503 }; };
  assert.deepEqual(await feed.load({ fetchImpl: ok, now: 1000 }), { n: 1 });
  assert.deepEqual(await feed.load({ fetchImpl: ok, now: 2000 }), { n: 1 });
  assert.deepEqual(await feed.load({ fetchImpl: bad, now: 1000 + 10 * 60e3 }), { n: 1 });
  delete globalThis.__serpQuakeFeed;
  await assert.rejects(feed.load({ fetchImpl: bad, now: 0 }), /503/);
});

test('/api/data: signed out 401, trial ended 402, trial and Pro get the seismograph', async () => {
  process.env.DATABASE_URL = 'postgres://fake';
  process.env.QUAKE_DATA_FILE = path.join(ROOT, 'demo-data.json');
  const now = Date.now();
  const users = {
    u1: { id: 'u1', email: 'a@x.com', plan: 'free', plan_status: 'none', created_at: new Date(now - DAY).toISOString() },
    u2: { id: 'u2', email: 'b@x.com', plan: 'free', plan_status: 'none', created_at: new Date(now - 30 * DAY).toISOString() },
    u3: { id: 'u3', email: 'c@x.com', plan: 'pro', plan_status: 'active', created_at: new Date(now - 30 * DAY).toISOString() },
  };
  await withDb(fakeDb(users, { s1: 'u1', s2: 'u2', s3: 'u3' }), async () => {
    const data = require('../api/data.js');
    assert.equal((await call(data)).status, 401);
    assert.equal((await call(data, { cookie: 'nope' })).status, 401);
    const expired = await call(data, { cookie: 's2' });
    assert.equal(expired.status, 402);
    assert.equal(expired.body.sweeps, undefined);
    const trial = await call(data, { cookie: 's1' });
    assert.equal(trial.status, 200);
    assert.ok(trial.body.sweeps.length > 100);
    assert.equal((await call(data, { cookie: 's3' })).status, 200);

    const session = require('../api/auth/session.js');
    const s = await call(session, { cookie: 's1' });
    assert.equal(s.body.user.email, 'a@x.com');
    assert.equal(s.body.access.level, 'trial');
    assert.equal((await call(session)).body.user, null);
  });
  delete process.env.DATABASE_URL;
  delete process.env.QUAKE_DATA_FILE;
});

test('without a database the site runs in demo mode instead of erroring', async () => {
  delete process.env.DATABASE_URL;
  for (const k of Object.keys(require.cache)) if (k.includes(path.join('site', 'api'))) delete require.cache[k];
  const s = await call(require('../api/auth/session.js'));
  assert.deepEqual(s.body, { user: null, accounts: false });
  assert.equal((await call(require('../api/data.js'))).status, 503);
});

test('Stripe webhook signatures: valid accepted, tampered and stale refused', () => {
  const secret = 'whsec_test';
  const body = JSON.stringify({ type: 'customer.subscription.updated', data: { object: { status: 'active' } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = (ts, b) => 't=' + ts + ',v1=' + crypto.createHmac('sha256', secret).update(ts + '.' + b).digest('hex');
  assert.equal(stripe.verify(body, sig(t, body), secret).ok, true);
  assert.equal(stripe.verify(body + ' ', sig(t, body), secret).ok, false);
  assert.equal(stripe.verify(body, sig(t - 3600, body), secret).ok, false);
  process.env.STRIPE_PRICE_PRO = 'price_pro';
  assert.equal(stripe.planForPrice('price_pro'), 'pro');
  assert.equal(stripe.priceFor('pro'), 'price_pro');
  delete process.env.STRIPE_PRICE_PRO;
});

test('pages only load local scripts and reference files that exist', () => {
  for (const page of ['index.html', 'login.html', 'app.html']) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    for (const [, src] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) assert.ok(!/^https?:/.test(src) && fs.existsSync(path.join(ROOT, src)), page + ' loads ' + src);
    for (const [, href] of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) assert.ok(/^https:\/\/fonts\.googleapis\.com/.test(href) || fs.existsSync(path.join(ROOT, href)), page + ' styles ' + href);
  }
});
