import { sma } from './indicators'
import { HOLD, numParam, type StrategyPlugin } from './types'

// Moving Average Crossover: buy when the fast SMA crosses above the slow SMA,
// sell when it crosses below.
export const maCrossover: StrategyPlugin = {
  id: 'ma_crossover',
  name: 'Moving Average Crossover',
  description: 'Buy when the fast moving average crosses above the slow one; sell on the reverse cross.',
  paramSpecs: [
    { key: 'fast', label: 'Fast period', type: 'number', default: 10, min: 2, max: 100, step: 1 },
    { key: 'slow', label: 'Slow period', type: 'number', default: 30, min: 3, max: 300, step: 1 },
  ],
  evaluate(ctx) {
    const fast = Math.round(numParam(ctx.params, 'fast', 10))
    const slow = Math.round(numParam(ctx.params, 'slow', 30))
    if (fast >= slow) return HOLD
    const closes = ctx.candles.map((c) => c.close)
    if (closes.length < slow + 2) return HOLD
    const f = sma(closes, fast)
    const s = sma(closes, slow)
    const i = closes.length - 1
    const prevF = f[i - 1]
    const prevS = s[i - 1]
    const curF = f[i]
    const curS = s[i]
    if ([prevF, prevS, curF, curS].some((v) => Number.isNaN(v))) return HOLD
    const spread = Math.abs(curF - curS) / curS
    const confidence = Math.min(1, spread * 20)
    if (prevF <= prevS && curF > curS) {
      return { action: 'buy', confidence, rationale: `Fast SMA(${fast}) crossed above slow SMA(${slow}).` }
    }
    if (prevF >= prevS && curF < curS) {
      return { action: 'sell', confidence, rationale: `Fast SMA(${fast}) crossed below slow SMA(${slow}).` }
    }
    return HOLD
  },
}
