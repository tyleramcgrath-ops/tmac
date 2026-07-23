// Keyword opportunities: pure, real-GSC-data-only "quick win" ranking. No
// fabricated potential-clicks number — only real position/impressions/clicks
// values, filtered to the near-miss band and ranked by real impressions.

import { describe, expect, it } from 'vitest'
import { findKeywordOpportunities, type GscOpportunityRow } from '../lib/foundation/reco/keyword-opportunities'

function row(over: Partial<GscOpportunityRow>): GscOpportunityRow {
  return { query: 'q', page: '/p', clicks: 0, impressions: 0, ctr: 0, position: 10, ...over }
}

describe('findKeywordOpportunities: real near-miss queries only', () => {
  it('includes a query ranking on page 2 with real impressions', () => {
    const rows = [row({ query: 'best crm', position: 12, impressions: 500, clicks: 3 })]
    const out = findKeywordOpportunities(rows)
    expect(out).toEqual([{ query: 'best crm', page: '/p', position: 12, impressions: 500, clicks: 3, ctr: 0 }])
  })

  it('excludes a query already ranking on page 1 (position < 4) — no room for a "quick win"', () => {
    const rows = [row({ query: 'top spot', position: 2, impressions: 1000 })]
    expect(findKeywordOpportunities(rows)).toEqual([])
  })

  it('excludes a query ranking far outside the near-miss band (position > 20)', () => {
    const rows = [row({ query: 'buried', position: 45, impressions: 1000 })]
    expect(findKeywordOpportunities(rows)).toEqual([])
  })

  it('excludes a query with negligible impressions — not a real opportunity, just noise', () => {
    const rows = [row({ query: 'rare phrase', position: 8, impressions: 2 })]
    expect(findKeywordOpportunities(rows)).toEqual([])
  })

  it('ranks by real impressions, highest first', () => {
    const rows = [
      row({ query: 'low', position: 10, impressions: 50 }),
      row({ query: 'high', position: 10, impressions: 900 }),
      row({ query: 'mid', position: 10, impressions: 300 }),
    ]
    expect(findKeywordOpportunities(rows).map((r) => r.query)).toEqual(['high', 'mid', 'low'])
  })

  it('caps at the requested limit', () => {
    const rows = Array.from({ length: 15 }, (_, i) => row({ query: `k${i}`, position: 10, impressions: 100 + i }))
    expect(findKeywordOpportunities(rows, 3)).toHaveLength(3)
  })

  it('returns nothing for an empty report rather than inventing an opportunity', () => {
    expect(findKeywordOpportunities([])).toEqual([])
  })
})
