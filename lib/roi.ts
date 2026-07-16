// ROI percentage formatting contract.
//
// Every place in this codebase that displays an "expected ROI" as a percent
// (the UI, API responses) must go through here first. Before this existed,
// internal initiative-scoring numbers — never intended as percentages, just
// relative weights used to sort initiatives — were being assigned directly
// to fields labeled "%" and shown to users as "+945,000% revenue impact."
//
// The contract: a value entering formatRoiPercent() is treated as an
// already-percentage-point estimate (25 means "+25%"). It is never
// multiplied or divided again here — upstream producers are responsible for
// emitting percentage-point numbers, not raw scores. This function's job is
// only to catch what gets through anyway: NaN, Infinity, negative baselines,
// and unrealistic outliers that indicate an upstream unit mismatch.

export interface FormattedRoi {
  /** Sanitized percentage-point value, safe to display as "+{value}%". */
  percent: number
  /** True if the input was NaN/Infinity/out of realistic range and had to be corrected. */
  wasCorrected: boolean
  /** 'estimated' whenever precision is untrustworthy (corrected, or always for projections) — never show '73%' as if it were measured fact. */
  precision: 'estimated'
  /** Human-friendly bucket, useful when exact precision would be false confidence. */
  band: 'low' | 'medium' | 'high'
}

const MAX_REALISTIC_ROI_PERCENT = 500
const MIN_REALISTIC_ROI_PERCENT = -100 // a baseline can't lose more than 100% of itself

export function formatRoiPercent(raw: number | null | undefined): FormattedRoi {
  if (raw == null || Number.isNaN(raw) || !Number.isFinite(raw)) {
    return { percent: 0, wasCorrected: true, precision: 'estimated', band: 'low' }
  }
  const clamped = Math.max(MIN_REALISTIC_ROI_PERCENT, Math.min(MAX_REALISTIC_ROI_PERCENT, raw))
  const wasCorrected = clamped !== raw
  const percent = Math.round(clamped)
  return { percent, wasCorrected, precision: 'estimated', band: roiBand(percent) }
}

export function roiBand(percent: number): 'low' | 'medium' | 'high' {
  if (percent < 15) return 'low'
  if (percent < 60) return 'medium'
  return 'high'
}

/** Formats a range (e.g. for uncertain projections) as "15-35%" rather than a single falsely-precise number. */
export function formatRoiRange(low: number, high: number): string {
  const a = formatRoiPercent(low)
  const b = formatRoiPercent(high)
  const lo = Math.min(a.percent, b.percent)
  const hi = Math.max(a.percent, b.percent)
  return lo === hi ? `~${lo}%` : `${lo}-${hi}%`
}
