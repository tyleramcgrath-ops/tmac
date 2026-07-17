// Backlink Intelligence (Phase G §3). Provider abstraction over Semrush, SE
// Ranking, Ahrefs, Majestic, and a manual CSV import path. Live providers grade
// their data 'observed'; a human CSV upload grades 'imported'. Disconnected →
// gracefully degrade to a failure outcome (never invented backlink metrics).

import type { Provider, ProviderConfig, ProviderOutcome, ProviderStatus } from '../types'
import { guard, statusFor } from './shared'

export type BacklinkVendor = 'semrush' | 'se-ranking' | 'ahrefs' | 'majestic' | 'manual'

export interface Backlink {
  sourceDomain: string
  targetUrl: string
  anchor: string
  // Vendor authority score if provided; null when the vendor didn't supply one.
  authority: number | null
  firstSeen: string | null
  nofollow: boolean
}

export interface BacklinkProfile {
  totalBacklinks: number
  referringDomains: number
  links: Backlink[]
}

export interface BacklinkProvider extends Provider {
  readonly kind: 'backlinks'
  readonly vendor: BacklinkVendor
  fetchProfile(domain: string): Promise<ProviderOutcome<BacklinkProfile>>
}

export class NullBacklinkProvider implements BacklinkProvider {
  readonly kind = 'backlinks' as const
  constructor(readonly id: string, readonly vendor: BacklinkVendor = 'semrush') {}
  status(): ProviderStatus {
    return statusFor(this.id, 'backlinks', { connected: false }, null)
  }
  async fetchProfile(): Promise<ProviderOutcome<BacklinkProfile>> {
    return { ok: false, reason: 'disconnected', detail: `${this.vendor} backlink provider not connected.` }
  }
}

export class MockBacklinkProvider implements BacklinkProvider {
  readonly kind = 'backlinks' as const
  constructor(
    readonly id: string,
    readonly vendor: BacklinkVendor,
    private config: ProviderConfig,
    private readonly profile: BacklinkProfile = { totalBacklinks: 0, referringDomains: 0, links: [] },
    private readonly now = '2026-07-17T06:00:00Z'
  ) {}
  rotate(config: ProviderConfig) {
    this.config = config
  }
  status(): ProviderStatus {
    return statusFor(this.id, 'backlinks', this.config, this.now)
  }
  async fetchProfile(_domain: string): Promise<ProviderOutcome<BacklinkProfile>> {
    const blocked = guard<BacklinkProfile>(this.config)
    if (blocked) return blocked
    // A partial response returns totals but truncates the link list.
    const data = this.config.partial ? { ...this.profile, links: this.profile.links.slice(0, 1) } : this.profile
    return { ok: true, data, grade: 'observed', source: `backlinks:${this.vendor}`, fetchedAt: this.now, partial: this.config.partial }
  }
}

// Manual import (§3): parse a vendor CSV a human uploaded. The result is graded
// 'imported' by the caller — evidence that it is human-supplied, not fetched.
// Tolerant of the common Semrush/Ahrefs column names; skips malformed rows.
export function parseBacklinkCsv(csv: string): BacklinkProfile {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { totalBacklinks: 0, referringDomains: 0, links: [] }
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h))
  const iSource = col('source url', 'source', 'referring page url', 'url from', 'from')
  const iTarget = col('target url', 'target', 'url to', 'to')
  const iAnchor = col('anchor', 'anchor text')
  const iAuth = col('authority', 'domain authority', 'page ascore', 'domain rating', 'dr')
  const iNofollow = col('nofollow', 'follow type')
  const links: Backlink[] = []
  const domains = new Set<string>()
  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    const sourceRaw = (cells[iSource] ?? '').trim()
    if (!sourceRaw) continue
    let sourceDomain = sourceRaw
    try {
      sourceDomain = new URL(sourceRaw).hostname
    } catch {
      /* keep raw if not a URL */
    }
    const authRaw = Number((cells[iAuth] ?? '').trim())
    links.push({
      sourceDomain,
      targetUrl: (cells[iTarget] ?? '').trim(),
      anchor: (cells[iAnchor] ?? '').trim(),
      authority: Number.isFinite(authRaw) && (cells[iAuth] ?? '').trim() !== '' ? authRaw : null,
      firstSeen: null,
      nofollow: /nofollow/i.test((cells[iNofollow] ?? '').trim()),
    })
    domains.add(sourceDomain.replace(/^www\./, ''))
  }
  return { totalBacklinks: links.length, referringDomains: domains.size, links }
}
