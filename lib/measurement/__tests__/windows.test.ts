import { describe, it, expect } from 'vitest'
import { defaultReviewDays, changeTypeFromDeployment, evaluateOutcome, REVIEW_DAYS, type EvaluateInput } from '../windows'

describe('defaultReviewDays', () => {
  it('returns change-specific defaults', () => {
    expect(defaultReviewDays('conversion_tracking')).toBe(7)
    expect(defaultReviewDays('new_page')).toBe(42)
    expect(defaultReviewDays('schema')).toBe(14)
  })
  it('covers all change types', () => {
    for (const k of Object.keys(REVIEW_DAYS)) expect(REVIEW_DAYS[k as keyof typeof REVIEW_DAYS]).toBeGreaterThan(0)
  })
})

describe('changeTypeFromDeployment', () => {
  it('classifies from type or changes', () => {
    expect(changeTypeFromDeployment('redirect', null)).toBe('redirect')
    expect(changeTypeFromDeployment('deploy', '{"schema":"FAQPage"}')).toBe('schema')
    expect(changeTypeFromDeployment('deploy', 'updated title and meta description')).toBe('title_meta')
    expect(changeTypeFromDeployment('deploy', 'rewrote body content')).toBe('content')
    expect(changeTypeFromDeployment(null, null)).toBe('content')
  })
})

describe('evaluateOutcome', () => {
  const base = (over: Partial<EvaluateInput>): EvaluateInput => ({
    changeType: 'title_meta',
    changeAppliedAt: new Date('2026-01-01T00:00:00Z'),
    now: new Date('2026-02-01T00:00:00Z'),
    reviewAt: new Date('2026-01-22T00:00:00Z'),
    baseline: null, current: null,
    freshness: { rank: true, gsc: true, ga4: true },
    ...over,
  })

  it('too_early before the review window', () => {
    const r = evaluateOutcome(base({ now: new Date('2026-01-10T00:00:00Z') }))
    expect(r.status).toBe('too_early')
  })

  it('awaiting_data when snapshots missing', () => {
    const r = evaluateOutcome(base({}))
    expect(r.status).toBe('awaiting_data')
  })

  it('too_early when within reporting delay even past reviewAt', () => {
    const r = evaluateOutcome(base({
      changeAppliedAt: new Date('2026-01-31T00:00:00Z'),
      reviewAt: new Date('2026-01-30T00:00:00Z'),
      now: new Date('2026-02-01T00:00:00Z'),
      baseline: { position: 10 }, current: { position: 5 },
    }))
    expect(r.status).toBe('too_early')
  })

  it('successful on multiple fresh improvements', () => {
    const r = evaluateOutcome(base({
      baseline: { position: 12, clicks: 100, impressions: 500 },
      current: { position: 6, clicks: 160, impressions: 800 },
    }))
    expect(r.status).toBe('successful')
    expect(r.confidence).toBeGreaterThan(0.6)
    expect(r.evidence.length).toBeGreaterThanOrEqual(2)
  })

  it('improving on a single fresh improvement', () => {
    const r = evaluateOutcome(base({
      baseline: { position: 12 }, current: { position: 6 },
      freshness: { rank: true },
    }))
    expect(r.status).toBe('improving')
  })

  it('declining when fresh metrics drop', () => {
    const r = evaluateOutcome(base({
      baseline: { position: 5 }, current: { position: 15 },
      freshness: { rank: true },
    }))
    expect(r.status).toBe('declining')
  })

  it('needs_review on conflicting signals', () => {
    const r = evaluateOutcome(base({
      baseline: { position: 10, conversions: 20, sessions: 200 },
      current: { position: 4, conversions: 10, sessions: 200 },
    }))
    expect(r.status).toBe('needs_review')
  })

  it('ignores CTR/conversions below the sample floor (inconclusive)', () => {
    const r = evaluateOutcome(base({
      baseline: { clicks: 2, impressions: 10, conversions: 1, sessions: 5 },
      current: { clicks: 4, impressions: 20, conversions: 2, sessions: 8 },
      freshness: { gsc: true, ga4: true },
    }))
    expect(r.status).toBe('inconclusive')
  })

  it('does not use stale data (no rank signal when rank not fresh)', () => {
    const r = evaluateOutcome(base({
      baseline: { position: 12 }, current: { position: 6 },
      freshness: { rank: false },
    }))
    expect(r.status).toBe('inconclusive')
  })
})
