'use client'

import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { post } from '@/lib/client/api'
import { num, pnlClass, usd } from '@/lib/client/format'

export default function PortfolioPage() {
  const { state, refresh } = useTraderContext()
  if (!state) return <div className="text-sm text-muted">Loading…</div>
  const { account, positions, orders } = state
  const pending = orders.filter((o) => o.status === 'pending')
  const unrealized = positions.reduce((s, p) => s + p.unrealizedPnl, 0)

  async function confirmOrder(orderId: string, action: 'confirm' | 'cancel') {
    try {
      await post('/api/orders', { action, orderId })
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader title="Portfolio" subtitle="Open positions and account balances." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Equity" value={usd(account.equity)} />
        <StatCard label="Cash" value={usd(account.cash)} />
        <StatCard label="Unrealized P/L" value={usd(unrealized)} tone={unrealized >= 0 ? 'pos' : 'neg'} />
        <StatCard label="Broker / Mode" value={`${account.broker}`} sub={account.mode.toUpperCase()} />
      </div>

      {pending.length > 0 && (
        <Card className="mt-6 border-[var(--warn)]/40">
          <h3 className="mb-3 text-sm font-medium text-[var(--warn)]">Orders awaiting confirmation</h3>
          <div className="space-y-2">
            {pending.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] p-2 text-sm">
                <span>
                  <Badge tone={o.side === 'buy' ? 'pos' : 'neg'}>{o.side}</Badge> {num(o.quantity)} {o.symbol} · {o.reason}
                </span>
                <span className="flex gap-2">
                  <Button variant="success" onClick={() => confirmOrder(o.id, 'confirm')}>Confirm</Button>
                  <Button variant="ghost" onClick={() => confirmOrder(o.id, 'cancel')}>Cancel</Button>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6 overflow-x-auto p-0">
        {positions.length === 0 ? (
          <EmptyState>No open positions.</EmptyState>
        ) : (
          <table className="w-full text-sm tabular">
            <thead className="border-b text-left text-xs uppercase text-muted">
              <tr>
                <Th>Symbol</Th><Th>Type</Th><Th>Qty</Th><Th>Avg</Th><Th>Price</Th><Th>Value</Th><Th>Unreal. P/L</Th><Th>Stop</Th><Th>Target</Th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <Td className="font-medium">{p.symbol}</Td>
                  <Td><Badge>{p.assetType}</Badge></Td>
                  <Td>{num(p.quantity)}</Td>
                  <Td>{usd(p.avgPrice)}</Td>
                  <Td>{usd(p.marketPrice)}</Td>
                  <Td>{usd(p.marketValue)}</Td>
                  <Td className={pnlClass(p.unrealizedPnl)}>{usd(p.unrealizedPnl)}</Td>
                  <Td>{p.stopLossPrice ? usd(p.stopLossPrice) : '—'}</Td>
                  <Td>{p.takeProfitPrice ? usd(p.takeProfitPrice) : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>
}
