// Browser-stored API keys for the in-app Settings page. Keys are kept in
// localStorage (per browser, never on a server) and sent with each analysis
// request, so the Settings page works with no database and no APP_SECRET.
// Environment variables set on the host always take precedence server-side.

export const CLIENT_KEY_NAMES = [
  'SERP_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'PAGESPEED_API_KEY',
  'DATAFORSEO_API_KEY',
] as const

export type ClientKeyName = (typeof CLIENT_KEY_NAMES)[number]

const STORAGE_KEY = 'seo-intel-api-keys'

export function readClientKeys(): Partial<Record<ClientKeyName, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Partial<Record<ClientKeyName, string>> = {}
    for (const name of CLIENT_KEY_NAMES) {
      if (typeof parsed[name] === 'string' && parsed[name]) out[name] = parsed[name] as string
    }
    return out
  } catch {
    return {}
  }
}

export function setClientKey(name: ClientKeyName, value: string): void {
  const keys = readClientKeys()
  if (value.trim()) keys[name] = value.trim()
  else delete keys[name]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch {
    // storage full/blocked — nothing we can do client-side
  }
}
