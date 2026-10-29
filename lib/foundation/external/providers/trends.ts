// Trend Engine (Phase G §6). Provider abstraction over an industry-trends source
// (e.g. Google Trends / a keyword provider). Monitors topic growth, emerging
// entities, and seasonality. Surfaces ONLY meaningful changes (see
// change-detection.ts). Disconnected → unavailable; nothing extrapolated.

import type { Provider, ProviderConfig, ProviderOutcome, ProviderStatus } from '../types'
import { guard, statusFor } from './shared'

export interface TopicTrend {
  topic: string
  // relative interest 0-100 over the window, oldest → newest
  series: number[]
  // computed direction; only surfaced when the change clears the threshold
  direction: 'rising' | 'falling' | 'flat'
  changePct: number
  emerging: boolean
}

export interface TrendReport {
  window: string // e.g. '90d'
  topics: TopicTrend[]
}

export interface TrendProvider extends Provider {
  readonly kind: 'trend'
  fetchTrends(topics: string[]): Promise<ProviderOutcome<TrendReport>>
}

export class NullTrendProvider implements TrendProvider {
  readonly kind = 'trend' as const
  constructor(readonly id = 'trends') {}
  status(): ProviderStatus {
    return statusFor(this.id, 'trend', { connected: false }, null)
  }
  async fetchTrends(): Promise<ProviderOutcome<TrendReport>> {
    return { ok: false, reason: 'disconnected', detail: 'Trend provider not connected.' }
  }
}

export class MockTrendProvider implements TrendProvider {
  readonly kind = 'trend' as const
  constructor(
    readonly id: string,
    private config: ProviderConfig,
    private readonly report: TrendReport = { window: '90d', topics: [] },
    private readonly now = '2026-07-17T06:00:00Z'
  ) {}
  rotate(config: ProviderConfig) {
    this.config = config
  }
  status(): ProviderStatus {
    return statusFor(this.id, 'trend', this.config, this.now)
  }
  async fetchTrends(_topics: string[]): Promise<ProviderOutcome<TrendReport>> {
    const blocked = guard<TrendReport>(this.config)
    if (blocked) return blocked
    return { ok: true, data: this.report, grade: 'observed', source: 'trends', fetchedAt: this.now, partial: this.config.partial }
  }
}
