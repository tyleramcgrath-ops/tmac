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
  clicks: number
  ctr: number
  /** The peer baseline this was judged against. Null for an 'absolute' finding,
   *  which needs no peers. */
  cohortMedianCtr: number | null
  /** 'relative' — clicking far below the site's own keywords at this position.
   *  'absolute' — ranking well, seen plenty, and never clicked at all. */
  kind: 'relative' | 'absolute'
}

const MIN_IMPRESSIONS = 20 // enough volume for CTR to mean anything
const MIN_COHORT_SIZE = 3 // need real peers to compare against, not 1-2 rows
const UNDERPERFORM_FACTOR = 0.5 // flag when CTR is under half the cohort median

// The absolute rule. The relative test above compares a keyword to the site's
// own peers, which is the right idea and silently does nothing on a site whose
// peers all sit at zero: envuetelematics.com runs a 0.1% site-wide CTR, so the
// median CTR in nearly every position bucket is exactly 0, the
// `cohortMedianCtr <= 0` guard skips every row, and the panel reported "no
// keyword is clicking below its peers" on a site where almost nothing is
// clicked at all. Correct arithmetic, useless answer.
//
// Ranking on page one, being shown this many times, and getting ZERO clicks is
// a title/meta problem whatever the peers are doing. No baseline required.
const ABS_MIN_IMPRESSIONS = 100
const ABS_MAX_POSITION = 10

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
  // One finding per (query, page); absolute wins, since "never clicked at all"
  // is the stronger statement and the two rules overlap.
  const claimed = new Set<string>()
  const keyOf = (r: GscCtrRow) => `${r.query}\u0000${r.page}`

  const absolute: CtrOutlier[] = []
  for (const r of rows) {
    // BOTH signals must say "never clicked". Google always reports them in
    // agreement (ctr = clicks / impressions), so requiring both costs nothing
    // on real data and keeps a malformed row from inventing a finding.
    if (r.clicks > 0 || r.ctr > 0) continue
    if (r.impressions < ABS_MIN_IMPRESSIONS || r.position > ABS_MAX_POSITION) continue
    claimed.add(keyOf(r))
    absolute.push({
      query: r.query, page: r.page, position: r.position, impressions: r.impressions,
      clicks: r.clicks, ctr: r.ctr, cohortMedianCtr: null, kind: 'absolute',
    })
  }

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
    if (claimed.has(keyOf(r))) continue
    if (r.ctr < cohortMedianCtr * UNDERPERFORM_FACTOR) {
      outliers.push({
        query: r.query, page: r.page, position: r.position, impressions: r.impressions,
        clicks: r.clicks, ctr: r.ctr, cohortMedianCtr, kind: 'relative',
      })
    }
  }

  return [...absolute, ...outliers]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
}

/** Total qualifying findings before the limit, so the UI can show "25 of N". */
export function countLowCtrOutliers(rows: GscCtrRow[]): number {
  return findLowCtrOutliers(rows, Number.MAX_SAFE_INTEGER).length
}
