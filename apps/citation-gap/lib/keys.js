// The customer's own search key, held so a schedule can run while their browser is closed.
//
// The pricing page makes specific promises about this, and they are the spec:
//
//   "encrypted at rest with a secret kept outside the database"   AES-256-GCM. The key comes
//     from SEARCH_KEY_SECRET in the environment and is deliberately not in Postgres: a database
//     dump on its own decrypts nothing.
//   "decrypted only inside the job that calls your provider"      decrypt() is called by the
//     scan job and by nothing that renders a response.
//   "never sent back to your browser, not even to show you what you typed"  there is no code
//     path from ciphertext to an HTTP body. The UI reads last4, which is its own column.
//   "delete it and the schedules stop"                            enforced by a trigger in
//     001_init.sql, not by remembering to do it here.
//
// GCM rather than CBC because it authenticates as well as encrypts: a tampered ciphertext fails
// to decrypt instead of producing plausible garbage that then gets sent to a search provider.
const crypto = require('crypto');

const IV_BYTES = 12;    // 96 bits, the size GCM is defined for
const TAG_BYTES = 16;

function secret() {
  const raw = process.env.SEARCH_KEY_SECRET;
  if (!raw) throw new Error('SEARCH_KEY_SECRET is not set — refusing to store a customer key without it');
  // Accept hex or base64 for a 32-byte key; anything else is a configuration mistake worth
  // failing loudly on rather than padding into something that looks like a key.
  let buf = null;
  if (/^[0-9a-f]{64}$/i.test(raw)) buf = Buffer.from(raw, 'hex');
  else { try { const b = Buffer.from(raw, 'base64'); if (b.length === 32) buf = b; } catch (e) {} }
  if (!buf) throw new Error('SEARCH_KEY_SECRET must be 32 bytes, as 64 hex characters or base64');
  return buf;
}

function encrypt(plaintext) {
  const iv = crypto.randomBytes(IV_BYTES);   // per row, never reused
  const c = crypto.createCipheriv('aes-256-gcm', secret(), iv);
  const ciphertext = Buffer.concat([c.update(String(plaintext), 'utf8'), c.final()]);
  return { ciphertext, iv, tag: c.getAuthTag() };
}

function decrypt(row) {
  const d = crypto.createDecipheriv('aes-256-gcm', secret(), Buffer.from(row.iv));
  d.setAuthTag(Buffer.from(row.tag));
  return Buffer.concat([d.update(Buffer.from(row.ciphertext)), d.final()]).toString('utf8');
}

const last4 = (k) => String(k).slice(-4);

// One key per account, so storing a new one replaces the old rather than leaving both usable.
async function storeKey(db, userId, provider, plaintext) {
  const key = String(plaintext || '').trim();
  if (key.length < 8) return { error: 'That does not look like an API key.', status: 400 };
  if (provider !== 'serpapi' && provider !== 'serper') return { error: 'Provider has to be serpapi or serper.', status: 400 };
  const e = encrypt(key);
  await db.query(
    `INSERT INTO search_keys (user_id, provider, ciphertext, iv, tag, last4)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id) DO UPDATE
       SET provider = EXCLUDED.provider, ciphertext = EXCLUDED.ciphertext, iv = EXCLUDED.iv,
           tag = EXCLUDED.tag, last4 = EXCLUDED.last4, added_at = now(),
           last_ok_at = NULL, last_err = NULL`,
    [userId, provider, e.ciphertext, e.iv, e.tag, last4(key)]
  );
  return { ok: true, provider, last4: last4(key) };
}

// What the UI is allowed to see. Note what is absent: no ciphertext, no iv, no tag, and no way
// to ask for the key itself.
async function describeKey(db, userId) {
  const r = await db.query(
    'SELECT provider, last4, added_at, last_ok_at, last_err FROM search_keys WHERE user_id = $1', [userId]);
  if (!r.rows.length) return null;
  const k = r.rows[0];
  return { provider: k.provider, last4: k.last4, addedAt: k.added_at, lastOkAt: k.last_ok_at, lastError: k.last_err };
}

async function deleteKey(db, userId) {
  const r = await db.query('DELETE FROM search_keys WHERE user_id = $1 RETURNING last4', [userId]);
  return { ok: true, deleted: r.rows.length > 0 };
}

// The only function that returns plaintext. Called by the scan job; called by nothing that
// writes an HTTP response.
async function keyForScan(db, userId) {
  const r = await db.query(
    'SELECT provider, ciphertext, iv, tag FROM search_keys WHERE user_id = $1', [userId]);
  if (!r.rows.length) return null;
  return { provider: r.rows[0].provider, key: decrypt(r.rows[0]) };
}

async function noteKeyResult(db, userId, err) {
  await db.query(
    err ? 'UPDATE search_keys SET last_err = $2 WHERE user_id = $1'
        : 'UPDATE search_keys SET last_ok_at = now(), last_err = NULL WHERE user_id = $1',
    err ? [userId, String(err).slice(0, 300)] : [userId]);
}

module.exports = { encrypt, decrypt, last4, storeKey, describeKey, deleteKey, keyForScan, noteKeyResult, IV_BYTES, TAG_BYTES };
