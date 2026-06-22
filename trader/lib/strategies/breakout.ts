import { highest, lowest } from './indicators'
import { HOLD, numParam, type StrategyPlugin } from './types'

// Breakout (Donchian-style): buy when price breaks above the N-bar high, sell
// when it breaks below the N-bar low.
export const breakout: StrategyPlugin = {
  id: 'breakout',
  name: 'Breakout',
  description: 'Buy when price breaks above the recent N-bar high; sell when it breaks below the recent N-bar low.',
  paramSpecs: [
    { key: 'lookback', label: 'Lookback bars', type: 'number', default: 20, min: 3, max: 200, step: 1 },
  ],
  evaluate(ctx) {
    const lookback = Math.round(numParam(ctx.params, 'lookback', 20))
    const closes = ctx.candles.map((c) => c.close)
    if (closes.length < lookback + 2) return HOLD
    const i = closes.length - 1
    // Exclude the current bar from the channel.
    const priorHigh = highest(closes, lookback, i - 1)
    const priorLow = lowest(closes, lookback, i - 1)
    const price = closes[i]
    if (price > priorHigh) {
      const conf = Math.min(1, (price - priorHigh) / priorHigh * 30)
      return { action: 'buy', confidence: Math.max(0.4, conf), rationale: `Price broke above ${lookback}-bar high (${priorHigh.toFixed(2)}).` }
    }
    if (price < priorLow) {
      const conf = Math.min(1, (priorLow - price) / priorLow * 30)
      return { action: 'sell', confidence: Math.max(0.4, conf), rationale: `Price broke below ${lookback}-bar low (${priorLow.toFixed(2)}).` }
    }
    return HOLD
  },
}
