import type { AppState } from '../db'
import type {
  AssetType,
  RiskDecision,
  StrategyConfig,
  TradingMode,
} from '../types'

// Risk manager — the safety core of the engine. Every order passes through here.
// All functions are PURE (no mutation, no I/O) so they are easy to unit-test;
// the OrderManager is responsible for logging and applying results.

export interface TradeProposal {
  strategy: StrategyConfig
  symbol: string
  assetType: AssetType
  action: 'buy' | 'sell'
  price: number
  hasPosition: boolean
  positionQty: number
}

export interface SizedDecision extends RiskDecision {
  quantity: number
}

function startOfLocalDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Realised P/L booked today (used for the daily-loss circuit breaker). */
export function realizedPnlToday(state: AppState, strategyId?: string): number {
  const dayStart = startOfLocalDay(Date.now())
  return state.trades
    .filter((t) => t.executedAt >= dayStart && (strategyId ? t.strategyId === strategyId : true))
    .reduce((sum, t) => sum + (t.pnl ?? 0), 0)
}

/** Count of trades executed today for a strategy (max-trades-per-day limit). */
export function tradesToday(state: AppState, strategyId: string): number {
  const dayStart = startOfLocalDay(Date.now())
  return state.trades.filter((t) => t.executedAt >= dayStart && t.strategyId === strategyId).length
}

/** Most recent losing trade for a strategy, for the post-loss cooldown. */
export function lastLossAt(state: AppState, strategyId: string): number | null {
  const losses = state.trades
    .filter((t) => t.strategyId === strategyId && (t.pnl ?? 0) < 0)
    .sort((a, b) => b.executedAt - a.executedAt)
  return losses.length ? losses[0].executedAt : null
}

/**
 * Global, account-wide gate independent of any specific trade. Returns the
 * blocking reasons (empty array = clear to trade). Checked before sizing.
 */
export function globalTradingBlocks(state: AppState, mode: TradingMode): string[] {
  const reasons: string[] = []
  const risk = state.risk
  if (risk.killSwitchEngaged) reasons.push('Kill switch is engaged — all trading halted.')
  if (mode === 'live' && !risk.liveTradingEnabled) {
    reasons.push('Live trading is disabled. Enable it explicitly in Risk Controls to trade live.')
  }
  // Daily loss circuit breaker (account-wide).
  const dailyLoss = realizedPnlToday(state)
  const maxDailyLoss = state.account.equity * risk.maxDailyLossPct
  if (dailyLoss <= -maxDailyLoss) {
    reasons.push(
      `Daily loss limit reached (${dailyLoss.toFixed(2)} <= -${maxDailyLoss.toFixed(2)}). Trading halted for today.`,
    )
  }
  // Never trade on uncertain account state.
  if (!Number.isFinite(state.account.equity) || state.account.equity <= 0) {
    reasons.push('Account equity is unknown or non-positive — refusing to trade.')
  }
  return reasons
}

/**
 * Assess and size a proposed trade. Returns approval, human-readable reasons,
 * the dollar risk, computed quantity, and stop/take-profit prices.
 */
