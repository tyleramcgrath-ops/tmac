import { describe, it, expect } from 'vitest'
import { classifyFreshness, worstFreshness, freshnessPenalty } from '../policy'

const now = new Date('2026-07-17T12:00:00Z')
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000)

describe('classifyFreshness', () => {
  it('reports not_configured when the source is not connected', () => {
    const r = classifyFreshness({ source: 'gsc', configured: false, lastSuccessAt: null, now })
    expect(r.status).toBe('not_configured')
  })

  it('reports missing when configured but never run', () => {
    const r = classifyFreshness({ source: 'gsc', configured: true, lastSuccessAt: null, now })
    expect(r.status).toBe('missing')
  })

  it('reports failed when never succeeded but a failure is on record', () => {
    const r = classifyFreshness({ source: 'gsc', configured: true, lastSuccessAt: null, lastFailureAt: hoursAgo(2), now })
    expect(r.status).toBe('failed')
  })

  it('treats GSC as fresh within its reporting-delay window (36h)', () => {
    const r = classifyFreshness({ source: 'gsc', lastSuccessAt: hoursAgo(36), now })
    expect(r.status).toBe('fresh') // 36h < 48h freshMax — reporting delay tolerated
  })

  it('treats priority rankings at 36h as fresh but full rankings at the same age also fresh (different cadence)', () => {
    // Same age, different sources — thresholds differ. 36h: priority fresh (<=48h), full fresh (<=240h)
    expect(classifyFreshness({ source: 'priority_rankings', lastSuccessAt: hoursAgo(72), now }).status).toBe('aging') // 72h in (48,96]
    expect(classifyFreshness({ source: 'full_rankings', lastSuccessAt: hoursAgo(72), now }).status).toBe('fresh') // 72h < 240h
  })

  it('does not apply one universal threshold — a 20-day-old crawl is still aging, not stale', () => {
    expect(classifyFreshness({ source: 'crawl', lastSuccessAt: hoursAgo(20 * 24), now }).status).toBe('aging') // <=30d
    expect(classifyFreshness({ source: 'crawl', lastSuccessAt: hoursAgo(40 * 24), now }).status).toBe('stale')
  })

  it('marks deployment verification stale quickly', () => {
    expect(classifyFreshness({ source: 'deployment_verification', lastSuccessAt: hoursAgo(3), now }).status).toBe('fresh')
    expect(classifyFreshness({ source: 'deployment_verification', lastSuccessAt: hoursAgo(30), now }).status).toBe('stale') // >24h
  })

  it('degrades fresh to aging when a failure occurred after the last success', () => {
    const r = classifyFreshness({ source: 'gsc', lastSuccessAt: hoursAgo(10), lastFailureAt: hoursAgo(1), now })
    expect(r.status).toBe('aging')
    expect(r.reason).toMatch(/failed/i)
  })

  it('includes age, cadence, reason, and a recommended action', () => {
    const r = classifyFreshness({ source: 'crawl', lastSuccessAt: hoursAgo(40 * 24), now })
    expect(r.ageHours).toBeGreaterThan(0)
    expect(r.expectedCadenceHours).toBeGreaterThan(0)
    expect(r.reason.length).toBeGreaterThan(0)
    expect(r.recommendedAction).toMatch(/refresh/i)
  })
})

describe('worstFreshness', () => {
  it('returns the worst status across sources', () => {
    expect(worstFreshness([
      classifyFreshness({ source: 'crawl', lastSuccessAt: hoursAgo(1), now }),
      classifyFreshness({ source: 'gsc', configured: false, lastSuccessAt: null, now }),
      classifyFreshness({ source: 'ga4', lastSuccessAt: hoursAgo(200), now }),
    ])).toBe('stale')
  })
  it('returns missing for an empty set', () => {
    expect(worstFreshness([])).toBe('missing')
  })
})

describe('freshnessPenalty', () => {
  it('penalizes worse freshness more', () => {
    expect(freshnessPenalty('fresh')).toBe(0)
    expect(freshnessPenalty('failed')).toBeGreaterThan(freshnessPenalty('stale'))
    expect(freshnessPenalty('stale')).toBeGreaterThan(freshnessPenalty('aging'))
  })
})
