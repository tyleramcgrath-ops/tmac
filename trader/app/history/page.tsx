'use client'

import { useState } from 'react'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { dt, num, pnlClass, usd } from '@/lib/client/format'

type Tab = 'trades' | 'orders' | 'signals'

export default function HistoryPage() {
  const { state } = useTraderContext()
  const [tab, setTab] = useState<Tab>('trades')
  if (!state) return <div className="text-sm text-muted">Loading…</div>

  return (
    <div>
      <PageHeader title="Trade History" subtitle="Every fill, order and signal — the full audit trail." />
      <div className="mb-4 flex gap-2">
        {(['trades', 'orders', 'signals'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${tab === t ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--surface-2)] text-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        {tab === 'trades' && (
          state.trades.length === 0 ? <EmptyState>No trades yet.</EmptyState> : (
            <table className="w-full text-sm tabular">
              <thead className="border-b text-left text-xs uppercase text-muted">
                <tr><Th>Time</Th><Th>Symbol</Th><Th>Side</Th><Th>Qty</Th><Th>Price</Th><Th>P/L</Th><Th>Mode</Th></tr>
              </thead>
              <tbody>
                {state.trades.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <Td>{dt(t.executedAt)}</Td>
                    <Td className="font-medium">{t.symbol}</Td>
                    <Td><Badge tone={t.side === 'buy' ? 'pos' : 'neg'}>{t.side}</Badge></Td>
                    <Td>{num(t.quantity)}</Td>
                    <Td>{usd(t.price)}</Td>
                    <Td className={pnlClass(t.pnl)}>{t.pnl != null ? usd(t.pnl) : '—'}</Td>
                    <Td><Badge tone={t.mode === 'live' ? 'warn' : 'default'}>{t.mode}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'orders' && (
          state.orders.length === 0 ? <EmptyState>No orders yet.</EmptyState> : (
            <table className="w-full text-sm tabular">
              <thead className="border-b text-left text-xs uppercase text-muted">
                <tr><Th>Time</Th><Th>Symbol</Th><Th>Side</Th><Th>Qty</Th><Th>Status</Th><Th>Fill</Th><Th>Reason</Th></tr>
              </thead>
              <tbody>
                {state.orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <Td>{dt(o.createdAt)}</Td>
                    <Td className="font-medium">{o.symbol}</Td>
                    <Td><Badge tone={o.side === 'buy' ? 'pos' : 'neg'}>{o.side}</Badge></Td>
                    <Td>{num(o.quantity)}</Td>
                    <Td><Badge tone={o.status === 'filled' ? 'pos' : o.status === 'rejected' ? 'neg' : 'default'}>{o.status}</Badge></Td>
                    <Td>{o.filledAvgPrice ? usd(o.filledAvgPrice) : '—'}</Td>
                    <Td className="max-w-xs truncate text-muted">{o.reason}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'signals' && (
          state.signals.length === 0 ? <EmptyState>No signals yet.</EmptyState> : (
            <table className="w-full text-sm tabular">
              <thead className="border-b text-left text-xs uppercase text-muted">
                <tr><Th>Time</Th><Th>Symbol</Th><Th>Action</Th><Th>Confidence</Th><Th>Price</Th><Th>Rationale</Th></tr>
              </thead>
              <tbody>
                {state.signals.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <Td>{dt(s.createdAt)}</Td>
                    <Td className="font-medium">{s.symbol}</Td>
                    <Td><Badge tone={s.action === 'buy' ? 'pos' : s.action === 'sell' ? 'neg' : 'default'}>{s.action}</Badge></Td>
                    <Td>{(s.confidence * 100).toFixed(0)}%</Td>
                    <Td>{usd(s.price)}</Td>
                    <Td className="max-w-xs truncate text-muted">{s.rationale}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
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
