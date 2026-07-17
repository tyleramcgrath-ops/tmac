// Measurement windows — pure logic for how long to wait before judging a change,
// how to classify the change type, and how to evaluate an outcome from real
// evidence. No causation is claimed without adequate, fresh, non-conflicting
// evidence; when the data can't support a verdict we say so explicitly.

export type ChangeType =
  | 'title_meta' | 'content' | 'new_page' | 'internal_links' | 'schema'
  | 'canonical' | 'redirect' | 'conversion_tracking' | 'cta'

export type OutcomeStatus =
  | 'awaiting_data' | 'too_early' | 'improving' | 'neutral' | 'declining'
  | 'inconclusive' | 'successful' | 'needs_review' | 'rolled_back'

// How long (days) to wait before the outcome should be reviewed, per change
// type. Reflects how quickly each change type typically shows measurable effect
// given crawl/index/reporting lag. Longer for content/new pages (need to be
// crawled, indexed, and accumulate impressions); shorter for tracking/CTA.
export const REVIEW_DAYS: Record<ChangeType, number> = {
  title_meta: 21,          // needs recrawl + CTR to accumulate in GSC
  content: 28,             // recrawl + ranking movement + traffic
  new_page: 42,            // discovery, indexing, then ranking
  internal_links: 21,      // recrawl + authority flow
  schema: 14,              // recrawl + rich-result eligibility
  canonical: 21,           // consolidation takes an index cycle
  redirect: 21,            // equity transfer over an index cycle
  conversion_tracking: 7,  // data-quality fix — verify quickly
  cta: 14,                 // conversion-rate change, needs sessions
}

export function defaultReviewDays(changeType: ChangeType): number {
  return REVIEW_DAYS[changeType] ?? 21
}

/** Infer a change type from a deployment's type + serialized changes JSON. */
export function changeTypeFromDeployment(deployType: string | null | undefined, changesJson: string | null | undefined): ChangeType {
  const t = (deployType ?? '').toLowerCase()
  let changes = ''
  try { changes = (changesJson ?? '').toLowerCase() } catch { /* ignore */ }
  const hay = `${t} ${changes}`
  if (/redirect/.test(hay)) return 'redirect'
  if (/canonical/.test(hay)) return 'canonical'
  if (/schema|structured|json-?ld/.test(hay)) return 'schema'
  if (/internal.?link|link.?building|anchor/.test(hay)) return 'internal_links'
  if (/conversion|tracking|analytics|pixel|tag/.test(hay)) return 'conversion_tracking'
  if (/cta|button|call.to.action/.test(hay)) return 'cta'
  if (/new.?page|create|publish/.test(hay)) return 'new_page'
  if (/title|meta|description/.test(hay)) return 'title_meta'
  return 'content'
}

// ── Outcome evaluation ───────────────────────────────────────────────────────

export interface MetricSnapshot {
  position?: number | null      // observed rank (lower is better)
  gscPosition?: number | null   // GSC average position (lower is better)
  clicks?: number | null
  impressions?: number | null
  ctr?: number | null
  sessions?: number | null
  conversions?: number | null
}

export interface SourceFreshness {
  rank?: boolean       // rank data fresh enough to trust
  gsc?: boolean        // GSC data fresh (accounts for ~2-3 day reporting delay)
  ga4?: boolean
}

export interface EvaluateInput {
  changeType: ChangeType
  changeAppliedAt: Date
  now: Date
  reviewAt: Date
  baseline: MetricSnapshot | null
  current: MetricSnapshot | null
  freshness: SourceFreshness
  // Reporting delay in days for GSC/GA4 — data for the last N days is incomplete.
  reportingDelayDays?: number
}

export interface EvaluateResult {
  status: OutcomeStatus
  confidence: number // 0..1
  reasons: string[]
  evidence: string[]
}

const MIN_IMPRESSIONS_FOR_CTR = 100   // below this, CTR is noise
const MIN_SESSIONS_FOR_CONV = 50      // below this, conversion rate is noise
const MEANINGFUL_POS_DELTA = 1.0      // positions
const MEANINGFUL_PCT = 0.1            // 10% relative change

/**
 * Evaluate an outcome from baseline vs current, honoring reporting delay,
 * freshness, and sample size. Never asserts success without an improvement that
 * clears the noise floor on fresh data.
 */
