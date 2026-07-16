import { describe, it, expect } from 'vitest'
import { buildOpportunities, summarizeOpportunities, type KeywordInput, type CrawlIssueInput } from '../build'

function kw(over: Partial<KeywordInput>): KeywordInput {
  return { keyword: 'k', currentPosition: null, previousPosition: null, status: 'tracking', targetPageUrl: null, confidence: 0.6, intent: 'informational', ...over }
}

describe('buildOpportunities', () => {
  it('turns a page-2 keyword into a ranking opportunity within reach of page 1', () => {
    const [o] = buildOpportunities({ projectId: 'p', keywords: [kw({ keyword: 'best crm', currentPosition: 12 })], crawlIssues: [] })
    expect(o.type).toBe('ranking')
    expect(o.keyword).toBe('best crm')
    expect(o.title).toMatch(/page 2 to page 1/i)
    expect(o.evidence.join(' ')).toContain('#12')
  })

  it('does not create a ranking opportunity for a page-1 keyword', () => {
    const list = buildOpportunities({ projectId: 'p', keywords: [kw({ keyword: 'x', currentPosition: 4 })], crawlIssues: [] })
    expect(list).toHaveLength(0)
  })

  it('turns a dropped keyword into a traffic-recovery opportunity', () => {
    const [o] = buildOpportunities({ projectId: 'p', keywords: [kw({ keyword: 'x', currentPosition: 15, previousPosition: 8 })], crawlIssues: [] })
    expect(o.type).toBe('traffic_recovery')
    expect(o.whyItMatters).toMatch(/dropped 7/i)
  })

  it('turns a lost keyword into a lost_keyword opportunity', () => {
    const [o] = buildOpportunities({ projectId: 'p', keywords: [kw({ keyword: 'x', status: 'lost' })], crawlIssues: [] })
    expect(o.type).toBe('lost_keyword')
  })

  it('turns a cannibalized keyword into a cannibalization opportunity', () => {
    const [o] = buildOpportunities({ projectId: 'p', keywords: [kw({ keyword: 'x', status: 'cannibalized' })], crawlIssues: [] })
    expect(o.type).toBe('cannibalization')
  })

  it('maps crawl issue categories to opportunity types and severity to risk', () => {
    const issues: CrawlIssueInput[] = [
      { pageUrl: 'https://s.com/a', severity: 'critical', category: 'Schema', title: 'Missing schema' },
      { pageUrl: 'https://s.com/b', severity: 'warning', category: 'Content', title: 'Thin content' },
    ]
    const list = buildOpportunities({ projectId: 'p', keywords: [], crawlIssues: issues })
    const schema = list.find((o) => o.type === 'schema')!
    const content = list.find((o) => o.type === 'content_gap')!
    expect(schema.risk).toBe('high') // critical
    expect(content.risk).toBe('medium') // warning
  })

  it('consolidates duplicate evidence for the same page+type into one record', () => {
    const issues: CrawlIssueInput[] = [
      { pageUrl: 'https://s.com/a', severity: 'warning', category: 'Schema', title: 'Missing Organization schema' },
      { pageUrl: 'https://s.com/a', severity: 'critical', category: 'Schema', title: 'Missing schema' },
    ]
    const list = buildOpportunities({ projectId: 'p', keywords: [], crawlIssues: issues })
    const schemaOpps = list.filter((o) => o.type === 'schema' && o.page === 'https://s.com/a')
    expect(schemaOpps).toHaveLength(1) // consolidated, not two rows
    expect(schemaOpps[0].businessValue).toBe(75) // kept the higher (critical) value
    expect(schemaOpps[0].evidence.length).toBeGreaterThan(1) // merged evidence
  })

  it('ranks higher-business-value opportunities first', () => {
    const list = buildOpportunities({
      projectId: 'p',
      keywords: [kw({ keyword: 'low', currentPosition: 20 })], // lower closeness
      crawlIssues: [{ pageUrl: 'https://s.com/a', severity: 'critical', category: 'Technical', title: 'Noindex' }],
    })
    expect(list[0].businessValue).toBeGreaterThanOrEqual(list[list.length - 1].businessValue)
  })

  it('summarizes by type and high-value count', () => {
    const list = buildOpportunities({
      projectId: 'p',
      keywords: [kw({ keyword: 'a', currentPosition: 12 }), kw({ keyword: 'b', status: 'lost' })],
      crawlIssues: [{ pageUrl: 'https://s.com/a', severity: 'critical', category: 'Technical', title: 'x' }],
    })
    const s = summarizeOpportunities(list)
    expect(s.total).toBe(3)
    expect(s.byType.ranking).toBe(1)
    expect(s.highValue).toBeGreaterThan(0)
  })
})
