// Low-CTR outliers: pure, real-GSC-data-only detection of queries
// underperforming their own site's cohort at a similar position — no
// external CTR-curve assumption, only the site's own other queries.

import { describe, expect, it } from 'vitest'
import { findLowCtrOutliers, type GscCtrRow } from '../lib/foundation/reco/ctr-outliers'

function row(over: Partial<GscCtrRow>): GscCtrRow {
  return { query: 'q', page: '/p', clicks: 0, impressions: 100, ctr: 0.1, position: 5, ...over }
}

describe('findLowCtrOutliers: real, self-relative underperformance only', () => {
  it('flags a query whose CTR is well below its own position cohort median', () => {
    const rows = [
      row({ query: 'a', position: 5, ctr: 0.1 }),
      row({ query: 'b', position: 5, ctr: 0.12 }),
      row({ query: 'c', position: 5, ctr: 0.11 }),
      row({ query: 'underperformer', position: 5, ctr: 0.02, impressions: 500 }),
    ]
    const out = findLowCtrOutliers(rows)
    expect(out.map((o) => o.query)).toEqual(['underperformer'])
    expect(out[0].cohortMedianCtr).toBeCloseTo(0.105)
  })

  it('does not flag a query performing near or above its cohort', () => {
    const rows = [
      row({ query: 'a', position: 5, ctr: 0.1 }),
      row({ query: 'b', position: 5, ctr: 0.1 }),
      row({ query: 'c', position: 5, ctr: 0.1 }),
      row({ query: 'normal', position: 5, ctr: 0.09 }),
    ]
    expect(findLowCtrOutliers(rows)).toEqual([])
  })

  it('ignores negligible-impression rows both as candidates and as cohort members', () => {
    const rows = [
      row({ query: 'a', position: 5, ctr: 0.1, impressions: 5 }),
      row({ query: 'b', position: 5, ctr: 0.1, impressions: 5 }),
      row({ query: 'low-volume-outlier', position: 5, ctr: 0.01, impressions: 5 }),
    ]
    expect(findLowCtrOutliers(rows)).toEqual([])
  })

  it('never flags when the position cohort is too small to be a real comparison', () => {
    const rows = [
      row({ query: 'a', position: 40, ctr: 0.2 }),
      row({ query: 'lonely', position: 41, ctr: 0.01 }),
    ]
    expect(findLowCtrOutliers(rows)).toEqual([])
  })

  it('compares against the right position bucket, not the whole report', () => {
    // Top-position queries naturally have much higher CTR; a page-2 query
    // should never be flagged just for having a lower CTR than page 1.
    const rows = [
      row({ query: 'top1', position: 1, ctr: 0.3 }),
      row({ query: 'top2', position: 2, ctr: 0.28 }),
      row({ query: 'top3', position: 1, ctr: 0.29 }),
      row({ query: 'page2-a', position: 15, ctr: 0.02 }),
      row({ query: 'page2-b', position: 16, ctr: 0.021 }),
      row({ query: 'page2-c', position: 17, ctr: 0.019 }),
    ]
    expect(findLowCtrOutliers(rows)).toEqual([])
  })

  it('ranks flagged outliers by impressions, highest first', () => {
    const rows = [
      row({ query: 'a', position: 5, ctr: 0.1 }),
      row({ query: 'b', position: 5, ctr: 0.1 }),
      row({ query: 'c', position: 5, ctr: 0.1 }),
      row({ query: 'low-small', position: 5, ctr: 0.01, impressions: 50 }),
      row({ query: 'low-big', position: 5, ctr: 0.01, impressions: 900 }),
    ]
    expect(findLowCtrOutliers(rows).map((o) => o.query)).toEqual(['low-big', 'low-small'])
  })

  it('returns nothing for an empty report rather than inventing an outlier', () => {
    expect(findLowCtrOutliers([])).toEqual([])
  })
})
