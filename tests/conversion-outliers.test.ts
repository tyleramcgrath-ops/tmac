// Low-conversion-rate outliers: pure, real-GA4-data-only detection of pages
// underperforming their own site's median conversion rate. No external
// "industry average" assumption — only the site's own other pages.

import { describe, expect, it } from 'vitest'
import { findLowConversionOutliers, type Ga4ConversionRow } from '../lib/foundation/reco/conversion-outliers'

function row(over: Partial<Ga4ConversionRow>): Ga4ConversionRow {
  return { page: '/p', sessions: 100, conversions: 10, ...over }
}

describe('findLowConversionOutliers: real, self-relative underperformance only', () => {
  it('flags a page whose conversion rate is well below the site median', () => {
    const rows = [
      row({ page: '/a', sessions: 100, conversions: 10 }), // 10%
      row({ page: '/b', sessions: 100, conversions: 12 }), // 12%
      row({ page: '/c', sessions: 100, conversions: 11 }), // 11%
      row({ page: '/underperformer', sessions: 500, conversions: 5 }), // 1%
    ]
    const out = findLowConversionOutliers(rows)
    expect(out.map((o) => o.page)).toEqual(['/underperformer'])
    expect(out[0].cohortMedianRate).toBeCloseTo(0.105)
  })

  it('does not flag a page performing near or above the cohort median', () => {
    const rows = [
      row({ page: '/a', sessions: 100, conversions: 10 }),
      row({ page: '/b', sessions: 100, conversions: 10 }),
      row({ page: '/c', sessions: 100, conversions: 10 }),
      row({ page: '/normal', sessions: 100, conversions: 9 }),
    ]
    expect(findLowConversionOutliers(rows)).toEqual([])
  })

  it('ignores low-traffic pages both as candidates and as cohort members', () => {
    const rows = [
      row({ page: '/a', sessions: 10, conversions: 5 }),
      row({ page: '/b', sessions: 10, conversions: 5 }),
      row({ page: '/low-traffic', sessions: 10, conversions: 0 }),
    ]
    expect(findLowConversionOutliers(rows)).toEqual([])
  })

  it('never flags when there is no real conversion anywhere yet — nothing to compare against', () => {
    const rows = [
      row({ page: '/a', sessions: 200, conversions: 0 }),
      row({ page: '/b', sessions: 200, conversions: 0 }),
      row({ page: '/c', sessions: 200, conversions: 0 }),
    ]
    expect(findLowConversionOutliers(rows)).toEqual([])
  })

  it('never flags when the cohort is too small to be a real comparison', () => {
    const rows = [row({ page: '/a', sessions: 200, conversions: 20 }), row({ page: '/b', sessions: 200, conversions: 0 })]
    expect(findLowConversionOutliers(rows)).toEqual([])
  })

  it('ranks flagged outliers by sessions, highest first', () => {
    const rows = [
      row({ page: '/a', sessions: 100, conversions: 10 }),
      row({ page: '/b', sessions: 100, conversions: 10 }),
      row({ page: '/c', sessions: 100, conversions: 10 }),
      row({ page: '/low-small', sessions: 60, conversions: 1 }),
      row({ page: '/low-big', sessions: 900, conversions: 5 }),
    ]
    expect(findLowConversionOutliers(rows).map((o) => o.page)).toEqual(['/low-big', '/low-small'])
  })

  it('returns nothing for an empty report rather than inventing an outlier', () => {
    expect(findLowConversionOutliers([])).toEqual([])
  })
})
