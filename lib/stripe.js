// Stripe, over plain fetch. No SDK: this is four calls and a signature check, and the SDK is
// larger than the code that uses it.
//
// The rule the whole file is built around, and the one the schema comment already states: the
// success redirect is not proof of payment. A browser can be sent to ?paid=1 by anyone. Only the
// webhook — signed by Stripe, verified here — is allowed to write plan or plan_status. Everything
// on the redirect path is cosmetic.
const crypto = require('crypto');

const API = 'https://api.stripe.com/v1/';
const TOLERANCE_S = 300;   // how old a signed payload may be, to bound replay

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(name + ' is not set');
  return v;
}
const configured = () => !!process.env.STRIPE_SECRET_KEY;

// Stripe takes form encoding, including for nested fields (line_items[0][price]).
function form(obj, prefix, out) {
  out = out || [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    const key = prefix ? prefix + '[' + k + ']' : k;
    if (typeof v === 'object') form(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  }
  return out;
}

async function call(path, body, opts) {
  const res = await fetch(API + path, {
    method: (opts && opts.method) || 'POST',
    headers: {
      authorization: 'Bearer ' + must('STRIPE_SECRET_KEY'),
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: body ? form(body).join('&') : undefined
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
  if (!res.ok) {
    // Stripe's own message is the useful part; without it a 400 is indistinguishable from a 500.
    const msg = (json.error && (json.error.message || json.error.type)) || ('HTTP ' + res.status);
    const err = new Error('stripe ' + path + ': ' + msg);
    err.status = res.status;
    err.stripeCode = json.error && json.error.code;
    throw err;
  }
  return json;
}

// Which price buys which plan. Held as env vars rather than in code because the test-mode and
// live-mode ids differ, and hard-coding either means one of them is wrong.
function priceFor(plan) {
  if (plan === 'practice') return process.env.STRIPE_PRICE_PRACTICE || '';
  if (plan === 'agency') return process.env.STRIPE_PRICE_AGENCY || '';
  return '';
}
function planForPrice(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRACTICE) return 'practice';
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return 'agency';
  return null;
}

// One customer per account, created on first checkout and remembered. Without this a second
// subscription opens a second customer and the portal shows only half their history.
async function customerFor(db, user) {
  if (user.stripe_customer_id) return user.stripe_customer_id;
  const c = await call('customers', {
    email: user.email,
    metadata: { user_id: user.id }
  });
  await db.query('UPDATE users SET stripe_customer_id = $2 WHERE id = $1', [user.id, c.id]);
  return c.id;
}

async function checkoutUrl(db, user, plan, origin) {
  const price = priceFor(plan);
  if (!price) return { error: 'That plan is not on sale yet.', status: 400 };
  const customer = await customerFor(db, user);
  const s = await call('checkout/sessions', {
    mode: 'subscription',
    customer: customer,
    success_url: origin + '/?billing=done',
    cancel_url: origin + '/?billing=cancelled',
    line_items: { 0: { price: price, quantity: 1 } },
    // The webhook reads these back rather than trusting anything the browser returns with.
    subscription_data: { metadata: { user_id: user.id, plan: plan } },
    metadata: { user_id: user.id, plan: plan },
    allow_promotion_codes: true
  });
  return { url: s.url };
}

async function portalUrl(db, user, origin) {
  if (!user.stripe_customer_id) return { error: 'There is no subscription on this account yet.', status: 400 };
  const s = await call('billing_portal/sessions', {
    customer: user.stripe_customer_id,
    return_url: origin + '/'
  });
  return { url: s.url };
}

// --- webhook --------------------------------------------------------------
//
// Verifying rather than trusting. An unsigned POST to this endpoint would otherwise be a way to
// give yourself a plan, which is the single most valuable thing an attacker could do here.
function verify(rawBody, signatureHeader, secret, nowMs) {
  if (!secret) return { ok: false, reason: 'no signing secret configured' };
  if (!signatureHeader) return { ok: false, reason: 'no signature' };

  const parts = {};
  for (const bit of String(signatureHeader).split(',')) {
    const i = bit.indexOf('=');
    if (i < 0) continue;
    const k = bit.slice(0, i).trim(), v = bit.slice(i + 1).trim();
    if (k === 'v1') (parts.v1 = parts.v1 || []).push(v);
    else parts[k] = v;
  }
  if (!parts.t || !parts.v1 || !parts.v1.length) return { ok: false, reason: 'malformed signature' };

  // Bound replay. A signature stays valid forever otherwise, so a captured request could be
  // resent after a cancellation to restore a plan.
  const age = Math.abs(Math.floor((nowMs || Date.now()) / 1000) - Number(parts.t));
  if (!Number.isFinite(age) || age > TOLERANCE_S) return { ok: false, reason: 'timestamp outside tolerance' };

  const expected = crypto.createHmac('sha256', secret)
    .update(parts.t + '.' + (Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)))
    .digest('hex');
  const want = Buffer.from(expected);
  const matched = parts.v1.some((given) => {
    const got = Buffer.from(given);
    // Lengths differ on a malformed header; comparing anyway would throw and leak the difference.
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  });
  if (!matched) return { ok: false, reason: 'signature does not match' };

  let event = null;
  try { event = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)); }
  catch (e) { return { ok: false, reason: 'body is not JSON' }; }
  return { ok: true, event };
}

