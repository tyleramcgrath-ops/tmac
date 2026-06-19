import { createPrivateKey, sign as edSign } from 'crypto'
import { getMarketStatus } from '../market-hours'
import type { Account, MarketStatusSnapshot, Order, OrderStatus, Position, Quote } from '../types'
import { newId } from '../db'
import { BrokerNotConfiguredError, type BrokerAdapter, type PlaceOrderRequest } from './adapter'

// RobinhoodCryptoAdapter — official Robinhood Crypto Trading API.
// Docs: https://docs.robinhood.com/crypto/trading/  (Crypto API support article:
// https://robinhood.com/us/en/support/articles/crypto-api/)
//
// Authentication (per official docs):
//   - You generate an Ed25519 keypair and register the PUBLIC key in the
//     Robinhood API Credentials portal. You receive an API key (string).
//   - Each request is signed: the message is
//       `${apiKey}${timestampSeconds}${path}${method}${body}`
//     signed with your Ed25519 PRIVATE key (base64). Headers:
//       x-api-key:      <apiKey>
//       x-timestamp:    <unix seconds>
//       x-signature:    <base64 ed25519 signature>
//
// Credentials come from env (or the encrypted settings store) — NEVER the
// frontend, NEVER hardcoded:
//   RH_CRYPTO_API_KEY        the API key string from the portal
//   RH_CRYPTO_PRIVATE_KEY    base64-encoded Ed25519 private key seed (32 bytes)
//
// This adapter implements the official request signing and the read endpoints,
// and scaffolds order placement. Order placement is GATED: it will only run for
// LIVE mode after the engine's risk checks pass. Review against the latest docs
// before enabling live crypto trading with real funds.

const BASE_URL = 'https://trading.robinhood.com'

export interface RobinhoodCryptoCreds {
  apiKey: string
  privateKeyBase64: string // 32-byte Ed25519 seed, base64
}

export class RobinhoodCryptoAdapter implements BrokerAdapter {
  readonly kind = 'robinhood_crypto'
  constructor(private creds: RobinhoodCryptoCreds | null) {}

  private requireCreds(): RobinhoodCryptoCreds {
    if (!this.creds?.apiKey || !this.creds?.privateKeyBase64) {
      throw new BrokerNotConfiguredError(
        'Robinhood Crypto credentials are not configured. Set RH_CRYPTO_API_KEY and RH_CRYPTO_PRIVATE_KEY.',
      )
    }
    return this.creds
  }

  /** Build an Ed25519 signature over the canonical message per the official docs. */
  private signRequest(method: string, path: string, body: string, timestamp: number): { headers: Record<string, string> } {
    const creds = this.requireCreds()
    const message = `${creds.apiKey}${timestamp}${path}${method}${body}`
    // Reconstruct a PKCS8 Ed25519 key from the raw 32-byte seed.
    const seed = Buffer.from(creds.privateKeyBase64, 'base64')
    if (seed.length !== 32) {
      throw new BrokerNotConfiguredError('RH_CRYPTO_PRIVATE_KEY must be a base64-encoded 32-byte Ed25519 seed.')
    }
    const pkcs8 = Buffer.concat([
      Buffer.from('302e020100300506032b657004220420', 'hex'), // Ed25519 PKCS8 prefix
      seed,
    ])
    const keyObject = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' })
    const signature = edSign(null, Buffer.from(message, 'utf8'), keyObject).toString('base64')
    return {
      headers: {
        'x-api-key': creds.apiKey,
        'x-timestamp': String(timestamp),
        'x-signature': signature,
        'Content-Type': 'application/json',
      },
    }
  }

