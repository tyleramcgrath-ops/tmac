import { describe, it, expect } from 'vitest'
import { getGoogleReadiness, getGoogleConfig } from '../config'
import { MockGoogleProvider, LiveGoogleProvider, getGoogleProvider } from '../providers'

const full = {
  GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'sec', GOOGLE_REDIRECT_URI: 'https://x/cb',
  TOKEN_ENCRYPTION_KEY: 'a'.repeat(64),
} as unknown as NodeJS.ProcessEnv

describe('getGoogleReadiness', () => {
  it('reports configured when all env vars (incl. encryption) are present', () => {
    const r = getGoogleReadiness(full)
    expect(r.configured).toBe(true)
    expect(r.missing).toEqual([])
    expect(r.encryptionConfigured).toBe(true)
    expect(r.redirectUri).toBe('https://x/cb')
  })

  it('lists exactly the missing canonical env-var names and never exposes values', () => {
    const r = getGoogleReadiness({ GOOGLE_CLIENT_ID: 'cid' } as unknown as NodeJS.ProcessEnv)
    expect(r.configured).toBe(false)
    expect(r.missing).toContain('GOOGLE_CLIENT_SECRET')
    expect(r.missing).toContain('GOOGLE_REDIRECT_URI')
    expect(r.missing).toContain('TOKEN_ENCRYPTION_KEY')
    expect(r.missing).not.toContain('cid') // no values, only names
  })

  it('accepts the legacy GOOGLE_OAUTH_* env names too', () => {
    const legacy = {
      GOOGLE_OAUTH_CLIENT_ID: 'cid', GOOGLE_OAUTH_CLIENT_SECRET: 'sec', GOOGLE_OAUTH_REDIRECT_URI: 'https://x/cb',
      ENCRYPTION_KEY: 'passphrase',
    } as unknown as NodeJS.ProcessEnv
    expect(getGoogleReadiness(legacy).configured).toBe(true)
    expect(getGoogleConfig(legacy)).not.toBeNull()
  })

  it('returns null config when incomplete', () => {
    expect(getGoogleConfig({} as NodeJS.ProcessEnv)).toBeNull()
  })
})

describe('provider selection', () => {
  it('uses the mock provider when not configured', () => {
    expect(getGoogleProvider({ configured: false }).kind).toBe('mock')
  })
  it('uses the live provider when configured', () => {
    expect(getGoogleProvider({ configured: true }).kind).toBe('live')
    expect(getGoogleProvider({ configured: true })).toBeInstanceOf(LiveGoogleProvider)
  })
})

describe('MockGoogleProvider', () => {
  it('lists both URL-prefix and domain GSC properties for the project domain', async () => {
    const p = new MockGoogleProvider('acme.com')
    const props = await p.listGscProperties('tok')
    expect(props.map((x) => x.type)).toEqual(expect.arrayContaining(['URL_PREFIX', 'DOMAIN']))
    expect(props.some((x) => x.siteUrl.includes('acme.com'))).toBe(true)
  })
  it('lists GA4 accounts and their properties', async () => {
    const p = new MockGoogleProvider('acme.com')
    const accounts = await p.listGa4Accounts('tok')
    expect(accounts).toHaveLength(1)
    const props = await p.listGa4Properties('tok', accounts[0].accountId)
    expect(props.length).toBeGreaterThan(0)
    expect(props[0].accountId).toBe(accounts[0].accountId)
  })
})
