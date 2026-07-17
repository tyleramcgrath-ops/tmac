import { describe, it, expect } from 'vitest'
import { buildFusedOpportunities, type FusedInput } from '../fused'
import type { PageIntelligence, KeywordIntelligence } from '@/lib/fusion/engine'

function kw(over: Partial<KeywordIntelligence>): KeywordIntelligence {
  return {
    keyword: 'k', intent: 'commercial', targetPage: 'https://s.com/p',
    observedRanking: null, observedRankingSource: null, previousObservedRanking: null, bestObservedRanking: null,
    gscAveragePosition: null, gscClicks: null, gscImpressions: null, gscCtr: null,
    estimatedRankingPotential: null, businessValue: 60, moneyPageRelationship: true,
    currentOpportunity: null, confidence: 0.7, dataSource: null, missingSignals: [], recommendedNextAction: '', ...over,
  }
}
function page(over: Partial<PageIntelligence>): PageIntelligence {
  return {
    url: 'https://s.com/p', pageType: 'service_page', moneyPage: true, businessValue: 70, crawlHealth: 70,
    httpStatus: 200, indexable: true, canonicalStatus: 'self', schemaCoverage: 1, contentQuality: 70, internalLinkStrength: 10,
    observedRankings: [], gscAveragePosition: null, gscClicks: null, gscImpressions: null, gscCtr: null,
    ga4OrganicSessions: null, ga4Engagement: null, ga4Conversions: null, ga4Revenue: null,
    recentDeployments: 0, verificationsPassed: null, confidence: 0.5, dataSources: [], missingSignals: [], recommendedNextAction: '', ...over,
  }
}
function input(over: Partial<FusedInput>): FusedInput {
  return { projectId: 'p', pages: [], keywords: [], wordpressConnected: true, worstFreshness: 'fresh', ...over }
}

describe('buildFusedOpportunities', () => {
  it('creates a CTR opportunity with a position-aware baseline and an incremental-clicks estimate', () => {
    const o = buildFusedOpportunities(input({
      keywords: [kw({ keyword: 'buy x', gscImpressions: 2000, gscCtr: 0.01, gscAveragePosition: 4 })],
    }))[0]
    expect(o.type).toBe('ctr')
    expect(o.estimate?.metric).toBe('incremental_clicks_per_period')
    expect(o.estimate?.value).toBeGreaterThan(0)
    expect(o.estimate?.explanation).toMatch(/expected CTR for position/i)
  })

  it('does not flag CTR when it already meets the position baseline', () => {
    const list = buildFusedOpportunities(input({
      keywords: [kw({ keyword: 'x', gscImpressions: 2000, gscCtr: 0.16, gscAveragePosition: 3 })],
    }))
    expect(list.find((o) => o.type === 'ctr')).toBeUndefined()
  })

  it('creates a tracking-quality opportunity (not "low converting") when conversions are untracked', () => {
    const o = buildFusedOpportunities(input({
      pages: [page({ ga4OrganicSessions: 200, ga4Conversions: null })],
    })).find((x) => x.type === 'tracking_quality')!
    expect(o).toBeDefined()
    expect(o.estimate?.value).toBeNull()
    expect(o.estimate?.explanation).toMatch(/insufficient data/i)
    expect(o.capability).toBe('waiting_for_data')
    expect(o.missingEvidence).toContain('conversion_tracking')
  })

  it('creates a conversion opportunity when tracking exists but conversions are zero', () => {
    const o = buildFusedOpportunities(input({
      pages: [page({ ga4OrganicSessions: 200, ga4Conversions: 0 })],
    })).find((x) => x.type === 'conversion')!
    expect(o).toBeDefined()
    expect(o.type).toBe('conversion')
  })

  it('prioritizes a strong-converting, weak-ranking page highly', () => {
    const o = buildFusedOpportunities(input({
      pages: [page({ ga4OrganicSessions: 300, ga4Conversions: 12, observedRankings: [{ keyword: 'x', position: 14, source: 'rankforge_live_check' }] })],
    })).find((x) => x.type === 'strong_conversion_weak_ranking')!
    expect(o).toBeDefined()
    expect(o.businessValue).toBeGreaterThanOrEqual(80)
  })

  it('consolidates a ranking drop with a recent deployment into ONE regression opportunity (correlation labeled)', () => {
    const list = buildFusedOpportunities(input({
      keywords: [kw({ keyword: 'x', targetPage: 'https://s.com/p', observedRanking: 15, previousObservedRanking: 6, gscClicks: 40 })],
      recentDeploys: [{ page: 'https://s.com/p', at: '2026-07-10' }],
    }))
    const regressions = list.filter((o) => o.type === 'deployment_regression')
    expect(regressions).toHaveLength(1) // one consolidated record, not several alerts
    expect(regressions[0].supportingSignals.join(' ')).toMatch(/correlation, not proven cause/i)
  })

  it('detects a page-2 ranking opportunity fused with money-page value', () => {
    const o = buildFusedOpportunities(input({
      keywords: [kw({ keyword: 'x', observedRanking: 13, moneyPageRelationship: true, businessValue: 80 })],
    })).find((x) => x.type === 'ranking')!
    expect(o).toBeDefined()
    expect(o.supportingSignals).toContain('Targets a money page')
  })

  it('sets waiting_for_wordpress when an auto-fixable opportunity has no WordPress connection', () => {
    const o = buildFusedOpportunities(input({
      wordpressConnected: false,
      pages: [page({ schemaCoverage: 0 })],
    })).find((x) => x.type === 'schema')!
    expect(o.capability).toBe('waiting_for_wordpress')
  })

  it('applies a stale-data confidence penalty', () => {
    const fresh = buildFusedOpportunities(input({ worstFreshness: 'fresh', pages: [page({ schemaCoverage: 0 })] }))[0]
    const stale = buildFusedOpportunities(input({ worstFreshness: 'stale', pages: [page({ schemaCoverage: 0 })] }))[0]
    expect(stale.confidence).toBeLessThan(fresh.confidence)
    expect(stale.priorityScore).toBeLessThan(fresh.priorityScore)
  })

  it('never fabricates a conversion estimate — value is null with a missing-input note', () => {
    const o = buildFusedOpportunities(input({ pages: [page({ ga4OrganicSessions: 200, ga4Conversions: null })] })).find((x) => x.type === 'tracking_quality')!
    expect(o.estimate?.value).toBeNull()
    expect(o.estimate?.missing).toContain('conversion_tracking')
  })

  it('ranks a measured GA4 opportunity above a low-confidence stale one', () => {
    const list = buildFusedOpportunities(input({
      worstFreshness: 'fresh',
      pages: [
        page({ url: 'https://s.com/converts', ga4OrganicSessions: 300, ga4Conversions: 0, dataSources: ['ga4'] }),
        page({ url: 'https://s.com/schema', schemaCoverage: 0 }),
      ],
    }))
    const conv = list.findIndex((o) => o.type === 'conversion')
    const schema = list.findIndex((o) => o.type === 'schema')
    expect(conv).toBeLessThan(schema) // measured conversion opportunity ranks first
  })
})
