import { describe, it, expect } from 'vitest'
import {
  buildCitationLandscape,
  buildQueryGuidance,
  bestOwnPageFor,
  hostBelongsTo,
  latestPerQuery,
  promptFor,
  recommendPrompts,
  type CitationSnapshotLike,
} from '../lib/foundation/ai/landscape'

const OURS = 'acme.com'

function snap(over: Partial<CitationSnapshotLike> = {}): CitationSnapshotLike {
  return {
    query: 'best crm', available: true, cited: false, position: null,
    checkedAt: '2026-08-09T00:00:00Z',
    sources: [
      { url: 'https://rival.com/crm', host: 'rival.com', position: 1 },
      { url: 'https://g2.com/crm', host: 'g2.com', position: 2 },
    ],
    answer: 'Several CRMs stand out.',
    ...over,
  }
}

describe('hostBelongsTo', () => {
  it('accepts subdomains of the domain', () => {
    expect(hostBelongsTo('docs.acme.com', 'acme.com')).toBe(true)
    expect(hostBelongsTo('acme.com', 'acme.com')).toBe(true)
  })
  it('ignores www and case on both sides', () => {
    expect(hostBelongsTo('WWW.Acme.com', 'acme.com')).toBe(true)
    expect(hostBelongsTo('acme.com', 'https://www.ACME.com/path')).toBe(true)
  })
  it('does not match a domain that merely ends with the same letters', () => {
    expect(hostBelongsTo('notacme.com', 'acme.com')).toBe(false)
    expect(hostBelongsTo('acme.com.evil.net', 'acme.com')).toBe(false)
  })
  it('is false for empty input rather than matching everything', () => {
    expect(hostBelongsTo('', 'acme.com')).toBe(false)
    expect(hostBelongsTo('acme.com', '')).toBe(false)
  })
})

describe('latestPerQuery', () => {
  it('keeps only the newest check per query', () => {
    const out = latestPerQuery([
      { query: 'a', checkedAt: '2026-01-01T00:00:00Z' },
      { query: 'a', checkedAt: '2026-06-01T00:00:00Z' },
      { query: 'b', checkedAt: '2026-03-01T00:00:00Z' },
    ])
    expect(out).toHaveLength(2)
    expect(out.find((s) => s.query === 'a')!.checkedAt).toBe('2026-06-01T00:00:00Z')
  })
})

describe('buildCitationLandscape', () => {
  it('names who was cited when we were not', () => {
    const l = buildCitationLandscape({ snapshots: [snap()], ourDomain: OURS, competitorDomains: ['rival.com'] })
    expect(l.queriesWhereWeAppear).toBe(0)
    expect(l.comparisons[0].citedInstead.map((c) => c.host)).toEqual(['rival.com', 'g2.com'])
    expect(l.comparisons[0].citedInstead[0].isCompetitor).toBe(true)
    expect(l.comparisons[0].citedInstead[1].isCompetitor).toBe(false)
  })

  it('excludes failed checks instead of counting them as "not cited"', () => {
    // A check that could not run is not evidence of absence.
    const l = buildCitationLandscape({
      snapshots: [snap({ query: 'broken', available: false, sources: [] }), snap({ query: 'ok' })],
      ourDomain: OURS,
    })
    expect(l.queriesTracked).toBe(2)
    expect(l.queriesAnalysed).toBe(1)
    expect(l.comparisons.map((c) => c.query)).toEqual(['ok'])
  })

  it('excludes an available check that returned no sources at all', () => {
    const l = buildCitationLandscape({ snapshots: [snap({ sources: [] })], ourDomain: OURS })
    expect(l.queriesAnalysed).toBe(0)
    expect(l.domains).toEqual([])
  })

  it('counts a domain once per query even when it supplies two sources', () => {
    const l = buildCitationLandscape({
      snapshots: [snap({
        sources: [
          { url: 'https://rival.com/a', host: 'rival.com', position: 1 },
          { url: 'https://rival.com/b', host: 'rival.com', position: 2 },
        ],
      })],
      ourDomain: OURS,
    })
    const rival = l.domains.find((d) => d.host === 'rival.com')!
    expect(rival.timesCited).toBe(1)
    expect(rival.bestPosition).toBe(1)
    expect(rival.shareOfVoice).toBe(1)
  })

  it('measures share of voice across the tracked query set', () => {
    const l = buildCitationLandscape({
      snapshots: [
        snap({ query: 'q1', sources: [{ url: 'https://rival.com/a', host: 'rival.com', position: 1 }] }),
        snap({ query: 'q2', sources: [{ url: 'https://rival.com/b', host: 'rival.com', position: 1 }] }),
        snap({ query: 'q3', sources: [{ url: 'https://other.com/c', host: 'other.com', position: 1 }] }),
      ],
      ourDomain: OURS,
    })
    expect(l.domains.find((d) => d.host === 'rival.com')!.shareOfVoice).toBeCloseTo(2 / 3, 6)
    expect(l.domains.find((d) => d.host === 'other.com')!.shareOfVoice).toBeCloseTo(1 / 3, 6)
  })

  it('flags our own domain and counts where we appear', () => {
    const l = buildCitationLandscape({
      snapshots: [snap({
        cited: true, position: 2,
        sources: [
          { url: 'https://rival.com/a', host: 'rival.com', position: 1 },
          { url: 'https://blog.acme.com/x', host: 'blog.acme.com', position: 2 },
        ],
      })],
      ourDomain: OURS,
    })
    expect(l.queriesWhereWeAppear).toBe(1)
    expect(l.domains.find((d) => d.host === 'blog.acme.com')!.isUs).toBe(true)
  })

  it('puts the queries we are losing first — those are the work', () => {
    const l = buildCitationLandscape({
      snapshots: [snap({ query: 'won', cited: true, position: 1 }), snap({ query: 'lost', cited: false })],
      ourDomain: OURS,
    })
    expect(l.comparisons[0].query).toBe('lost')
  })

  it('ranks domains by how many queries they win', () => {
    const l = buildCitationLandscape({
      snapshots: [
        snap({ query: 'q1', sources: [{ url: 'https://a.com/1', host: 'a.com', position: 1 }, { url: 'https://b.com/1', host: 'b.com', position: 2 }] }),
        snap({ query: 'q2', sources: [{ url: 'https://b.com/2', host: 'b.com', position: 1 }] }),
        snap({ query: 'q3', sources: [{ url: 'https://b.com/3', host: 'b.com', position: 1 }] }),
      ],
      ourDomain: OURS,
    })
    expect(l.domains[0].host).toBe('b.com')
    expect(l.domains[0].timesCited).toBe(3)
  })

  it('returns an empty landscape for no snapshots rather than throwing', () => {
    const l = buildCitationLandscape({ snapshots: [], ourDomain: OURS })
    expect(l).toMatchObject({ queriesTracked: 0, queriesAnalysed: 0, queriesWhereWeAppear: 0, domains: [], comparisons: [] })
  })
})

