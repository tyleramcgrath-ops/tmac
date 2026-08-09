import { describe, it, expect } from 'vitest'
import {
  bandOf,
  rollUpKeywords,
  summarizeKeywords,
  pathKey,
  attachLandingOutcomes,
  type GscKeywordRow,
} from '../lib/foundation/reco/keyword-intelligence'

function row(over: Partial<GscKeywordRow> = {}): GscKeywordRow {
  return { query: 'q', page: 'https://example.com/', clicks: 0, impressions: 0, ctr: 0, position: 10, ...over }
}

describe('bandOf', () => {
  it('splits on the boundaries a human actually cares about', () => {
    expect(bandOf(1)).toBe('top3')
    expect(bandOf(3)).toBe('top3')
    expect(bandOf(3.1)).toBe('page1')
    expect(bandOf(10)).toBe('page1')
    expect(bandOf(10.4)).toBe('striking')
    expect(bandOf(20)).toBe('striking')
    expect(bandOf(20.1)).toBe('deep')
    expect(bandOf(99)).toBe('deep')
  })
})

describe('rollUpKeywords', () => {
  it('collapses one row per (query, page) into one row per keyword', () => {
    const out = rollUpKeywords([
      row({ query: 'crm software', page: 'https://example.com/a', clicks: 5, impressions: 100, position: 8 }),
      row({ query: 'crm software', page: 'https://example.com/b', clicks: 1, impressions: 50, position: 14 }),
      row({ query: 'best crm', page: 'https://example.com/a', clicks: 2, impressions: 30, position: 4 }),
    ])
    expect(out).toHaveLength(2)
    const crm = out.find((r) => r.query === 'crm software')!
    expect(crm.clicks).toBe(6)
    expect(crm.impressions).toBe(150)
    expect(crm.pageCount).toBe(2)
  })

  it('recomputes CTR from the rolled-up totals, not by averaging per-row CTRs', () => {
    // Averaging the CTRs would give (0.5 + 0.0)/2 = 25%, weighting a 2-impression
    // row the same as a 10,000-impression one. The real CTR is 1/10002.
    const [k] = rollUpKeywords([
      row({ query: 'k', page: '/a', clicks: 1, impressions: 2, ctr: 0.5 }),
      row({ query: 'k', page: '/b', clicks: 0, impressions: 10000, ctr: 0 }),
    ])
    expect(k.ctr).toBeCloseTo(1 / 10002, 10)
    expect(k.ctr).toBeLessThan(0.01)
  })

  it('weights position by impressions so a rare deep row cannot drag the average down', () => {
    // Unweighted mean would be (4 + 90) / 2 = 47 — "page 5", which is a lie
    // about a keyword that is overwhelmingly seen at position 4.
    const [k] = rollUpKeywords([
      row({ query: 'k', page: '/a', impressions: 5000, position: 4 }),
      row({ query: 'k', page: '/b', impressions: 2, position: 90 }),
    ])
    expect(k.position).toBeCloseTo(4, 1)
    expect(k.band).toBe('page1')
  })

  it('falls back to a plain mean instead of dividing by zero when nothing has impressions', () => {
    const [k] = rollUpKeywords([
      row({ query: 'k', page: '/a', impressions: 0, position: 10 }),
      row({ query: 'k', page: '/b', impressions: 0, position: 20 }),
    ])
    expect(k.position).toBe(15)
    expect(k.ctr).toBe(0)
    expect(Number.isNaN(k.position)).toBe(false)
  })

  it('picks the most-impressed page as the one to edit, breaking ties on clicks', () => {
    const [k] = rollUpKeywords([
      row({ query: 'k', page: '/low', clicks: 0, impressions: 100 }),
      row({ query: 'k', page: '/high', clicks: 9, impressions: 100 }),
    ])
    expect(k.bestPage).toBe('/high')
  })

  it('sorts by impressions — real search demand, before any CTR assumption', () => {
    const out = rollUpKeywords([
      row({ query: 'small', impressions: 10 }),
      row({ query: 'big', impressions: 900 }),
      row({ query: 'mid', impressions: 100 }),
    ])
    expect(out.map((r) => r.query)).toEqual(['big', 'mid', 'small'])
  })

  it('marks keywords already in the rank-tracking list, case- and space-insensitively', () => {
    const out = rollUpKeywords(
      [row({ query: 'Best CRM' }), row({ query: 'untracked thing' })],
      ['  best crm  ']
    )
    expect(out.find((r) => r.query === 'Best CRM')!.tracked).toBe(true)
    expect(out.find((r) => r.query === 'untracked thing')!.tracked).toBe(false)
  })

  it('returns an empty list for an empty corpus rather than throwing', () => {
    expect(rollUpKeywords([])).toEqual([])
  })
})

