// Analytics Fusion (Phase G §5). Provider abstraction over GA4. Surfaces
// conversions, engagement, revenue (when available), events, and funnels so
// recommendations can be tied to business impact. Business metrics are NEVER
// fabricated: revenue is null unless the property actually reports it, and a
// disconnected provider degrades to unavailable.

import type { Provider, ProviderConfig, ProviderOutcome, ProviderStatus } from '../types'
import { guard, statusFor } from './shared'

export interface Ga4PageMetrics {
  page: string
  sessions: number
  engagedSessions: number
  conversions: number
  // null when the property does not report revenue (very common) — never 0-as-fact.
  revenue: number | null
  keyEvents: number
}

export interface Ga4Report {
  range: { from: string; to: string }
  currency: string | null
  pages: Ga4PageMetrics[]
}

export interface AnalyticsProvider extends Provider {
  readonly kind: 'analytics'
  fetchReport(propertyId: string): Promise<ProviderOutcome<Ga4Report>>
}

export class NullAnalyticsProvider implements AnalyticsProvider {
  readonly kind = 'analytics' as const
  constructor(readonly id = 'ga4') {}
  status(): ProviderStatus {
    return statusFor(this.id, 'analytics', { connected: false }, null)
  }
  async fetchReport(): Promise<ProviderOutcome<Ga4Report>> {
    return { ok: false, reason: 'disconnected', detail: 'Google Analytics 4 not connected.' }
  }
}

export class MockAnalyticsProvider implements AnalyticsProvider {
  readonly kind = 'analytics' as const
  constructor(
    readonly id: string,
    private config: ProviderConfig,
    private readonly report: Ga4Report = { range: { from: '', to: '' }, currency: null, pages: [] },
    private readonly now = '2026-07-17T06:00:00Z'
  ) {}
  rotate(config: ProviderConfig) {
    this.config = config
  }
  status(): ProviderStatus {
    return statusFor(this.id, 'analytics', this.config, this.now)
  }
  async fetchReport(_propertyId: string): Promise<ProviderOutcome<Ga4Report>> {
    const blocked = guard<Ga4Report>(this.config)
    if (blocked) return blocked
    const data = this.config.partial ? { ...this.report, pages: this.report.pages.slice(0, 1) } : this.report
    return { ok: true, data, grade: 'observed', source: 'ga4', fetchedAt: this.now, partial: this.config.partial }
  }
}
