// Regression tests for four defects that only real Search Console data exposed.
// Each fails against the previous behaviour.

import { describe, it, expect } from 'vitest'
import { findKeywordOpportunities, countKeywordOpportunities } from '../lib/foundation/reco/keyword-opportunities'
import { findLowCtrOutliers, countLowCtrOutliers } from '../lib/foundation/reco/ctr-outliers'
import { findKeywordCannibalization } from '../lib/foundation/reco/keyword-cannibalization'
import { brandTermsFor } from '../lib/foundation/reco/brand'
import { bandOf } from '../lib/foundation/reco/keyword-intelligence'

const row = (over: Partial<{ query: string; page: string; clicks: number; impressions: number; ctr: number; position: number }> = {}) => ({
  query: 'q', page: 'https://acme.com/p', clicks: 0, impressions: 100, ctr: 0, position: 15, ...over,
})

describe('striking distance means one thing', () => {
  const rows = [
    row({ query: 'page-one', position: 6.9, impressions: 500 }),
    row({ query: 'page-two', position: 15.0, impressions: 500 }),
  ]

  it('the 11-20 window excludes a page-one result the bands call "Page 1"', () => {
    // Previously the panel defaulted to 4-20 and listed #6.9 items under a
    // heading the band card defined as 11-20.
    const out = findKeywordOpportunities(rows, 25, { min: 11, max: 20 })
    expect(out.map((o) => o.query)).toEqual(['page-two'])
  })

  it('agrees with bandOf on both boundaries', () => {
    expect(bandOf(6.9)).toBe('page1')
    expect(bandOf(15)).toBe('striking')
    const striking = findKeywordOpportunities(rows, 25, { min: 11, max: 20 })
    expect(striking.every((o) => bandOf(o.position) === 'striking')).toBe(true)
  })

  it('still supports the wider window for callers that want it', () => {
    expect(findKeywordOpportunities(rows, 25, { min: 4, max: 20 })).toHaveLength(2)
  })
})

describe('counts are totals, not the display cap', () => {
  const many = Array.from({ length: 300 }, (_, i) => row({ query: `k${i}`, position: 15, impressions: 100 + i }))

  it('counts every qualifying row regardless of the limit', () => {
    expect(findKeywordOpportunities(many, 25, { min: 11, max: 20 })).toHaveLength(25)
    expect(countKeywordOpportunities(many, { min: 11, max: 20 })).toBe(300)
  })

  it('counts low-CTR findings beyond the cap too', () => {
    const unclicked = Array.from({ length: 40 }, (_, i) =>
      row({ query: `u${i}`, position: 5, impressions: 500, clicks: 0, ctr: 0 }))
    expect(findLowCtrOutliers(unclicked, 25)).toHaveLength(25)
    expect(countLowCtrOutliers(unclicked)).toBe(40)
  })
})

