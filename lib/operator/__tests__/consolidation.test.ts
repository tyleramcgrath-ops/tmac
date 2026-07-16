import { describe, it, expect } from 'vitest'
import { consolidate, canonicalizeActionType, computeDedupeKey } from '../consolidate'
import { suppressionFor, bucketFor } from '../suppress'
import type { Candidate } from '../types'

function c(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: overrides.id ?? 'a::money_page_reinforcement',
    pageUrl: overrides.pageUrl ?? 'https://example.com/services',
    recommendationType: overrides.recommendationType ?? 'money_page_reinforcement',
    source: overrides.source ?? 'money_page_intelligence',
    estimatedMinutes: overrides.estimatedMinutes ?? 60,
    rawScore: overrides.rawScore ?? 40,
    confidence: overrides.confidence ?? 0.8,
    evidence: overrides.evidence ?? [{ label: 'weakness', source: 'graph' }],
    metadata: overrides.metadata ?? { isMoneyPage: true },
  }
}

describe('canonicalizeActionType', () => {
  it('collapses synonyms', () => {
    expect(canonicalizeActionType('faq_schema_missing')).toBe('add_faq_schema')
    expect(canonicalizeActionType('faqpage_missing')).toBe('add_faq_schema')
    expect(canonicalizeActionType('expand_content')).toBe('refresh_content')
    expect(canonicalizeActionType('content_refresh')).toBe('refresh_content')
  })
  it('strips close_gap:: prefix', () => {
    expect(canonicalizeActionType('close_gap::add_faq_schema')).toBe('add_faq_schema')
  })
})

describe('computeDedupeKey', () => {
  it('canonicalizes trailing slash + query', () => {
    const a = computeDedupeKey('proj', 'money_page', 'money_page_reinforcement', 'https://ex.com/foo/?utm=x')
    const b = computeDedupeKey('proj', 'money_page', 'money_page_reinforcement', 'https://ex.com/foo')
    expect(a).toBe(b)
  })
  it('differs per project', () => {
    const a = computeDedupeKey('projA', 'x', 'y', 'https://z.com/a')
    const b = computeDedupeKey('projB', 'x', 'y', 'https://z.com/a')
    expect(a).not.toBe(b)
  })
})

describe('consolidate', () => {
  it('merges duplicates from different sources on the same page + action', () => {
    const raw: Candidate[] = [
      c({ id: '1', source: 'money_page_intelligence', rawScore: 50 }),
      c({ id: '2', source: 'decision_engine', rawScore: 45 }),
      c({ id: '3', source: 'graph_broken_cluster', rawScore: 35 }),
    ]
    const result = consolidate('proj', raw)
    expect(result.consolidated.length).toBe(1)
    const survivor = result.consolidated[0]
    expect(survivor.rawScore).toBeGreaterThan(50)   // multi-source boost applied
    expect(survivor.consolidatedFrom.length).toBe(2)
    expect(survivor.evidence.length).toBeGreaterThan(1)
    expect(result.duplicates[0].ids.length).toBe(2)
  })

  it('preserves evidence when consolidating', () => {
    const raw: Candidate[] = [
      c({ id: 'x', evidence: [{ label: 'A', source: 'graph' }] }),
      c({ id: 'y', evidence: [{ label: 'B', source: 'gsc' }] }),
    ]
    const result = consolidate('proj', raw)
    const labels = result.consolidated[0].evidence.map((e) => e.label)
    expect(labels).toContain('A')
    expect(labels).toContain('B')
  })

  it('detects conflicts between incompatible actions on the same page', () => {
    const raw: Candidate[] = [
      c({ id: 'expand', pageUrl: 'https://ex.com/p', recommendationType: 'refresh_content' }),
      c({ id: 'merge', pageUrl: 'https://ex.com/p', recommendationType: 'redirect_and_merge' }),
    ]
    const result = consolidate('proj', raw)
    expect(result.conflicts.length).toBeGreaterThan(0)
    expect(result.consolidated.every((cand) => cand.conflictsWith.length > 0)).toBe(true)
  })
})

describe('suppressionFor', () => {
  const baseCtx = {
    isMoneyPage: false,
    isIndexable: true,
    pageRanksInTop3: false,
    pageConvertsWell: false,
    clusterCoverageSufficient: false,
    metadataAcceptable: false,
    candidateHasConflict: false,
    dependencyStillOpen: false,
    evidenceAgeDays: 3,
    dataSufficient: true,
    userCanApprove: true,
    userCanDeploy: true,
    deploymentAvailable: true,
  }

  it('flags good-enough on non-money page that ranks + converts', () => {
    const s = suppressionFor(c({ recommendationType: 'refresh_content' }), {
      ...baseCtx, pageRanksInTop3: true, pageConvertsWell: true,
    })
    expect(s?.kind).toBe('good_enough')
  })

  it('blocks stale evidence over 30 days', () => {
    const s = suppressionFor(c(), { ...baseCtx, evidenceAgeDays: 60 })
    expect(s?.kind).toBe('stale_data')
  })

  it('blocks conflicting candidates', () => {
    const s = suppressionFor(c(), { ...baseCtx, candidateHasConflict: true })
    expect(s?.kind).toBe('conflict')
  })

  it('respects focus-window time-fit', () => {
    const s = suppressionFor(c({ recommendationType: 'full_content_rewrite' }), {
      ...baseCtx, focusWindow: '15m',
    })
    expect(s?.kind).toBe('time_fit')
  })

  it('suppresses non-indexable pages', () => {
    const s = suppressionFor(c({ recommendationType: 'refresh_content' }), {
      ...baseCtx, isIndexable: false,
    })
    expect(s?.kind).toBe('not_indexable')
  })
})

describe('bucketFor', () => {
  const suppressed = { kind: 'good_enough' as const, reason: 'test' }
  it('routes stale/insufficient to deferred', () => {
    expect(bucketFor(c(), 60, { kind: 'stale_data', reason: 'x' })).toBe('deferred')
    expect(bucketFor(c(), 60, { kind: 'insufficient_data', reason: 'x' })).toBe('deferred')
  })
  it('routes any other suppression to suppressed', () => {
    expect(bucketFor(c(), 60, suppressed)).toBe('suppressed')
  })
  it('assigns thresholds: critical/primary/next_best/watch/deferred', () => {
    expect(bucketFor(c(), 95, null)).toBe('critical')
    expect(bucketFor(c(), 75, null)).toBe('primary')
    expect(bucketFor(c(), 50, null)).toBe('next_best')
    expect(bucketFor(c(), 30, null)).toBe('watch')
    expect(bucketFor(c(), 10, null)).toBe('deferred')
  })
})
