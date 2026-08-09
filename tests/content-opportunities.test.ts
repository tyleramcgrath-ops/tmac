import { describe, it, expect } from 'vitest'
import {
  findContentOpportunities,
  summarizeOpportunities,
  topicalOverlap,
  type OpportunityPage,
} from '../lib/foundation/content/opportunities'
import type { KeywordRollup } from '../lib/foundation/reco/keyword-intelligence'
import type { CannibalizedQuery } from '../lib/foundation/reco/keyword-cannibalization'

function kw(over: Partial<KeywordRollup> = {}): KeywordRollup {
  return {
    query: 'crm software', clicks: 0, impressions: 500, ctr: 0, position: 12,
    bestPage: 'https://example.com/crm-software', pageCount: 1, band: 'striking',
    tracked: false, ...over,
  }
}
function page(url: string, wordCount?: number, title?: string): OpportunityPage {
  return { url, wordCount, title }
}
function cannibal(over: Partial<CannibalizedQuery> = {}): CannibalizedQuery {
  return {
    query: 'crm pricing',
    totalImpressions: 900,
    pages: [
      { page: 'https://example.com/pricing', impressions: 600, clicks: 12, position: 9 },
      { page: 'https://example.com/plans', impressions: 300, clicks: 3, position: 17 },
    ],
    ...over,
  }
}

describe('topicalOverlap', () => {
  it('reads the URL path, not just the title', () => {
    // Branded title says nothing; the path says everything.
    const p = page('https://example.com/crm-for-agencies', 800, 'Solutions | Acme')
    expect(topicalOverlap('crm for agencies', p)).toBeGreaterThan(0.9)
  })

  it('scores an unrelated page near zero', () => {
    expect(topicalOverlap('crm for agencies', page('https://example.com/careers', 400, 'Careers'))).toBe(0)
  })

  it('ignores stopwords so "best crm guide" is judged on "crm"', () => {
    expect(topicalOverlap('best crm guide', page('https://example.com/crm', 500, 'CRM'))).toBe(1)
  })

  it('treats a query with no meaningful words as fully covered rather than dividing by zero', () => {
    const v = topicalOverlap('the and for', page('https://example.com/x', 100, 'X'))
    expect(v).toBe(1)
    expect(Number.isNaN(v)).toBe(false)
  })

  it('does not throw on an unparseable page URL', () => {
    expect(() => topicalOverlap('crm', page('not a url', 100, 'CRM'))).not.toThrow()
  })
})

describe('findContentOpportunities — expand', () => {
  it('flags a thin page that already ranks on page 1-2', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'crm software', position: 12, impressions: 800 })],
      cannibalization: [],
      pages: [page('https://example.com/crm-software', 240, 'CRM Software')],
    })
    expect(out).toHaveLength(1)
    expect(out[0].action).toBe('expand')
    expect(out[0].targetWordCount).toBe(240)
    expect(out[0].reason).toContain('240')
    expect(out[0].reason).toContain('#12')
  })

  it('leaves a substantial page alone', () => {
    const out = findContentOpportunities({
      keywords: [kw({ position: 12 })],
      cannibalization: [],
      pages: [page('https://example.com/crm-software', 2400, 'CRM Software')],
    })
    expect(out.filter((o) => o.action === 'expand')).toHaveLength(0)
  })

  it('does not flag a page whose word count was never captured', () => {
    // Unknown is not thin. Guessing here would send someone to rewrite a page
    // that may already be 3,000 words.
    const out = findContentOpportunities({
      keywords: [kw({ position: 12 })],
      cannibalization: [],
      pages: [page('https://example.com/crm-software', undefined, 'CRM Software')],
    })
    expect(out.filter((o) => o.action === 'expand')).toHaveLength(0)
  })

  it('ignores keywords already winning — nothing to fix at #2', () => {
    const out = findContentOpportunities({
      keywords: [kw({ position: 2 })],
      cannibalization: [],
      pages: [page('https://example.com/crm-software', 200, 'CRM Software')],
    })
    expect(out.filter((o) => o.action === 'expand')).toHaveLength(0)
  })
})

describe('findContentOpportunities — consolidate', () => {
  it('turns a cannibalized query into one consolidation job naming every page', () => {
    const out = findContentOpportunities({ keywords: [], cannibalization: [cannibal()], pages: [] })
    expect(out).toHaveLength(1)
    expect(out[0].action).toBe('consolidate')
    expect(out[0].pagesInvolved).toEqual(['https://example.com/pricing', 'https://example.com/plans'])
    expect(out[0].targetPage).toBe('https://example.com/pricing') // most impressions
    expect(out[0].clicks).toBe(15)
  })

  it('wins precedence over expand for the same query', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'crm pricing', position: 9, bestPage: 'https://example.com/pricing' })],
      cannibalization: [cannibal({ query: 'crm pricing' })],
      pages: [page('https://example.com/pricing', 100, 'Pricing')],
    })
    expect(out).toHaveLength(1)
    expect(out[0].action).toBe('consolidate')
  })
})

describe('findContentOpportunities — answer', () => {
  it('flags a question whose ranking page barely covers it', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'how much does a crm cost', position: 24, impressions: 300, bestPage: 'https://example.com/about' })],
      cannibalization: [],
      pages: [page('https://example.com/about', 900, 'About Us')],
    })
    expect(out).toHaveLength(1)
    expect(out[0].action).toBe('answer')
  })

  it('leaves a question alone when a page genuinely covers it', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'how much does a crm cost', position: 24, bestPage: 'https://example.com/crm-cost' })],
      cannibalization: [],
      pages: [page('https://example.com/crm-cost', 900, 'How much does a CRM cost')],
    })
    expect(out.filter((o) => o.action === 'answer')).toHaveLength(0)
  })

  it('leaves a question alone when it already ranks in the top 10', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'what is a crm', position: 6, bestPage: 'https://example.com/about' })],
      cannibalization: [],
      pages: [page('https://example.com/about', 900, 'About Us')],
    })
    expect(out.filter((o) => o.action === 'answer')).toHaveLength(0)
  })
})

