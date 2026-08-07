// Tests for the scenario simulator.
//
// The failure mode worth guarding against here is not a crash — it is the
// simulator quietly inventing confidence: counting exposure it cannot justify,
// reporting a median from one data point without saying so, or letting an
// absent signal read as a zero. Each test below pins one of those.

import { describe, expect, it } from 'vitest'
import { simulate } from '../apps/north-star-hq/lib/foundation/simulate/engine'
import type {
  RankSnapshot,
  Recommendation,
  RecommendationStatus,
  TrackedKeyword,
  WpDeployment,
} from '../apps/north-star-hq/lib/foundation/types'

function rec(over: Partial<Recommendation> & { id: string }): Recommendation {
  return {
    projectId: 'p1',
    scanId: 's1',
    issueId: `issue-${over.id}`,
    ruleId: 'title-length',
    ruleVersion: 1,
    ruleCategory: 'content',
    ruleSeverity: 'warning',
    businessContext: 'standard',
    title: 'x',
    category: 'content',
    severity: 'warning',
    status: 'open' as RecommendationStatus,
    reasoning: 'x',
    evidence: { affectedUrls: [], facts: [] },
    confidence: 80,
    confidenceBasis: 'x',
    expectedImpact: { category: 'content', size: 'low', note: '' },
    risk: { level: 'low', note: '' },
    createdAt: '2026-01-01T00:00:00Z',
    history: [],
    ...over,
  } as Recommendation
}

function kw(keyword: string): TrackedKeyword {
  return { id: keyword, projectId: 'p1', keyword, addedBy: 'u1', createdAt: '2026-01-01T00:00:00Z' }
}

function snap(keyword: string, url: string | null, position: number | null, checkedAt: string): RankSnapshot {
  return { id: `${keyword}-${checkedAt}`, projectId: 'p1', keyword, position, url, checkedAt }
}

function dep(id: string, recommendationId: string, outcome: WpDeployment['outcome']): WpDeployment {
  return {
    id,
    projectId: 'p1',
    connectionId: 'c1',
    postId: 1,
    postType: 'posts',
    postUrl: 'https://a.test/x',
    before: { title: '', metaDescription: '', contentHash: '', content: '' },
    after: {},
    approvedBy: 'u1',
    approvedAt: '2026-01-01T00:00:00Z',
    reason: '',
    recommendationId,
    status: 'verified',
    verification: null,
    result: '',
    createdAt: '2026-01-01T00:00:00Z',
    outcome,
  } as WpDeployment
}

const measured = (clicks: number, position: number): WpDeployment['outcome'] => ({
  capturedAt: '2026-02-01T00:00:00Z',
  skipped: false,
  before: { from: '', to: '', clicks: 0, impressions: 0, ctr: 0, position: 0 },
  after: { from: '', to: '', clicks: 0, impressions: 0, ctr: 0, position: 0 },
  delta: { clicks, impressions: 0, ctr: 0, position },
})

const empty = { recommendations: [], pages: [], keywords: [], rankSnapshots: [], deployments: [] }

describe('exposure', () => {
  it('matches URLs across protocol, www and trailing-slash differences', () => {
    // The crawl, Search Console and rank snapshots disagree on URL form. Exact
    // matching would silently report "this fix affects nothing".
    const r = rec({ id: 'r1', evidence: { affectedUrls: ['https://www.a.test/pricing/'], facts: [] } })
    const sim = simulate({
      ...empty,
      selectedIds: ['r1'],
      recommendations: [r],
      keywords: [kw('crm pricing')],
      rankSnapshots: [snap('crm pricing', 'http://a.test/pricing', 4, '2026-03-01T00:00:00Z')],
    })
    expect(sim.exposure.keywordsOnTouchedPages).toEqual([
      { keyword: 'crm pricing', position: 4, url: 'http://a.test/pricing' },
    ])
  })

  it('uses the most recent snapshot per keyword, not the first row seen', () => {
    const r = rec({ id: 'r1', evidence: { affectedUrls: ['https://a.test/new'], facts: [] } })
    const sim = simulate({
      ...empty,
      selectedIds: ['r1'],
      recommendations: [r],
      keywords: [kw('k')],
      rankSnapshots: [
        snap('k', 'https://a.test/new', 12, '2026-03-01T00:00:00Z'),
        snap('k', 'https://a.test/old', 3, '2026-01-01T00:00:00Z'),
      ],
    })
    expect(sim.exposure.keywordsOnTouchedPages).toHaveLength(1)
    expect(sim.exposure.keywordsOnTouchedPages[0].position).toBe(12)
  })

  it('ignores a keyword whose latest snapshot has no ranking URL', () => {
    // position null / url null means "not found". It has no page to attribute,
    // so it must not be counted as affected.
    const r = rec({ id: 'r1', evidence: { affectedUrls: ['https://a.test/x'], facts: [] } })
    const sim = simulate({
      ...empty,
      selectedIds: ['r1'],
      recommendations: [r],
      keywords: [kw('k')],
      rankSnapshots: [snap('k', null, null, '2026-03-01T00:00:00Z')],
    })
    expect(sim.exposure.keywordsOnTouchedPages).toEqual([])
    expect(sim.exposure.keywordsTracked).toBe(1)
  })

  it('deduplicates pages touched by more than one recommendation', () => {
    const a = rec({ id: 'r1', evidence: { affectedUrls: ['https://a.test/p', 'https://a.test/q'], facts: [] } })
    const b = rec({ id: 'r2', evidence: { affectedUrls: ['https://a.test/p/'], facts: [] } })
    const sim = simulate({ ...empty, selectedIds: ['r1', 'r2'], recommendations: [a, b] })
    expect(sim.exposure.pagesTouched).toBe(2)
  })

  it('reports ids it could not resolve instead of silently dropping them', () => {
    const sim = simulate({ ...empty, selectedIds: ['ghost'], recommendations: [] })
    expect(sim.selected.count).toBe(0)
    expect(sim.selected.unknownIds).toEqual(['ghost'])
  })
})

