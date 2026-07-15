'use client'

import { Command, Compass, Dna, Target, Activity, ClipboardCheck, TrendingUp, Database } from 'lucide-react'

export type RailPanel = 'command-center' | 'compass' | 'digital-dna' | 'opportunities' | 'work-in-progress' | 'approvals' | 'results' | 'sources'

const ITEMS: { id: RailPanel; label: string; icon: typeof Command }[] = [
  { id: 'command-center', label: 'Command Center', icon: Command },
  { id: 'compass', label: 'Compass', icon: Compass },
  { id: 'digital-dna', label: 'Digital DNA', icon: Dna },
  { id: 'opportunities', label: 'Opportunities', icon: Target },
  { id: 'work-in-progress', label: 'Work in Progress', icon: Activity },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck },
  { id: 'results', label: 'Results', icon: TrendingUp },
  { id: 'sources', label: 'Sources', icon: Database },
]

export function CCRail({
  onNavigate,
  approvalCount,
  opportunityCount,
}: {
  onNavigate: (panel: RailPanel) => void
  approvalCount: number
  opportunityCount: number
}) {
  return (
    <nav className="cc-rail" aria-label="North Star sections">
      <div className="cc-rail-inner">
        <div className="cc-rail-brand">
          <Compass className="h-4 w-4 text-[var(--rf-blue-bright)]" aria-hidden="true" />
          North Star
        </div>
        <div className="cc-rail-nav">
          {ITEMS.map((item) => {
            const Icon = item.icon
            const badge = item.id === 'approvals' ? approvalCount : item.id === 'opportunities' ? opportunityCount : 0
            return (
              <button
                key={item.id}
                className="cc-rail-item ns-touch"
                data-active={item.id === 'command-center'}
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
                {badge > 0 && <span className="cc-rail-badge">{badge}</span>}
              </button>
            )
          })}
        </div>
        <div className="cc-rail-footer">
          <span className="ns-preview-badge">Preview</span>
        </div>
      </div>
    </nav>
  )
}
