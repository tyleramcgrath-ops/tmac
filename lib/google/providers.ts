// Provider abstraction for listing Google properties.
//
// The property picker needs to enumerate a user's Search Console properties and
// GA4 accounts/properties. That's behind the OAuth boundary, so we define a
// provider interface with two implementations: a live one (real Google APIs)
// and a mock one used by tests and by the property-picker UI in environments
// where live OAuth isn't configured yet. The mock is clearly labeled and never
// leaks into a real connected project.

export interface GscProperty {
  siteUrl: string
  type: 'URL_PREFIX' | 'DOMAIN'
  permissionLevel: string
}
export interface Ga4Account { accountId: string; displayName: string }
export interface Ga4Property { propertyId: string; displayName: string; accountId: string }

export interface GoogleProvider {
  readonly kind: 'live' | 'mock'
  listGscProperties(accessToken: string): Promise<GscProperty[]>
  listGa4Accounts(accessToken: string): Promise<Ga4Account[]>
  listGa4Properties(accessToken: string, accountId: string): Promise<Ga4Property[]>
}

// ── Mock provider (tests + pre-credential property-picker preview) ──
export class MockGoogleProvider implements GoogleProvider {
  readonly kind = 'mock' as const
  constructor(private readonly domain = 'example.com') {}

  async listGscProperties(): Promise<GscProperty[]> {
    return [
      { siteUrl: `https://${this.domain}/`, type: 'URL_PREFIX', permissionLevel: 'siteOwner' },
      { siteUrl: `sc-domain:${this.domain}`, type: 'DOMAIN', permissionLevel: 'siteOwner' },
    ]
  }
  async listGa4Accounts(): Promise<Ga4Account[]> {
    return [{ accountId: 'acct-mock-1', displayName: `${this.domain} (mock account)` }]
  }
  async listGa4Properties(_accessToken: string, accountId: string): Promise<Ga4Property[]> {
    return [
      { propertyId: 'properties/mock-111', displayName: `${this.domain} — Web`, accountId },
      { propertyId: 'properties/mock-222', displayName: `${this.domain} — App`, accountId },
    ]
  }
}

// ── Live provider (real Google APIs) ──
export class LiveGoogleProvider implements GoogleProvider {
  readonly kind = 'live' as const

  async listGscProperties(accessToken: string): Promise<GscProperty[]> {
    const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`GSC sites request failed (${res.status})`)
    const data = await res.json()
    const entries: any[] = Array.isArray(data?.siteEntry) ? data.siteEntry : []
    return entries.map((e) => ({
      siteUrl: String(e.siteUrl ?? ''),
      type: String(e.siteUrl ?? '').startsWith('sc-domain:') ? 'DOMAIN' : 'URL_PREFIX',
      permissionLevel: String(e.permissionLevel ?? 'unknown'),
    }))
  }

  async listGa4Accounts(accessToken: string): Promise<Ga4Account[]> {
    const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`GA4 accounts request failed (${res.status})`)
    const data = await res.json()
    const accounts: any[] = Array.isArray(data?.accounts) ? data.accounts : []
    return accounts.map((a) => ({ accountId: String(a.name ?? '').replace('accounts/', ''), displayName: String(a.displayName ?? '') }))
  }

  async listGa4Properties(accessToken: string, accountId: string): Promise<Ga4Property[]> {
    const res = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/${encodeURIComponent(accountId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`GA4 properties request failed (${res.status})`)
    const data = await res.json()
    const props: any[] = Array.isArray(data?.properties) ? data.properties : []
    return props.map((p) => ({ propertyId: String(p.name ?? ''), displayName: String(p.displayName ?? ''), accountId }))
  }
}

/**
 * Selects the provider. Live when Google OAuth is configured; otherwise the
 * mock, so the property-picker UI and tests work up to the credential boundary.
 */
export function getGoogleProvider(opts: { configured: boolean; domain?: string }): GoogleProvider {
  return opts.configured ? new LiveGoogleProvider() : new MockGoogleProvider(opts.domain)
}
