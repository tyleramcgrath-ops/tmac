// Magic-link authentication.
//
// No passwords, for the same reason the front door stopped asking for one in v10.8: a password
// is a thing to store, leak and reset, and it buys nothing here that a short-lived emailed token
// does not. What this file has to get right instead:
//
//   the token is never stored      Only its sha256 goes in the database. A dump of login_tokens
//                                  cannot be replayed into logins, which is the whole point of
//                                  hashing something that is itself a credential.
//   redemption is single-use       Enforced inside a transaction with a row lock, so two clicks
//                                  on the same link cannot both mint a session.
//   the cookie is not a bearer     HttpOnly, Secure, SameSite=Lax: unreadable from script,
//                                  never sent over plaintext, not attached to cross-site POSTs.
//   failures do not leak accounts  Requesting a link for an address says the same thing whether
//                                  or not that address exists.
//
// db is injected rather than required, so the tests can run this against a throwaway PostgreSQL
// and assert on the real queries rather than on a mock that agrees with itself.
const crypto = require('crypto');

const TOKEN_TTL_MIN = 15;
const SESSION_TTL_DAYS = 30;
const COOKIE = 'cg_session';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest();
// base64url of 32 random bytes: 256 bits, URL-safe, no padding to mangle in a mail client.
const newToken = () => crypto.randomBytes(32).toString('base64url');

// A lax, deliberately unclever check. Address validity is decided by whether the mail arrives,
// not by a regex trying to implement RFC 5322.
function normaliseEmail(raw) {
  const e = String(raw == null ? '' : raw).trim().toLowerCase();
  if (e.length < 3 || e.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

async function upsertUser(db, email) {
  // ON CONFLICT rather than select-then-insert: two links requested at once for a new address
  // would otherwise race into a unique violation.
  const r = await db.query(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email, plan, plan_status`,
    [email]
  );
  return r.rows[0];
}

// Returns the token to email. The caller sends it; this never logs or returns it anywhere else.
async function issueLoginToken(db, email) {
  const user = await upsertUser(db, email);
  const token = newToken();
  await db.query(
    `INSERT INTO login_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [user.id, sha256(token), String(TOKEN_TTL_MIN)]
  );
  return { user, token };
}

// Single-use redemption. The SELECT takes a row lock and the UPDATE stamps used_at inside the
// same transaction, so a second redemption of the same token finds it already used rather than
// racing the first to a second session.
async function redeemLoginToken(db, token) {
  if (!token || typeof token !== 'string') return { ok: false, reason: 'missing' };
  return db.tx(async (client) => {
    const r = await client.query(
      `SELECT id, user_id, expires_at, used_at
         FROM login_tokens
        WHERE token_hash = $1
        FOR UPDATE`,
      [sha256(token)]
    );
    if (!r.rows.length) return { ok: false, reason: 'unknown' };
    const row = r.rows[0];
    if (row.used_at) return { ok: false, reason: 'already_used' };
    if (new Date(row.expires_at) <= new Date()) return { ok: false, reason: 'expired' };

    await client.query('UPDATE login_tokens SET used_at = now() WHERE id = $1', [row.id]);
    const s = await client.query(
      `INSERT INTO sessions (user_id, expires_at, last_seen_at)
       VALUES ($1, now() + ($2 || ' days')::interval, now())
       RETURNING id, expires_at`,
      [row.user_id, String(SESSION_TTL_DAYS)]
    );
    return { ok: true, sessionId: s.rows[0].id, expiresAt: s.rows[0].expires_at, userId: row.user_id };
  });
}

// Resolving a session also renews last_seen_at, which is what makes an abandoned session
// distinguishable from a live one later without a second write path.
async function sessionUser(db, sessionId) {
  if (!sessionId) return null;
  const r = await db.query(
    `UPDATE sessions SET last_seen_at = now()
      WHERE id = $1 AND expires_at > now()
      RETURNING user_id`,
    [sessionId]
  );
  if (!r.rows.length) return null;
  const u = await db.query(
    `SELECT id, email, plan, plan_status, plan_renews_at, created_at FROM users WHERE id = $1`,
    [r.rows[0].user_id]
  );
  return u.rows[0] || null;
}

async function endSession(db, sessionId) {
  if (!sessionId) return;
  await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

// --- cookies -------------------------------------------------------------

function cookieHeader(sessionId, maxAgeSeconds) {
  const bits = [
    COOKIE + '=' + (sessionId || ''),
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=' + (maxAgeSeconds == null ? SESSION_TTL_DAYS * 86400 : maxAgeSeconds)
  ];
  return bits.join('; ');
}
const clearCookieHeader = () => cookieHeader('', 0);

function readCookie(req) {
  const raw = (req.headers && (req.headers.cookie || req.headers.Cookie)) || '';
  for (const part of String(raw).split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    if (part.slice(0, i).trim() === COOKIE) return part.slice(i + 1).trim();
  }
  return null;
}

module.exports = {
  TOKEN_TTL_MIN, SESSION_TTL_DAYS, COOKIE,
  normaliseEmail, issueLoginToken, redeemLoginToken, sessionUser, endSession,
  cookieHeader, clearCookieHeader, readCookie,
  _sha256: sha256
};
