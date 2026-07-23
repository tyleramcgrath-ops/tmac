// Keyword cannibalization: pure, real-GSC-data-only detection of the same
// query splitting impressions across multiple distinct pages. No invented
// pages — only queries actually observed on 2+ different real pages.

import { describe, expect, it } from 'vitest'
import { findKeywordCannibalization, type GscCannibalizationRow } from '../lib/foundation/reco/keyword-cannibalization'

function row(over: Partial<GscCannibalizationRow>): GscCannibalizationRow {
  return { query: 'q', page: '/a', clicks: 0, impressions: 20, position: 10, ...over }
}

describe('findKeywordCannibalization: real split-signal queries only', () => {
  it('flags a query with impressions split across two distinct real pages', () => {
    const rows = [
      row({ query: 'roof repair', page: '/roof-repair', impressions: 300, clicks: 10, position: 8 }),
      row({ query: 'roof repair', page: '/blog/roof-repair-guide', impressions: 150, clicks: 3, position: 14 }),
    ]
    const out = findKeywordCannibalization(rows)
    expect(out).toEqual([
      {
        query: 'roof repair',
        totalImpressions: 450,
        pages: [
          { page: '/roof-repair', impressions: 300, clicks: 10, position: 8 },
          { page: '/blog/roof-repair-guide', impressions: 150, clicks: 3, position: 14 },
        ],
      },
    ])
  })

  it('does not flag a query with only one real page', () => {
    const rows = [row({ query: 'solo query', page: '/only-page', impressions: 500 })]
    expect(findKeywordCannibalization(rows)).toEqual([])
  })

  it('ignores a page with negligible impressions when deciding "distinct" pages', () => {
    const rows = [
      row({ query: 'q', page: '/main', impressions: 200 }),
      row({ query: 'q', page: '/noise', impressions: 1 }),
    ]
    expect(findKeywordCannibalization(rows)).toEqual([])
  })

  it('ranks by total impressions across all its pages, highest first', () => {
    const rows = [
      row({ query: 'low', page: '/a', impressions: 20 }),
      row({ query: 'low', page: '/b', impressions: 20 }),
      row({ query: 'high', page: '/a', impressions: 400 }),
      row({ query: 'high', page: '/b', impressions: 300 }),
    ]
    expect(findKeywordCannibalization(rows).map((c) => c.query)).toEqual(['high', 'low'])
  })

  it('caps at the requested limit', () => {
    const rows: GscCannibalizationRow[] = []
    for (let i = 0; i < 15; i++) {
      rows.push(row({ query: `k${i}`, page: '/a', impressions: 100 }))
      rows.push(row({ query: `k${i}`, page: '/b', impressions: 100 }))
    }
    expect(findKeywordCannibalization(rows, 3)).toHaveLength(3)
  })

  it('returns nothing for an empty report rather than inventing a conflict', () => {
    expect(findKeywordCannibalization([])).toEqual([])
  })
})
