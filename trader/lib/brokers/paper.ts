import type { AppState } from '../db'
import { newId } from '../db'
import { getMarketStatus } from '../market-hours'
import { getQuotes as getMarketQuotes } from '../market-data'
import type { Account, MarketStatusSnapshot, Order, Position, Quote } from '../types'
import type { BrokerAdapter, PlaceOrderRequest } from './adapter'

// Fully functional paper-trading broker. Simulates execution against live
// (synthetic) market data. Market orders fill immediately at the current
// quote; limit orders fill only if the quote is at/through the limit, otherwise
// they are returned as 'submitted' (the engine can re-evaluate next tick).
//
// The adapter is a pure execution venue: it reads account/positions from the
// engine's state for reporting but does NOT mutate state. The OrderManager
// applies returned fills to positions and cash so all brokers share one code
// path for bookkeeping.

export class PaperTradingAdapter implements BrokerAdapter {
  readonly kind = 'paper'
  constructor(private state: AppState) {}

  async testConnection() {
    return { ok: true, message: 'Paper trading simulator ready.' }
  }

  async getAccount(): Promise<Account> {
    return { ...this.state.account, broker: 'paper', mode: 'paper' }
  }

  async getPositions(): Promise<Position[]> {
    return this.state.positions
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    // Infer asset type from known positions/watchlists, default to crypto for
    // hyphenated pairs (e.g. BTC-USD), equity otherwise.
    const items = symbols.map((symbol) => ({
      symbol,
      assetType: symbol.includes('-') ? ('crypto' as const) : ('equity' as const),
    }))
    return getMarketQuotes(items)
  }

  async placeOrder(req: PlaceOrderRequest): Promise<Order> {
    const now = Date.now()
    const [quote] = await getMarketQuotes([{ symbol: req.symbol, assetType: req.assetType }])
    const refPrice = req.side === 'buy' ? quote.ask ?? quote.price : quote.bid ?? quote.price

    const base: Order = {
      id: newId('ord'),
      clientOrderId: req.clientOrderId,
      symbol: req.symbol,
      assetType: req.assetType,
      side: req.side,
      type: req.type,
      quantity: req.quantity,
      limitPrice: req.limitPrice,
      filledQuantity: 0,
      status: 'submitted',
      mode: 'paper',
      broker: 'paper',
      strategyId: req.strategyId,
      reason: req.reason,
      createdAt: now,
      updatedAt: now,
    }

    const marketable =
      req.type === 'market' ||
      (req.type === 'limit' &&
        req.limitPrice != null &&
        ((req.side === 'buy' && refPrice <= req.limitPrice) ||
          (req.side === 'sell' && refPrice >= req.limitPrice)))

    if (marketable) {
      const fillPrice = req.type === 'limit' && req.limitPrice != null ? req.limitPrice : refPrice
      return {
        ...base,
        status: 'filled',
        filledQuantity: req.quantity,
        filledAvgPrice: fillPrice,
      }
    }
    return base
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.state.orders.find((o) => o.id === orderId)
    if (!order || order.status === 'filled') return false
    order.status = 'cancelled'
    order.updatedAt = Date.now()
    return true
  }

  async getOrders(): Promise<Order[]> {
    return this.state.orders.filter((o) => o.broker === 'paper')
  }

  async getMarketHours(): Promise<MarketStatusSnapshot> {
    return getMarketStatus()
  }
}
