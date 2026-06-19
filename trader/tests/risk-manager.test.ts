import { describe, expect, it } from 'vitest'
import {
  assessTrade,
  globalTradingBlocks,
  realizedPnlToday,
  tradesToday,
} from '../lib/engine/risk-manager'
import type { Position, Trade } from '../lib/types'
import { defaultRisk, defaultStrategyRisk, makeState, makeStrategy } from './helpers'

const buy = (over = {}) => ({
  strategy: makeStrategy(),
  symbol: 'BTC-USD',
  assetType: 'crypto' as const,
  action: 'buy' as const,
  price: 100,
  hasPosition: false,
  positionQty: 0,
  ...over,
})

describe('global trading blocks', () => {
  it('defaults to paper-safe and clear', () => {
    expect(globalTradingBlocks(makeState(), 'paper')).toEqual([])
  })

  it('blocks live trading when the master switch is off', () => {
    const blocks = globalTradingBlocks(makeState(), 'live')
    expect(blocks.join(' ')).toMatch(/Live trading is disabled/)
  })

  it('allows live trading when explicitly enabled', () => {
    const state = makeState({ risk: defaultRisk({ liveTradingEnabled: true }) })
    expect(globalTradingBlocks(state, 'live')).toEqual([])
  })

  it('blocks everything when the kill switch is engaged', () => {
    const state = makeState({ risk: defaultRisk({ killSwitchEngaged: true }) })
    expect(globalTradingBlocks(state, 'paper').join(' ')).toMatch(/Kill switch/)
  })

  it('halts when the daily loss limit is breached', () => {
    const loss: Trade = {
      id: 't1', orderId: 'o1', symbol: 'BTC-USD', assetType: 'crypto', side: 'sell',
      quantity: 1, price: 1, pnl: -4000, mode: 'paper', strategyId: 'strat1', executedAt: Date.now(),
    }
    const state = makeState({ trades: [loss] }) // equity 100k, 3% = 3000 limit
    expect(globalTradingBlocks(state, 'paper').join(' ')).toMatch(/Daily loss limit/)
  })

  it('refuses to trade on non-positive equity', () => {
    const state = makeState()
    state.account.equity = 0
    expect(globalTradingBlocks(state, 'paper').join(' ')).toMatch(/equity/)
  })
})

