import { rateOfChange } from './indicators'
import { HOLD, numParam, type StrategyPlugin } from './types'

// Momentum: buy when rate-of-change over the lookback exceeds a threshold; sell
// when it falls below the negative threshold.
export const momentum: StrategyPlugin = {
  id: 'momentum',
  name: 'Momentum',
  description: 'Buy on strong positive momentum over the lookback window; sell on strong negative momentum.',
  paramSpecs: [
    { key: 'lookback', label: 'Lookback bars', type: 'number', default: 10, min: 2, max: 100, step: 1 },
    { key: 'threshold', label: 'Threshold (%)', type: 'number', default: 3, min: 0.1, max: 50, step: 0.1, help: 'Percent move required to trigger.' },
  ],
  evaluate(ctx) {
    const lookback = Math.round(numParam(ctx.params, 'lookback', 10))
    const threshold = numParam(ctx.params, 'threshold', 3) / 100
    const closes = ctx.candles.map((c) => c.close)
    if (closes.length < lookback + 2) return HOLD
    const i = closes.length - 1
    const roc = rateOfChange(closes, lookback, i)
    if (Number.isNaN(roc)) return HOLD
    if (roc >= threshold) {
      return { action: 'buy', confidence: Math.min(1, roc / (threshold * 3)), rationale: `Momentum +${(roc * 100).toFixed(2)}% over ${lookback} bars.` }
    }
    if (roc <= -threshold) {
      return { action: 'sell', confidence: Math.min(1, -roc / (threshold * 3)), rationale: `Momentum ${(roc * 100).toFixed(2)}% over ${lookback} bars.` }
    }
    return HOLD
  },
}
