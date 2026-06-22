import { rsi } from './indicators'
import { HOLD, numParam, type StrategyPlugin } from './types'

// RSI overbought/oversold: buy when RSI crosses up out of oversold, sell when it
// crosses down out of overbought.
export const rsiStrategy: StrategyPlugin = {
  id: 'rsi',
  name: 'RSI Overbought/Oversold',
  description: 'Buy when RSI rises back above the oversold line; sell when it falls back below the overbought line.',
  paramSpecs: [
    { key: 'period', label: 'RSI period', type: 'number', default: 14, min: 2, max: 50, step: 1 },
    { key: 'oversold', label: 'Oversold level', type: 'number', default: 30, min: 5, max: 45, step: 1 },
    { key: 'overbought', label: 'Overbought level', type: 'number', default: 70, min: 55, max: 95, step: 1 },
  ],
  evaluate(ctx) {
    const period = Math.round(numParam(ctx.params, 'period', 14))
    const oversold = numParam(ctx.params, 'oversold', 30)
    const overbought = numParam(ctx.params, 'overbought', 70)
    const closes = ctx.candles.map((c) => c.close)
    if (closes.length < period + 3) return HOLD
    const r = rsi(closes, period)
    const i = closes.length - 1
    const prev = r[i - 1]
    const cur = r[i]
    if (Number.isNaN(prev) || Number.isNaN(cur)) return HOLD
    if (prev <= oversold && cur > oversold) {
      return { action: 'buy', confidence: Math.min(1, (oversold - Math.min(prev, oversold)) / oversold + 0.4), rationale: `RSI recovered above ${oversold} (oversold).` }
    }
    if (prev >= overbought && cur < overbought) {
      return { action: 'sell', confidence: Math.min(1, (Math.max(prev, overbought) - overbought) / (100 - overbought) + 0.4), rationale: `RSI dropped below ${overbought} (overbought).` }
    }
    return HOLD
  },
}
