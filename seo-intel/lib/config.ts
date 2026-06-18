import { getStore } from './db'
import { decrypt, encrypt } from './crypto'

// API keys are resolved env-first; keys saved from the Settings page are
// stored AES-256-GCM encrypted (requires APP_SECRET) and used as fallback.
// Keys are never returned to the frontend — only a configured/not flag.

export const KEY_NAMES = [
  'SERP_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'PAGESPEED_API_KEY',
  'DATAFORSEO_API_KEY',
] as const

export type KeyName = (typeof KEY_NAMES)[number]

const SETTING_PREFIX = 'apikey:'

export async function getApiKey(name: KeyName): Promise<string | null> {
  const fromEnv = process.env[name]
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()

  const secret = process.env.APP_SECRET
  if (!secret) return null
  try {
    const store = await getStore()
    const stored = await store.getSetting(SETTING_PREFIX + name)
    return stored ? decrypt(stored, secret) : null
  } catch {
    return null
  }
}

export async function saveApiKey(name: KeyName, value: string): Promise<void> {
  const secret = process.env.APP_SECRET
  if (!secret) {
    throw new Error('APP_SECRET is not set — saving keys from the UI requires it. Use environment variables instead.')
  }
  const store = await getStore()
  if (value.trim() === '') {
    await store.deleteSetting(SETTING_PREFIX + name)
  } else {
    await store.setSetting(SETTING_PREFIX + name, encrypt(value.trim(), secret))
  }
}

export interface KeyStatus {
  name: KeyName
  configured: boolean
  source: 'env' | 'saved' | null
}

// Keys can also be supplied per-request from the browser (the in-app Settings
// page stores them in localStorage and sends them with each analysis). This
// sanitizes that untrusted input down to known key names.
export type KeyOverrides = Partial<Record<KeyName, string>>

export function sanitizeKeyOverrides(input: unknown): KeyOverrides {
  const out: KeyOverrides = {}
  if (!input || typeof input !== 'object') return out
  for (const name of KEY_NAMES) {
    const value = (input as Record<string, unknown>)[name]
    if (typeof value === 'string' && value.trim() && value.length <= 500) {
      out[name] = value.trim()
    }
  }
  return out
}

export async function getKeyStatuses(): Promise<KeyStatus[]> {
  const statuses: KeyStatus[] = []
  for (const name of KEY_NAMES) {
    const fromEnv = process.env[name]
    if (fromEnv && fromEnv.trim()) {
      statuses.push({ name, configured: true, source: 'env' })
      continue
    }
    const value = await getApiKey(name)
    statuses.push({ name, configured: value !== null, source: value !== null ? 'saved' : null })
  }
  return statuses
}

export function canSaveKeys(): boolean {
  return Boolean(process.env.APP_SECRET)
}
