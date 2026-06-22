import { getMarketStatus } from '../market-hours'
import type { Account, MarketStatusSnapshot, Order, Position, Quote } from '../types'
import { BrokerNotConfiguredError, type BrokerAdapter, type PlaceOrderRequest } from './adapter'

// RobinhoodEquitiesOptionsAdapter — PLACEHOLDER scaffold.
//
// Robinhood does NOT currently offer a public, self-serve REST API for
// programmatic equities/options trading equivalent to the Crypto Trading API.
// Programmatic equities/options access requires an approved integration such as
// Robinhood's Agentic Trading access (or another approved brokerage API).
//
// This app DOES NOT use password scraping, browser automation, or unofficial
// private endpoints. Until an approved API is wired in, this adapter throws on
// any trading call. The trading engine treats an unconfigured broker as a hard
// stop and will route nothing to it.
//
// INTEGRATION TODO (when approved access is available):
//   1. Add credentials to env / encrypted settings (never the frontend).
//   2. Implement testConnection(), getAccount(), getPositions(), getQuotes().
//   3. Implement placeOrder()/cancelOrder()/getOrders() against the approved API.
//   4. For options, enforce: no naked options, max premium per trade, and the
//      same risk checks as the rest of the engine (already centralised in
//      lib/engine/risk-manager.ts).
//
// NOTE: An MCP-based Robinhood Agentic Trading integration also exists
// (review_equity_order / place_equity_order / review_option_order /
// place_option_order). If you operate this engine from an MCP-enabled agent
// context, those tools are the approved path for equities/options — keep the
// same risk-manager gating in front of them.

export class RobinhoodEquitiesOptionsAdapter implements BrokerAdapter {
  readonly kind = 'robinhood_equities_options'

  private notImplemented(): never {
    throw new BrokerNotConfiguredError(
      'Equities/options trading requires approved API access (e.g. Robinhood Agentic Trading). ' +
        'This adapter is a scaffold — see lib/brokers/robinhood-equities-options.ts.',
    )
  }

  async testConnection() {
    return {
      ok: false,
      message:
        'Not configured: equities/options need approved API access. Crypto works via the official Crypto API; everything else runs in paper mode.',
    }
  }

  async getAccount(): Promise<Account> {
    this.notImplemented()
  }
  async getPositions(): Promise<Position[]> {
    this.notImplemented()
  }
  async getQuotes(_symbols: string[]): Promise<Quote[]> {
    this.notImplemented()
  }
  async placeOrder(_req: PlaceOrderRequest): Promise<Order> {
    this.notImplemented()
  }
  async cancelOrder(_orderId: string): Promise<boolean> {
    this.notImplemented()
  }
  async getOrders(): Promise<Order[]> {
    this.notImplemented()
  }
  async getMarketHours(): Promise<MarketStatusSnapshot> {
    return getMarketStatus()
  }
}
