// Low-CTR outliers: queries whose click-through rate is significantly below
// what OTHER queries on this same site achieve at a similar ranking
// position — a real, self-relative signal that the title/meta description
// for that page may be underperforming, worth a rewrite. Deliberately does
// NOT assume an external "industry average CTR by position" curve (that
// varies wildly by query intent and can't be verified per site) — the only
// baseline used is the site's own other queries, from the same already-
// fetched GSC report.

export interface GscCtrRow {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface CtrOutlier {
  query: string
  page: string
  position: number
  impressions: number
  ctr: number
  cohortMedianCtr: number
}

const MIN_IMPRESSIONS = 20 // enough volume for CTR to mean anything
const MIN_COHORT_SIZE = 3 // need real peers to compare against, not 1-2 rows
const UNDERPERFORM_FACTOR = 0.5 // flag when CTR is under half the cohort median

function bucketOf(position: number): number {
  // Buckets of width 3 (1-3, 4-6, 7-9, ...) — coarse enough for real cohorts
  // to form, fine enough that position 2 isn't compared against position 18.
  return Math.floor((position - 1) / 3)
}

function median(nums: number[]): number {
  const sorted = nums.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function findLowCtrOutliers(rows: GscCtrRow[], limit = 10): CtrOutlier[] {
  const eligible = rows.filter((r) => r.impressions >= MIN_IMPRESSIONS)

  const byBucket = new Map<number, GscCtrRow[]>()
  for (const r of eligible) {
    const b = bucketOf(r.position)
    const list = byBucket.get(b) ?? []
    list.push(r)
    byBucket.set(b, list)
  }

  const outliers: CtrOutlier[] = []
  for (const r of eligible) {
    const cohort = byBucket.get(bucketOf(r.position)) ?? []
    if (cohort.length < MIN_COHORT_SIZE) continue
    const cohortMedianCtr = median(cohort.map((c) => c.ctr))
    if (cohortMedianCtr <= 0) continue
    if (r.ctr < cohortMedianCtr * UNDERPERFORM_FACTOR) {
      outliers.push({ query: r.query, page: r.page, position: r.position, impressions: r.impressions, ctr: r.ctr, cohortMedianCtr })
    }
  }

  return outliers.sort((a, b) => b.impressions - a.impressions).slice(0, limit)
}
