// Password hashing (scrypt), secret encryption (AES-256-GCM), and session
// token signing (HMAC via jose) for the foundation layer.
//
// APP_SECRET is required for sessions and WordPress-credential encryption.
// Without it those features refuse to run — they never fall back to a
// hardcoded key.

import { createCipheriv, createDecipheriv, randomBytes, scrypt, timingSafeEqual, createHash } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

const SCRYPT_N = 16384
const SCRYPT_KEYLEN = 64

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_N }, (err, key) =>
      err ? reject(err) : resolve(key as Buffer)
    )
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt)
  return `scrypt.${SCRYPT_N}.${salt.toString('base64')}.${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('.')
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[2], 'base64')
  const expected = Buffer.from(parts[3], 'base64')
  const actual = await scryptAsync(password, salt)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// Minimum APP_SECRET length the crypto primitives will operate with. Raised
// from 8 → 16 in Phase D.6 P6; production enforces a stronger ≥32 in env.ts.
const MIN_SECRET_LEN = 16

function requireSecret(): Buffer {
  const secret = process.env.APP_SECRET
  if (!secret || secret.length < MIN_SECRET_LEN) {
    throw new Error(`APP_SECRET must be at least ${MIN_SECRET_LEN} characters to use sessions or credential encryption.`)
  }
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const key = requireSecret()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${data.toString('base64')}`
}

export function decryptSecret(payload: string): string {
  const key = requireSecret()
  const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64'))
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

const SESSION_TTL = '7d'

// The session token now carries a `tv` (tokenVersion) claim (Phase D.6 P6) so a
// server-side version bump can revoke every outstanding token for a user.
export async function createSessionToken(userId: string, tokenVersion = 0): Promise<string> {
  return new SignJWT({ sub: userId, tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(requireSecret())
}

export interface SessionClaims {
  userId: string
  tokenVersion: number
}

export async function readSessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, requireSecret())
    if (typeof payload.sub !== 'string') return null
    return { userId: payload.sub, tokenVersion: typeof payload.tv === 'number' ? payload.tv : 0 }
  } catch {
    return null
  }
}
