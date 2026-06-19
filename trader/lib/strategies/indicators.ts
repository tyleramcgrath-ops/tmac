// Technical indicators used by strategy plugins and the backtester. All take an
// array of closing prices (oldest first) and return same-length arrays where the
// leading, not-yet-computable entries are NaN.

export function sma(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  if (values.length === 0) return out
  const k = 2 / (period + 1)
  // Seed with SMA of first `period` values.
  let prev = NaN
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      sum += values[i]
      if (i === period - 1) {
        prev = sum / period
        out[i] = prev
      }
    } else {
      prev = values[i] * k + prev * (1 - k)
      out[i] = prev
    }
  }
  return out
}

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  if (values.length <= period) return out
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const g = diff >= 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

export function highest(values: number[], period: number, index: number): number {
  const start = Math.max(0, index - period + 1)
  let h = -Infinity
  for (let i = start; i <= index; i++) h = Math.max(h, values[i])
  return h
}

export function lowest(values: number[], period: number, index: number): number {
  const start = Math.max(0, index - period + 1)
  let l = Infinity
  for (let i = start; i <= index; i++) l = Math.min(l, values[i])
  return l
}

export function rateOfChange(values: number[], period: number, index: number): number {
  if (index - period < 0) return NaN
  const past = values[index - period]
  if (past === 0) return NaN
  return (values[index] - past) / past
}

export function stdev(values: number[], period: number, index: number): number {
  const start = Math.max(0, index - period + 1)
  const slice = values.slice(start, index + 1)
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length
  return Math.sqrt(variance)
}
