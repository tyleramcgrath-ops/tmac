import { describe, it, expect } from '@jest/globals'
import { applyJudgment } from '../judgment'
import { isBlockedByMemory, memoryKey } from '../memory'
import { FOCUS_MINUTES } from '../types'
import type { Candidate } from '../types'
import type { OperatorMemory } from '@prisma/client'

const baseCandidate: Candidate = {
  id: 'https://example.com/services::money_page_reinforcement',
  pageUrl: 'https://example.com/services',
  recommendationType: 'money_page_reinforcement',
  source: 'money_page_intelligence',
  estimatedMinutes: 60,
  rawScore: 40,
  confidence: 0.8,
  evidence: [],
  metadata: {},
}

const baseCtx = {
  isMoneyPage: false,
  hasTrafficDrop: false,
  hasCtrDrop: false,
  hasZeroTraffic: false,
  isConvertingPage: false,
  supportingCount: 3,
  daysSinceLastEdit: 30,
  seasonalPriority: false,
}

describe('applyJudgment', () => {
  it('boosts a money page losing CTR', () => {
    const { adjustedScore, boosts } = applyJudgment(baseCandidate, {
      ...baseCtx,
      isMoneyPage: true,
      hasCtrDrop: true,
    })
    expect(adjustedScore).toBeGreaterThan(baseCandidate.rawScore)
    expect(boosts.some((b) => b.reason.includes('CTR'))).toBe(true)
  })

  it('boosts money page with zero supporting content', () => {
    const { boosts } = applyJudgment(baseCandidate, {
      ...baseCtx,
      isMoneyPage: true,
      supportingCount: 0,
    })
    expect(boosts.some((b) => b.reason.includes('supporting'))).toBe(true)
  })

  it('boosts missing FAQ schema on a converting page', () => {
    const c = { ...baseCandidate, recommendationType: 'add_faq_schema' }
    const { boosts } = applyJudgment(c, { ...baseCtx, isMoneyPage: true, isConvertingPage: true })
    expect(boosts.some((b) => b.reason.includes('FAQ'))).toBe(true)
  })

  it('deprioritizes a blog with no traffic (unless seasonal)', () => {
    const c = { ...baseCandidate, recommendationType: 'refresh' }
    const { adjustedScore, boosts } = applyJudgment(c, {
      ...baseCtx,
      isMoneyPage: false,
      hasZeroTraffic: true,
    })
    expect(adjustedScore).toBeLessThan(baseCandidate.rawScore)
    expect(boosts.some((b) => b.delta < 0)).toBe(true)
  })

  it('deprioritizes a homepage typo when it is not a money page', () => {
    const c = { ...baseCandidate, recommendationType: 'fix_homepage_typo' }
    const { boosts } = applyJudgment(c, { ...baseCtx })
    expect(boosts.some((b) => b.reason.toLowerCase().includes('cosmetic'))).toBe(true)
  })

  it('applies seasonal amplifier when the page matches a seasonal priority', () => {
    const { boosts } = applyJudgment(baseCandidate, { ...baseCtx, seasonalPriority: true })
    expect(boosts.some((b) => b.reason.toLowerCase().includes('seasonal'))).toBe(true)
  })
})

describe('memory filtering', () => {
  const build = (overrides: Partial<OperatorMemory>): OperatorMemory =>
    ({
      id: 'x',
      organizationId: 'org',
      projectId: 'proj',
      pageUrl: 'https://example.com/services',
      recommendationType: 'money_page_reinforcement',
      status: 'proposed',
      reason: null,
      decidedAt: null,
      decidedBy: null,
      expiresAt: null,
      snapshot: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as unknown as OperatorMemory

  it('blocks accepted / rejected / completed / blocked / ignored / proposed', () => {
    for (const status of ['accepted', 'rejected', 'completed', 'blocked', 'ignored', 'proposed']) {
      expect(isBlockedByMemory(build({ status }))).toBe(true)
    }
  })

  it('respects expiresAt on deferred items', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(isBlockedByMemory(build({ status: 'deferred', expiresAt: future }))).toBe(true)
    expect(isBlockedByMemory(build({ status: 'deferred', expiresAt: past }))).toBe(false)
  })

  it('does not block expired memory', () => {
    expect(isBlockedByMemory(build({ status: 'expired' }))).toBe(false)
  })

  it('does not block when no memory exists', () => {
    expect(isBlockedByMemory(undefined)).toBe(false)
  })
})

describe('memoryKey', () => {
  it('is stable', () => {
    expect(memoryKey('https://x.com/a', 'y')).toBe(memoryKey('https://x.com/a', 'y'))
  })
  it('differs by url', () => {
    expect(memoryKey('https://x.com/a', 'y')).not.toBe(memoryKey('https://x.com/b', 'y'))
  })
  it('differs by type', () => {
    expect(memoryKey('https://x.com/a', 'y')).not.toBe(memoryKey('https://x.com/a', 'z'))
  })
})

describe('FOCUS_MINUTES', () => {
  it('covers 15m through full-day', () => {
    expect(FOCUS_MINUTES['15m']).toBe(15)
    expect(FOCUS_MINUTES['30m']).toBe(30)
    expect(FOCUS_MINUTES['1h']).toBe(60)
    expect(FOCUS_MINUTES['half-day']).toBe(240)
    expect(FOCUS_MINUTES['full-day']).toBe(480)
  })
})
