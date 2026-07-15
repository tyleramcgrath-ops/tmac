'use client'

import { AlertTriangle, ClipboardCheck, Activity, ChevronRight } from 'lucide-react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'

const PRIORITY_CLASS = {
  high: 'cc-priority-pill cc-priority-pill-high',
  medium: 'cc-priority-pill cc-priority-pill-medium',
  low: 'cc-priority-pill cc-priority-pill-low',
}

export function CCPriorityPanel({
  scenario,
  onOpenOpportunity,
  onOpenApproval,
}: {
  scenario: PreviewScenario
  onOpenOpportunity: () => void
  onOpenApproval: () => void
}) {
  const currentActivity = scenario.activity.find((a) => a.status !== 'finished' && a.status !== 'waiting') ?? scenario.activity.find((a) => a.status === 'waiting')

  return (
    <aside className="cc-priority cc-fade-in" aria-label="Today's priorities">
      <div className="cc-priority-section">
        <p className="cc-priority-label">Needs attention</p>
        {scenario.opportunity ? (
          <button className="cc-priority-card ns-touch w-full text-left" data-actionable="true" onClick={onOpenOpportunity}>
            <div className="flex items-start justify-between gap-2">
              <span className={PRIORITY_CLASS[scenario.opportunity.priority]}>{scenario.opportunity.priority} priority</span>
              <ChevronRight className="h-4 w-4 text-[var(--rf-faint)] shrink-0" />
            </div>
            <p className="mt-2 text-sm font-medium text-white leading-snug">{scenario.opportunity.headline}</p>
            {scenario.opportunityStale && (
              <p className="mt-1.5 text-xs text-[var(--rf-faint)]">Based on your last successful check — not confirmed today.</p>
            )}
          </button>
        ) : (
          <p className="cc-priority-empty">Nothing needs your attention right now.</p>
        )}
      </div>

      <div className="cc-priority-section">
        <p className="cc-priority-label">Waiting for approval</p>
        {scenario.pendingApproval ? (
          <button className="cc-priority-card ns-touch w-full text-left" data-actionable="true" onClick={onOpenApproval}>
            <div className="flex items-start justify-between gap-2">
              <ClipboardCheck className="h-4 w-4 text-[var(--rf-amber)] shrink-0" />
              <ChevronRight className="h-4 w-4 text-[var(--rf-faint)] shrink-0" />
            </div>
            <p className="mt-2 text-sm font-medium text-white leading-snug">{scenario.pendingApproval.title}</p>
          </button>
        ) : (
          <p className="cc-priority-empty">Nothing waiting on you.</p>
        )}
      </div>

      <div className="cc-priority-section">
        <p className="cc-priority-label">North Star is doing now</p>
        {currentActivity ? (
          <div className="cc-priority-card">
            <div className="flex items-start gap-2">
              {currentActivity.status === 'needs-attention' ? (
                <AlertTriangle className="h-4 w-4 text-[var(--rf-red)] shrink-0 mt-0.5" />
              ) : (
                <Activity className="h-4 w-4 text-[var(--rf-blue-bright)] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white leading-snug">{currentActivity.label}</p>
                {currentActivity.finding && <p className="mt-1 text-xs text-[var(--rf-muted)] leading-relaxed">{currentActivity.finding}</p>}
              </div>
            </div>
          </div>
        ) : (
          <p className="cc-priority-empty">Idle — nothing scheduled right now.</p>
        )}
      </div>
    </aside>
  )
}
