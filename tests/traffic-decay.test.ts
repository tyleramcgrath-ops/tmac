// Traffic decay: pure, real-trend-data-only detection of a meaningful
// organic-click decline between the two halves of an already-fetched daily
// GSC trend window. No new fetch, no fabricated baseline.

import { describe, expect, it } from 'vitest'
import { detectTrafficDecay, type GscDecayPoint } from '../lib/foundation/reco/traffic-decay'

function points(clicksByDay: number[]): GscDecayPoint[] {
  return clicksByDay.map((clicks, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, clicks }))
}

describe('detectTrafficDecay: real, meaningful declines only', () => {
  it('flags a real decline of at least the threshold between halves', () => {
    // earlier half: 10 days x 20 clicks = 200. recent half: 10 days x 5 clicks = 50. -75%.
    const out = detectTrafficDecay(points([...Array(10).fill(20), ...Array(10).fill(5)]))
    expect(out).toEqual({ earlierClicks: 200, recentClicks: 50, changePct: -75 })
  })

  it('does not flag ordinary noise under the threshold', () => {
    // earlier: 200, recent: 180 → -10%, under the 20% threshold
    const out = detectTrafficDecay(points([...Array(10).fill(20), ...Array(10).fill(18)]))
    expect(out).toBeNull()
  })

  it('does not flag an improvement', () => {
    const out = detectTrafficDecay(points([...Array(10).fill(10), ...Array(10).fill(30)]))
    expect(out).toBeNull()
  })

  it('never flags with too few days of data to mean anything', () => {
    const out = detectTrafficDecay(points([50, 40, 30, 20, 10]))
    expect(out).toBeNull()
  })

  it('never flags off a near-zero baseline — percent change would be meaningless noise', () => {
    const out = detectTrafficDecay(points([...Array(10).fill(1), ...Array(10).fill(0)]))
    expect(out).toBeNull()
  })

  it('is order-independent — sorts by date before splitting', () => {
    const shuffled = points([...Array(10).fill(20), ...Array(10).fill(5)]).reverse()
    const out = detectTrafficDecay(shuffled)
    expect(out).toEqual({ earlierClicks: 200, recentClicks: 50, changePct: -75 })
  })
})
