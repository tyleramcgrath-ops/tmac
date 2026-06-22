'use client'

import { RefreshCw } from 'lucide-react'
import { Badge, Button, Card, PageHeader, StatCard } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { post } from '@/lib/client/api'
import { usd } from '@/lib/client/format'

export default function PaperPage() {
  const { state, refresh } = useTraderContext()
  if (!state) return <div className="text-sm text-muted">Loading…</div>

  const realized = state.trades.reduce((s, t) => s + (t.pnl ?? 0), 0)

  async function reset() {
    if (!confirm('Reset the paper account? This clears all simulated positions, orders, trades and logs.')) return
    try {
      await post('/api/settings', { action: 'reset' })
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Paper Trading"
        subtitle="Simulated trading against live (synthetic) market data. This is the default and safest mode."
        action={<Button variant="secondary" onClick={reset}><RefreshCw size={14} /> Reset paper account</Button>}
      />

      <Card className="mb-6">
        <div className="flex items-center gap-2">
          <Badge tone="pos">Active mode: PAPER</Badge>
          <span className="text-sm text-muted">No real orders are sent in paper mode. Switch to live only from Risk Controls.</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Paper Equity" value={usd(state.account.equity)} />
        <StatCard label="Cash" value={usd(state.account.cash)} />
        <StatCard label="Realized P/L" value={usd(realized)} tone={realized >= 0 ? 'pos' : 'neg'} />
        <StatCard label="Open Positions" value={state.positions.length} />
      </div>

      <Card className="mt-6">
        <h3 className="mb-2 text-sm font-medium">How paper mode works</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          <li>The engine evaluates your enabled strategies on each tick and routes orders to the paper simulator.</li>
          <li>Market orders fill at the current quote; positions are marked to market continuously.</li>
          <li>Stop-loss and take-profit are enforced automatically as protective exits.</li>
          <li>All the same risk limits apply in paper mode, so you can validate them safely.</li>
          <li>Crypto strategies run 24/7; equity/option strategies only act during market hours.</li>
        </ul>
      </Card>
    </div>
  )
}
