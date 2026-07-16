// Authenticated encryption for OAuth tokens at rest (AES-256-GCM).
//
// OAuth access/refresh tokens must never be stored in plaintext. This wraps
// Node's crypto with a versioned, self-describing envelope so tokens can be
// rotated and decrypted deterministically. The key comes from an environment
// secret; if it's absent we fail closed (throw) rather than silently storing
// plaintext.

import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const VERSION = 'v1'
const IV_BYTES = 12
const KEY_BYTES = 32

export class TokenCryptoError extends Error {
  constructor(message: string) { super(message); this.name = 'TokenCryptoError' }
}

/**
 * Derives a 32-byte key from the configured secret. Accepts either a 64-char
 * hex string (used directly) or any other string (hashed to 32 bytes). Reads
 * TOKEN_ENCRYPTION_KEY, falling back to ENCRYPTION_KEY.
 */
export function getEncryptionKey(env: NodeJS.ProcessEnv = process.env): Buffer {
  const secret = env.TOKEN_ENCRYPTION_KEY || env.ENCRYPTION_KEY || ''
  if (!secret) {
    throw new TokenCryptoError('No encryption key configured. Set TOKEN_ENCRYPTION_KEY (or ENCRYPTION_KEY).')
  }
  if (/^[0-9a-fA-F]{64}$/.test(secret)) return Buffer.from(secret, 'hex')
  // Any other secret: hash to a stable 32-byte key.
  return crypto.createHash('sha256').update(secret).digest().subarray(0, KEY_BYTES)
}

export function isEncryptionConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!(env.TOKEN_ENCRYPTION_KEY || env.ENCRYPTION_KEY)
}

/** Encrypts plaintext, returning a self-describing envelope: v1:<iv>:<tag>:<ciphertext> (all base64). */
export function encryptToken(plaintext: string, env: NodeJS.ProcessEnv = process.env): string {
  const key = getEncryptionKey(env)
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`
}

/** Decrypts an envelope produced by encryptToken. Throws on tampering or a wrong key. */
export function decryptToken(envelope: string, env: NodeJS.ProcessEnv = process.env): string {
  const parts = envelope.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new TokenCryptoError('Unrecognized token envelope format.')
  }
  const key = getEncryptionKey(env)
  const iv = Buffer.from(parts[1], 'base64')
  const tag = Buffer.from(parts[2], 'base64')
  const ciphertext = Buffer.from(parts[3], 'base64')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  } catch {
    throw new TokenCryptoError('Failed to decrypt token (tampered data or wrong key).')
  }
}

/** True if a stored value looks like one of our encrypted envelopes (vs legacy plaintext). */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(`${VERSION}:`) && value.split(':').length === 4
}

/**
 * Decrypts a stored token, tolerating legacy plaintext values written before
 * encryption was added: if the value isn't an envelope, it's returned as-is so
 * existing connections keep working until they're re-encrypted on next write.
 */
export function decryptTokenTolerant(stored: string, env: NodeJS.ProcessEnv = process.env): string {
  return isEncrypted(stored) ? decryptToken(stored, env) : stored
}
