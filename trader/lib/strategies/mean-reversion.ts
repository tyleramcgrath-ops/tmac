import { sma, stdev } from './indicators'
import { HOLD, numParam, type StrategyPlugin } from './types'

// Mean reversion (Bollinger-style): buy when price is N standard deviations
// below the moving average, sell when N standard deviations above.
export const meanReversion: StrategyPlugin = {
  id: 'mean_reversion',
  name: 'Mean Reversion',
  description: 'Buy when price falls far below its moving average (oversold band); sell when far above.',
  paramSpecs: [
    { key: 'period', label: 'MA period', type: 'number', default: 20, min: 3, max: 200, step: 1 },
    { key: 'bands', label: 'Std-dev bands', type: 'number', default: 2, min: 0.5, max: 4, step: 0.1 },
  ],
  evaluate(ctx) {
    const period = Math.round(numParam(ctx.params, 'period', 20))
    const bands = numParam(ctx.params, 'bands', 2)
    const closes = ctx.candles.map((c) => c.close)
    if (closes.length < period + 2) return HOLD
    const i = closes.length - 1
    const mean = sma(closes, period)[i]
    const sd = stdev(closes, period, i)
    if (Number.isNaN(mean) || sd === 0) return HOLD
    const z = (closes[i] - mean) / sd
    if (z <= -bands) {
      return { action: 'buy', confidence: Math.min(1, -z / (bands * 2)), rationale: `Price ${z.toFixed(2)}σ below MA(${period}) — oversold.` }
    }
    if (z >= bands) {
      return { action: 'sell', confidence: Math.min(1, z / (bands * 2)), rationale: `Price ${z.toFixed(2)}σ above MA(${period}) — overbought.` }
    }
    return HOLD
  },
}
