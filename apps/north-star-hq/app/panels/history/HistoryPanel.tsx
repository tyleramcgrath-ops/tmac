'use client'

// The first UI built on the Activity Stream (Milestone 3.5) — every domain
// action (missions, approvals, deployments, agents) writes to this one real
// event log; this panel just reads it back, newest first. No derivation.

import { api, ApiError, type ActivityEventDTO } from '../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'

const POLL_MS = 15_000

function formatWhen(at: string): string {
  const diffMs = Date.now() - new Date(at).getTime()
  const s = Math.round(diffMs / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(at).toLocaleDateString()
}

export default function HistoryPanel({
  projectId,
  enabled,
}: {
  projectId: string | null
  enabled: boolean
}) {
  const { data, error } = useLivePoll<{ events: ActivityEventDTO[] }>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      return api.getActivity(projectId, { limit: 20 })
    },
    { enabled: Boolean(projectId) && enabled, intervalMs: POLL_MS }
  )

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">History</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to start building activity here.</p>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <p className="ns-panel-eyebrow">History</p>
        <h2>{error ? 'Not connected yet.' : 'Loading…'}</h2>
        {error && <p className="ns-panel-body">{error}</p>}
      </>
    )
  }

  const { events } = data

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">History</p>
        <p className="ns-panel-status">{events.length} recent</p>
      </div>
      <h2>The Activity Stream.</h2>
      <hr className="ns-panel-divider" />
      {events.length === 0 ? (
        <p className="ns-panel-body">Nothing has happened yet.</p>
      ) : (
        <ul className="ns-row-list">
          {events.map((e) => (
            <li key={e.id} className="ns-row">
              <span className="ns-row-text">
                <b className="ns-row-title">{e.summary}</b>
                <span className="ns-row-desc">
                  {formatWhen(e.at)}
                  {e.agentRole ? ` · ${e.agentRole}` : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
