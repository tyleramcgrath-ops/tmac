import { describe, it, expect } from 'vitest'
import {
  interpretSerpResponse,
  unavailableResult,
  extractSerpFeatures,
  summarizeRankChecks,
  computeRankDeltas,
  type RankCheckResult,
} from '../track'

describe('interpretSerpResponse', () => {
  it('finds the target domain position and labels it as an observed live check', () => {
    const r = interpretSerpResponse('emergency plumbing', 'acme.com', {
      organic_results: [
        { link: 'https://competitor.com/a', position: 1 },
        { link: 'https://www.acme.com/emergency', position: 4 },
      ],
    })
    expect(r.position).toBe(4)
    expect(r.rankingUrl).toBe('https://www.acme.com/emergency')
    expect(r.source).toBe('rankforge_live_check')
    expect(r.available).toBe(true)
  })

  it('returns position null but still available when the site is not in the pulled results', () => {
    const r = interpretSerpResponse('emergency plumbing', 'acme.com', {
      organic_results: [{ link: 'https://competitor.com/a', position: 1 }],
    })
    expect(r.position).toBeNull()
    expect(r.available).toBe(true) // the check succeeded — the site just doesn't rank in range
    expect(r.unavailableReason).toBeNull()
  })

  it('matches regardless of www prefix', () => {
    const r = interpretSerpResponse('x', 'www.acme.com', {
      organic_results: [{ link: 'https://acme.com/p', position: 7 }],
    })
    expect(r.position).toBe(7)
  })
})

describe('extractSerpFeatures', () => {
  it('detects local pack, featured snippet, PAA, video, and AI overview', () => {
    const features = extractSerpFeatures({
      local_results: {},
      answer_box: {},
      related_questions: [{}, {}],
      inline_videos: {},
      ai_overview: {},
    })
    expect(features).toEqual(expect.arrayContaining(['local_pack', 'featured_snippet', 'paa', 'video', 'ai_overview']))
  })

  it('returns an empty array when no features are present', () => {
    expect(extractSerpFeatures({ organic_results: [] })).toEqual([])
  })

  it('does not report AI overview when the field is absent (never fabricated)', () => {
    expect(extractSerpFeatures({ organic_results: [{ link: 'x', position: 1 }] })).not.toContain('ai_overview')
  })
})

describe('unavailableResult', () => {
  it('marks a failed check as unavailable with a reason, never a fake position', () => {
    const r = unavailableResult('emergency plumbing', 'SERP request failed (503)')
    expect(r.position).toBeNull()
    expect(r.available).toBe(false)
    expect(r.source).toBe('unavailable')
    expect(r.unavailableReason).toBe('SERP request failed (503)')
  })
})

describe('summarizeRankChecks', () => {
  it('computes averages only from observed, ranking results — unavailable checks never skew it', () => {
    const results: RankCheckResult[] = [
      { keyword: 'a', position: 2, rankingUrl: 'x', source: 'rankforge_live_check', available: true, unavailableReason: null, serpFeatures: [] },
      { keyword: 'b', position: 8, rankingUrl: 'x', source: 'rankforge_live_check', available: true, unavailableReason: null, serpFeatures: [] },
      { keyword: 'c', position: null, rankingUrl: null, source: 'rankforge_live_check', available: true, unavailableReason: null, serpFeatures: [] }, // observed, not ranking
      { keyword: 'd', position: null, rankingUrl: null, source: 'unavailable', available: false, unavailableReason: 'timeout', serpFeatures: [] },
    ]
    const s = summarizeRankChecks(results)
    expect(s.checked).toBe(4)
    expect(s.observed).toBe(3)
    expect(s.unavailable).toBe(1)
    expect(s.ranking).toBe(2)
    expect(s.top3).toBe(1)
    expect(s.top10).toBe(2)
    expect(s.avgPosition).toBe(5) // (2 + 8) / 2 — c and d excluded
  })

  it('returns null average when nothing ranked', () => {
    const s = summarizeRankChecks([unavailableResult('a', 'x')])
    expect(s.avgPosition).toBeNull()
    expect(s.ranking).toBe(0)
  })
})

describe('computeRankDeltas', () => {
  it('computes improvement as previous minus current (positive = moved up)', () => {
    const results: RankCheckResult[] = [
      { keyword: 'a', position: 3, rankingUrl: 'x', source: 'rankforge_live_check', available: true, unavailableReason: null, serpFeatures: [] },
    ]
    const [d] = computeRankDeltas(results, { a: 8 })
    expect(d.delta).toBe(5)
    expect(d.direction).toBe('up')
  })

  it('reports a drop as a negative delta', () => {
    const results: RankCheckResult[] = [
      { keyword: 'a', position: 12, rankingUrl: 'x', source: 'rankforge_live_check', available: true, unavailableReason: null, serpFeatures: [] },
    ]
    const [d] = computeRankDeltas(results, { a: 5 })
    expect(d.delta).toBe(-7)
    expect(d.direction).toBe('down')
  })

  it('never fabricates a delta when there is no prior position', () => {
    const results: RankCheckResult[] = [
      { keyword: 'a', position: 4, rankingUrl: 'x', source: 'rankforge_live_check', available: true, unavailableReason: null, serpFeatures: [] },
    ]
    const [d] = computeRankDeltas(results, {})
    expect(d.delta).toBeNull()
    expect(d.direction).toBe('unknown')
  })

  it('never fabricates a delta when the current check was unavailable', () => {
    const results: RankCheckResult[] = [unavailableResult('a', 'timeout')]
    const [d] = computeRankDeltas(results, { a: 5 })
    expect(d.delta).toBeNull()
    expect(d.current).toBeNull()
    expect(d.direction).toBe('unknown')
  })
})
