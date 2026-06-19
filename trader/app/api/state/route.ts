import { NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { isEngineRunning, getMarketStatus } from '@/lib/engine'
import { STRATEGIES } from '@/lib/strategies'

export const dynamic = 'force-dynamic'

// Public, sanitized application snapshot for the dashboard. Secrets (the
// `settings` map) are NEVER included.
export async function GET() {
  const store = await getStore()
  const s = store.get()
  return NextResponse.json({
    account: s.account,
    positions: s.positions,
    orders: [...s.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200),
    trades: [...s.trades].sort((a, b) => b.executedAt - a.executedAt).slice(0, 200),
    signals: [...s.signals].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100),
    strategies: s.strategies,
    risk: s.risk,
    riskEvents: [...s.riskEvents].sort((a, b) => b.createdAt - a.createdAt).slice(0, 200),
    auditLogs: [...s.auditLogs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 300),
    watchlists: s.watchlists,
    backtests: [...s.backtests].sort((a, b) => b.createdAt - a.createdAt).slice(0, 50),
    marketStatus: getMarketStatus(),
    engineRunning: isEngineRunning(),
    availableStrategies: STRATEGIES.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      paramSpecs: p.paramSpecs,
    })),
  })
}
