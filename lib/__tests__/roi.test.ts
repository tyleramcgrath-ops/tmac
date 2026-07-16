import { describe, it, expect } from 'vitest'
import { formatRoiPercent, formatRoiRange, roiBand } from '../roi'

describe('formatRoiPercent', () => {
  it('passes through a realistic percentage-point value unchanged', () => {
    const r = formatRoiPercent(25)
    expect(r.percent).toBe(25)
    expect(r.wasCorrected).toBe(false)
  })

  it('rounds a fractional percentage', () => {
    const r = formatRoiPercent(24.6)
    expect(r.percent).toBe(25)
  })

  it('clamps an extreme outlier like the 945000% regression case', () => {
    const r = formatRoiPercent(945000)
    expect(r.percent).toBeLessThanOrEqual(500)
    expect(r.wasCorrected).toBe(true)
  })

  it('clamps a large negative value to the realistic floor', () => {
    const r = formatRoiPercent(-9000)
    expect(r.percent).toBe(-100)
    expect(r.wasCorrected).toBe(true)
  })

  it('treats NaN as a missing value, not zero-through-math', () => {
    const r = formatRoiPercent(NaN)
    expect(r.percent).toBe(0)
    expect(r.wasCorrected).toBe(true)
  })

  it('treats Infinity as corrected, not a literal display value', () => {
    const r = formatRoiPercent(Infinity)
    expect(Number.isFinite(r.percent)).toBe(true)
    expect(r.wasCorrected).toBe(true)
  })

  it('treats -Infinity as corrected', () => {
    const r = formatRoiPercent(-Infinity)
    expect(Number.isFinite(r.percent)).toBe(true)
    expect(r.wasCorrected).toBe(true)
  })

  it('treats null/undefined as missing, defaulting to 0 with wasCorrected', () => {
    expect(formatRoiPercent(null).percent).toBe(0)
    expect(formatRoiPercent(null).wasCorrected).toBe(true)
    expect(formatRoiPercent(undefined).percent).toBe(0)
    expect(formatRoiPercent(undefined).wasCorrected).toBe(true)
  })

  it('never multiplies the input again — a fraction like 0.25 is not turned into 25', () => {
    // formatRoiPercent's contract is "input is already percentage points."
    // 0.25 in that contract means a quarter of one percent, not 25%.
    const r = formatRoiPercent(0.25)
    expect(r.percent).toBe(0)
  })

  it('always reports precision as estimated (never false exactness)', () => {
    expect(formatRoiPercent(50).precision).toBe('estimated')
  })
})

describe('roiBand', () => {
  it('buckets low/medium/high correctly', () => {
    expect(roiBand(5)).toBe('low')
    expect(roiBand(30)).toBe('medium')
    expect(roiBand(80)).toBe('high')
  })
})

describe('formatRoiRange', () => {
  it('formats a range as low-high', () => {
    expect(formatRoiRange(15, 35)).toBe('15-35%')
  })

  it('collapses an equal range to a single tilde value', () => {
    expect(formatRoiRange(20, 20)).toBe('~20%')
  })

  it('clamps both ends of an extreme range', () => {
    const result = formatRoiRange(1000000, 2000000)
    expect(result).toBe('~500%')
  })
})