describe('deterministic deltas', () => {
  it('counts only open items, and only the ones selected', () => {
    const recs = [
      rec({ id: 'r1', severity: 'critical', status: 'open' }),
      rec({ id: 'r2', severity: 'critical', status: 'open' }),
      rec({ id: 'r3', severity: 'critical', status: 'verified' }), // already done
      rec({ id: 'r4', severity: 'warning', status: 'open' }),
    ]
    const sim = simulate({ ...empty, selectedIds: ['r1', 'r3'], recommendations: recs })
    const crit = sim.deterministic.find((d) => d.metric.includes('critical'))!
    expect(crit.before).toBe(2) // r3 is verified, never counted as open
    expect(crit.after).toBe(1)
    // r4 was not selected, so warnings do not appear at all.
    expect(sim.deterministic.some((d) => d.metric.includes('warning'))).toBe(false)
  })

  it('counts a regressed issue as open — it is live on the site again', () => {
    const recs = [rec({ id: 'r1', severity: 'critical', status: 'regressed' })]
    const sim = simulate({ ...empty, selectedIds: ['r1'], recommendations: recs })
    expect(sim.deterministic.find((d) => d.metric.includes('critical'))).toMatchObject({ before: 1, after: 0 })
  })

  it('moves the grounding score only for pages observed to have no schema', () => {
    const recs = [
      rec({ id: 'r1', category: 'schema', ruleCategory: 'schema', evidence: { affectedUrls: ['https://a.test/b'], facts: [] } }),
      // Already has schema — fixing it cannot raise coverage.
      rec({ id: 'r2', category: 'schema', ruleCategory: 'schema', evidence: { affectedUrls: ['https://a.test/a'], facts: [] } }),
    ]
    const sim = simulate({
      ...empty,
      selectedIds: ['r1', 'r2'],
      recommendations: recs,
      pages: [
        { url: 'https://a.test/a', schemaTypes: ['Organization'] },
        { url: 'https://a.test/b', schemaTypes: [] },
        { url: 'https://a.test/c', schemaTypes: [] },
        { url: 'https://a.test/d', schemaTypes: [] },
      ],
    })
    const g = sim.deterministic.find((d) => d.metric.includes('grounding'))!
    expect(g.before).toBe(25) // 1 of 4
    expect(g.after).toBe(50) // 2 of 4 — only /b gained, not /a
  })

  it('never reports a grounding delta when the crawl captured no schema signal', () => {
    // Absent signal must stay absent. Treating it as "no schema" would invent
    // a 0% baseline and then a fake improvement off it.
    const r = rec({ id: 'r1', category: 'schema', ruleCategory: 'schema', evidence: { affectedUrls: ['https://a.test/b'], facts: [] } })
    const sim = simulate({ ...empty, selectedIds: ['r1'], recommendations: [r], pages: [{ url: 'https://a.test/b' }] })
    expect(sim.deterministic.some((d) => d.metric.includes('grounding'))).toBe(false)
  })

  it('does not move grounding for a non-schema fix on an empty page', () => {
    const r = rec({ id: 'r1', category: 'content', ruleCategory: 'content', evidence: { affectedUrls: ['https://a.test/b'], facts: [] } })
    const sim = simulate({ ...empty, selectedIds: ['r1'], recommendations: [r], pages: [{ url: 'https://a.test/b', schemaTypes: [] }] })
    expect(sim.deterministic.some((d) => d.metric.includes('grounding'))).toBe(false)
  })
})

