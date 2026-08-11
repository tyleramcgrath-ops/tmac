import { describe, expect, it } from 'vitest'
import {
  scoreBand,
  scoreProbe,
  scoreScan,
  shareOfVoice,
  type Probe,
} from '@/app/contact/_lib/types'
import { ordinal, probeTone, timeAgoFromMs } from '@/app/contact/_lib/format'

// The visibility score is computed locally rather than asked of the model, so
// the same scan always produces the same number. That property is only worth
// anything if it is pinned down by tests.

function probe(over: Partial<Probe> = {}): Probe {
  return {
    id: 'p1',
    prompt: 'best cbd gummies for sleep',
    intent: 'discovery',
    why: '',
    status: 'done',
    mentioned: true,
    position: 1,
    sentiment: 'positive',
    brandsNamed: ['Botany Farms'],
    ...over,
  }
}

describe('scoreProbe', () => {
  it('scores an absent brand as zero regardless of anything else', () => {
    expect(scoreProbe(probe({ mentioned: false, position: 1, sentiment: 'positive' }))).toBe(0)
  })

  it('rewards being named first over being named later', () => {
    const first = scoreProbe(probe({ position: 1 }))
    const second = scoreProbe(probe({ position: 2 }))
    const fifth = scoreProbe(probe({ position: 5 }))
    expect(first).toBeGreaterThan(second)
    expect(second).toBeGreaterThan(fifth)
  })

  it('penalises a caveated mention against a recommended one', () => {
    expect(scoreProbe(probe({ sentiment: 'negative' }))).toBeLessThan(
      scoreProbe(probe({ sentiment: 'positive' }))
    )
  })

  it('never leaves the 0-100 range', () => {
    for (const position of [1, 2, 3, 9, 50]) {
      for (const sentiment of ['positive', 'neutral', 'negative'] as const) {
        const value = scoreProbe(probe({ position, sentiment }))
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
      }
    }
  })

  it('treats a missing position as a late placement rather than crashing', () => {
    expect(scoreProbe(probe({ position: null }))).toBeGreaterThan(0)
  })
})

describe('scoreScan', () => {
  it('is zero when nothing has finished', () => {
    expect(scoreScan([probe({ status: 'pending' }), probe({ status: 'running' })])).toBe(0)
  })

  it('ignores pending and errored probes so a partial scan is not punished', () => {
    const strong = probe({ position: 1, sentiment: 'positive' })
    const onlyDone = scoreScan([strong])
    const withNoise = scoreScan([
      strong,
      probe({ id: 'p2', status: 'error' }),
      probe({ id: 'p3', status: 'pending' }),
    ])
    expect(withNoise).toBe(onlyDone)
  })

  it('is deterministic — the same probes always give the same score', () => {
    const probes = [probe({ position: 1 }), probe({ id: 'p2', position: 3, sentiment: 'neutral' })]
    expect(scoreScan(probes)).toBe(scoreScan(probes))
  })

  it('drops when the brand goes missing from an answer', () => {
    const before = scoreScan([probe(), probe({ id: 'p2' })])
    const after = scoreScan([probe(), probe({ id: 'p2', mentioned: false, position: null })])
    expect(after).toBeLessThan(before)
  })
})

describe('scoreBand', () => {
  it('labels the extremes honestly', () => {
    expect(scoreBand(0)).toEqual({ label: 'Invisible', tone: 'miss' })
    expect(scoreBand(90).tone).toBe('win')
  })

  it('never calls a low score strong', () => {
    for (const score of [1, 10, 34]) expect(scoreBand(score).tone).not.toBe('win')
  })
})

describe('shareOfVoice', () => {
  const probes = [
    probe({ brandsNamed: ['FOCL', 'Botany Farms'] }),
    probe({ id: 'p2', brandsNamed: ['FOCL', 'cbdMD'] }),
    probe({ id: 'p3', brandsNamed: ['FOCL'] }),
  ]

  it('counts every mention across answers, most-named first', () => {
    const voices = shareOfVoice(probes, 'Botany Farms')
    expect(voices[0]).toEqual({ name: 'FOCL', count: 3, isBrand: false })
  })

  it('flags the tracked brand even when written differently', () => {
    const voices = shareOfVoice([probe({ brandsNamed: ['botany farms'] })], 'Botany Farms')
    expect(voices[0].isBrand).toBe(true)
  })

  it('matches the brand across punctuation and spacing', () => {
    const voices = shareOfVoice([probe({ brandsNamed: ["Charlotte's Web"] })], 'Charlottes Web')
    expect(voices[0].isBrand).toBe(true)
  })

  it('ignores blank names the model may hand back', () => {
    const voices = shareOfVoice([probe({ brandsNamed: ['', '  ', 'FOCL'] })], 'X')
    expect(voices).toHaveLength(1)
  })

  it('caps the list so one runaway answer cannot flood the chart', () => {
    const many = probe({ brandsNamed: Array.from({ length: 20 }, (_, i) => `Brand ${i}`) })
    expect(shareOfVoice([many], 'X').length).toBeLessThanOrEqual(8)
  })
})

describe('presentation helpers', () => {
  it('ordinals read correctly, including the teens', () => {
    expect(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd']).toEqual([
      ordinal(1), ordinal(2), ordinal(3), ordinal(4), ordinal(11), ordinal(12), ordinal(13),
      ordinal(21), ordinal(22),
    ])
  })

  it('tones a probe by placement and framing', () => {
    expect(probeTone(probe({ mentioned: false }))).toBe('miss')
    expect(probeTone(probe({ position: 1, sentiment: 'positive' }))).toBe('win')
    expect(probeTone(probe({ position: 6, sentiment: 'neutral' }))).toBe('warn')
  })

  it('renders relative times from a fixed clock', () => {
    const now = Date.parse('2026-08-11T12:00:00Z')
    expect(timeAgoFromMs(now - 30_000, now)).toBe('just now')
    expect(timeAgoFromMs(now - 5 * 60_000, now)).toBe('5m ago')
    expect(timeAgoFromMs(now - 3 * 3_600_000, now)).toBe('3h ago')
    expect(timeAgoFromMs(now - 2 * 86_400_000, now)).toBe('2d ago')
  })
})
