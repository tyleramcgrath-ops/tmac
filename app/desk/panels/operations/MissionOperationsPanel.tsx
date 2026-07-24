'use client'

// UI layer (Engine -> API -> UI): pure presentation. Every phase, owner,
// timestamp, and elapsed duration below is read directly off the
// MissionOperationsDTO the API already computed from the real Mission Queue
// and the real Activity Stream — no stage derivation or timing math happens
// in this component. "Where is my work right now?" — that's the question
// this panel answers, not "here is our pipeline architecture."

import { api, ApiError, type MissionOperationsDTO, type MissionPhase } from '../../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'

const PHASE_LABEL: Record<MissionPhase, string> = {
  discovery: 'Discovery',
  analysis: 'Analysis',
  planning: 'Planning',
  approval: 'Approval',
  deployment: 'Deployment',
  verification: 'Verification',
  complete: 'Complete',
}

const OWNER_LABEL: Record<string, string> = {
  scout: 'Scout',
  atlas: 'Atlas',
  forge: 'Forge',
  operator: 'Operator',
  sentinel: 'Sentinel',
}

const OUTCOME_LABEL: Record<MissionOperationsDTO['outcome'], string> = {
  'in-progress': 'In progress',
  completed: 'Complete',
  canceled: 'Canceled',
  retrying: 'Retrying',
}

const POLL_MS = 15_000

function formatElapsed(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

export default function MissionOperationsPanel({
  projectId,
  projectsResolved,
  panelsUp,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
}) {
  const { data, error } = useLivePoll<{ operations: MissionOperationsDTO | null }>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      const { queue } = await api.getMissionQueue(projectId)
      if (!queue.currentMission) return { operations: null }
      const { operations } = await api.getMissionOperations(projectId, queue.currentMission.id)
      return { operations }
    },
    { enabled: Boolean(projectId) && panelsUp, intervalMs: POLL_MS }
  )

  if (!projectsResolved || (projectId && !data && !error)) {
    return (
      <>
        <p className="ns-panel-eyebrow">Mission operations</p>
        <span className="ns-skeleton-line" style={{ width: '70%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Mission operations</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to see where work stands.</p>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <p className="ns-panel-eyebrow">Mission operations</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error ?? 'Could not load mission operations.'}</p>
      </>
    )
  }

  const { operations } = data
  if (!operations) {
    return (
      <>
        <p className="ns-panel-eyebrow">Mission operations</p>
        <h2>Nothing in flight.</h2>
        <p className="ns-panel-body">Where your work stands will appear here the moment a mission starts moving.</p>
      </>
    )
  }

  const current = operations.steps.find((s) => s.phase === operations.currentPhase) ?? operations.steps[0]

  return (
    <>
      <p className="ns-panel-eyebrow">Mission operations</p>
      <h2>
        &ldquo;{operations.title}&rdquo; <span className="ns-ops-outcome" data-outcome={operations.outcome}>{OUTCOME_LABEL[operations.outcome]}</span>
      </h2>
      <ol className="ns-ops-flow" aria-label="Mission phase progress">
        {operations.steps.map((step) => (
          <li key={step.phase} data-status={step.status} title={PHASE_LABEL[step.phase]}>
            <span className="ns-ops-dot" aria-hidden />
          </li>
        ))}
      </ol>
      <p className="ns-ops-current">
        {PHASE_LABEL[operations.currentPhase]}
        {current?.owner && ` — ${OWNER_LABEL[current.owner] ?? current.owner}`}
        {current?.elapsedMs !== null && current?.elapsedMs !== undefined && ` · ${formatElapsed(current.elapsedMs)}`}
      </p>
      <p className="ns-panel-body">
        {operations.blockingReason ?? operations.nextAction}
        {' · '}
        {Math.round(operations.confidence)}% confidence
      </p>
    </>
  )
}
