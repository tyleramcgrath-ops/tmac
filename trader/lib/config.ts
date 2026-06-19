import { getStore } from './db'
import { decrypt, encrypt } from './crypto'

// Broker credential resolution. Keys are resolved ENV-FIRST; keys saved from the
// API Settings page are stored AES-256-GCM encrypted (requires APP_SECRET) and
// used as a fallback. Secrets are NEVER returned to the frontend — only a
// "configured" boolean per key (see app/api/settings).

export const KEY_NAMES = [
  'RH_CRYPTO_API_KEY',
  'RH_CRYPTO_PRIVATE_KEY',
] as const

export type KeyName = (typeof KEY_NAMES)[number]

const SETTING_PREFIX = 'apikey:'

export async function getSecret(name: KeyName): Promise<string | null> {
  const fromEnv = process.env[name]
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()

  const secret = process.env.APP_SECRET
  if (!secret) return null
  try {
    const store = await getStore()
    const stored = store.get().settings[SETTING_PREFIX + name]
    return stored ? decrypt(stored, secret) : null
  } catch {
    return null
  }
}

export async function saveSecret(name: KeyName, value: string): Promise<void> {
  const secret = process.env.APP_SECRET
  if (!secret) {
    throw new Error(
      'APP_SECRET is not set — saving keys from the UI requires it. Use environment variables instead.',
    )
  }
  const store = await getStore()
  store.get().settings[SETTING_PREFIX + name] = encrypt(value, secret)
  store.schedulePersist()
}

export async function deleteSecret(name: KeyName): Promise<void> {
  const store = await getStore()
  delete store.get().settings[SETTING_PREFIX + name]
  store.schedulePersist()
}

export async function isSecretConfigured(name: KeyName): Promise<boolean> {
  return (await getSecret(name)) != null
}