describe('promptFor', () => {
  it('turns a Google question into the sentence a person types into an assistant', () => {
    expect(promptFor('how much does a crm cost', 'question')).toBe('How much does a crm cost?')
  })
  it('does not double up an existing question mark', () => {
    expect(promptFor('what is a crm?', 'question')).toBe('What is a crm?')
  })
  it('asks a comparison as a decision', () => {
    expect(promptFor('crm vs erp', 'comparison')).toBe('Crm vs erp — which should I choose, and why?')
  })
  it('phrases a "best of" query so it stays grammatical either way', () => {
    // "What is the top crm tools?" would be wrong; "Recommend the ..." never is.
    expect(promptFor('best crm for agencies', 'recommendation')).toBe('Recommend the best crm for agencies.')
    expect(promptFor('top crm tools', 'recommendation')).toBe('Recommend the top crm tools.')
  })
  it('returns empty for an empty query instead of stray punctuation', () => {
    expect(promptFor('   ', 'question')).toBe('')
  })
})

describe('recommendPrompts', () => {
  const keywords = [
    { query: 'how much does a crm cost', impressions: 900, position: 22 },
    { query: 'best crm for agencies', impressions: 700, position: 14 },
    { query: 'salesforce vs hubspot', impressions: 500, position: 30 },
    { query: 'acme login', impressions: 5000, position: 1 },
    { query: 'crm', impressions: 4000, position: 18 },
  ]

  it('only suggests conversational shapes, not navigational or bare terms', () => {
    const out = recommendPrompts({ keywords, trackedQueries: [] })
    expect(out.map((p) => p.sourceQuery)).toEqual([
      'how much does a crm cost', 'best crm for agencies', 'salesforce vs hubspot',
    ])
    // "acme login" has the most impressions by far and is still excluded —
    // nobody asks an assistant to log them in.
    expect(out.some((p) => p.sourceQuery === 'acme login')).toBe(false)
  })

  it('classifies each shape from the query itself', () => {
    const out = recommendPrompts({ keywords, trackedQueries: [] })
    expect(out.find((p) => p.sourceQuery === 'how much does a crm cost')!.shape).toBe('question')
    expect(out.find((p) => p.sourceQuery === 'best crm for agencies')!.shape).toBe('recommendation')
    expect(out.find((p) => p.sourceQuery === 'salesforce vs hubspot')!.shape).toBe('comparison')
  })

  it('orders by real impressions', () => {
    const out = recommendPrompts({ keywords, trackedQueries: [] })
    expect(out.map((p) => p.impressions)).toEqual([900, 700, 500])
  })

  it('skips queries already being tracked, matching the query or the built prompt', () => {
    const byQuery = recommendPrompts({ keywords, trackedQueries: ['how much does a crm cost'] })
    expect(byQuery.some((p) => p.sourceQuery === 'how much does a crm cost')).toBe(false)

    const byPrompt = recommendPrompts({ keywords, trackedQueries: ['How much does a crm cost?'] })
    expect(byPrompt.some((p) => p.sourceQuery === 'how much does a crm cost')).toBe(false)
  })

  it('does not emit the same prompt twice from two similar queries', () => {
    const out = recommendPrompts({
      keywords: [
        { query: 'what is a crm', impressions: 100, position: 10 },
        { query: 'What is a CRM', impressions: 90, position: 11 },
      ],
      trackedQueries: [],
    })
    expect(out).toHaveLength(1)
  })

  it('cites the real impression count in its reason', () => {
    const [p] = recommendPrompts({ keywords, trackedQueries: [] })
    expect(p.reason).toContain('900')
  })

  it('honours the limit and survives an empty corpus', () => {
    expect(recommendPrompts({ keywords, trackedQueries: [], limit: 2 })).toHaveLength(2)
    expect(recommendPrompts({ keywords: [], trackedQueries: [] })).toEqual([])
  })
})

