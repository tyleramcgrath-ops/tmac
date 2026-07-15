'use client'

import { Check, X, Clock, Ban } from 'lucide-react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'
import { timelineFor, type TimelineState } from '@/lib/north-star-timeline'

function StateIcon({ state }: { state: TimelineState }) {
  if (state === 'completed') return <Check className="h-2.5 w-2.5 text-[var(--rf-green)]" />
  if (state === 'running') return <span className="cc-pulse h-1.5 w-1.5 rounded-full bg-[var(--rf-blue-bright)]" />
  if (state === 'waiting-approval') return <Clock className="h-2.5 w-2.5 text-[var(--rf-amber)]" />
  if (state === 'failed') return <X className="h-2.5 w-2.5 text-[var(--rf-red)]" />
  if (state === 'blocked') return <Clock className="h-2.5 w-2.5 text-[var(--rf-faint)]" />
  return <Ban className="h-2.5 w-2.5 text-[var(--rf-faint)]" />
}

export function CCTimeline({ scenario, investigating }: { scenario: PreviewScenario; investigating: boolean }) {
  const stages = timelineFor(scenario)

  return (
    <div className="cc-timeline">
      <div className="cc-timeline-inner" role="list" aria-label="North Star's current work cycle">
        {stages.map((stage) => {
          const state: TimelineState = investigating && stage.id === 'checking' ? 'running' : stage.state
          return (
            <div key={stage.id} className="cc-timeline-step" role="listitem" title={stage.note}>
              <span className="cc-timeline-dot" data-state={state}>
                <StateIcon state={state} />
              </span>
              <span className="cc-timeline-label">{stage.label}</span>
              <span className="cc-timeline-substate">{state === 'not-connected' ? 'Not started' : state === 'blocked' ? 'On hold' : state === 'waiting-approval' ? 'Needs you' : state === 'failed' ? 'Failed' : state === 'running' ? 'Active' : 'Done'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
