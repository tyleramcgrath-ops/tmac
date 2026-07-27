// Stale critical recommendations: pure, real-history-only detection of
// critical fixes accepted but never deployed for too long. No fabricated
// acceptance date, no invented recommendations.

import { describe, expect, it } from 'vitest'
import { findStaleCriticalRecommendations, type StaleCriticalInput } from '../lib/foundation/reco/stale-critical'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-07-24T00:00:00Z')

function rec(over: Partial<StaleCriticalInput>): StaleCriticalInput {
  return {
    id: 'r1',
    title: 'Missing title tag',
    status: 'accepted',
    severity: 'critical',
    createdAt: new Date(NOW - 20 * DAY).toISOString(),
    history: [],
    ...over,
  }
}

describe('findStaleCriticalRecommendations: real staleness only', () => {
  it('flags a critical rec accepted well over the threshold ago', () => {
    const r = rec({ history: [{ at: new Date(NOW - 20 * DAY).toISOString(), to: 'accepted' }] })
    const out = findStaleCriticalRecommendations([r], NOW)
    expect(out).toHaveLength(1)
    expect(out[0].daysStale).toBeCloseTo(20, 0)
  })

  it('does not flag a critical rec accepted recently', () => {
    const r = rec({ history: [{ at: new Date(NOW - 2 * DAY).toISOString(), to: 'accepted' }] })
    expect(findStaleCriticalRecommendations([r], NOW)).toEqual([])
  })

  it('never flags a non-critical severity rec, however old', () => {
    const r = rec({ severity: 'warning', history: [{ at: new Date(NOW - 60 * DAY).toISOString(), to: 'accepted' }] })
    expect(findStaleCriticalRecommendations([r], NOW)).toEqual([])
  })

  it('never flags a rec that is not currently accepted (e.g. already verified)', () => {
    const r = rec({ status: 'verified', history: [{ at: new Date(NOW - 60 * DAY).toISOString(), to: 'accepted' }] })
    expect(findStaleCriticalRecommendations([r], NOW)).toEqual([])
  })

  it('uses the MOST RECENT acceptance, not a stale one from a prior accept/reopen cycle', () => {
    const r = rec({
      history: [
        { at: new Date(NOW - 90 * DAY).toISOString(), to: 'accepted' },
        { at: new Date(NOW - 80 * DAY).toISOString(), to: 'reopened' },
        { at: new Date(NOW - 3 * DAY).toISOString(), to: 'accepted' },
      ],
    })
    expect(findStaleCriticalRecommendations([r], NOW)).toEqual([])
  })

  it('falls back to createdAt when there is no acceptance history entry', () => {
    const r = rec({ createdAt: new Date(NOW - 30 * DAY).toISOString(), history: [] })
    const out = findStaleCriticalRecommendations([r], NOW)
    expect(out).toHaveLength(1)
    expect(out[0].daysStale).toBeCloseTo(30, 0)
  })

  it('sorts the most stale first', () => {
    const a = rec({ id: 'a', history: [{ at: new Date(NOW - 15 * DAY).toISOString(), to: 'accepted' }] })
    const b = rec({ id: 'b', history: [{ at: new Date(NOW - 40 * DAY).toISOString(), to: 'accepted' }] })
    expect(findStaleCriticalRecommendations([a, b], NOW).map((r) => r.id)).toEqual(['b', 'a'])
  })

  it('returns nothing for an empty list rather than inventing a stale fix', () => {
    expect(findStaleCriticalRecommendations([], NOW)).toEqual([])
  })
})
