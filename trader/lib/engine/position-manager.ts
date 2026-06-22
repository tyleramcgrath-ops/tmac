import type { AppState } from '../db'
import { newId } from '../db'
import type { Order, Position, Quote, Trade } from '../types'

// Position manager: applies fills to positions/cash, records trades with P/L,
// and marks open positions to market. One position per strategy+symbol.

export function positionKey(strategyId: string | undefined, symbol: string): string {
  return `${strategyId ?? 'manual'}:${symbol}`
}

export function findPosition(state: AppState, strategyId: string | undefined, symbol: string): Position | undefined {
  return state.positions.find((p) => p.id === positionKey(strategyId, symbol))
}

/**
 * Apply a FILLED order to the account. Returns the resulting Trade (with P/L for
 * closes). Mutates state.positions and state.account.
 */
export function applyFill(
  state: AppState,
  order: Order,
  opts?: { stopLossPrice?: number; takeProfitPrice?: number },
): Trade {
  const price = order.filledAvgPrice ?? 0
  const qty = order.filledQuantity
  const key = positionKey(order.strategyId, order.symbol)
  const existing = state.positions.find((p) => p.id === key)
  let pnl: number | undefined

  if (order.side === 'buy') {
    const cost = price * qty
    state.account.cash -= cost
    if (existing) {
      const totalQty = existing.quantity + qty
      existing.avgPrice = (existing.avgPrice * existing.quantity + cost) / totalQty
      existing.quantity = totalQty
    } else {
      state.positions.push({
        id: key,
        symbol: order.symbol,
        assetType: order.assetType,
        quantity: qty,
        avgPrice: price,
        marketPrice: price,
        marketValue: cost,
        unrealizedPnl: 0,
        openedAt: Date.now(),
        strategyId: order.strategyId,
        stopLossPrice: opts?.stopLossPrice,
        takeProfitPrice: opts?.takeProfitPrice,
      })
    }
  } else {
    // sell — realise P/L against the open position.
    if (existing) {
      pnl = (price - existing.avgPrice) * qty
      state.account.cash += price * qty
      existing.quantity -= qty
      if (existing.quantity <= 1e-9) {
        state.positions = state.positions.filter((p) => p.id !== key)
      }
    } else {
      state.account.cash += price * qty
    }
  }

  recomputeEquity(state)

  const trade: Trade = {
    id: newId('trade'),
    orderId: order.id,
    symbol: order.symbol,
    assetType: order.assetType,
    side: order.side,
    quantity: qty,
    price,
    pnl,
    mode: order.mode,
    strategyId: order.strategyId,
    executedAt: Date.now(),
  }
  state.trades.push(trade)
  return trade
}

export function markToMarket(state: AppState, quotes: Quote[]): void {
  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]))
  for (const pos of state.positions) {
    const q = bySymbol.get(pos.symbol)
    if (!q) continue
    pos.marketPrice = q.price
    pos.marketValue = q.price * pos.quantity
    pos.unrealizedPnl = (q.price - pos.avgPrice) * pos.quantity
  }
  recomputeEquity(state)
}

export function recomputeEquity(state: AppState): void {
  const positionsValue = state.positions.reduce((sum, p) => sum + p.marketValue, 0)
  state.account.equity = state.account.cash + positionsValue
  state.account.buyingPower = state.risk.allowMargin
    ? state.account.cash * 2 // simplistic 2x margin model when explicitly enabled
    : state.account.cash
  state.account.asOf = Date.now()
}
