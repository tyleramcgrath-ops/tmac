import { describe, it, expect } from 'vitest'
import { computePortfolioPriority, rankPortfolio, type ProjectSignals } from '../priority'

function signals(overrides: Partial<ProjectSignals> = {}): ProjectSignals {
  return {
    projectId: 'p1',
    name: 'Test',
    domain: 'test.com',
    lastCrawlAt: new Date('2026-07-15'),
    lastRankCheckAt: new Date('2026-07-15'),
    now: new Date('2026-07-16'),
    siteScore: 80,
    criticalIssues: 0,
    rankingLosses: 0,
    rankingGains: 0,
    moneyPageRankingLoss: false,
    lostKeywords: 0,
    pageTwoOpportunities: 0,
    failedDeployments: 0,
    failedVerifications: 0,
    pendingApprovals: 0,
    hasAudit: true,
    hasKeywords: true,
    ...overrides,
  }
}

describe('computePortfolioPriority', () => {
  it('returns waiting_for_data (not a fabricated urgency) when the project has never been crawled', () => {
    const p = computePortfolioPriority(signals({ hasAudit: false, hasKeywords: false }))
    expect(p.status).toBe('waiting_for_data')
    expect(p.missingData).toContain('crawl')
    expect(p.recommendedFocus).toMatch(/first site audit/i)
  })

  it('flags a money-page ranking loss as critical and recommends investigating it first', () => {
    const p = computePortfolioPriority(signals({ moneyPageRankingLoss: true }))
    expect(p.status).toBe('critical')
    expect(p.headline).toMatch(/money page/i)
    expect(p.recommendedFocus).toMatch(/money-page ranking loss/i)
    expect(p.reasons.length).toBeGreaterThan(0)
  })

  it('treats a failed WordPress deployment as critical', () => {
    const p = computePortfolioPriority(signals({ failedDeployments: 1 }))
    expect(p.status).toBe('critical')
    expect(p.reasons.join(' ')).toMatch(/deployment/i)
  })

  it('classifies ranking losses (without money-page impact) as needs_attention', () => {
    const p = computePortfolioPriority(signals({ rankingLosses: 4 }))
    expect(p.status).toBe('needs_attention')
    expect(p.headline).toMatch(/dropped in ranking/i)
  })

  it('classifies page-2 keywords with nothing wrong as an opportunity', () => {
    const p = computePortfolioPriority(signals({ pageTwoOpportunities: 5 }))
    expect(p.status).toBe('opportunity')
    expect(p.recommendedFocus).toMatch(/page 1/i)
  })

  it('classifies ranking gains with no problems as improving', () => {
    const p = computePortfolioPriority(signals({ rankingGains: 3 }))
    expect(p.status).toBe('improving')
  })

  it('classifies a clean, fresh project as stable and tells the user to spend time elsewhere', () => {
    const p = computePortfolioPriority(signals())
    expect(p.status).toBe('stable')
    expect(p.recommendedFocus).toMatch(/higher-priority project/i)
  })

  it('reports stale crawl data as a needs_attention reason', () => {
    const p = computePortfolioPriority(signals({
      lastCrawlAt: new Date('2026-06-01'),
      now: new Date('2026-07-16'),
    }))
    expect(p.status).toBe('needs_attention')
    expect(p.reasons.join(' ')).toMatch(/last crawl was/i)
  })

  it('flags missing ranking data without inventing urgency', () => {
    const p = computePortfolioPriority(signals({ lastRankCheckAt: null, hasKeywords: true, rankingGains: 0, rankingLosses: 0 }))
    expect(p.missingData).toContain('rankings')
  })

  it('prioritizes a money-page loss above a mere ranking dip in score', () => {
    const critical = computePortfolioPriority(signals({ moneyPageRankingLoss: true }))
    const attention = computePortfolioPriority(signals({ rankingLosses: 2 }))
    expect(critical.score).toBeGreaterThan(attention.score)
  })
})

describe('rankPortfolio', () => {
  it('sorts the most urgent project first', () => {
    const ranked = rankPortfolio([
      signals({ projectId: 'stable', rankingGains: 0 }),
      signals({ projectId: 'critical', moneyPageRankingLoss: true, failedDeployments: 1 }),
      signals({ projectId: 'attention', rankingLosses: 3 }),
    ])
    expect(ranked[0].projectId).toBe('critical')
    expect(ranked[ranked.length - 1].projectId).toBe('stable')
  })
})
