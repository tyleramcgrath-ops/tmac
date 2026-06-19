import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

// AES-256-GCM encryption for broker API keys saved via the API Settings page.
// The key is derived from APP_SECRET; without it, saving keys is disabled and
// the app expects credentials via environment variables instead. Secrets are
// never returned to the frontend — only a "configured" flag.

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest()
}

export function encrypt(plaintext: string, secret: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.')
}

export function decrypt(payload: string, secret: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted payload')
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}
