// Shared data-freshness contract.
//
// One policy, source-aware thresholds. A single universal "stale after N hours"
// would be wrong: GSC has a normal reporting delay, GA4's most-recent day is
// partial, priority keywords go stale faster than the weekly full set, small
// stable sites stay fresh between crawls longer, and deployment verification
// should go stale quickly if it never completes. Used by every surface so
// freshness reads the same everywhere.

export type FreshnessSource =
  | 'crawl'
  | 'priority_rankings'
  | 'full_rankings'
  | 'gsc'
  | 'ga4'
  | 'fusion'
  | 'portfolio_priority'
  | 'daily_mission'
  | 'morning_briefing'
  | 'opportunities'
  | 'deployment_verification'

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'missing' | 'failed' | 'not_configured'

// Per-source cadence in hours. `fresh` ≤ freshMax; `aging` ≤ agingMax; else stale.
// expectedCadence is the intended run interval (what the schedule targets).
interface Thresholds { freshMax: number; agingMax: number; expectedCadence: number }
const H = 1
const D = 24
const THRESHOLDS: Record<FreshnessSource, Thresholds> = {
  // GSC/GA4: a ~2 day reporting delay is normal, so "fresh" is generous.
  gsc: { freshMax: 2 * D, agingMax: 4 * D, expectedCadence: 1 * D },
  ga4: { freshMax: 2 * D, agingMax: 4 * D, expectedCadence: 1 * D },
  // Priority keywords go stale fast; the full set is weekly.
  priority_rankings: { freshMax: 2 * D, agingMax: 4 * D, expectedCadence: 1 * D },
  full_rankings: { freshMax: 10 * D, agingMax: 21 * D, expectedCadence: 7 * D },
  // Small stable sites stay fresh between crawls longer.
  crawl: { freshMax: 14 * D, agingMax: 30 * D, expectedCadence: 7 * D },
  fusion: { freshMax: 1 * D, agingMax: 3 * D, expectedCadence: 1 * D },
  portfolio_priority: { freshMax: 36 * H, agingMax: 3 * D, expectedCadence: 1 * D },
  daily_mission: { freshMax: 36 * H, agingMax: 3 * D, expectedCadence: 1 * D },
  morning_briefing: { freshMax: 36 * H, agingMax: 3 * D, expectedCadence: 1 * D },
  opportunities: { freshMax: 1 * D, agingMax: 3 * D, expectedCadence: 1 * D },
  // Verification should go stale quickly if it never completes.
  deployment_verification: { freshMax: 6 * H, agingMax: 24 * H, expectedCadence: 6 * H },
}

export interface FreshnessInput {
  source: FreshnessSource
  configured?: boolean // false → not_configured (e.g. GSC/GA4 without OAuth)
  lastSuccessAt: Date | null
  lastFailureAt?: Date | null
  now?: Date
}

export interface FreshnessResult {
  source: FreshnessSource
  status: FreshnessStatus
  ageHours: number | null
  expectedCadenceHours: number
  reason: string
  recommendedAction: string
}

function hoursBetween(a: Date, b: Date): number {
  return Math.max(0, (a.getTime() - b.getTime()) / (1000 * 60 * 60))
}

export function classifyFreshness(input: FreshnessInput): FreshnessResult {
  const now = input.now ?? new Date()
  const t = THRESHOLDS[input.source]
  const base = { source: input.source, expectedCadenceHours: t.expectedCadence }

  if (input.configured === false) {
    return { ...base, status: 'not_configured', ageHours: null, reason: 'This source is not connected/configured.', recommendedAction: 'Connect this integration to start collecting data.' }
  }
  if (input.lastSuccessAt === null) {
    // Never succeeded. If there's a failure on record, it's failed; else missing.
    if (input.lastFailureAt) {
      return { ...base, status: 'failed', ageHours: null, reason: 'No successful run yet; the last attempt failed.', recommendedAction: 'Check the error and retry.' }
    }
    return { ...base, status: 'missing', ageHours: null, reason: 'No data collected yet.', recommendedAction: 'Run this job to establish a baseline.' }
  }

  const age = hoursBetween(now, input.lastSuccessAt)
  // A failure AFTER the last success degrades the status by one step and is noted.
  const failedSinceSuccess = !!(input.lastFailureAt && input.lastFailureAt > input.lastSuccessAt)

  let status: FreshnessStatus
  if (age <= t.freshMax) status = 'fresh'
  else if (age <= t.agingMax) status = 'aging'
  else status = 'stale'

  if (failedSinceSuccess && status === 'fresh') status = 'aging' // a recent failure means we can't fully trust freshness

  const ageHours = Math.round(age * 10) / 10
  const reason = failedSinceSuccess
    ? `Last succeeded ${describeAge(age)} ago, but a later attempt failed.`
    : `Last succeeded ${describeAge(age)} ago (cadence ~${describeAge(t.expectedCadence)}).`
  const recommendedAction =
    status === 'stale' ? 'Refresh this source — the data is older than its expected cadence.'
    : status === 'aging' ? 'A refresh is due soon.'
    : failedSinceSuccess ? 'Investigate the recent failure; data may not be current.'
    : 'No action needed.'

  return { ...base, status, ageHours, reason, recommendedAction }
}

function describeAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 48) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

// Freshness ranks worst-first for portfolio roll-ups and priority penalties.
const STATUS_SEVERITY: Record<FreshnessStatus, number> = {
  failed: 5, stale: 4, missing: 3, not_configured: 2, aging: 1, fresh: 0,
}

/** The worst status across several sources — for a project- or portfolio-level badge. */
export function worstFreshness(results: FreshnessResult[]): FreshnessStatus {
  if (results.length === 0) return 'missing'
  return results.reduce((worst, r) => (STATUS_SEVERITY[r.status] > STATUS_SEVERITY[worst] ? r.status : worst), 'fresh' as FreshnessStatus)
}

/** A 0..1 confidence penalty from stale/failed/missing data, for opportunity prioritization. */
export function freshnessPenalty(status: FreshnessStatus): number {
  switch (status) {
    case 'fresh': return 0
    case 'aging': return 0.1
    case 'not_configured': return 0.2
    case 'missing': return 0.3
    case 'stale': return 0.35
    case 'failed': return 0.5
  }
}
