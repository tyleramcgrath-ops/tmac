'use client'

import { useEffect } from 'react'
import { api, ApiError, type AgentRosterDTO } from '../../../lib/client'
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
      <p className="ns-panel-eyebrow">Agent roster</p>
      <h2>
        {needsAttention
          ? 'One agent needs your attention.'
          : activeCount > 0
            ? `${activeCount} agent${activeCount > 1 ? 's' : ''} at work.`
            : 'The room is quiet.'}
      </h2>
      <ul className="ns-agents">
        {agents.map((a) => (
          <li key={a.agentId} data-status={a.status}>
            <span className="ns-agents-dot" aria-hidden />
            <span className="ns-agents-name">{a.name}</span>
            <span className="ns-agents-activity">
              {a.currentActivity ?? a.lastCompletedAction ?? a.blockingReason ?? 'Nothing yet.'}
            </span>
            <b className="ns-agents-status">{STATUS_LABEL[a.status] ?? a.status}</b>
          </li>
        ))}
      </ul>
    </>
  )
}