export function assessTrade(state: AppState, p: TradeProposal): SizedDecision {
  const reasons: string[] = []
  const risk = state.risk
  const sr = p.strategy.risk
  const mode = p.strategy.mode

  // 1. Global gates.
  const blocks = globalTradingBlocks(state, mode)
  if (blocks.length) {
    return { approved: false, reasons: blocks, riskAmount: 0, quantity: 0 }
  }

  // 2. Uncertain market data => never trade.
  if (!Number.isFinite(p.price) || p.price <= 0) {
    return { approved: false, reasons: ['Market price is unknown — refusing to trade.'], riskAmount: 0, quantity: 0 }
  }

  // 3. SELL handling: only ever close an existing long. No shorting / naked.
  if (p.action === 'sell') {
    if (!p.hasPosition || p.positionQty <= 0) {
      return {
        approved: false,
        reasons:
          p.assetType === 'option'
            ? ['Refusing to sell-to-open an option (naked options are disabled).']
            : ['No open position to sell — short selling is disabled.'],
        riskAmount: 0,
        quantity: 0,
      }
    }
    return {
      approved: true,
      reasons: ['Closing existing position (risk-reducing).'],
      riskAmount: 0,
      quantity: p.positionQty,
    }
  }

  // 4. BUY handling.
  if (p.hasPosition && p.positionQty > 0) {
    return { approved: false, reasons: ['Already holding a position for this symbol/strategy.'], riskAmount: 0, quantity: 0 }
  }

  // Strategy daily loss limit.
  const stratPnl = realizedPnlToday(state, p.strategy.id)
  if (stratPnl <= -sr.dailyMaxLoss && sr.dailyMaxLoss > 0) {
    reasons.push(`Strategy daily max loss reached (${stratPnl.toFixed(2)} <= -${sr.dailyMaxLoss}).`)
  }

  // Max trades/day.
  if (tradesToday(state, p.strategy.id) >= sr.maxTradesPerDay) {
    reasons.push(`Max trades per day reached (${sr.maxTradesPerDay}).`)
  }

  // Cooldown after a loss.
  const lossAt = lastLossAt(state, p.strategy.id)
  if (lossAt && Date.now() - lossAt < sr.cooldownAfterLossMs) {
    const mins = Math.ceil((sr.cooldownAfterLossMs - (Date.now() - lossAt)) / 60000)
    reasons.push(`In post-loss cooldown (~${mins} min remaining).`)
  }

  // Max open positions (account-wide).
  if (state.positions.length >= risk.maxOpenPositions) {
    reasons.push(`Max open positions reached (${risk.maxOpenPositions}).`)
  }

  // 5. Position sizing.
  const stopLossPrice = p.price * (1 - sr.stopLossPct)
  const takeProfitPrice = p.price * (1 + sr.takeProfitPct)
  const stopDistance = p.price * sr.stopLossPct

  const riskDollar = state.account.equity * risk.maxAccountRiskPerTradePct
  const qtyFromRisk = stopDistance > 0 ? riskDollar / stopDistance : Infinity

  // Notional cap: strategy max position size, and available cash unless margin
  // is explicitly enabled.
  const cashCap = risk.allowMargin ? state.account.buyingPower : state.account.cash
  const notionalCap = Math.min(sr.maxPositionSize, cashCap)
  if (notionalCap <= 0) {
    reasons.push('No buying power available for a new position.')
  }
  const qtyFromNotional = notionalCap / p.price

  let quantity = Math.min(qtyFromRisk, qtyFromNotional)

  // Asset-specific rounding.
  if (p.assetType === 'equity') {
    quantity = Math.floor(quantity)
  } else if (p.assetType === 'option') {
    quantity = Math.floor(quantity) // contracts
    const premium = quantity * p.price * 100
    if (premium > risk.maxOptionPremiumPerTrade) {
      // Re-size down to the premium cap.
      quantity = Math.floor(risk.maxOptionPremiumPerTrade / (p.price * 100))
    }
    if (quantity < 1) reasons.push('Option premium cap too low for one contract at this price.')
  } else {
    // crypto: allow fractional, round to 6 dp.
    quantity = Math.floor(quantity * 1e6) / 1e6
  }

  if (quantity <= 0) {
    reasons.push('Computed position size is zero after applying risk limits.')
  }

  const riskAmount = quantity * stopDistance

  if (reasons.length) {
    return { approved: false, reasons, riskAmount: 0, quantity: 0, stopLossPrice, takeProfitPrice }
  }

  return {
    approved: true,
    reasons: [
      `Approved: risking $${riskAmount.toFixed(2)} (${(risk.maxAccountRiskPerTradePct * 100).toFixed(2)}% of equity), ` +
        `stop ${stopLossPrice.toFixed(2)}, target ${takeProfitPrice.toFixed(2)}.`,
    ],
    riskAmount,
    quantity,
    stopLossPrice,
    takeProfitPrice,
  }
}
