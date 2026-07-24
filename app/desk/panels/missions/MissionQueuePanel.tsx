'use client'

// UI layer (Engine -> API -> UI): pure presentation. Every number and label
// here is read directly off the MissionQueueDTO the API already computed —
// no filtering, counting, or stage derivation happens in this component.

import { api, ApiError, type MissionQueueDTO, type MissionStage } from '../../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'

const STAGE_LABEL: Record<MissionStage, string> = {
  discovered: 'Discovered',
  scored: 'Scored',
  planned: 'Planned',
  'waiting-for-approval': 'Awaiting approval',
  approved: 'Approved',
  executing: 'Executing',
  deploying: 'Deploying',
  verifying: 'Verifying',
  completed: 'Completed',
  failed: 'Failed',
  retry: 'Retry',
}

const POLL_MS = 15_000

export default function MissionQueuePanel({
  projectId,
  projectsResolved,
  panelsUp,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
}) {
  const { data, error } = useLivePoll<{ queue: MissionQueueDTO }>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      return api.getMissionQueue(projectId)
    },
    { enabled: Boolean(projectId) && panelsUp, intervalMs: POLL_MS }
  )

  if (!projectsResolved || (projectId && !data && !error)) {
    return (
      <>
        <p className="ns-panel-eyebrow">Mission queue</p>
        <span className="ns-skeleton-line" style={{ width: '70%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Mission queue</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to see missions here.</p>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <p className="ns-panel-eyebrow">Mission queue</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error ?? 'Could not load the mission queue.'}</p>
      </>
    )
  }

  const { queue } = data
  const { summary, currentMission, missions } = queue
  const recent = missions.slice(0, 4)

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Mission queue</p>
        <p className="ns-panel-status">{summary.total === 0 ? 'Empty' : `${summary.total} total`}</p>
      </div>
      <h2>
        {currentMission
          ? `"${currentMission.title}" — ${STAGE_LABEL[currentMission.stage]}.`
          : summary.total === 0
            ? 'No missions yet.'
            : 'The queue is clear.'}
      </h2>
      <hr className="ns-panel-divider" />
      <ul className="ns-missions-summary">
        <li><b>{summary.waitingForApproval}</b><span>Awaiting approval</span></li>
        <li><b>{summary.active}</b><span>In flight</span></li>
        <li><b>{summary.retry}</b><span>Needs retry</span></li>
        <li><b>{summary.failed}</b><span>Failed</span></li>
        <li><b>{summary.completed}</b><span>Completed</span></li>
      </ul>
      {recent.length > 0 && (
        <ul className="ns-missions-list">
          {recent.map((m) => (
            <li key={m.id} data-stage={m.stage}>
              <span className="ns-missions-dot" aria-hidden />
              <span className="ns-missions-title">{m.title}</span>
              <b className="ns-missions-stage">{STAGE_LABEL[m.stage]}</b>
            </li>
          ))}
        </ul>
      )}
      <p className="ns-panel-body">
        {summary.total === 0
          ? 'Missions appear here the moment Scout finds something worth doing.'
          : `${summary.total} mission${summary.total === 1 ? '' : 's'} total across the project.`}
      </p>
    </>
  )
}