describe('base rates', () => {
  it('reports the median of real outcome deltas with its sample size', () => {
    const recs = [
      rec({ id: 'r1', ruleId: 'meta-description' }),
      rec({ id: 'h1', ruleId: 'meta-description' }),
      rec({ id: 'h2', ruleId: 'meta-description' }),
      rec({ id: 'h3', ruleId: 'meta-description' }),
    ]
    const sim = simulate({
      ...empty,
      selectedIds: ['r1'],
      recommendations: recs,
      deployments: [dep('d1', 'h1', measured(10, -1)), dep('d2', 'h2', measured(30, -3)), dep('d3', 'h3', measured(20, -2))],
    })
    expect(sim.baseRates).toHaveLength(1)
    expect(sim.baseRates[0]).toMatchObject({ observations: 3, measured: 3, medianClicksDelta: 20, medianPositionDelta: -2 })
    expect(sim.baseRates[0].caveat).toContain('anecdote')
  })

  it('calls small samples an anecdote and larger ones observational', () => {
    const mk = (n: number) => {
      const recs = [rec({ id: 'r1', ruleId: 'x' }), ...Array.from({ length: n }, (_, i) => rec({ id: `h${i}`, ruleId: 'x' }))]
      const deps = Array.from({ length: n }, (_, i) => dep(`d${i}`, `h${i}`, measured(1, 0)))
      return simulate({ ...empty, selectedIds: ['r1'], recommendations: recs, deployments: deps }).baseRates[0]
    }
    expect(mk(4).caveat).toContain('anecdote')
    expect(mk(6).caveat).toContain('observational')
    expect(mk(6).caveat).not.toContain('anecdote')
  })

  it('separates skipped captures from measured ones instead of averaging them in', () => {
    const recs = [rec({ id: 'r1', ruleId: 'x' }), rec({ id: 'h1', ruleId: 'x' }), rec({ id: 'h2', ruleId: 'x' })]
    const sim = simulate({
      ...empty,
      selectedIds: ['r1'],
      recommendations: recs,
      deployments: [dep('d1', 'h1', measured(50, -5)), dep('d2', 'h2', { capturedAt: '2026-02-01T00:00:00Z', skipped: true, reason: 'no GSC' })],
    })
    expect(sim.baseRates[0]).toMatchObject({ observations: 2, measured: 1, medianClicksDelta: 50 })
  })

  it('reports nulls, not zeros, when every capture was skipped', () => {
    const recs = [rec({ id: 'r1', ruleId: 'x' }), rec({ id: 'h1', ruleId: 'x' })]
    const sim = simulate({
      ...empty,
      selectedIds: ['r1'],
      recommendations: recs,
      deployments: [dep('d1', 'h1', { capturedAt: '2026-02-01T00:00:00Z', skipped: true, reason: 'no GSC' })],
    })
    expect(sim.baseRates[0].medianClicksDelta).toBeNull()
    expect(sim.baseRates[0].medianPositionDelta).toBeNull()
    expect(sim.baseRates[0].caveat).toContain('No measured outcomes')
  })

  it('ignores deployments for a different rule than the one selected', () => {
    const recs = [rec({ id: 'r1', ruleId: 'schema-missing' }), rec({ id: 'h1', ruleId: 'title-length' })]
    const sim = simulate({ ...empty, selectedIds: ['r1'], recommendations: recs, deployments: [dep('d1', 'h1', measured(99, -9))] })
    expect(sim.baseRates).toEqual([])
  })
})

describe('unknowns', () => {
  it('always states that rank movement is not predicted', () => {
    const sim = simulate({ ...empty, selectedIds: [] })
    expect(sim.unknowns[0]).toMatch(/predicts that/)
  })

  it('names the specific gaps rather than only the generic one', () => {
    const sim = simulate({ ...empty, selectedIds: [] })
    expect(sim.unknowns.some((u) => u.includes('No tracked keywords'))).toBe(true)
    expect(sim.unknowns.some((u) => u.includes('no measured history'))).toBe(true)
    expect(sim.unknowns.some((u) => u.includes('No completed crawl'))).toBe(true)
  })

  it('never emits a predicted score field of any kind', () => {
    // The whole point. If someone adds a "projectedVisibility" later, this fails.
    const sim = simulate({ ...empty, selectedIds: [] })
    expect(JSON.stringify(sim)).not.toMatch(/projected|predicted|forecast|estimatedScore/i)
  })
})
