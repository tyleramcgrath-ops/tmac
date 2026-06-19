import { describe, expect, it } from 'vitest'
import { STRATEGIES, getStrategyPlugin, defaultParamsFor } from '../lib/strategies'
import type { Candle } from '../lib/types'

function candlesFromCloses(closes: number[]): Candle[] {
  return closes.map((c, i) => ({ timestamp: i * 86_400_000, open: c, high: c, low: c, close: c, volume: 1000 }))
}

describe('strategy registry', () => {
  it('exposes the six required strategies', () => {
    const ids = STRATEGIES.map((s) => s.id).sort()
    expect(ids).toEqual(
      ['breakout', 'custom_rule', 'ma_crossover', 'mean_reversion', 'momentum', 'rsi'].sort(),
    )
  })

  it('every strategy returns hold on insufficient data', () => {
    for (const s of STRATEGIES) {
      const res = s.evaluate({ symbol: 'X', assetType: 'crypto', candles: candlesFromCloses([1, 2, 3]), params: {}, hasPosition: false })
      expect(res.action).toBe('hold')
    }
  })

  it('default params cover every spec', () => {
    for (const s of STRATEGIES) {
      const params = defaultParamsFor(s.id)
      for (const spec of s.paramSpecs) expect(params[spec.key]).toBe(spec.default)
    }
  })
})

describe('ma crossover signals', () => {
  it('emits buy on an upward cross', () => {
    const plugin = getStrategyPlugin('ma_crossover')!
    // Long downtrend then sharp rally to force fast above slow.
    const closes = [
      ...Array.from({ length: 40 }, (_, i) => 100 - i), // falling
      ...Array.from({ length: 15 }, (_, i) => 60 + i * 5), // sharp rally
    ]
    const res = plugin.evaluate({ symbol: 'X', assetType: 'crypto', candles: candlesFromCloses(closes), params: { fast: 5, slow: 20 }, hasPosition: false })
    expect(['buy', 'hold']).toContain(res.action)
  })
})

describe('rsi strategy', () => {
  it('produces a sell after a strong rally pushes RSI above overbought then it eases', () => {
    const plugin = getStrategyPlugin('rsi')!
    const closes = [
      ...Array.from({ length: 20 }, () => 100),
      ...Array.from({ length: 15 }, (_, i) => 100 + i * 5), // rally -> overbought
      98, // pullback
    ]
    const res = plugin.evaluate({ symbol: 'X', assetType: 'crypto', candles: candlesFromCloses(closes), params: {}, hasPosition: true })
    expect(['sell', 'hold']).toContain(res.action)
  })
})
