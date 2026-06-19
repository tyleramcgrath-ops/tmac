// Shared domain types for the trading platform.
// These mirror the production data model in prisma/schema.prisma. The default
// runtime uses an in-memory/JSON file store (see lib/db) so the app runs with
// zero database setup in paper mode.

export type AssetType = 'crypto' | 'equity' | 'option'

export type TradingMode = 'paper' | 'live'

export type OrderSide = 'buy' | 'sell'

export type OrderType = 'market' | 'limit'

export type OrderStatus =
  | 'pending'
  | 'submitted'
  | 'filled'
  | 'partially_filled'
  | 'cancelled'
  | 'rejected'

export type BrokerKind =
  | 'paper'
  | 'alpaca'
  | 'robinhood_crypto'
  | 'robinhood_equities_options'

// ----- Market data -----

export interface Quote {
  symbol: string
  assetType: AssetType
  price: number
  bid?: number
  ask?: number
  timestamp: number
}

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketStatusSnapshot {
  crypto: boolean // crypto trades 24/7
  equities: boolean
  options: boolean
  asOf: number
  nextEquityOpen?: number
  nextEquityClose?: number
}

// ----- Account / positions / orders -----

export interface Account {
  broker: BrokerKind
  mode: TradingMode
  equity: number
  cash: number
  buyingPower: number
  currency: string
  asOf: number
}

export interface Position {
  id: string
  symbol: string
  assetType: AssetType
  quantity: number
  avgPrice: number
  marketPrice: number
  marketValue: number
  unrealizedPnl: number
  openedAt: number
  strategyId?: string
  stopLossPrice?: number
  takeProfitPrice?: number
}

export interface Order {
  id: string
  clientOrderId: string
  symbol: string
  assetType: AssetType
  side: OrderSide
  type: OrderType
  quantity: number
  limitPrice?: number
  filledQuantity: number
  filledAvgPrice?: number
  status: OrderStatus
  mode: TradingMode
  broker: BrokerKind
  strategyId?: string
  reason?: string
  createdAt: number
  updatedAt: number
}

export interface Trade {
  id: string
  orderId: string
  symbol: string
  assetType: AssetType
  side: OrderSide
  quantity: number
  price: number
  pnl?: number
  mode: TradingMode
  strategyId?: string
  executedAt: number
}

// ----- Strategies -----

export interface StrategyRiskParams {
  maxPositionSize: number // max notional ($) per position
  stopLossPct: number // e.g. 0.02 = 2%
  takeProfitPct: number // e.g. 0.04 = 4%
  dailyMaxLoss: number // $ loss that halts the strategy for the day
  maxTradesPerDay: number
  cooldownAfterLossMs: number // pause after a losing trade
}

export interface StrategyConfig {
  id: string
  name: string
  kind: string // strategy plugin id, e.g. "ma_crossover"
  assetType: AssetType
  symbols: string[]
  params: Record<string, number | string | boolean>
  risk: StrategyRiskParams
  mode: TradingMode // paper | live (live also gated by global live switch)
  enabled: boolean
  backtestPassed: boolean
  createdAt: number
  updatedAt: number
}

export type SignalAction = 'buy' | 'sell' | 'hold'

export interface Signal {
  id: string
  strategyId: string
  symbol: string
  assetType: AssetType
  action: SignalAction
  confidence: number // 0..1
  price: number
  rationale: string
  createdAt: number
}

// ----- Risk -----

export interface GlobalRiskSettings {
  liveTradingEnabled: boolean // master live switch (default false)
  killSwitchEngaged: boolean // emergency stop
  confirmationMode: boolean // require manual confirm before live orders
  maxAccountRiskPerTradePct: number // fraction of equity at risk per trade
  maxDailyLossPct: number // fraction of equity; halts all trading when hit
  maxOpenPositions: number
  maxOptionPremiumPerTrade: number // $
  allowNakedOptions: boolean // must be false
  allowMargin: boolean // must be explicitly enabled
  updatedAt: number
}

export interface RiskDecision {
  approved: boolean
  reasons: string[] // human-readable explanations (accept or reject)
  riskAmount: number // $ at risk on this trade
  stopLossPrice?: number
  takeProfitPrice?: number
}

export interface RiskEvent {
  id: string
  type: string // e.g. "kill_switch", "daily_loss_limit", "order_rejected"
  severity: 'info' | 'warning' | 'critical'
  message: string
  strategyId?: string
  symbol?: string
  createdAt: number
}

// ----- Audit -----

export interface AuditLog {
  id: string
  category: 'signal' | 'decision' | 'order' | 'rejection' | 'system' | 'risk'
  message: string
  data?: Record<string, unknown>
  createdAt: number
}

// ----- Watchlists -----

export interface Watchlist {
  id: string
  name: string
  symbols: { symbol: string; assetType: AssetType }[]
  createdAt: number
}

// ----- Backtests -----

export interface BacktestResult {
  id: string
  strategyKind: string
  symbol: string
  assetType: AssetType
  params: Record<string, number | string | boolean>
  start: number
  end: number
  startingEquity: number
  endingEquity: number
  totalReturnPct: number
  maxDrawdownPct: number
  winRate: number
  trades: number
  avgWin: number
  avgLoss: number
  sharpe: number
  equityCurve: { t: number; equity: number }[]
  createdAt: number
}
