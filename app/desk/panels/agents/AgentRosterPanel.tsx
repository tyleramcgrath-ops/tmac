'use client'

import { useEffect } from 'react'
import { Telescope, Map, Hammer, Rocket, ShieldCheck } from 'lucide-react'
import { api, ApiError, type AgentId, type AgentRosterDTO } from '../../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'
import { deriveCompassSignal } from '../../_lib/agent-signal'
import type { CompassState } from '../../compass'

const STATUS_LABEL: Record<string, string> = {
  idle: 'Idle',
  active: 'Active',
  'waiting-for-approval': 'Awaiting approval',
  blocked: 'Blocked',
  failed: 'Attention',
  verifying: 'Verifying',
  completed: 'Done',
}

const AGENT_ICON: Record<AgentId, typeof Telescope> = {
  scout: Telescope,
  atlas: Map,
  forge: Hammer,
  operator: Rocket,
  sentinel: ShieldCheck,
}

const POLL_MS = 15_000

export default function AgentRosterPanel({
  projectId,
  projectsResolved,
  panelsUp,
  onCompassSignal,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
  onCompassSignal: (s: CompassState | null) => void
}) {
  const { data, error } = useLivePoll<{ roster: AgentRosterDTO }>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      return api.getAgentRoster(projectId)
    },
    { enabled: Boolean(projectId) && panelsUp, intervalMs: POLL_MS }
  )

  useEffect(() => {
    if (data?.roster) onCompassSignal(deriveCompassSignal(data.roster))
  }, [data, onCompassSignal])

  if (!projectsResolved || (projectId && !data && !error)) {
    return (
      <>
        <p className="ns-panel-eyebrow">Agent roster</p>
        <span className="ns-skeleton-line" style={{ width: '70%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Agent roster</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to see agent activity here.</p>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <p className="ns-panel-eyebrow">Agent roster</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error ?? 'Could not load agent activity.'}</p>
      </>
    )
  }

  const { agents } = data.roster
  const activeCount = agents.filter((a) => a.status === 'active' || a.status === 'verifying').length
  const needsAttention = agents.some((a) => a.status === 'failed')

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Agent roster</p>
        <p className="ns-panel-status">{needsAttention ? 'Attention' : 'Watching'}</p>
      </div>
      <h2>
        {needsAttention
          ? 'One agent needs your attention.'
          : activeCount > 0
            ? `${activeCount} agent${activeCount > 1 ? 's' : ''} at work.`
            : 'The room is quiet.'}
      </h2>
      <hr className="ns-panel-divider" />
      <ul className="ns-row-list">
        {agents.map((a) => {
          const Icon = AGENT_ICON[a.agentId]
          return (
            <li key={a.agentId} className="ns-row" data-status={a.status}>
              <Icon className="ns-row-icon" strokeWidth={1.5} aria-hidden />
              <span className="ns-row-text">
                <b className="ns-row-title">{a.name}</b>
                <span className="ns-row-desc">
                  {a.currentActivity ?? a.lastCompletedAction ?? a.blockingReason ?? 'Nothing yet.'}
                </span>
              </span>
              <span className="ns-row-dot" aria-hidden title={STATUS_LABEL[a.status] ?? a.status} />
            </li>
          )
        })}
      </ul>
    </>
  )
}