export function evaluateOutcome(input: EvaluateInput): EvaluateResult {
  const { baseline, current, now, reviewAt, changeAppliedAt, freshness } = input
  const reasons: string[] = []
  const evidence: string[] = []

  // Not enough elapsed time yet.
  if (now.getTime() < reviewAt.getTime()) {
    const daysLeft = Math.ceil((reviewAt.getTime() - now.getTime()) / (24 * 3600 * 1000))
    return { status: 'too_early', confidence: 0.2, reasons: [`Review window not reached — ~${daysLeft}d remaining for ${input.changeType}.`], evidence: [] }
  }

  // No data to compare.
  if (!baseline || !current) {
    return { status: 'awaiting_data', confidence: 0.1, reasons: ['Baseline or current snapshot missing.'], evidence: [] }
  }

  // Reporting delay: if the change is very recent relative to reporting delay,
  // GSC/GA4 numbers can't yet reflect it.
  const elapsedDays = (now.getTime() - changeAppliedAt.getTime()) / (24 * 3600 * 1000)
  const delay = input.reportingDelayDays ?? 3
  if (elapsedDays < delay + 1) {
    return { status: 'too_early', confidence: 0.2, reasons: [`Only ${elapsedDays.toFixed(1)}d elapsed; reporting delay ~${delay}d means data is incomplete.`], evidence: [] }
  }

  const signals: Array<{ dir: 1 | -1 | 0; weight: number; note: string }> = []

  // Rank (observed) — only if fresh.
  if (freshness.rank && baseline.position != null && current.position != null) {
    const delta = baseline.position - current.position // positive = improved (moved up)
    if (Math.abs(delta) >= MEANINGFUL_POS_DELTA) {
      signals.push({ dir: delta > 0 ? 1 : -1, weight: 1.0, note: `Observed rank ${baseline.position}→${current.position}` })
      evidence.push(`Observed rank moved ${baseline.position} → ${current.position}`)
    } else {
      signals.push({ dir: 0, weight: 0.5, note: 'Observed rank ~flat' })
    }
  }

  // GSC average position — only if fresh (distinct from observed rank).
  if (freshness.gsc && baseline.gscPosition != null && current.gscPosition != null) {
    const delta = baseline.gscPosition - current.gscPosition
    if (Math.abs(delta) >= MEANINGFUL_POS_DELTA) {
      signals.push({ dir: delta > 0 ? 1 : -1, weight: 0.9, note: `GSC avg position ${baseline.gscPosition}→${current.gscPosition}` })
      evidence.push(`GSC average position ${baseline.gscPosition.toFixed(1)} → ${current.gscPosition.toFixed(1)}`)
    }
  }

  // Clicks — needs enough impressions.
  if (freshness.gsc && (current.impressions ?? 0) >= MIN_IMPRESSIONS_FOR_CTR && baseline.clicks != null && current.clicks != null) {
    const rel = baseline.clicks === 0 ? (current.clicks > 0 ? 1 : 0) : (current.clicks - baseline.clicks) / baseline.clicks
    if (Math.abs(rel) >= MEANINGFUL_PCT) {
      signals.push({ dir: rel > 0 ? 1 : -1, weight: 0.9, note: `Clicks ${baseline.clicks}→${current.clicks}` })
      evidence.push(`GSC clicks ${baseline.clicks} → ${current.clicks}`)
    }
  }

  // Conversions — needs enough sessions.
  if (freshness.ga4 && (current.sessions ?? 0) >= MIN_SESSIONS_FOR_CONV && baseline.conversions != null && current.conversions != null) {
    const rel = baseline.conversions === 0 ? (current.conversions > 0 ? 1 : 0) : (current.conversions - baseline.conversions) / baseline.conversions
    if (Math.abs(rel) >= MEANINGFUL_PCT) {
      signals.push({ dir: rel > 0 ? 1 : -1, weight: 1.0, note: `Conversions ${baseline.conversions}→${current.conversions}` })
      evidence.push(`GA4 conversions ${baseline.conversions} → ${current.conversions}`)
    }
  }

  const meaningful = signals.filter((s) => s.dir !== 0)
  if (meaningful.length === 0) {
    if (signals.length === 0) return { status: 'inconclusive', confidence: 0.2, reasons: ['No fresh, sufficiently-sampled metric available to judge.'], evidence }
    return { status: 'neutral', confidence: 0.5, reasons: ['Metrics moved within the noise floor — no meaningful change.'], evidence }
  }

  const up = meaningful.filter((s) => s.dir === 1)
  const down = meaningful.filter((s) => s.dir === -1)
  const upWeight = up.reduce((s, x) => s + x.weight, 0)
  const downWeight = down.reduce((s, x) => s + x.weight, 0)

  // Conflicting evidence → needs_review, not a verdict.
  if (up.length > 0 && down.length > 0 && Math.abs(upWeight - downWeight) < 0.5) {
    return { status: 'needs_review', confidence: 0.4, reasons: ['Conflicting signals of similar strength — needs human review.'], evidence }
  }

  if (upWeight > downWeight) {
    const strong = upWeight >= 1.5 && meaningful.length >= 2
    return {
      status: strong ? 'successful' : 'improving',
      confidence: Math.min(0.95, 0.5 + upWeight * 0.2),
      reasons: [strong ? 'Multiple fresh metrics improved past the noise floor.' : 'A fresh metric improved past the noise floor.'],
      evidence,
    }
  }

  return { status: 'declining', confidence: Math.min(0.9, 0.5 + downWeight * 0.2), reasons: ['Fresh metrics declined past the noise floor.'], evidence }
}
