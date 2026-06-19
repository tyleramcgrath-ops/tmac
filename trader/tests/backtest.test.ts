import { describe, expect, it } from 'vitest'
import { runBacktest } from '../lib/backtest/engine'

describe('backtester', () => {
  it('runs deterministically and returns coherent metrics', async () => {
    const a = await runBacktest({ strategyKind: 'ma_crossover', symbol: 'BTC-USD', assetType: 'crypto', params: { fast: 10, slow: 30 }, bars: 300 })
    const b = await runBacktest({ strategyKind: 'ma_crossover', symbol: 'BTC-USD', assetType: 'crypto', params: { fast: 10, slow: 30 }, bars: 300 })
    // Deterministic synthetic data => identical results.
    expect(a.endingEquity).toBe(b.endingEquity)
    expect(a.winRate).toBeGreaterThanOrEqual(0)
    expect(a.winRate).toBeLessThanOrEqual(1)
    expect(a.maxDrawdownPct).toBeGreaterThanOrEqual(0)
    expect(a.equityCurve.length).toBeGreaterThan(0)
  })

  it('respects stop-loss / take-profit parameters without crashing', async () => {
    const r = await runBacktest({ strategyKind: 'rsi', symbol: 'ETH-USD', assetType: 'crypto', params: {}, bars: 250, stopLossPct: 0.05, takeProfitPct: 0.1 })
    expect(Number.isFinite(r.totalReturnPct)).toBe(true)
    expect(r.trades).toBeGreaterThanOrEqual(0)
  })

  it('throws on unknown strategy', async () => {
    await expect(runBacktest({ strategyKind: 'nope', symbol: 'X', assetType: 'crypto', params: {} })).rejects.toThrow()
  })
})
