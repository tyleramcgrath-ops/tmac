'use strict';
// End to end against the real PHP API (the SiteGround build), on PHP's built-in
// server with SQLite standing in for MySQL. Skipped where PHP isn't installed.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const hasPhp = spawnSync('php', ['-r', 'exit(extension_loaded("pdo_sqlite") ? 0 : 1);']).status === 0;

test('PHP API: sign-in, trial, paywall, Stripe webhook, sign-out', { skip: !hasPhp && 'php with pdo_sqlite not installed' }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sq-php-'));
  // Mirror SiteGround: <site>/public_html/serp-quake, config + database beside public_html.
  const site = path.join(tmp, 'site');
  const dist = path.join(site, 'public_html', 'serp-quake');
  execFileSync(process.execPath, [path.join(ROOT, 'build-pages.js'), '--siteground', dist]);
  const outbox = path.join(tmp, 'outbox'); fs.mkdirSync(outbox);
  const db = path.join(site, 'serp-quake-accounts.sqlite');
  const port = 3300 + Math.floor(Math.random() * 500);
  const cfg = path.join(tmp, 'config.php');
  fs.writeFileSync(cfg, `<?php return ${JSON.stringify({
    db_dsn: 'sqlite:auto', app_origin: `http://localhost:${port}/serp-quake`, mail_outbox: outbox,
    stripe_webhook_secret: 'whsec_test', stripe_price_pro: 'price_pro', trial_days: 7,
  }).replace(/^\{/, '[').replace(/\}$/, ']').replace(/":/g, '" =>')};`);
  const env = { ...process.env, SQ_CONFIG: cfg, SQ_DATA_FILE: path.join(ROOT, 'demo-data.json') };
  execFileSync('php', [path.join(dist, 'api', 'migrate.php')], { env });
  assert.ok(fs.existsSync(db), 'sqlite:auto puts the database beside public_html');
  const srv = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', path.join(site, 'public_html')], { env, stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}/serp-quake/api/`;
  const sql = (q) => execFileSync('php', ['-r', `$p=new PDO('sqlite:${db}');$p->exec(${JSON.stringify(q)});`]);
  try {
    for (let i = 0; i < 50; i++) { try { await fetch(base + 'pulse.php'); break; } catch (e) { await new Promise((r) => setTimeout(r, 100)); } }

    const pulse = await (await fetch(base + 'pulse.php')).json();
    assert.equal(pulse.mood, 'panic');
    assert.equal(pulse.sweeps, undefined);

    let s = await (await fetch(base + 'auth/session.php')).json();
    assert.deepEqual([s.user, s.accounts], [null, true]);
    assert.equal((await fetch(base + 'data.php')).status, 401);

    const bad = await fetch(base + 'auth/link.php', { method: 'POST', body: JSON.stringify({ email: 'nope' }) });
    assert.equal(bad.status, 400);
    const ask = await fetch(base + 'auth/link.php', { method: 'POST', body: JSON.stringify({ email: 'Owner@Example.com' }) });
    assert.equal(ask.status, 200);
    const link = fs.readFileSync(path.join(outbox, 'owner@example.com.txt'), 'utf8');
    assert.match(link, /\/serp-quake\/api\/auth\/link\.php\?token=/);

    const redeem = await fetch(link.replace('localhost', '127.0.0.1'), { redirect: 'manual' });
    assert.equal(redeem.status, 302);
    assert.equal(redeem.headers.get('location'), `http://localhost:${port}/serp-quake/app.html`);
    const setCookie = redeem.headers.get('set-cookie');
    assert.match(setCookie, /sq_session=[0-9a-f]{32}; Path=\/serp-quake; HttpOnly; Secure; SameSite=Lax/);
    const cookie = setCookie.split(';')[0];

    const again = await fetch(link.replace('localhost', '127.0.0.1'), { redirect: 'manual' });
    assert.match(again.headers.get('location'), /login\.html\?signin=used/);

    s = await (await fetch(base + 'auth/session.php', { headers: { cookie } })).json();
    assert.equal(s.user.email, 'owner@example.com');
    assert.equal(s.access.level, 'trial');
    assert.equal(s.access.daysLeft, 7);
    const data = await fetch(base + 'data.php', { headers: { cookie } });
    assert.equal(data.status, 200);
    assert.ok((await data.json()).sweeps.length > 100);

    // Trial over: the paywall.
    sql(`UPDATE users SET created_at = ${Math.floor(Date.now() / 1000) - 30 * 86400}`);
    const walled = await fetch(base + 'data.php', { headers: { cookie } });
    assert.equal(walled.status, 402);
    assert.equal((await walled.json()).sweeps, undefined);

    // A forged webhook does nothing; a signed one turns Pro on.
    sql(`UPDATE users SET stripe_customer_id = 'cus_1'`);
    const event = JSON.stringify({ type: 'customer.subscription.updated', data: { object: { customer: 'cus_1', status: 'active', current_period_end: 2000000000, items: { data: [{ price: { id: 'price_pro' } }] } } } });
    const t = Math.floor(Date.now() / 1000);
    const sign = (secret) => `t=${t},v1=` + crypto.createHmac('sha256', secret).update(t + '.' + event).digest('hex');
    assert.equal((await fetch(base + 'stripe-webhook.php', { method: 'POST', body: event, headers: { 'stripe-signature': sign('wrong') } })).status, 400);
    assert.equal((await fetch(base + 'data.php', { headers: { cookie } })).status, 402);
    const hook = await fetch(base + 'stripe-webhook.php', { method: 'POST', body: event, headers: { 'stripe-signature': sign('whsec_test') } });
    assert.equal(hook.status, 200);
    assert.equal((await hook.json()).plan, 'pro');
    assert.equal((await fetch(base + 'data.php', { headers: { cookie } })).status, 200);
    s = await (await fetch(base + 'auth/session.php', { headers: { cookie } })).json();
    assert.equal(s.access.level, 'pro');

    // Sign out ends the session server-side, not just the cookie.
    await fetch(base + 'auth/session.php', { method: 'DELETE', headers: { cookie } });
    assert.equal((await fetch(base + 'data.php', { headers: { cookie } })).status, 401);

    // migrate.php is command-line only.
    assert.equal((await fetch(base + 'migrate.php')).status, 404);
  } finally {
    srv.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