// Stripe's statuses, mapped onto the three this app stores. past_due deliberately keeps the plan:
// a failed payment on Tuesday should not throw away Wednesday's work, and Stripe will retry.
function planStatusFor(stripeStatus) {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active';
  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') return 'past_due';
  return 'canceled';
}

// The only function that writes a plan. Everything it needs comes out of the signed event.
async function applyEvent(db, event) {
  const type = event && event.type;
  const obj = (event && event.data && event.data.object) || {};

  if (type === 'checkout.session.completed') {
    // The subscription object arrives separately as customer.subscription.created/updated, which
    // carries the status and the period end. Here we only bind the customer to the account, so a
    // later event can find them even if the metadata is missing.
    const userId = (obj.metadata && obj.metadata.user_id) || null;
    if (userId && obj.customer) {
      await db.query('UPDATE users SET stripe_customer_id = $2 WHERE id = $1', [userId, obj.customer]);
    }
    return { handled: 'checkout.session.completed', userId: userId };
  }

  if (type === 'customer.subscription.created' || type === 'customer.subscription.updated'
      || type === 'customer.subscription.deleted') {
    const status = type === 'customer.subscription.deleted' ? 'canceled' : planStatusFor(obj.status);
    const priceId = obj.items && obj.items.data && obj.items.data[0] && obj.items.data[0].price
                    && obj.items.data[0].price.id;
    const plan = (obj.metadata && obj.metadata.plan) || planForPrice(priceId);
    const renews = obj.current_period_end ? new Date(obj.current_period_end * 1000) : null;

    // Find the account by customer id first — it is the one identifier Stripe always sends.
    // Falling back to metadata covers a subscription created outside this app.
    const byCustomer = await db.query('SELECT id FROM users WHERE stripe_customer_id = $1', [obj.customer]);
    let userId = byCustomer.rows.length ? byCustomer.rows[0].id : ((obj.metadata && obj.metadata.user_id) || null);
    if (!userId) return { handled: type, skipped: 'no account matches this customer' };

    // A cancelled subscription keeps the plan name so the account page can say which plan ended;
    // plan_status is what every permission check actually reads.
    if (status === 'canceled') {
      await db.query(
        `UPDATE users SET plan_status = 'canceled', plan_renews_at = NULL WHERE id = $1`, [userId]);
    } else if (plan) {
      await db.query(
        `UPDATE users SET plan = $2, plan_status = $3, plan_renews_at = $4 WHERE id = $1`,
        [userId, plan, status, renews]);
    } else {
      await db.query(`UPDATE users SET plan_status = $2, plan_renews_at = $3 WHERE id = $1`,
        [userId, status, renews]);
    }
    return { handled: type, userId: userId, plan: plan, status: status };
  }

  // Everything else is acknowledged and ignored: Stripe retries anything it does not get a 2xx
  // for, and an unrecognised type is not a failure.
  return { handled: type, ignored: true };
}

module.exports = { configured, checkoutUrl, portalUrl, verify, applyEvent, planStatusFor,
                   priceFor, planForPrice, customerFor, form, TOLERANCE_S };
