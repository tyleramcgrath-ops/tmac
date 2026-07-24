'use client'

// Bottom mission strip — the one-line "what's happening right now" readout.
// Reads the same Mission Queue every other surface reads; no separate truth.

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

const ACTIVE_STAGES = new Set<MissionStage>([
  'waiting-for-approval', 'approved', 'executing', 'deploying', 'verifying',
])

const POLL_MS = 15_000

export default function MissionStrip({
  projectId,
  panelsUp,
}: {
  projectId: string | null
  panelsUp: boolean
}) {
  const { data } = useLivePoll<{ queue: MissionQueueDTO }>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      return api.getMissionQueue(projectId)
    },
    { enabled: Boolean(projectId) && panelsUp, intervalMs: POLL_MS }
  )

  const current = data?.queue.currentMission ?? null
  const live = Boolean(current && ACTIVE_STAGES.has(current.stage))

  return (
    <div className="ns-strip ns-glass" aria-label="Current mission">
      <span className="ns-strip-dot" data-live={live ? 'true' : 'false'} aria-hidden />
      <span className="ns-strip-text">
        {current ? `"${current.title}"` : data ? 'The queue is clear.' : 'Loading the mission queue…'}
      </span>
      {current && <span className="ns-strip-meta">{STAGE_LABEL[current.stage]}</span>}
    </div>
  )
}
