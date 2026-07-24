'use client'

// The rail is wayfinding, not a dashboard — each entry opens a real drawer
// (or, for Search, just focuses the command console) and the dot beside it
// is that destination's honest real state, derived from the same Mission
// Queue data every other surface reads. No fabricated activity.

import { useEffect, useState } from 'react'
import { api, ApiError, type MissionQueueDTO } from '../../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'

export type RailDestination = 'opportunities' | 'approvals' | 'missions' | 'history' | 'search'

const RAIL: { id: RailDestination; label: string }[] = [
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'missions', label: 'Missions' },
  { id: 'history', label: 'History' },
  { id: 'search', label: 'Search' },
]

const POLL_MS = 15_000

export default function CommandRail({
  projectId,
  panelsUp,
  active,
  onOpen,
}: {
  projectId: string | null
  panelsUp: boolean
  active: RailDestination | null
  onOpen: (id: RailDestination) => void
}) {
  const { data } = useLivePoll<{ queue: MissionQueueDTO }>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      return api.getMissionQueue(projectId)
    },
    { enabled: Boolean(projectId) && panelsUp, intervalMs: POLL_MS }
  )
  const [hasOpportunities, setHasOpportunities] = useState(false)
  useEffect(() => {
    if (!projectId || !panelsUp) return
    let cancelled = false
    api.listRecommendations(projectId).then((r) => {
      if (!cancelled) setHasOpportunities(r.recommendations.some((rec) => rec.status === 'open'))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [projectId, panelsUp])

  const summary = data?.queue.summary
  const liveFor = (id: RailDestination): boolean => {
    if (id === 'approvals') return (summary?.waitingForApproval ?? 0) > 0
    if (id === 'missions') return (summary?.active ?? 0) > 0 || (summary?.retry ?? 0) > 0
    if (id === 'opportunities') return hasOpportunities
    return false
  }

  return (
    <nav className="ns-rail ns-glass" aria-label="North Star destinations">
      {RAIL.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className="ns-rail-item"
          aria-pressed={active === id}
          onClick={() => onOpen(id)}
        >
          <span>{label}</span>
          <span className="ns-rail-dot" data-live={liveFor(id) ? 'true' : undefined} aria-hidden />
        </button>
      ))}
    </nav>
  )
}