describe('assessTrade — approvals and sizing', () => {
  it('approves a normal paper buy and sizes by risk', () => {
    const d = assessTrade(makeState(), buy())
    expect(d.approved).toBe(true)
    expect(d.quantity).toBeGreaterThan(0)
    // Risk-based size = $1000 risk / ($2 stop) = 500 units, but the default
    // strategy maxPositionSize ($10k) caps notional at $10k / $100 = 100 units.
    expect(d.quantity).toBeCloseTo(100, 5)
    expect(d.stopLossPrice).toBeCloseTo(98, 5)
    expect(d.takeProfitPrice).toBeCloseTo(104, 5)
  })

  it('lets risk-based sizing dominate when the notional cap is large', () => {
    const strat = makeStrategy({ risk: defaultStrategyRisk({ maxPositionSize: 1_000_000 }) })
    const d = assessTrade(makeState(), buy({ strategy: strat }))
    // 1% of 100k = $1000 risk / (price 100 * 2% stop = $2) = 500 units
    expect(d.quantity).toBeCloseTo(500, 0)
  })

  it('caps size by strategy max position size', () => {
    const strat = makeStrategy({ risk: defaultStrategyRisk({ maxPositionSize: 1000 }) })
    const d = assessTrade(makeState(), buy({ strategy: strat }))
    // notional cap 1000 / price 100 = 10 units (less than risk-based 500)
    expect(d.quantity).toBeCloseTo(10, 5)
  })

  it('rejects a buy with no buying power', () => {
    const state = makeState()
    state.account.cash = 0
    const d = assessTrade(state, buy())
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/buying power/i)
  })

  it('rejects when already holding a position', () => {
    const d = assessTrade(makeState(), buy({ hasPosition: true, positionQty: 5 }))
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/Already holding/)
  })

  it('rejects buys beyond max open positions', () => {
    const positions: Position[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`, symbol: `S${i}`, assetType: 'equity', quantity: 1, avgPrice: 1,
      marketPrice: 1, marketValue: 1, unrealizedPnl: 0, openedAt: Date.now(),
    }))
    const d = assessTrade(makeState({ positions }), buy())
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/Max open positions/)
  })

  it('enforces max trades per day', () => {
    const strat = makeStrategy({ risk: defaultStrategyRisk({ maxTradesPerDay: 1 }) })
    const trade: Trade = {
      id: 't', orderId: 'o', symbol: 'BTC-USD', assetType: 'crypto', side: 'buy',
      quantity: 1, price: 1, mode: 'paper', strategyId: 'strat1', executedAt: Date.now(),
    }
    const d = assessTrade(makeState({ trades: [trade] }), buy({ strategy: strat }))
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/Max trades per day/)
  })

  it('enforces post-loss cooldown', () => {
    const strat = makeStrategy({ risk: defaultStrategyRisk({ cooldownAfterLossMs: 60_000 }) })
    const trade: Trade = {
      id: 't', orderId: 'o', symbol: 'BTC-USD', assetType: 'crypto', side: 'sell',
      quantity: 1, price: 1, pnl: -50, mode: 'paper', strategyId: 'strat1', executedAt: Date.now(),
    }
    const d = assessTrade(makeState({ trades: [trade] }), buy({ strategy: strat }))
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/cooldown/)
  })
})

describe('assessTrade — sell / short / naked rules', () => {
  it('allows closing an existing long', () => {
    const d = assessTrade(makeState(), buy({ action: 'sell', hasPosition: true, positionQty: 7 }))
    expect(d.approved).toBe(true)
    expect(d.quantity).toBe(7)
  })

  it('blocks short selling (sell with no position)', () => {
    const d = assessTrade(makeState(), buy({ action: 'sell', hasPosition: false, positionQty: 0 }))
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/short selling is disabled/i)
  })

  it('blocks naked option selling', () => {
    const strat = makeStrategy({ assetType: 'option' })
    const d = assessTrade(makeState(), buy({ strategy: strat, assetType: 'option', action: 'sell', hasPosition: false }))
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/naked options/i)
  })
})

describe('assessTrade — options premium cap', () => {
  it('caps option contracts by max premium per trade', () => {
    const strat = makeStrategy({ assetType: 'option', risk: defaultStrategyRisk({ maxPositionSize: 1_000_000 }) })
    // price 2 => premium per contract = 2*100 = 200; cap 500 => max 2 contracts
    const state = makeState({ risk: defaultRisk({ maxOptionPremiumPerTrade: 500 }) })
    const d = assessTrade(state, buy({ strategy: strat, assetType: 'option', price: 2 }))
    expect(d.approved).toBe(true)
    expect(d.quantity).toBe(2)
  })
})

describe('uncertainty guards', () => {
  it('refuses to trade on an unknown price', () => {
    const d = assessTrade(makeState(), buy({ price: NaN }))
    expect(d.approved).toBe(false)
    expect(d.reasons.join(' ')).toMatch(/price is unknown/i)
  })
})

describe('helpers', () => {
  it('sums realized pnl today', () => {
    const trades: Trade[] = [
      { id: '1', orderId: 'o', symbol: 'X', assetType: 'crypto', side: 'sell', quantity: 1, price: 1, pnl: 100, mode: 'paper', strategyId: 'strat1', executedAt: Date.now() },
      { id: '2', orderId: 'o', symbol: 'X', assetType: 'crypto', side: 'sell', quantity: 1, price: 1, pnl: -30, mode: 'paper', strategyId: 'strat1', executedAt: Date.now() },
    ]
    expect(realizedPnlToday(makeState({ trades }))).toBe(70)
    expect(tradesToday(makeState({ trades }), 'strat1')).toBe(2)
  })
})
