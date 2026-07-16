import { describe, it, expect } from 'vitest'
import { fuse, type FusionInputs, type CrawlPageInput, type KeywordInput } from '../engine'

function page(over: Partial<CrawlPageInput>): CrawlPageInput {
  return {
    url: 'https://s.com/', status: 200, title: 'T', metaDescription: 'M', h1Count: 1,
    contentLength: 800, canonical: 'https://s.com/', hasNoindex: false, hasMixedContent: false,
    schemaTypes: ['WebSite'], internalLinks: 5, inboundCount: 10,
    technicalScore: 80, contentScore: 75, schemaScore: 70, aiScore: 80, ...over,
  }
}
function kw(over: Partial<KeywordInput>): KeywordInput {
  return {
    keyword: 'k', normalizedKeyword: 'k', intent: 'informational', type: 'primary', status: 'tracking',
    targetPageUrl: null, currentPosition: null, previousPosition: null, bestPosition: null,
    dataSource: null, confidence: 0.6, estimatedDemand: null, ...over,
  }
}
function inputs(over: Partial<FusionInputs>): FusionInputs {
  return { projectId: 'p', domain: 's.com', pages: [], keywords: [], gsc: null, ga4: null, now: new Date('2026-07-16'), ...over }
}

describe('fuse — data fusion engine', () => {
  it('works with crawl-only data (GSC and GA4 disconnected) without breaking', () => {
    const r = fuse(inputs({ pages: [page({})] }))
    expect(r.dataSources.gsc).toBe('not_connected')
    expect(r.dataSources.ga4).toBe('not_connected')
    expect(r.pages).toHaveLength(1)
    expect(r.pages[0].gscAveragePosition).toBeNull()
    expect(r.pages[0].ga4Conversions).toBeNull()
    expect(r.pages[0].missingSignals).toContain('gsc')
    expect(r.pages[0].missingSignals).toContain('ga4')
    expect(r.missingIntegrations).toEqual(expect.arrayContaining(['Google Search Console', 'Google Analytics 4']))
  })

  it('raises page confidence as more sources corroborate', () => {
    const crawlOnly = fuse(inputs({ pages: [page({ url: 'https://s.com/x' })] })).pages[0].confidence
    const withAll = fuse(inputs({
      pages: [page({ url: 'https://s.com/x' })],
      keywords: [kw({ targetPageUrl: 'https://s.com/x', currentPosition: 5 })],
      gsc: [{ url: 'https://s.com/x', clicks: 10, impressions: 500, ctr: 0.02, position: 5.4, dataDate: null }],
      ga4: [{ url: 'https://s.com/x', sessions: 100, users: 90, engagementRate: 0.6, conversions: 3, revenue: 0, dataDate: null }],
    })).pages[0].confidence
    expect(withAll).toBeGreaterThan(crawlOnly)
  })

  it('keeps observed ranking, GSC average position, and estimated potential strictly separate', () => {
    const r = fuse(inputs({
      keywords: [kw({ keyword: 'buy shoes', targetPageUrl: 'https://s.com/p', currentPosition: 4, dataSource: 'rankforge_live_check' })],
      pages: [page({ url: 'https://s.com/p' })],
      gsc: [{ url: 'https://s.com/p', clicks: 20, impressions: 800, ctr: 0.025, position: 6.2, dataDate: null }],
    }))
    const k = r.keywords[0]
    expect(k.observedRanking).toBe(4)
    expect(k.observedRankingSource).toBe('rankforge_live_check')
    expect(k.gscAveragePosition).toBe(6.2) // different number, separate field
    expect(k.estimatedRankingPotential).toBeNull() // not estimated when observed exists
  })

  it('produces an estimated ranking potential only when there is no observed rank', () => {
    const r = fuse(inputs({ keywords: [kw({ keyword: 'x', currentPosition: null, estimatedDemand: 400, confidence: 0.8 })] }))
    const k = r.keywords[0]
    expect(k.observedRanking).toBeNull()
    expect(k.estimatedRankingPotential).not.toBeNull()
    expect(k.missingSignals).toContain('observed_ranking')
  })

  it('never invents GA4 conversions or revenue when GA4 is disconnected', () => {
    const r = fuse(inputs({ pages: [page({})], ga4: null }))
    expect(r.pages[0].ga4Conversions).toBeNull()
    expect(r.pages[0].ga4Revenue).toBeNull()
  })

  it('recommends a CTR fix when GSC shows high impressions and low CTR', () => {
    const r = fuse(inputs({
      pages: [page({ url: 'https://s.com/p' })],
      gsc: [{ url: 'https://s.com/p', clicks: 5, impressions: 1000, ctr: 0.005, position: 8, dataDate: null }],
    }))
    expect(r.pages[0].recommendedNextAction).toMatch(/CTR/i)
  })

  it('flags a money page with traffic but no conversions', () => {
    const r = fuse(inputs({
      pages: [page({ url: 'https://s.com/services/tax', inboundCount: 30, contentScore: 90 })],
      ga4: [{ url: 'https://s.com/services/tax', sessions: 200, users: 180, engagementRate: 0.5, conversions: 0, revenue: 0, dataDate: null }],
    }))
    const p = r.pages[0]
    expect(p.moneyPage).toBe(true)
    expect(p.recommendedNextAction).toMatch(/conversion/i)
  })

  it('detects a page-2 keyword as a page_2_to_page_1 opportunity', () => {
    const r = fuse(inputs({ keywords: [kw({ keyword: 'x', currentPosition: 14 })] }))
    expect(r.keywords[0].currentOpportunity).toBe('page_2_to_page_1')
  })

  it('classifies page types from the URL', () => {
    const r = fuse(inputs({ pages: [
      page({ url: 'https://s.com/' }),
      page({ url: 'https://s.com/services/plumbing' }),
      page({ url: 'https://s.com/blog/how-to' }),
    ] }))
    const types = new Set(r.pages.map((p) => p.pageType))
    expect(types).toContain('homepage')
    expect(types).toContain('service_page')
    expect(types).toContain('blog_post')
  })

  it('marks a non-200 page as non-indexable and recommends fixing the status', () => {
    const r = fuse(inputs({ pages: [page({ url: 'https://s.com/gone', status: 404 })] }))
    expect(r.pages[0].indexable).toBe(false)
    expect(r.pages[0].recommendedNextAction).toMatch(/404/)
  })
})
