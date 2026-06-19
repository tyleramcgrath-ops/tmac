import type {
  Account,
  AuditLog,
  BacktestResult,
  GlobalRiskSettings,
  MarketStatusSnapshot,
  Order,
  Position,
  RiskEvent,
  Signal,
  StrategyConfig,
  Trade,
  Watchlist,
} from '../types'
import type { StrategyParamSpec } from '../strategies/types'

export interface AvailableStrategy {
  id: string
  name: string
  description: string
  paramSpecs: StrategyParamSpec[]
}

export interface PublicState {
  account: Account
  positions: Position[]
  orders: Order[]
  trades: Trade[]
  signals: Signal[]
  strategies: StrategyConfig[]
  risk: GlobalRiskSettings
  riskEvents: RiskEvent[]
  auditLogs: AuditLog[]
  watchlists: Watchlist[]
  backtests: BacktestResult[]
  marketStatus: MarketStatusSnapshot
  engineRunning: boolean
  availableStrategies: AvailableStrategy[]
}

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export async function fetchState(): Promise<PublicState> {
  const res = await fetch('/api/state', { cache: 'no-store' })
  return jsonOrThrow(res)
}

export async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return jsonOrThrow(res)
}

export const engineAction = (action: string) => post('/api/engine', { action })
