// Low-conversion-rate outliers: pages getting real GA4 traffic but converting
// well below what OTHER pages on this same site achieve — a real, self-
// relative CRO signal, worth investigating (weak CTA, broken form, wrong
// audience for that page). Mirrors ctr-outliers.ts's approach: the only
// baseline used is the site's own other pages from the same already-fetched
// GA4 report — never an assumed "industry average conversion rate," which
// varies enormously by business model and can't be verified per site.

export interface Ga4ConversionRow {
  page: string
  sessions: number
  conversions: number
}

export interface ConversionOutlier {
  page: string
  sessions: number
  conversions: number
  conversionRate: number
  cohortMedianRate: number
}

const MIN_SESSIONS = 50 // enough traffic for a conversion rate to mean anything
const MIN_COHORT_SIZE = 3 // need real peers to compare against, not 1-2 pages
const UNDERPERFORM_FACTOR = 0.5 // flag when rate is under half the cohort median

function median(nums: number[]): number {
  const sorted = nums.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function findLowConversionOutliers(rows: Ga4ConversionRow[], limit = 10): ConversionOutlier[] {
  const eligible = rows.filter((r) => r.sessions >= MIN_SESSIONS)
  if (eligible.length < MIN_COHORT_SIZE) return []

  const rates = eligible.map((r) => r.conversions / r.sessions)
  const cohortMedianRate = median(rates)
  if (cohortMedianRate <= 0) return [] // no real conversions anywhere yet — nothing to compare against

  const outliers: ConversionOutlier[] = []
  for (const r of eligible) {
    const conversionRate = r.conversions / r.sessions
    if (conversionRate < cohortMedianRate * UNDERPERFORM_FACTOR) {
      outliers.push({ page: r.page, sessions: r.sessions, conversions: r.conversions, conversionRate, cohortMedianRate })
    }
  }

  return outliers.sort((a, b) => b.sessions - a.sessions).slice(0, limit)
}
