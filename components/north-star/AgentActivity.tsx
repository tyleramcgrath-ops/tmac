'use client'

import { useState } from 'react'
import { ChevronDown, Clock, Loader2, CheckCircle2, AlertTriangle, ClipboardCheck, Circle } from 'lucide-react'
import type { ActivityItem, ActivityStatus } from '@/lib/north-star-preview-data'

const STATUS_LABEL: Record<ActivityStatus, string> = {
  waiting: 'Waiting to begin',
  checking: 'Checking your website',
  understanding: 'Understanding what changed',
  preparing: 'Preparing your briefing',
  finished: 'Finished',
  'needs-attention': 'Needs attention',
  'waiting-approval': 'Waiting for your approval',
}

function StatusIcon({ status }: { status: ActivityStatus }) {
  const cls = 'h-4 w-4 shrink-0'
  switch (status) {
    case 'finished':
      return <CheckCircle2 className={`${cls} text-[var(--rf-green)]`} />
    case 'needs-attention':
      return <AlertTriangle className={`${cls} text-[var(--rf-red)]`} />
    case 'waiting-approval':
      return <ClipboardCheck className={`${cls} text-[var(--rf-amber)]`} />
    case 'checking':
    case 'understanding':
    case 'preparing':
      return <Loader2 className={`${cls} animate-spin text-[var(--rf-blue-bright)]`} />
    default:
      return <Circle className={`${cls} text-[var(--rf-faint)]`} />
  }
}

const PERSISTENCE_LABEL: Record<ActivityItem['persistence'], string> = {
  temporary: 'One-time run',
  persistent: 'Runs automatically',
  'not-connected': 'Not scheduled',
}

/** Content-only: the activity list, with no outer card or heading of its own. Meant to live inside a shared shell (see BehindTheScenes.tsx). */
export function AgentActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </ul>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const [open, setOpen] = useState(false)
  const panelId = `activity-detail-${item.id}`

  return (
    <li className="ns-panel-quiet overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="ns-touch flex w-full items-start justify-between gap-3 p-3.5 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          <StatusIcon status={item.status} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="mt-0.5 text-xs text-[var(--rf-muted)]">{STATUS_LABEL[item.status]}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {item.actionRequired && <span className="ns-pill ns-pill-partial">Needs you</span>}
          <ChevronDown className={`h-4 w-4 text-[var(--rf-faint)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div className={`ns-expand ${open ? 'ns-expand-open' : ''}`} id={panelId}>
        <div>
          <div className="border-t border-[var(--rf-card-line)] px-3.5 pb-3.5 pt-3 text-xs text-[var(--rf-muted)]">
            {item.finding && <p className="text-sm text-white">{item.finding}</p>}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[var(--rf-faint)]">
              {item.startedAt && (
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Started {item.startedAt}</span>
              )}
              {item.finishedAt && <span>Finished {item.finishedAt}</span>}
              <span>{PERSISTENCE_LABEL[item.persistence]}</span>
            </div>
            <details className="mt-2.5">
              <summary className="ns-touch inline-flex cursor-pointer list-none items-center text-[11px] text-[var(--rf-faint)] underline decoration-dotted underline-offset-2">
                Technical detail
              </summary>
              <p className="rf-mono mt-1.5 text-[11px] text-[var(--rf-faint)]">{item.technicalDetail}</p>
            </details>
          </div>
        </div>
      </div>
    </li>
  )
}
