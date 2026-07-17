// Provider-agnostic rank-check abstraction.
//
// RankForge must not be hardcoded to one SERP vendor and must never require a
// third-party SEO platform (Semrush/Ahrefs/etc). This defines a small provider
// interface plus the concrete providers, selected by env (SERP_PROVIDER). When
// no provider is configured the "none" provider returns unavailable results —
// honestly, never a fabricated position.

import { interpretSerpResponse, unavailableResult, type RankCheckResult, type SerpResponse } from './track'

export interface RankCheckRequest {
  keyword: string
  domain: string
  device?: 'desktop' | 'mobile'
  country?: string | null
  language?: string | null
}

export interface RankProvider {
  readonly id: string
  readonly configured: boolean
  check(req: RankCheckRequest): Promise<RankCheckResult>
}

// ── SerpAPI adapter ──
class SerpApiProvider implements RankProvider {
  readonly id = 'serpapi'
  constructor(private readonly apiKey: string) {}
  get configured() { return !!this.apiKey }
  async check(req: RankCheckRequest): Promise<RankCheckResult> {
    try {
      const endpoint = new URL('https://serpapi.com/search.json')
      endpoint.searchParams.set('engine', 'google')
      endpoint.searchParams.set('q', req.keyword)
      endpoint.searchParams.set('num', '100')
      if (req.device) endpoint.searchParams.set('device', req.device)
      if (req.country) endpoint.searchParams.set('gl', req.country)
      if (req.language) endpoint.searchParams.set('hl', req.language)
      endpoint.searchParams.set('api_key', this.apiKey)
      const res = await fetch(endpoint)
      if (!res.ok) return unavailableResult(req.keyword, `SERP request failed (HTTP ${res.status})`)
      const data = (await res.json()) as SerpResponse
      return interpretSerpResponse(req.keyword, req.domain, data)
    } catch (err) {
      return unavailableResult(req.keyword, err instanceof Error ? err.message : 'SERP request error')
    }
  }
}

// ── "None configured" provider ── honest unavailable, never fabricated.
class NoneProvider implements RankProvider {
  readonly id = 'none'
  readonly configured = false
  async check(req: RankCheckRequest): Promise<RankCheckResult> {
    return unavailableResult(req.keyword, 'No live SERP source configured (set SERP_PROVIDER + its API key to enable RankForge live rank checks).')
  }
}

export interface ProviderStatus {
  id: string
  configured: boolean
  label: string
}

// Registry of known providers → the env var that configures each. Adding a new
// vendor is a matter of registering it here; nothing else is hardcoded.
const REGISTRY: Record<string, { keyEnv: string; label: string; make: (key: string) => RankProvider }> = {
  serpapi: { keyEnv: 'SERPAPI_KEY', label: 'SerpAPI', make: (k) => new SerpApiProvider(k) },
}

/** Selects the configured provider from env. SERP_PROVIDER names the vendor; its
 *  key comes from that vendor's env var. Falls back to SERPAPI_KEY for back-compat. */
export function getRankProvider(env: NodeJS.ProcessEnv = process.env): RankProvider {
  const explicit = (env.SERP_PROVIDER || '').trim().toLowerCase()
  if (explicit && REGISTRY[explicit]) {
    const key = (env[REGISTRY[explicit].keyEnv] || '').trim()
    if (key) return REGISTRY[explicit].make(key)
  }
  // Back-compat: a bare SERPAPI_KEY selects SerpAPI even without SERP_PROVIDER.
  if ((env.SERPAPI_KEY || '').trim()) return new SerpApiProvider(env.SERPAPI_KEY!.trim())
  return new NoneProvider()
}

export function getProviderStatus(env: NodeJS.ProcessEnv = process.env): ProviderStatus {
  const p = getRankProvider(env)
  const label = p.id === 'none' ? 'None configured' : (REGISTRY[p.id]?.label ?? p.id)
  return { id: p.id, configured: p.configured, label }
}
