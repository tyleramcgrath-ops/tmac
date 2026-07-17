'use client'

import { type ScanSummary } from '../../../lib/client'
import { EmptyState } from '../../../lib/ui'
import { StatusChip } from './shared'

export function HistoryTab({ scans }: { scans: ScanSummary[] }) {
  if (scans.length === 0) return <EmptyState title="No scan history" detail="Scans you run appear here with their status and results." />
  return (
    <div className="space-y-2">
      {scans.map((s) => (
        <div key={s.id} className="rf-card flex items-center justify-between p-4 text-sm">
          <div>
            <p className="text-white">{new Date(s.createdAt).toLocaleString()}</p>
            <p className="text-xs text-[var(--rf-muted)]">
              {s.summary.pagesCrawled} pages · score {s.summary.siteScore} · {s.summary.blockedCount} blocked
              {s.error ? ` · ${s.error}` : ''}
            </p>
          </div>
          <StatusChip status={s.status} />
        </div>
      ))}
    </div>
  )
}
