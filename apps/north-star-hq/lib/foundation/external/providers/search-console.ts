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

// Aggregate GSC metrics for ONE page over an arbitrary date range — the
// outcome-measurement flywheel's evidence source (before/after a WordPress
// deployment; see SCHEDULER_DESIGN.md §11). `fetchReport` above is the
// broad, always-trailing-28-days-to-now view; this is a targeted, exact-range
// query for a single URL.
export interface GscPageMetrics {
  range: { from: string; to: string }
  page: string
  clicks: number
  impressions: number
  ctr: number // 0-1
  position: number
}

export interface SearchConsoleProvider extends Provider {
  readonly kind: 'search-console'
  fetchReport(domain: string): Promise<ProviderOutcome<GscReport>>
  fetchPageMetrics(page: string, from: string, to: string): Promise<ProviderOutcome<GscPageMetrics>>
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
  async fetchPageMetrics(): Promise<ProviderOutcome<GscPageMetrics>> {
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
  async fetchPageMetrics(page: string, from: string, to: string): Promise<ProviderOutcome<GscPageMetrics>> {
    const blocked = guard<GscPageMetrics>(this.config)
    if (blocked) return blocked
    const rows = this.report.rows.filter((r) => r.page === page)
    const clicks = rows.reduce((n, r) => n + r.clicks, 0)
    const impressions = rows.reduce((n, r) => n + r.impressions, 0)
    const position = rows.length ? rows.reduce((n, r) => n + r.position, 0) / rows.length : 0
    const ctr = impressions > 0 ? clicks / impressions : 0
    return {
      ok: true,
      data: { range: { from, to }, page, clicks, impressions, ctr, position },
      grade: 'observed',
      source: 'gsc',
      fetchedAt: this.now,
    }
  }
}
