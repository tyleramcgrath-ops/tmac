import { getMarketStatus } from '../market-hours'
import type { Account, AssetType, MarketStatusSnapshot, Order, OrderStatus, Position, Quote } from '../types'
import { newId } from '../db'
import { BrokerNotConfiguredError, type BrokerAdapter, type PlaceOrderRequest } from './adapter'

// AlpacaAdapter — Alpaca Trading API (https://docs.alpaca.markets).
//
// Why Alpaca: simple key+secret auth (no request signing), a built-in PAPER
// environment on the same API, stocks AND crypto in one place, and real market
// data. This makes it the smoothest path to real (or paper) automated trading.
//
// Credentials come from env / encrypted settings — never the frontend, never
// hardcoded:
//   ALPACA_API_KEY     your key id
//   ALPACA_API_SECRET  your secret
//   ALPACA_PAPER       "true" (default) routes orders to Alpaca's paper account;
//                      set "false" only when you intend to trade real money.
//
// Auth: every request sends APCA-API-KEY-ID / APCA-API-SECRET-KEY headers.

const TRADING_PAPER = 'https://paper-api.alpaca.markets'
const TRADING_LIVE = 'https://api.alpaca.markets'
const DATA = 'https://data.alpaca.markets'

export interface AlpacaCreds {
  keyId: string
  secret: string
  paper: boolean
}

// Our symbols use "BTC-USD"; Alpaca crypto uses "BTC/USD". Equities are plain.
function toAlpacaSymbol(symbol: string, assetType: AssetType): string {
  if (assetType === 'crypto') return symbol.replace('-', '/')
  return symbol
}

export class AlpacaAdapter implements BrokerAdapter {
  readonly kind = 'alpaca'
  constructor(private creds: AlpacaCreds | null) {}

  private requireCreds(): AlpacaCreds {
    if (!this.creds?.keyId || !this.creds?.secret) {
      throw new BrokerNotConfiguredError('Alpaca credentials are not configured. Set ALPACA_API_KEY and ALPACA_API_SECRET.')
    }
    return this.creds
  }

  private get tradingBase(): string {
    return this.creds?.paper === false ? TRADING_LIVE : TRADING_PAPER
  }

  private headers(): Record<string, string> {
    const c = this.requireCreds()
    return {
      'APCA-API-KEY-ID': c.keyId,
      'APCA-API-SECRET-KEY': c.secret,
      'Content-Type': 'application/json',
    }
  }

