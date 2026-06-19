'use client'

import { Disclaimer } from '@/components/disclaimer'
import { BarChart, Donut, LineChart } from '@/components/charts'
import { Badge, Card, EmptyState, PageHeader, StatCard } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { pnlClass, usd } from '@/lib/client/format'

export default function DashboardPage() {
  const { state } = useTraderContext()
  if (!state) return <Loading />

  const { account, positions, trades, strategies, risk, marketStatus } = state

  const dayStart = new Date().setHours(0, 0, 0, 0)
  const todayTrades = trades.filter((t) => t.executedAt >= dayStart)
  const todayPnl = todayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const maxDailyLoss = account.equity * risk.maxDailyLossPct
  const dailyLossRemaining = Math.max(0, maxDailyLoss + Math.min(0, todayPnl))
  const activeStrategies = strategies.filter((s) => s.enabled).length
  const unrealized = positions.reduce((s, p) => s + p.unrealizedPnl, 0)

  // Cumulative realized-P/L equity curve.
  const sorted = [...trades].sort((a, b) => a.executedAt - b.executedAt)
  let cum = account.equity - trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const curve = [cum, ...sorted.map((t) => (cum += t.pnl ?? 0))]

  // Daily P/L for the last 14 days.
  const byDay = new Map<string, number>()
  for (const t of trades) {
    const key = new Date(t.executedAt).toLocaleDateString()
    byDay.set(key, (byDay.get(key) ?? 0) + (t.pnl ?? 0))
  }
  const dailyBars = [...byDay.entries()].slice(-14).map(([label, value]) => ({ label, value }))

  const closed = trades.filter((t) => t.pnl != null)
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length
  const winRate = closed.length ? wins / closed.length : 0

  // Drawdown curve.
  let peak = curve[0] || 1
  const dd = curve.map((v) => {
    peak = Math.max(peak, v)
    return -((peak - v) / peak)
  })

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of account, strategies and markets." />
      <Disclaimer />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Account Equity" value={usd(account.equity)} sub={`Unrealized ${usd(unrealized)}`} />
        <StatCard label="Cash Available" value={usd(account.cash)} sub={`Buying power ${usd(account.buyingPower)}`} />
        <StatCard label="Open Positions" value={positions.length} sub={`Max ${risk.maxOpenPositions}`} />
        <StatCard label="Today P/L" value={usd(todayPnl)} tone={todayPnl >= 0 ? 'pos' : 'neg'} sub={`${todayTrades.length} trades`} />
        <StatCard label="Daily Loss Left" value={usd(dailyLossRemaining)} tone={dailyLossRemaining <= 0 ? 'neg' : 'default'} sub={`Limit ${usd(maxDailyLoss)}`} />
        <StatCard label="Active Strategies" value={activeStrategies} sub={`${strategies.length} configured`} />
        <StatCard label="Mode" value={account.mode === 'live' ? 'LIVE' : 'PAPER'} tone={account.mode === 'live' ? 'warn' : 'pos'} sub={risk.killSwitchEngaged ? 'Kill switch ON' : 'Operational'} />
        <StatCard
          label="Markets"
          value={
            <div className="flex flex-wrap gap-1 text-sm">
              <Badge tone={marketStatus.crypto ? 'pos' : 'default'}>Crypto</Badge>
              <Badge tone={marketStatus.equities ? 'pos' : 'default'}>Equities</Badge>
              <Badge tone={marketStatus.options ? 'pos' : 'default'}>Options</Badge>
            </div>
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-medium">Portfolio Performance (equity)</h3>
          <LineChart data={curve} />
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium">Daily P/L</h3>
          {dailyBars.length ? <BarChart data={dailyBars} /> : <EmptyState>No trades yet.</EmptyState>}
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium">Drawdown</h3>
          <LineChart data={dd} stroke="var(--neg)" />
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium">Win / Loss Rate</h3>
          <Donut value={winRate} label={`${wins} wins / ${closed.length - wins} losses (${closed.length} closed)`} />
        </Card>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse" />
      ))}
    </div>
  )
}
