import { rsi, sma } from './indicators'
import { HOLD, numParam, type StrategyPlugin } from './types'

// Custom rule builder: a composable rule combining a trend filter (price vs SMA)
// with an RSI condition. This demonstrates the rule-builder pattern; extend
// paramSpecs and evaluate() to add more composable conditions.
//
//   BUY  when RSI < buyRsiBelow  AND (trendFilter off OR price > SMA)
//   SELL when RSI > sellRsiAbove AND (trendFilter off OR price < SMA)
export const customRule: StrategyPlugin = {
  id: 'custom_rule',
  name: 'Custom Rule Builder',
  description: 'Combine an RSI condition with an optional price/SMA trend filter to define your own entries and exits.',
  paramSpecs: [
    { key: 'rsiPeriod', label: 'RSI period', type: 'number', default: 14, min: 2, max: 50, step: 1 },
    { key: 'buyRsiBelow', label: 'Buy when RSI below', type: 'number', default: 35, min: 5, max: 60, step: 1 },
    { key: 'sellRsiAbove', label: 'Sell when RSI above', type: 'number', default: 65, min: 40, max: 95, step: 1 },
    { key: 'smaPeriod', label: 'Trend SMA period', type: 'number', default: 50, min: 2, max: 300, step: 1 },
    { key: 'trendFilter', label: 'Use trend filter (1=on, 0=off)', type: 'number', default: 1, min: 0, max: 1, step: 1 },
  ],
  evaluate(ctx) {
    const rsiPeriod = Math.round(numParam(ctx.params, 'rsiPeriod', 14))
    const buyRsiBelow = numParam(ctx.params, 'buyRsiBelow', 35)
    const sellRsiAbove = numParam(ctx.params, 'sellRsiAbove', 65)
    const smaPeriod = Math.round(numParam(ctx.params, 'smaPeriod', 50))
    const trendOn = numParam(ctx.params, 'trendFilter', 1) >= 0.5
    const closes = ctx.candles.map((c) => c.close)
    if (closes.length < Math.max(rsiPeriod, smaPeriod) + 2) return HOLD
    const i = closes.length - 1
    const r = rsi(closes, rsiPeriod)[i]
    const trend = sma(closes, smaPeriod)[i]
    if (Number.isNaN(r) || Number.isNaN(trend)) return HOLD
    const price = closes[i]
    if (r < buyRsiBelow && (!trendOn || price > trend)) {
      return { action: 'buy', confidence: Math.min(1, (buyRsiBelow - r) / buyRsiBelow + 0.3), rationale: `RSI ${r.toFixed(1)} < ${buyRsiBelow}${trendOn ? ' and price above SMA' : ''}.` }
    }
    if (r > sellRsiAbove && (!trendOn || price < trend)) {
      return { action: 'sell', confidence: Math.min(1, (r - sellRsiAbove) / (100 - sellRsiAbove) + 0.3), rationale: `RSI ${r.toFixed(1)} > ${sellRsiAbove}${trendOn ? ' and price below SMA' : ''}.` }
    }
    return HOLD
  },
}
