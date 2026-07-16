import { describe, it, expect } from 'vitest'
import { buildTodayPlan, AVAILABLE_TIME_MINUTES } from '../mission'
import type { PortfolioPriority } from '@/lib/portfolio/priority'

type P = PortfolioPriority & { projectName: string; domain: string }
function p(over: Partial<P>): P {
  return {
    projectId: 'x', projectName: 'X', domain: 'x.com',
    status: 'stable', score: 0, headline: 'ok', reasons: ['ok'], recommendedFocus: 'nothing', missingData: [],
    ...over,
  }
}

describe('buildTodayPlan', () => {
  const set: P[] = [
    p({ projectId: 'crit', projectName: 'Crit', domain: 'crit.com', status: 'critical', score: 60, headline: 'money page lost ranking', recommendedFocus: 'investigate rollback' }),
    p({ projectId: 'att', projectName: 'Att', domain: 'att.com', status: 'needs_attention', score: 30, headline: '4 keywords dropped', recommendedFocus: 'review drops' }),
    p({ projectId: 'opp', projectName: 'Opp', domain: 'opp.com', status: 'opportunity', score: 12, headline: '5 page-2 keywords', recommendedFocus: 'push to page 1' }),
    p({ projectId: 'wait', projectName: 'Wait', domain: 'wait.com', status: 'waiting_for_data', score: 5, headline: 'no audit yet', recommendedFocus: 'run first audit' }),
    p({ projectId: 'stab', projectName: 'Stab', domain: 'stab.com', status: 'stable', score: 0, headline: 'stable', recommendedFocus: 'spend time elsewhere' }),
  ]

  it('picks the highest-scoring critical project as the Portfolio Mission', () => {
    const plan = buildTodayPlan(set, '1h')
    expect(plan.mission?.projectId).toBe('crit')
    expect(plan.mission?.whyThisFirst).toMatch(/urgent/i)
  })

  it('falls back to the biggest attention item as mission when nothing is critical', () => {
    const plan = buildTodayPlan(set.filter((x) => x.status !== 'critical'), '1h')
    expect(plan.mission?.projectId).toBe('att')
    expect(plan.mission?.whyThisFirst).toMatch(/decline/i)
  })

  it('falls back to the biggest opportunity when nothing is critical or declining', () => {
    const plan = buildTodayPlan([set[2], set[3], set[4]], '1h')
    expect(plan.mission?.projectId).toBe('opp')
    expect(plan.mission?.whyThisFirst).toMatch(/gain/i)
  })

  it('returns no mission when nothing is actionable (only waiting/stable)', () => {
    const plan = buildTodayPlan([set[3], set[4]], '1h')
    expect(plan.mission).toBeNull()
  })

  it('narrows to a single Do-First item at 15 minutes', () => {
    const plan = buildTodayPlan(set, '15m')
    expect(plan.buckets.do_first).toHaveLength(1)
    expect(plan.buckets.quick_wins).toHaveLength(0)
    expect(plan.buckets.strategic).toHaveLength(0)
  })

  it('surfaces more work as available time grows', () => {
    const short = buildTodayPlan(set, '15m')
    const long = buildTodayPlan(set, 'full_day')
    const total = (plan: ReturnType<typeof buildTodayPlan>) =>
      Object.values(plan.buckets).reduce((n, b) => n + b.length, 0)
    expect(total(long)).toBeGreaterThan(total(short))
  })

  it('computes an accurate briefing', () => {
    const plan = buildTodayPlan(set, '1h')
    expect(plan.briefing.projectCount).toBe(5)
    expect(plan.briefing.critical).toBe(1)
    expect(plan.briefing.needingAttention).toBe(2) // critical + needs_attention
    expect(plan.briefing.waitingForData).toBe(1)
    expect(plan.briefing.opportunities).toBe(1)
  })

  it('routes overflow criticals into risks-to-watch when they exceed the do-first cap', () => {
    const twoCrit: P[] = [
      p({ projectId: 'c1', status: 'critical', score: 70, headline: 'a' }),
      p({ projectId: 'c2', status: 'critical', score: 65, headline: 'b' }),
    ]
    const plan = buildTodayPlan(twoCrit, '30m') // do-first cap = 1, risks cap = 1
    expect(plan.buckets.do_first).toHaveLength(1)
    expect(plan.buckets.do_first[0].projectId).toBe('c1')
    expect(plan.buckets.risks.map((r) => r.projectId)).toContain('c2')
  })

  it('exposes the available-time minute map', () => {
    expect(AVAILABLE_TIME_MINUTES['15m']).toBe(15)
    expect(AVAILABLE_TIME_MINUTES['full_day']).toBe(480)
  })
})