describe('summarizeKeywords', () => {
  it('counts each keyword into exactly one band', () => {
    const s = summarizeKeywords(
      rollUpKeywords([
        row({ query: 'a', impressions: 10, position: 2 }),
        row({ query: 'b', impressions: 10, position: 7 }),
        row({ query: 'c', impressions: 10, position: 15 }),
        row({ query: 'd', impressions: 10, position: 40 }),
      ])
    )
    expect(s.bands).toEqual({ top3: 1, page1: 1, striking: 1, deep: 1 })
    expect(s.keywords).toBe(4)
  })

  it('reports null — not zero — for CTR and position when there is no data', () => {
    const s = summarizeKeywords([])
    expect(s.ctr).toBeNull()
    expect(s.avgPosition).toBeNull()
    expect(s.clickConcentration).toBeNull()
    expect(s.keywords).toBe(0)
  })

  it('reports null CTR when impressions are zero, instead of a confident 0%', () => {
    const s = summarizeKeywords(rollUpKeywords([row({ query: 'a', clicks: 0, impressions: 0 })]))
    expect(s.ctr).toBeNull()
  })

  it('measures how concentrated clicks are in the top 10 keywords', () => {
    // 10 keywords with 10 clicks each, plus 10 more with 0 — all clicks are in
    // the top 10, so concentration is total (1.0).
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => row({ query: `paid${i}`, clicks: 10, impressions: 100 })),
      ...Array.from({ length: 10 }, (_, i) => row({ query: `free${i}`, clicks: 0, impressions: 100 })),
    ]
    const s = summarizeKeywords(rollUpKeywords(rows))
    expect(s.clickConcentration).toBe(1)

    // Spread evenly across 20 keywords, the top 10 hold exactly half.
    const even = Array.from({ length: 20 }, (_, i) => row({ query: `k${i}`, clicks: 5, impressions: 100 }))
    expect(summarizeKeywords(rollUpKeywords(even)).clickConcentration).toBeCloseTo(0.5, 6)
  })

  it('counts distinct landing pages, not rows', () => {
    const s = summarizeKeywords(
      rollUpKeywords([
        row({ query: 'a', page: '/x', impressions: 10 }),
        row({ query: 'b', page: '/x', impressions: 10 }),
        row({ query: 'c', page: '/y', impressions: 10 }),
      ])
    )
    expect(s.pages).toBe(2)
  })

  it('weights the site-wide average position by impressions', () => {
    const s = summarizeKeywords(
      rollUpKeywords([
        row({ query: 'a', impressions: 1000, position: 3 }),
        row({ query: 'b', impressions: 10, position: 80 }),
      ])
    )
    // Unweighted this would be 41.5; weighted it is ~3.8.
    expect(s.avgPosition!).toBeLessThan(5)
  })
})

describe('pathKey', () => {
  it('reduces a GSC full URL and a GA4 path to the same key', () => {
    expect(pathKey('https://example.com/pricing/')).toBe('/pricing')
    expect(pathKey('/pricing')).toBe('/pricing')
    expect(pathKey('https://www.example.com/pricing')).toBe('/pricing')
  })

  it('keeps the root path as a single slash', () => {
    expect(pathKey('https://example.com/')).toBe('/')
    expect(pathKey('https://example.com')).toBe('/')
    expect(pathKey('/')).toBe('/')
  })

  it('drops query strings and fragments from either shape', () => {
    expect(pathKey('https://example.com/blog?utm_source=x')).toBe('/blog')
    expect(pathKey('/blog?page=2#top')).toBe('/blog')
  })

  it('normalizes a bare path with no leading slash', () => {
    expect(pathKey('pricing')).toBe('/pricing')
  })
})

describe('attachLandingOutcomes', () => {
  it('joins GA4 path metrics onto GSC full-URL keywords', () => {
    const rollups = rollUpKeywords([row({ query: 'k', page: 'https://example.com/pricing/', impressions: 10 })])
    const [k] = attachLandingOutcomes(rollups, [{ page: '/pricing', sessions: 40, conversions: 3, revenue: null }])
    expect(k.landing).toEqual({ sessions: 40, conversions: 3, revenue: null })
  })

  it('returns null for a page GA4 has no data for, rather than zeros', () => {
    const rollups = rollUpKeywords([row({ query: 'k', page: 'https://example.com/ghost', impressions: 10 })])
    const [k] = attachLandingOutcomes(rollups, [{ page: '/other', sessions: 5, conversions: 0, revenue: null }])
    expect(k.landing).toBeNull()
  })

  it('sums GA4 rows that normalize to the same path instead of letting one win', () => {
    const rollups = rollUpKeywords([row({ query: 'k', page: 'https://example.com/blog', impressions: 10 })])
    const [k] = attachLandingOutcomes(rollups, [
      { page: '/blog', sessions: 10, conversions: 1, revenue: 100 },
      { page: '/blog/', sessions: 5, conversions: 2, revenue: 50 },
    ])
    expect(k.landing).toEqual({ sessions: 15, conversions: 3, revenue: 150 })
  })

  it('keeps revenue null when no matching GA4 row reports revenue', () => {
    const rollups = rollUpKeywords([row({ query: 'k', page: 'https://example.com/blog', impressions: 10 })])
    const [k] = attachLandingOutcomes(rollups, [
      { page: '/blog', sessions: 10, conversions: 1, revenue: null },
      { page: '/blog/', sessions: 5, conversions: 2, revenue: null },
    ])
    expect(k.landing!.revenue).toBeNull()
  })

  it('leaves every keyword null when GA4 is not connected (empty page list)', () => {
    const rollups = rollUpKeywords([row({ query: 'k', page: 'https://example.com/x', impressions: 10 })])
    expect(attachLandingOutcomes(rollups, []).every((r) => r.landing === null)).toBe(true)
  })
})
