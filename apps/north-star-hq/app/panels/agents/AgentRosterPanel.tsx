'use client'

import { useEffect, useState } from 'react'
import { Telescope, Map, Hammer, Rocket, ShieldCheck } from 'lucide-react'
import { api, ApiError, type AgentId, type AgentRosterDTO } from '../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'
import { deriveCompassSignal } from '../../_lib/agent-signal'
import type { CompassState } from '../../compass'

// "N of M items" is the only genuine progress figure this roster ever has
// (buildAgentRoster's own contract — see runtime.ts), and no workflow here
// currently emits one. Elapsed time is the other honest signal available
// for free: every agent state already carries evidenceAt, a real persisted
// timestamp (scan.startedAt, job.updatedAt, mission.updatedAt — never
// invented). Turning that into "working for 47s" is real information, not
// decoration: the number is exact wall-clock time since that timestamp, and
// it only ever appears next to a status the backend actually reports.
function formatElapsed(iso: string | null, now: number): string | null {
  if (!iso) return null
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

const TICKING: string[] = ['active', 'verifying']

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

  // A single shared clock, not one interval per agent: cheaper, and it means
  // every ticking row updates in the same frame. Only runs at all while at
  // least one agent is genuinely active/verifying — an idle roster (the
  // common case) never starts a timer. Before the early returns below: hooks
  // can't be conditional, so this has to see every render, agents or not.
  const anyTicking = Boolean(data?.roster?.agents.some((a) => TICKING.includes(a.status)))
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!anyTicking) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [anyTicking])

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
      <h2 aria-live="polite">
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
          // Real elapsed time since evidenceAt (a persisted timestamp — see
          // the module comment above), shown only for a status the backend
          // is actually reporting right now. Never shown for 'completed' or
          // 'idle': "37s" next to a finished task would misread as still
          // running.
          const elapsed = TICKING.includes(a.status) ? formatElapsed(a.evidenceAt, now) : null
          return (
            <li key={a.agentId} className="ns-row" data-status={a.status}>
              <Icon className="ns-row-icon" strokeWidth={1.5} aria-hidden />
              <span className="ns-row-text">
                <b className="ns-row-title">{a.name}</b>
                <span className="ns-row-desc">
                  {a.currentActivity ?? a.lastCompletedAction ?? a.blockingReason ?? 'Nothing yet.'}
                  {elapsed && <span className="ns-row-elapsed"> · {elapsed}</span>}
                </span>
              </span>
              <span className="ns-row-dot" aria-hidden title={STATUS_LABEL[a.status] ?? a.status} />
              <span className="ns-sr-only">{STATUS_LABEL[a.status] ?? a.status}</span>
            </li>
          )
        })}
      </ul>
    </>
  )
}
