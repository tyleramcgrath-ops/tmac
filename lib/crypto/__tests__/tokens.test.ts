import { describe, it, expect } from 'vitest'
import { encryptToken, decryptToken, isEncrypted, decryptTokenTolerant, isEncryptionConfigured, TokenCryptoError } from '../tokens'

const HEX_KEY = 'a'.repeat(64)
const env = { TOKEN_ENCRYPTION_KEY: HEX_KEY } as unknown as NodeJS.ProcessEnv

describe('token encryption', () => {
  it('round-trips a token', () => {
    const secret = 'ya29.super-secret-access-token'
    const enc = encryptToken(secret, env)
    expect(enc).not.toContain(secret) // ciphertext must not contain the plaintext
    expect(decryptToken(enc, env)).toBe(secret)
  })

  it('produces a versioned, self-describing envelope', () => {
    const enc = encryptToken('x', env)
    expect(enc.startsWith('v1:')).toBe(true)
    expect(enc.split(':')).toHaveLength(4)
    expect(isEncrypted(enc)).toBe(true)
  })

  it('produces different ciphertext each time (random IV)', () => {
    expect(encryptToken('same', env)).not.toBe(encryptToken('same', env))
  })

  it('fails to decrypt with the wrong key', () => {
    const enc = encryptToken('secret', env)
    const wrong = { TOKEN_ENCRYPTION_KEY: 'b'.repeat(64) } as unknown as NodeJS.ProcessEnv
    expect(() => decryptToken(enc, wrong)).toThrow(TokenCryptoError)
  })

  it('detects tampering (GCM auth tag)', () => {
    const enc = encryptToken('secret', env)
    const parts = enc.split(':')
    // Flip a byte in the ciphertext.
    const ct = Buffer.from(parts[3], 'base64'); ct[0] ^= 0xff
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${ct.toString('base64')}`
    expect(() => decryptToken(tampered, env)).toThrow(TokenCryptoError)
  })

  it('throws when no key is configured', () => {
    expect(() => encryptToken('x', {} as NodeJS.ProcessEnv)).toThrow(TokenCryptoError)
    expect(isEncryptionConfigured({} as NodeJS.ProcessEnv)).toBe(false)
    expect(isEncryptionConfigured(env)).toBe(true)
  })

  it('accepts a non-hex secret by hashing it to a key', () => {
    const passphraseEnv = { TOKEN_ENCRYPTION_KEY: 'a memorable passphrase' } as unknown as NodeJS.ProcessEnv
    const enc = encryptToken('secret', passphraseEnv)
    expect(decryptToken(enc, passphraseEnv)).toBe('secret')
  })

  it('tolerates legacy plaintext values via decryptTokenTolerant', () => {
    expect(decryptTokenTolerant('legacy-plaintext-token', env)).toBe('legacy-plaintext-token')
    const enc = encryptToken('new-token', env)
    expect(decryptTokenTolerant(enc, env)).toBe('new-token')
  })

  it('rejects a malformed envelope', () => {
    expect(() => decryptToken('not-an-envelope', env)).toThrow(TokenCryptoError)
    expect(() => decryptToken('v9:a:b:c', env)).toThrow(TokenCryptoError)
  })
})