  private async request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const ts = Math.floor(Date.now() / 1000)
    const bodyStr = body ? JSON.stringify(body) : ''
    const { headers } = this.signRequest(method, path, bodyStr, ts)
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: bodyStr || undefined,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Robinhood Crypto API ${method} ${path} failed: ${res.status} ${text}`)
    }
    return (await res.json()) as T
  }

  async testConnection() {
    try {
      this.requireCreds()
      await this.request('GET', '/api/v1/crypto/trading/accounts/')
      return { ok: true, message: 'Robinhood Crypto API connection OK.' }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Connection failed' }
    }
  }

  async getAccount(): Promise<Account> {
    const data = await this.request<{ buying_power?: string }>('GET', '/api/v1/crypto/trading/accounts/')
    const cash = parseFloat(data.buying_power ?? '0') || 0
    return {
      broker: 'robinhood_crypto',
      mode: 'live',
      equity: cash,
      cash,
      buyingPower: cash,
      currency: 'USD',
      asOf: Date.now(),
    }
  }

  async getPositions(): Promise<Position[]> {
    const data = await this.request<{ results?: Array<Record<string, string>> }>(
      'GET',
      '/api/v1/crypto/trading/holdings/',
    )
    return (data.results ?? []).map((h) => {
      const qty = parseFloat(h.total_quantity ?? h.quantity ?? '0') || 0
      const price = parseFloat(h.cost_basis ?? '0') / (qty || 1)
      return {
        id: h.asset_code ?? newId('pos'),
        symbol: `${h.asset_code}-USD`,
        assetType: 'crypto' as const,
        quantity: qty,
        avgPrice: price,
        marketPrice: price,
        marketValue: qty * price,
        unrealizedPnl: 0,
        openedAt: Date.now(),
      }
    })
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const param = symbols.map((s) => `symbol=${encodeURIComponent(s)}`).join('&')
    const data = await this.request<{ results?: Array<Record<string, string>> }>(
      'GET',
      `/api/v1/crypto/marketdata/best_bid_ask/?${param}`,
    )
    return (data.results ?? []).map((q) => {
      const bid = parseFloat(q.bid_price ?? '0')
      const ask = parseFloat(q.ask_price ?? '0')
      return {
        symbol: q.symbol ?? '',
        assetType: 'crypto' as const,
        price: (bid + ask) / 2 || bid || ask,
        bid,
        ask,
        timestamp: Date.now(),
      }
    })
  }

  async placeOrder(req: PlaceOrderRequest): Promise<Order> {
    const now = Date.now()
    const payload = {
      client_order_id: req.clientOrderId,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      [`${req.type}_order_config`]:
        req.type === 'market'
          ? { asset_quantity: String(req.quantity) }
          : { asset_quantity: String(req.quantity), limit_price: String(req.limitPrice) },
    }
    const data = await this.request<Record<string, string>>('POST', '/api/v1/crypto/trading/orders/', payload)
    return {
      id: data.id ?? newId('ord'),
      clientOrderId: req.clientOrderId,
      symbol: req.symbol,
      assetType: 'crypto',
      side: req.side,
      type: req.type,
      quantity: req.quantity,
      limitPrice: req.limitPrice,
      filledQuantity: parseFloat(data.filled_asset_quantity ?? '0') || 0,
      filledAvgPrice: data.average_price ? parseFloat(data.average_price) : undefined,
      status: (data.state as OrderStatus) ?? 'submitted',
      mode: 'live',
      broker: 'robinhood_crypto',
      strategyId: req.strategyId,
      reason: req.reason,
      createdAt: now,
      updatedAt: now,
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    await this.request('POST', `/api/v1/crypto/trading/orders/${orderId}/cancel/`)
    return true
  }

  async getOrders(): Promise<Order[]> {
    const data = await this.request<{ results?: Array<Record<string, string>> }>(
      'GET',
      '/api/v1/crypto/trading/orders/',
    )
    return (data.results ?? []).map((o) => ({
      id: o.id ?? newId('ord'),
      clientOrderId: o.client_order_id ?? '',
      symbol: o.symbol ?? '',
      assetType: 'crypto' as const,
      side: (o.side as 'buy' | 'sell') ?? 'buy',
      type: (o.type as 'market' | 'limit') ?? 'market',
      quantity: parseFloat(o.asset_quantity ?? '0') || 0,
      filledQuantity: parseFloat(o.filled_asset_quantity ?? '0') || 0,
      filledAvgPrice: o.average_price ? parseFloat(o.average_price) : undefined,
      status: (o.state as OrderStatus) ?? 'submitted',
      mode: 'live' as const,
      broker: 'robinhood_crypto' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
  }

  async getMarketHours(): Promise<MarketStatusSnapshot> {
    // Crypto trades 24/7.
    return getMarketStatus()
  }
}