describe('findContentOpportunities — create', () => {
  it('flags real demand with no page behind it', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'crm migration checklist', position: 41, impressions: 1200, bestPage: 'https://example.com/blog' })],
      cannibalization: [],
      pages: [page('https://example.com/blog', 900, 'Blog')],
    })
    expect(out).toHaveLength(1)
    expect(out[0].action).toBe('create')
    expect(out[0].targetPage).toBeNull()
  })

  it('does not claim a page is missing when one is clearly about the topic', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'crm migration checklist', position: 41, bestPage: 'https://example.com/crm-migration-checklist' })],
      cannibalization: [],
      pages: [page('https://example.com/crm-migration-checklist', 1500, 'CRM Migration Checklist')],
    })
    expect(out).toHaveLength(0)
  })
})

describe('findContentOpportunities — ranking and hygiene', () => {
  it('drops low-impression noise', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'obscure thing', impressions: 3, position: 40, bestPage: 'https://example.com/x' })],
      cannibalization: [cannibal({ totalImpressions: 4 })],
      pages: [page('https://example.com/x', 100, 'X')],
    })
    expect(out).toHaveLength(0)
  })

  it('emits each topic once, even when several passes could claim it', () => {
    const out = findContentOpportunities({
      keywords: [
        kw({ query: 'what is a crm', position: 30, bestPage: 'https://example.com/about' }),
        kw({ query: 'what is a crm', position: 30, bestPage: 'https://example.com/about' }),
      ],
      cannibalization: [],
      pages: [page('https://example.com/about', 400, 'About')],
    })
    expect(out).toHaveLength(1)
  })

  it('ranks a bigger opportunity above a smaller one of the same kind', () => {
    const out = findContentOpportunities({
      keywords: [
        kw({ query: 'small demand', impressions: 100, position: 12, bestPage: 'https://example.com/a' }),
        kw({ query: 'huge demand', impressions: 9000, position: 12, bestPage: 'https://example.com/b' }),
      ],
      cannibalization: [],
      pages: [page('https://example.com/a', 100), page('https://example.com/b', 100)],
    })
    expect(out.map((o) => o.topic)).toEqual(['huge demand', 'small demand'])
  })

  it('puts competitor guesses below measured demand at equal size', () => {
    const out = findContentOpportunities({
      keywords: [kw({ query: 'measured demand', impressions: 100, position: 12, bestPage: 'https://example.com/a' })],
      cannibalization: [],
      pages: [page('https://example.com/a', 100)],
      competitorGaps: [{ title: 'their bet', url: 'https://rival.com/x', competitorDomain: 'rival.com' }],
    })
    expect(out.map((o) => o.action)).toEqual(['expand', 'competitor-gap'])
    expect(out[1].impressions).toBe(0)
    expect(out[1].reason).toContain('not measured demand')
  })

  it('gives every opportunity a stable id that survives a re-run', () => {
    const args = {
      keywords: [kw({ query: 'crm software', position: 12, bestPage: 'https://example.com/a' })],
      cannibalization: [],
      pages: [page('https://example.com/a', 100)],
    }
    expect(findContentOpportunities(args)[0].id).toBe(findContentOpportunities(args)[0].id)
    expect(findContentOpportunities(args)[0].id).toBe('expand:crm-software')
  })

  it('honours the limit', () => {
    const keywords = Array.from({ length: 40 }, (_, i) =>
      kw({ query: `topic ${i}`, impressions: 100 + i, position: 12, bestPage: `https://example.com/p${i}` })
    )
    const pages = keywords.map((k) => page(k.bestPage, 100))
    expect(findContentOpportunities({ keywords, cannibalization: [], pages, limit: 5 })).toHaveLength(5)
  })

  it('returns nothing rather than throwing when there is no data at all', () => {
    expect(findContentOpportunities({ keywords: [], cannibalization: [], pages: [] })).toEqual([])
  })
})

describe('summarizeOpportunities', () => {
  it('counts each action and totals the real impressions behind them', () => {
    const opps = findContentOpportunities({
      keywords: [
        kw({ query: 'expand me', impressions: 500, position: 12, bestPage: 'https://example.com/a' }),
        kw({ query: 'create me', impressions: 300, position: 40, bestPage: 'https://example.com/z' }),
      ],
      cannibalization: [cannibal()],
      pages: [page('https://example.com/a', 100), page('https://example.com/z', 100, 'Unrelated')],
    })
    const s = summarizeOpportunities(opps)
    expect(s.total).toBe(3)
    expect(s.byAction.expand).toBe(1)
    expect(s.byAction.create).toBe(1)
    expect(s.byAction.consolidate).toBe(1)
    expect(s.addressableImpressions).toBe(500 + 300 + 900)
  })

  it('reports null addressable impressions when nothing measurable is behind the list', () => {
    const opps = findContentOpportunities({
      keywords: [], cannibalization: [], pages: [],
      competitorGaps: [{ title: 'a guess', url: 'https://rival.com/x', competitorDomain: 'rival.com' }],
    })
    expect(summarizeOpportunities(opps).addressableImpressions).toBeNull()
  })

  it('zeroes every action bucket for an empty list', () => {
    const s = summarizeOpportunities([])
    expect(s.total).toBe(0)
    expect(Object.values(s.byAction).every((n) => n === 0)).toBe(true)
  })
})