  private async req<T>(base: string, method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Alpaca ${method} ${path} failed: ${res.status} ${text}`)
    }
    if (res.status === 204) return {} as T
    return (await res.json()) as T
  }

  async testConnection() {
    try {
      this.requireCreds()
      const acct = await this.req<{ status?: string }>(this.tradingBase, 'GET', '/v2/account')
      const env = this.creds?.paper === false ? 'LIVE' : 'paper'
      return { ok: true, message: `Alpaca ${env} connection OK (account ${acct.status ?? 'active'}).` }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Connection failed' }
    }
  }

  async getAccount(): Promise<Account> {
    const a = await this.req<Record<string, string>>(this.tradingBase, 'GET', '/v2/account')
    return {
      broker: 'alpaca',
      mode: this.creds?.paper === false ? 'live' : 'paper',
      equity: parseFloat(a.equity ?? a.portfolio_value ?? '0') || 0,
      cash: parseFloat(a.cash ?? '0') || 0,
      buyingPower: parseFloat(a.buying_power ?? '0') || 0,
      currency: a.currency ?? 'USD',
      asOf: Date.now(),
    }
  }

  async getPositions(): Promise<Position[]> {
    const data = await this.req<Array<Record<string, string>>>(this.tradingBase, 'GET', '/v2/positions')
    return (data ?? []).map((p) => {
      const qty = parseFloat(p.qty ?? '0') || 0
      const avg = parseFloat(p.avg_entry_price ?? '0') || 0
      const price = parseFloat(p.current_price ?? '0') || avg
      const isCrypto = (p.asset_class ?? '').includes('crypto') || (p.symbol ?? '').includes('/')
      return {
        id: p.asset_id ?? p.symbol ?? newId('pos'),
        symbol: (p.symbol ?? '').replace('/', '-'),
        assetType: isCrypto ? ('crypto' as const) : ('equity' as const),
        quantity: qty,
        avgPrice: avg,
        marketPrice: price,
        marketValue: parseFloat(p.market_value ?? '0') || qty * price,
        unrealizedPnl: parseFloat(p.unrealized_pl ?? '0') || 0,
        openedAt: Date.now(),
      }
    })
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const crypto = symbols.filter((s) => s.includes('-'))
    const equities = symbols.filter((s) => !s.includes('-'))
    const out: Quote[] = []

    if (crypto.length) {
      const ids = crypto.map((s) => toAlpacaSymbol(s, 'crypto')).join(',')
      const data = await this.req<{ quotes?: Record<string, { ap?: number; bp?: number }> }>(
        DATA,
        'GET',
        `/v1beta3/crypto/us/latest/quotes?symbols=${encodeURIComponent(ids)}`,
      )
      for (const [sym, q] of Object.entries(data.quotes ?? {})) {
        const bid = q.bp ?? 0
        const ask = q.ap ?? 0
        out.push({ symbol: sym.replace('/', '-'), assetType: 'crypto', price: (bid + ask) / 2 || ask || bid, bid, ask, timestamp: Date.now() })
      }
    }
    if (equities.length) {
      const data = await this.req<{ quotes?: Record<string, { ap?: number; bp?: number }> }>(
        DATA,
        'GET',
        `/v2/stocks/quotes/latest?symbols=${encodeURIComponent(equities.join(','))}`,
      )
      for (const [sym, q] of Object.entries(data.quotes ?? {})) {
        const bid = q.bp ?? 0
        const ask = q.ap ?? 0
        out.push({ symbol: sym, assetType: 'equity', price: (bid + ask) / 2 || ask || bid, bid, ask, timestamp: Date.now() })
      }
    }
    return out
  }

  async placeOrder(req: PlaceOrderRequest): Promise<Order> {
    const now = Date.now()
    const payload: Record<string, unknown> = {
      symbol: toAlpacaSymbol(req.symbol, req.assetType),
      qty: String(req.quantity),
      side: req.side,
      type: req.type,
      // Crypto cannot use 'day'; equities use 'day'.
      time_in_force: req.assetType === 'crypto' ? 'gtc' : 'day',
      client_order_id: req.clientOrderId,
    }
    if (req.type === 'limit' && req.limitPrice != null) payload.limit_price = String(req.limitPrice)

    const o = await this.req<Record<string, string>>(this.tradingBase, 'POST', '/v2/orders', payload)
    return {
      id: o.id ?? newId('ord'),
      clientOrderId: req.clientOrderId,
      symbol: req.symbol,
      assetType: req.assetType,
      side: req.side,
      type: req.type,
      quantity: req.quantity,
      limitPrice: req.limitPrice,
      filledQuantity: parseFloat(o.filled_qty ?? '0') || 0,
      filledAvgPrice: o.filled_avg_price ? parseFloat(o.filled_avg_price) : undefined,
      status: mapStatus(o.status),
      mode: this.creds?.paper === false ? 'live' : 'paper',
      broker: 'alpaca',
      strategyId: req.strategyId,
      reason: req.reason,
      createdAt: now,
      updatedAt: now,
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    await this.req(this.tradingBase, 'DELETE', `/v2/orders/${orderId}`)
    return true
  }

  async getOrders(): Promise<Order[]> {
    const data = await this.req<Array<Record<string, string>>>(this.tradingBase, 'GET', '/v2/orders?status=all&limit=100')
    return (data ?? []).map((o) => {
      const isCrypto = (o.symbol ?? '').includes('/')
      return {
        id: o.id ?? newId('ord'),
        clientOrderId: o.client_order_id ?? '',
        symbol: (o.symbol ?? '').replace('/', '-'),
        assetType: isCrypto ? ('crypto' as const) : ('equity' as const),
        side: (o.side as 'buy' | 'sell') ?? 'buy',
        type: (o.type as 'market' | 'limit') ?? 'market',
        quantity: parseFloat(o.qty ?? '0') || 0,
        filledQuantity: parseFloat(o.filled_qty ?? '0') || 0,
        filledAvgPrice: o.filled_avg_price ? parseFloat(o.filled_avg_price) : undefined,
        status: mapStatus(o.status),
        mode: this.creds?.paper === false ? ('live' as const) : ('paper' as const),
        broker: 'alpaca' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    })
  }

  async getMarketHours(): Promise<MarketStatusSnapshot> {
    // Equity session from Alpaca's clock; crypto is always open.
    try {
      const clock = await this.req<{ is_open?: boolean }>(this.tradingBase, 'GET', '/v2/clock')
      const base = getMarketStatus()
      return { ...base, equities: !!clock.is_open, options: !!clock.is_open }
    } catch {
      return getMarketStatus()
    }
  }
}

function mapStatus(s?: string): OrderStatus {
  switch (s) {
    case 'filled':
      return 'filled'
    case 'partially_filled':
      return 'partially_filled'
    case 'canceled':
    case 'cancelled':
    case 'expired':
      return 'cancelled'
    case 'rejected':
      return 'rejected'
    case 'new':
    case 'accepted':
    case 'pending_new':
      return 'submitted'
    default:
      return 'submitted'
  }
}
