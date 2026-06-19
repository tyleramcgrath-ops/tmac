import { promises as fs } from 'fs'
import path from 'path'
import type {
  Account,
  AuditLog,
  BacktestResult,
  GlobalRiskSettings,
  Order,
  Position,
  RiskEvent,
  Signal,
  StrategyConfig,
  Trade,
  Watchlist,
} from '../types'

// -----------------------------------------------------------------------------
// Runtime data store.
//
// The DEFAULT store is an in-memory store with best-effort JSON persistence to
// ./.data/state.json so the app runs with ZERO database setup in paper mode.
//
// For production / multi-instance deployments the data model is defined in
// prisma/schema.prisma (Postgres). A PostgresStore implementing this same shape
// is the documented upgrade path — see README "Production database". We keep the
// abstraction here so swapping in Postgres requires no engine changes.
// -----------------------------------------------------------------------------

export interface AppState {
  account: Account
  positions: Position[]
  orders: Order[]
  trades: Trade[]
  strategies: StrategyConfig[]
  signals: Signal[]
  risk: GlobalRiskSettings
  riskEvents: RiskEvent[]
  auditLogs: AuditLog[]
  watchlists: Watchlist[]
  backtests: BacktestResult[]
  settings: Record<string, string> // encrypted secrets + misc kv
}

const DATA_DIR = path.join(process.cwd(), '.data')
const STATE_FILE = path.join(DATA_DIR, 'state.json')
const MAX_LOG_ROWS = 5000

export const PAPER_STARTING_EQUITY = 100_000

function defaultState(): AppState {
  const now = Date.now()
  return {
    account: {
      broker: 'paper',
      mode: 'paper',
      equity: PAPER_STARTING_EQUITY,
      cash: PAPER_STARTING_EQUITY,
      buyingPower: PAPER_STARTING_EQUITY,
      currency: 'USD',
      asOf: now,
    },
    positions: [],
    orders: [],
    trades: [],
    strategies: [],
    signals: [],
    risk: {
      liveTradingEnabled: false, // SAFE DEFAULT: live trading off
      killSwitchEngaged: false,
      confirmationMode: true,
      maxAccountRiskPerTradePct: 0.01, // 1% of equity per trade
      maxDailyLossPct: 0.03, // 3% daily loss halts everything
      maxOpenPositions: 10,
      maxOptionPremiumPerTrade: 500,
      allowNakedOptions: false,
      allowMargin: false,
      updatedAt: now,
    },
    riskEvents: [],
    auditLogs: [],
    watchlists: [
      {
        id: 'wl_default',
        name: 'Default',
        symbols: [
          { symbol: 'BTC-USD', assetType: 'crypto' },
          { symbol: 'ETH-USD', assetType: 'crypto' },
          { symbol: 'AAPL', assetType: 'equity' },
          { symbol: 'SPY', assetType: 'equity' },
        ],
        createdAt: now,
      },
    ],
    backtests: [],
    settings: {},
  }
}

class Store {
  private state: AppState = defaultState()
  private loaded = false
  private persistTimer: ReturnType<typeof setTimeout> | null = null

  async init(): Promise<void> {
    if (this.loaded) return
    try {
      const raw = await fs.readFile(STATE_FILE, 'utf8')
      const parsed = JSON.parse(raw) as Partial<AppState>
      this.state = { ...defaultState(), ...parsed }
    } catch {
      // No persisted state yet — start fresh.
    }
    this.loaded = true
  }

  /** Direct access to the live state object. Callers mutate then call persist(). */
  get(): AppState {
    return this.state
  }

  /** Reset everything back to a fresh paper account. */
  reset(): void {
    this.state = defaultState()
    this.schedulePersist()
  }

  schedulePersist(): void {
    // Trim unbounded logs before persisting.
    if (this.state.auditLogs.length > MAX_LOG_ROWS) {
      this.state.auditLogs = this.state.auditLogs.slice(-MAX_LOG_ROWS)
    }
    if (this.state.signals.length > MAX_LOG_ROWS) {
      this.state.signals = this.state.signals.slice(-MAX_LOG_ROWS)
    }
    if (this.persistTimer) return
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null
      void this.persistNow()
    }, 250)
  }

  private async persistNow(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8')
    } catch {
      // Best-effort: on read-only/serverless filesystems persistence is skipped
      // and state lives in-memory for the lifetime of the instance.
    }
  }
}

declare global {
  // Cached across hot reloads in dev and across route invocations.
  // eslint-disable-next-line no-var
  var __traderStore: Store | undefined
}

export async function getStore(): Promise<Store> {
  if (globalThis.__traderStore) return globalThis.__traderStore
  const store = new Store()
  await store.init()
  globalThis.__traderStore = store
  return store
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
