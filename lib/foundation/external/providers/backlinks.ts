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

// Manual import (§3). Parse a vendor CSV a human uploaded. The result is graded
// 'imported' by the caller — evidence that it is human-supplied, not fetched.
//
// SAFETY (final-review hardening): bounded (max bytes/rows/field length),
// neutralizes spreadsheet formula-injection in text fields, strips control
// characters, rejects rows whose source host is internal/private (a poisoned
// import must not claim links from localhost/10.x/etc.), skips invalid domains,
// and de-duplicates identical rows so a re-import is idempotent. Rejections are
// counted so the caller can disclose completeness, never silently dropped.

const CSV_MAX_BYTES = 5_000_000 // 5 MB upload ceiling
const CSV_MAX_ROWS = 100_000
const CSV_MAX_FIELD = 2_048

export interface CsvImportResult {
  profile: BacklinkProfile
  rowsSeen: number
  imported: number
  rejected: number
  rejectReasons: Record<string, number>
  truncated: boolean // hit a byte/row cap
}

function sanitizeCell(raw: string): string {
  // Strip control chars (NUL..US and DEL); neutralize a leading formula trigger
  // (= + - @) so the value can never be re-exported as an executable spreadsheet
  // formula.
  const cleaned = (raw ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, CSV_MAX_FIELD)
  return /^[=+\-@]/.test(cleaned) ? `'${cleaned}` : cleaned
}
function isInternalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.lan')) return true
  if (/^\d+$/.test(h) || /^0x/i.test(h)) return true // decimal/hex-encoded
  if (/^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^::1$|^fe80|^fc|^fd/i.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  return false
}

export function parseBacklinkCsvDetailed(csv: string): CsvImportResult {
  const reject: Record<string, number> = {}
  const bump = (r: string) => { reject[r] = (reject[r] ?? 0) + 1 }
  const empty: CsvImportResult = { profile: { totalBacklinks: 0, referringDomains: 0, links: [] }, rowsSeen: 0, imported: 0, rejected: 0, rejectReasons: reject, truncated: false }

  let truncated = false
  let text = csv
  if (text.length > CSV_MAX_BYTES) { text = text.slice(0, CSV_MAX_BYTES); truncated = true }

  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return empty
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h))
  const iSource = col('source url', 'source', 'referring page url', 'url from', 'from')
  if (iSource < 0) return empty // required header missing → cannot parse
  const iTarget = col('target url', 'target', 'url to', 'to')
  const iAnchor = col('anchor', 'anchor text')
  const iAuth = col('authority', 'domain authority', 'page ascore', 'domain rating', 'dr')
  const iNofollow = col('nofollow', 'follow type')

  const links: Backlink[] = []
  const domains = new Set<string>()
  const seen = new Set<string>()
  let rowsSeen = 0
  const dataLines = lines.slice(1)
  for (const line of dataLines) {
    if (rowsSeen >= CSV_MAX_ROWS) { truncated = true; break }
    rowsSeen++
    const cells = line.split(',')
    const sourceRaw = sanitizeCell(cells[iSource] ?? '')
    if (!sourceRaw) { bump('empty-source'); continue }
    let sourceDomain: string
    try {
      sourceDomain = new URL(sourceRaw.includes('://') ? sourceRaw : `https://${sourceRaw}`).hostname
    } catch {
      bump('invalid-source'); continue
    }
    if (isInternalHost(sourceDomain)) { bump('internal-host'); continue }
    if (!/\.[a-z]{2,}$/i.test(sourceDomain)) { bump('invalid-domain'); continue }

    const authRaw = (cells[iAuth] ?? '').trim()
    const authNum = Number(authRaw)
    const link: Backlink = {
      sourceDomain,
      targetUrl: sanitizeCell(cells[iTarget] ?? ''),
      anchor: sanitizeCell(cells[iAnchor] ?? ''),
      authority: authRaw !== '' && Number.isFinite(authNum) ? authNum : null,
      firstSeen: null,
      nofollow: /nofollow/i.test((cells[iNofollow] ?? '').trim()),
    }
    const key = `${link.sourceDomain}|${link.targetUrl}|${link.anchor}`
    if (seen.has(key)) { bump('duplicate'); continue }
    seen.add(key)
    links.push(link)
    domains.add(sourceDomain.replace(/^www\./, ''))
  }

  return {
    profile: { totalBacklinks: links.length, referringDomains: domains.size, links },
    rowsSeen,
    imported: links.length,
    rejected: Object.values(reject).reduce((n, v) => n + v, 0),
    rejectReasons: reject,
    truncated,
  }
}

// Back-compat convenience: just the profile.
export function parseBacklinkCsv(csv: string): BacklinkProfile {
  return parseBacklinkCsvDetailed(csv).profile
}
