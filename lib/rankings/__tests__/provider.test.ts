import { describe, it, expect } from 'vitest'
import { getRankProvider, getProviderStatus } from '../provider'

describe('rank provider selection', () => {
  it('returns the none provider when nothing is configured (honest, never fabricated)', async () => {
    const p = getRankProvider({} as NodeJS.ProcessEnv)
    expect(p.id).toBe('none')
    expect(p.configured).toBe(false)
    const r = await p.check({ keyword: 'x', domain: 'x.com' })
    expect(r.available).toBe(false)
    expect(r.position).toBeNull()
    expect(r.source).toBe('unavailable')
  })

  it('selects SerpAPI from a bare SERPAPI_KEY (back-compat)', () => {
    const p = getRankProvider({ SERPAPI_KEY: 'k' } as unknown as NodeJS.ProcessEnv)
    expect(p.id).toBe('serpapi')
    expect(p.configured).toBe(true)
  })

  it('selects a provider by SERP_PROVIDER + its key', () => {
    const p = getRankProvider({ SERP_PROVIDER: 'serpapi', SERPAPI_KEY: 'k' } as unknown as NodeJS.ProcessEnv)
    expect(p.id).toBe('serpapi')
  })

  it('falls back to none when SERP_PROVIDER is set but its key is missing', () => {
    const p = getRankProvider({ SERP_PROVIDER: 'serpapi' } as unknown as NodeJS.ProcessEnv)
    expect(p.id).toBe('none')
  })

  it('is not hardcoded to a single vendor — an unknown provider name degrades to none', () => {
    const p = getRankProvider({ SERP_PROVIDER: 'somevendor', SOMEVENDOR_KEY: 'k' } as unknown as NodeJS.ProcessEnv)
    expect(p.id).toBe('none') // unknown vendor isn't registered; no fabrication
  })

  it('reports provider status with a human label', () => {
    expect(getProviderStatus({} as NodeJS.ProcessEnv)).toEqual({ id: 'none', configured: false, label: 'None configured' })
    expect(getProviderStatus({ SERPAPI_KEY: 'k' } as unknown as NodeJS.ProcessEnv)).toEqual({ id: 'serpapi', configured: true, label: 'SerpAPI' })
  })
})