describe('bestOwnPageFor', () => {
  const pages = [
    { url: 'https://acme.com/crm-pricing', title: 'CRM Pricing' },
    { url: 'https://acme.com/careers', title: 'Careers' },
  ]
  it('finds the page that genuinely covers the query', () => {
    expect(bestOwnPageFor('crm pricing', pages)!.url).toBe('https://acme.com/crm-pricing')
  })
  it('returns null rather than claiming an incidental match is the topic page', () => {
    expect(bestOwnPageFor('warehouse robotics automation', pages)).toBeNull()
  })
  it('returns null for a query with no meaningful words', () => {
    expect(bestOwnPageFor('the and for', pages)).toBeNull()
  })
})

describe('buildQueryGuidance', () => {
  function comparisonFor(over: Partial<CitationSnapshotLike> = {}) {
    return buildCitationLandscape({
      snapshots: [snap(over)], ourDomain: OURS, competitorDomains: ['rival.com'],
    }).comparisons[0]
  }

  it('names the competitors in the answer', () => {
    const g = buildQueryGuidance({ comparison: comparisonFor(), ourDomain: OURS, competitorDomains: ['rival.com'] })
    expect(g.observations.some((o) => o.detail.includes('rival.com'))).toBe(true)
  })

  it('says placement matters when the answer rests on independent sites', () => {
    const g = buildQueryGuidance({
      comparison: comparisonFor({
        sources: [
          { url: 'https://g2.com/a', host: 'g2.com', position: 1 },
          { url: 'https://reddit.com/b', host: 'reddit.com', position: 2 },
          { url: 'https://capterra.com/c', host: 'capterra.com', position: 3 },
        ],
      }),
      ourDomain: OURS,
      competitorDomains: ['rival.com'],
    })
    expect(g.observations.some((o) => /listed and reviewed on those sites/.test(o.detail))).toBe(true)
  })

  it('says plainly when no page of ours covers the topic', () => {
    const g = buildQueryGuidance({ comparison: comparisonFor(), ourDomain: OURS, pages: [{ url: 'https://acme.com/careers', title: 'Careers' }] })
    expect(g.ourPage).toBeNull()
    expect(g.observations.some((o) => /cannot cite a page that does not exist/.test(o.detail))).toBe(true)
  })

  it('describes our page without promising a change would win the citation', () => {
    const g = buildQueryGuidance({
      comparison: comparisonFor({ query: 'best crm' }),
      ourDomain: OURS,
      pages: [{ url: 'https://acme.com/best-crm', title: 'Best CRM', wordCount: 320, hasFaq: false }],
    })
    const detail = g.observations.find((o) => o.label === 'Your page for this topic')!.detail
    expect(detail).toContain('320')
    expect(detail).toContain('no FAQ markup')
    // The honesty line: no claim that fixing it produces a citation.
    expect(detail).toMatch(/not something this tool can measure/)
  })

  it('reports our source position when we are cited', () => {
    const g = buildQueryGuidance({
      comparison: comparisonFor({
        cited: true, position: 2,
        sources: [
          { url: 'https://rival.com/a', host: 'rival.com', position: 1 },
          { url: 'https://acme.com/x', host: 'acme.com', position: 2 },
        ],
      }),
      ourDomain: OURS,
      competitorDomains: ['rival.com'],
    })
    expect(g.weAreCited).toBe(true)
    expect(g.observations.some((o) => o.label === 'You are cited')).toBe(true)
  })

  it('notes when the whole answer rests on very few sources', () => {
    const g = buildQueryGuidance({
      comparison: comparisonFor({ sources: [{ url: 'https://rival.com/a', host: 'rival.com', position: 1 }] }),
      ourDomain: OURS,
      competitorDomains: ['rival.com'],
    })
    expect(g.observations.some((o) => o.label === 'Concentrated answer')).toBe(true)
  })
})
