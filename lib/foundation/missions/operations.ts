// Mission Operations — a projection of the Mission Queue (engine.ts), not a
// second source of truth. The mission state machine is the product; this
// module answers "where is my work right now?" using the SAME Mission plus
// the Activity Stream's real, timestamped history of that mission. No new
// state is invented here — every enteredAt/elapsedMs below traces back to a
// real event this project actually emitted, or falls back to the mission's
// own createdAt/updatedAt when no earlier stream event exists (e.g. a
// recommendation created before the Activity Stream shipped).
//
// Honesty note: per engine.ts's own honesty note, Discovery/Analysis/Planning
// happen synchronously in one request today — no event separates them, so
// they share one real timestamp (not an invented gap) until a future async
// pipeline actually produces distinct ones.

import type { ActivityEvent } from '../types'
import type { Mission, MissionAgentRole, MissionStage } from './engine'

export type MissionPhase = 'discovery' | 'analysis' | 'planning' | 'approval' | 'deployment' | 'verification' | 'complete'

export const MISSION_PHASES: MissionPhase[] = [
  'discovery', 'analysis', 'planning', 'approval', 'deployment', 'verification', 'complete',
]

// The agent responsible for each phase — null during 'approval' because that
// phase waits on the human, not an agent.
const PHASE_OWNER: Record<MissionPhase, MissionAgentRole | null> = {
  discovery: 'scout',
  analysis: 'atlas',
  planning: 'forge',
  approval: null,
  deployment: 'operator',
  verification: 'sentinel',
  complete: null,
}

const PHASE_NEXT_ACTION: Record<MissionPhase, string> = {
  discovery: 'Scout is analyzing this finding.',
  analysis: 'Atlas is scoring priority and expected impact.',
  planning: 'Forge is preparing a deployable fix.',
  approval: 'Waiting for your approval.',
  deployment: 'Operator will deploy this change.',
  verification: 'Sentinel is verifying the live result.',
  complete: 'No further action needed.',
}

const STAGE_TO_PHASE: Partial<Record<MissionStage, MissionPhase>> = {
  discovered: 'discovery',
  scored: 'analysis',
  planned: 'planning',
  'waiting-for-approval': 'approval',
  approved: 'deployment',
  executing: 'deployment',
  deploying: 'deployment',
  verifying: 'verification',
  completed: 'complete',
}

export type MissionOutcome = 'in-progress' | 'completed' | 'canceled' | 'retrying'

function outcomeFor(stage: MissionStage): MissionOutcome {
  if (stage === 'completed') return 'completed'
  if (stage === 'failed') return 'canceled' // a human rejected/dismissed it — not a pipeline failure
  if (stage === 'retry') return 'retrying' // a real deploy/verify attempt didn't stick, or a regression reopened it
  return 'in-progress'
}

export interface MissionPhaseStep {
  phase: MissionPhase
  status: 'done' | 'current' | 'pending'
  owner: MissionAgentRole | null
  enteredAt: string | null
  elapsedMs: number | null
}

export interface MissionOperationsView {
  missionId: string
  title: string
  outcome: MissionOutcome
  currentPhase: MissionPhase
  confidence: number
  blockingReason: string | null
  nextAction: string
  steps: MissionPhaseStep[]
}

export function buildMissionOperations(mission: Mission, events: ActivityEvent[], nowIso: string): MissionOperationsView {
  const mine = events.filter((e) => e.missionId === mission.id).sort((a, b) => (a.at < b.at ? -1 : 1))
  const firstOf = (...types: string[]) => mine.find((e) => types.includes(e.type))?.at ?? null

  const discoveredAt = firstOf('recommendation.generated') ?? mission.createdAt
  const approvalRequestedAt = firstOf('approval.requested') ?? discoveredAt
  const approvedAt = firstOf('approval.granted')
  const deployStartedAt = firstOf('deployment.started')
  const completedAt = firstOf('verification.passed')

  const enteredAt: Record<MissionPhase, string | null> = {
    discovery: discoveredAt,
    analysis: discoveredAt,
    planning: discoveredAt,
    approval: approvalRequestedAt,
    deployment: approvedAt,
    verification: deployStartedAt,
    complete: completedAt,
  }

  const outcome = outcomeFor(mission.stage)
  const currentPhase: MissionPhase =
    mission.stage === 'retry' ? 'analysis' : // reopened — back near the start for another pass
    mission.stage === 'failed' ? (approvedAt ? 'deployment' : 'approval') : // canceled after vs. before approval
    STAGE_TO_PHASE[mission.stage] ?? 'discovery'

  const currentIdx = MISSION_PHASES.indexOf(currentPhase)
  const steps: MissionPhaseStep[] = MISSION_PHASES.map((phase, i) => {
    const status: MissionPhaseStep['status'] = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'pending'
    const at = enteredAt[phase]
    let elapsedMs: number | null = null
    if (at && status === 'current') {
      elapsedMs = Math.max(0, new Date(nowIso).getTime() - new Date(at).getTime())
    } else if (at && status === 'done') {
      const nextAt = enteredAt[MISSION_PHASES[i + 1]]
      elapsedMs = nextAt ? Math.max(0, new Date(nextAt).getTime() - new Date(at).getTime()) : 0
    }
    return { phase, status, owner: PHASE_OWNER[phase], enteredAt: at, elapsedMs }
  })

  const nextAction =
    outcome === 'completed' ? 'No further action needed.' :
    outcome === 'canceled' ? 'This mission was canceled — resume it to try again.' :
    outcome === 'retrying' ? (mission.blockingReason ?? 'Ready for another attempt.') :
    PHASE_NEXT_ACTION[currentPhase]

  return {
    missionId: mission.id,
    title: mission.title,
    outcome,
    currentPhase,
    confidence: mission.confidence,
    blockingReason: mission.blockingReason,
    nextAction,
    steps,
  }
}
