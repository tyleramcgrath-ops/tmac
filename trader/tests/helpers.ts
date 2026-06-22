import type { AppState } from '../lib/db'
import type { GlobalRiskSettings, StrategyConfig, StrategyRiskParams } from '../lib/types'

export function defaultRisk(over: Partial<GlobalRiskSettings> = {}): GlobalRiskSettings {
  return {
    liveTradingEnabled: false,
    killSwitchEngaged: false,
    confirmationMode: true,
    maxAccountRiskPerTradePct: 0.01,
    maxDailyLossPct: 0.03,
    maxOpenPositions: 10,
    maxOptionPremiumPerTrade: 500,
    allowNakedOptions: false,
    allowMargin: false,
    updatedAt: Date.now(),
    ...over,
  }
}

export function defaultStrategyRisk(over: Partial<StrategyRiskParams> = {}): StrategyRiskParams {
  return {
    maxPositionSize: 10_000,
    stopLossPct: 0.02,
    takeProfitPct: 0.04,
    dailyMaxLoss: 1_000,
    maxTradesPerDay: 10,
    cooldownAfterLossMs: 0,
    ...over,
  }
}

export function makeStrategy(over: Partial<StrategyConfig> = {}): StrategyConfig {
  return {
    id: 'strat1',
    name: 'Test Strategy',
    kind: 'ma_crossover',
    assetType: 'crypto',
    symbols: ['BTC-USD'],
    params: {},
    risk: defaultStrategyRisk(),
    mode: 'paper',
    enabled: true,
    backtestPassed: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...over,
  }
}

export function makeState(over: Partial<AppState> = {}): AppState {
  const equity = 100_000
  return {
    account: {
      broker: 'paper',
      mode: 'paper',
      equity,
      cash: equity,
      buyingPower: equity,
      currency: 'USD',
      asOf: Date.now(),
    },
    positions: [],
    orders: [],
    trades: [],
    strategies: [],
    signals: [],
    risk: defaultRisk(),
    riskEvents: [],
    auditLogs: [],
    watchlists: [],
    backtests: [],
    settings: {},
    ...over,
  }
}
