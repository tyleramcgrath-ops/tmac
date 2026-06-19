'use client'

import { useState } from 'react'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import { useTraderContext } from '@/components/trader-context'
import { dt } from '@/lib/client/format'
import type { AuditLog } from '@/lib/types'

const CATEGORIES: (AuditLog['category'] | 'all')[] = ['all', 'signal', 'decision', 'order', 'rejection', 'risk', 'system']

const toneFor: Record<string, 'default' | 'pos' | 'neg' | 'warn' | 'accent'> = {
  signal: 'accent',
  decision: 'default',
  order: 'pos',
  rejection: 'neg',
  risk: 'warn',
  system: 'default',
}

export default function LogsPage() {
  const { state } = useTraderContext()
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('all')
  if (!state) return <div className="text-sm text-muted">Loading…</div>

  const logs = state.auditLogs.filter((l) => cat === 'all' || l.category === cat)

  return (
    <div>
      <PageHeader title="Logs" subtitle="Full audit trail of every signal, decision, order and risk event." />

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${cat === c ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--surface-2)] text-muted'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {logs.length === 0 ? (
        <EmptyState>No log entries{cat !== 'all' ? ` in “${cat}”` : ''} yet.</EmptyState>
      ) : (
        <Card className="p-0">
          <div className="max-h-[70vh] overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 border-b px-4 py-2 text-sm last:border-0">
                <Badge tone={toneFor[l.category] ?? 'default'}>{l.category}</Badge>
                <div className="min-w-0">
                  <div className="break-words">{l.message}</div>
                  <div className="text-xs text-muted">{dt(l.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
