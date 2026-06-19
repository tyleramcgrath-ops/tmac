import { describe, expect, it } from 'vitest'
import { ema, highest, lowest, rateOfChange, rsi, sma } from '../lib/strategies/indicators'

describe('sma', () => {
  it('computes simple moving average with NaN warmup', () => {
    const out = sma([1, 2, 3, 4, 5], 3)
    expect(out[0]).toBeNaN()
    expect(out[1]).toBeNaN()
    expect(out[2]).toBe(2)
    expect(out[3]).toBe(3)
    expect(out[4]).toBe(4)
  })
})

describe('ema', () => {
  it('seeds with sma then smooths', () => {
    const out = ema([1, 2, 3, 4, 5], 3)
    expect(out[2]).toBe(2) // SMA seed
    expect(out[3]).toBeCloseTo(3, 5)
    expect(out[4]).toBeCloseTo(4, 5)
  })
})

describe('rsi', () => {
  it('is 100 for a monotonic rise', () => {
    const out = rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 14)
    expect(out[15]).toBeCloseTo(100, 5)
  })
  it('stays within 0..100', () => {
    const vals = Array.from({ length: 60 }, (_, i) => 50 + 10 * Math.sin(i / 3))
    for (const v of rsi(vals, 14)) {
      if (!Number.isNaN(v)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('highest / lowest / rateOfChange', () => {
  const v = [10, 12, 8, 15, 9, 20]
  it('highest over window', () => {
    expect(highest(v, 3, 5)).toBe(20)
    expect(highest(v, 3, 2)).toBe(12)
  })
  it('lowest over window', () => {
    expect(lowest(v, 3, 4)).toBe(8)
  })
  it('rate of change', () => {
    expect(rateOfChange([100, 110], 1, 1)).toBeCloseTo(0.1, 5)
    expect(rateOfChange([100], 1, 0)).toBeNaN()
  })
})
