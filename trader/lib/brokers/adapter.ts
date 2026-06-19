import type {
  Account,
  AssetType,
  MarketStatusSnapshot,
  Order,
  OrderSide,
  OrderType,
  Position,
  Quote,
} from '../types'

// Broker adapter pattern. Every broker integration implements this interface so
// the trading engine is broker-agnostic. Implementations:
//   - PaperTradingAdapter            (fully functional simulation)
//   - RobinhoodCryptoAdapter         (official Robinhood Crypto Trading API)
//   - RobinhoodEquitiesOptionsAdapter(scaffold for an approved equities/options API)

export interface PlaceOrderRequest {
  symbol: string
  assetType: AssetType
  side: OrderSide
  type: OrderType
  quantity: number
  limitPrice?: number
  clientOrderId: string
  strategyId?: string
  reason?: string
}

export interface BrokerAdapter {
  readonly kind: string
  /** Verify credentials / connectivity. Throws or returns false when not ready. */
  testConnection(): Promise<{ ok: boolean; message: string }>
  getAccount(): Promise<Account>
  getPositions(): Promise<Position[]>
  getQuotes(symbols: string[]): Promise<Quote[]>
  placeOrder(req: PlaceOrderRequest): Promise<Order>
  cancelOrder(orderId: string): Promise<boolean>
  getOrders(): Promise<Order[]>
  getMarketHours(): Promise<MarketStatusSnapshot>
}

export class BrokerNotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BrokerNotConfiguredError'
  }
}
