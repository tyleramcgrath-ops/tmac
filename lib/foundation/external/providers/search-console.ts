// Search Console Fusion (Phase G §4). Provider abstraction over Google Search
// Console. Maps queries → landing pages with CTR, position, impressions, clicks.
// Live GSC data grades 'observed'; disconnected → gracefully unavailable. This
// is the primary evidence source for tying recommendations to real search data.

import type { Provider, ProviderConfig, ProviderOutcome, ProviderStatus } from '../types'
import { guard, statusFor } from './shared'

export interface GscRow {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number // 0-1
  position: number
}

export interface GscReport {
  range: { from: string; to: string }
  rows: GscRow[]
}

export interface SearchConsoleProvider extends Provider {
  readonly kind: 'search-console'
  fetchReport(domain: string): Promise<ProviderOutcome<GscReport>>
}

export class NullSearchConsoleProvider implements SearchConsoleProvider {
  readonly kind = 'search-console' as const
  constructor(readonly id = 'gsc') {}
  status(): ProviderStatus {
    return statusFor(this.id, 'search-console', { connected: false }, null)
  }
  async fetchReport(): Promise<ProviderOutcome<GscReport>> {
    return { ok: false, reason: 'disconnected', detail: 'Google Search Console not connected.' }
  }
}

export class MockSearchConsoleProvider implements SearchConsoleProvider {
  readonly kind = 'search-console' as const
  constructor(
    readonly id: string,
    private config: ProviderConfig,
    private readonly report: GscReport = { range: { from: '', to: '' }, rows: [] },
    private readonly now = '2026-07-17T06:00:00Z'
  ) {}
  rotate(config: ProviderConfig) {
    this.config = config
  }
  status(): ProviderStatus {
    return statusFor(this.id, 'search-console', this.config, this.now)
  }
  async fetchReport(_domain: string): Promise<ProviderOutcome<GscReport>> {
    const blocked = guard<GscReport>(this.config)
    if (blocked) return blocked
    const data = this.config.partial ? { ...this.report, rows: this.report.rows.slice(0, 1) } : this.report
    return { ok: true, data, grade: 'observed', source: 'gsc', fetchedAt: this.now, partial: this.config.partial }
  }
}