describe('low-CTR works on a site where nothing is clicked', () => {
  // envuetelematics.com: 73,063 impressions, 63 clicks, 0.1% site-wide CTR. The
  // median CTR in nearly every position bucket is exactly 0, so the relative
  // rule's `cohortMedianCtr <= 0` guard skipped every row and the panel read
  // "no keyword is clicking below its peers" — on a site where almost nothing
  // is clicked at all.
  const allZeroCtr = [
    row({ query: 'a', position: 4, impressions: 1000, clicks: 0, ctr: 0 }),
    row({ query: 'b', position: 5, impressions: 800, clicks: 0, ctr: 0 }),
    row({ query: 'c', position: 6, impressions: 600, clicks: 0, ctr: 0 }),
  ]

  it('flags page-one keywords that are never clicked', () => {
    const out = findLowCtrOutliers(allZeroCtr, 25)
    expect(out.length).toBeGreaterThan(0)
    expect(out.every((o) => o.kind === 'absolute')).toBe(true)
    expect(out[0].cohortMedianCtr).toBeNull()
  })

  it('orders the biggest lost audience first', () => {
    expect(findLowCtrOutliers(allZeroCtr, 25)[0].query).toBe('a')
  })

  it('ignores a page-one keyword too rarely shown to judge', () => {
    expect(findLowCtrOutliers([row({ position: 5, impressions: 40, clicks: 0, ctr: 0 })], 25)).toEqual([])
  })

  it('ignores an unclicked keyword buried past page one', () => {
    // Nobody clicks position 40. That is a ranking problem, not a title problem.
    expect(findLowCtrOutliers([row({ position: 40, impressions: 5000, clicks: 0, ctr: 0 })], 25)).toEqual([])
  })

  it('does not flag a keyword that IS being clicked', () => {
    expect(findLowCtrOutliers([row({ position: 5, impressions: 1000, clicks: 12, ctr: 0.012 })], 25)).toEqual([])
  })

  it('still finds relative outliers, and never reports the same row twice', () => {
    const mixed = [
      row({ query: 'healthy1', position: 5, impressions: 1000, clicks: 100, ctr: 0.1 }),
      row({ query: 'healthy2', position: 5, impressions: 1000, clicks: 100, ctr: 0.1 }),
      row({ query: 'healthy3', position: 5, impressions: 1000, clicks: 90, ctr: 0.09 }),
      row({ query: 'laggard', position: 5, impressions: 1000, clicks: 5, ctr: 0.005 }),
      row({ query: 'zero', position: 5, impressions: 1000, clicks: 0, ctr: 0 }),
    ]
    const out = findLowCtrOutliers(mixed, 25)
    expect(out.find((o) => o.query === 'laggard')?.kind).toBe('relative')
    expect(out.find((o) => o.query === 'zero')?.kind).toBe('absolute')
    expect(out.filter((o) => o.query === 'zero')).toHaveLength(1)
  })
})

describe('cannibalization ignores brand queries', () => {
  const terms = brandTermsFor({ domain: 'envuetelematics.com', competitorDomains: ['geotab.com'] })
  const rows = [
    // The real top-two findings, both false positives.
    { query: 'envue', page: 'https://envuetelematics.com/', clicks: 1, impressions: 400, position: 1 },
    { query: 'envue', page: 'https://envuetelematics.com/about-envue/', clicks: 0, impressions: 200, position: 4 },
    { query: 'geotab', page: 'https://envuetelematics.com/what-is-geotab/', clicks: 2, impressions: 300, position: 9 },
    { query: 'geotab', page: 'https://envuetelematics.com/compare/', clicks: 0, impressions: 100, position: 14 },
    // A genuine one.
    { query: 'fleet fuel management', page: 'https://envuetelematics.com/fuel/', clicks: 1, impressions: 300, position: 12 },
    { query: 'fleet fuel management', page: 'https://envuetelematics.com/blog/fuel-waste/', clicks: 0, impressions: 150, position: 18 },
  ]

  it('marks the brand and rival-brand queries', () => {
    const out = findKeywordCannibalization(rows, 50, { brandTerms: terms })
    expect(out.find((c) => c.query === 'envue')!.isBrand).toBe(true)
    expect(out.find((c) => c.query === 'geotab')!.isBrand).toBe(true)
  })

  it('leaves the real finding unflagged', () => {
    const out = findKeywordCannibalization(rows, 50, { brandTerms: terms })
    expect(out.find((c) => c.query === 'fleet fuel management')!.isBrand).toBe(false)
  })

  it('filtering by isBrand leaves only the genuine finding', () => {
    const real = findKeywordCannibalization(rows, 50, { brandTerms: terms }).filter((c) => !c.isBrand)
    expect(real.map((c) => c.query)).toEqual(['fleet fuel management'])
  })

  it('flags nothing as brand when no terms are supplied', () => {
    expect(findKeywordCannibalization(rows, 50).every((c) => c.isBrand === false)).toBe(true)
  })
})
