// The "where is my work right now?" projection. Its whole premise, stated at
// the top of the module, is that it invents no state: every timestamp traces
// back to a real event the project emitted. These tests hold it to that,
// especially where an event is missing.

import { describe, expect, it } from 'vitest'
import { MISSION_PHASES, buildMissionOperations, type MissionPhase } from '../lib/foundation/missions/operations'
import type { Mission, MissionStage } from '../lib/foundation/missions/engine'
import type { ActivityEvent, ActivityEventType } from '../lib/foundation/types'

const NOW = '2026-07-29T12:00:00.000Z'

function mission(over: Partial<Mission> = {}): Mission {
  return {
    id: 'missing-title::site',
    recommendationId: 'r1',
    title: 'Missing title',
    category: 'content',
    severity: 'critical',
    stage: 'discovered',
    currentAgent: 'scout',
    project: { id: 'p1', name: 'Acme' },
    createdAt: '2026-07-29T10:00:00.000Z',
    updatedAt: '2026-07-29T10:00:00.000Z',
    confidence: 90,
    expectedImpactSize: 'high',
    blockingReason: null,
    deployment: null,
    ...over,
  }
}

function event(type: string, at: string, missionId = 'missing-title::site'): ActivityEvent {
  return {
    id: `e-${type}-${at}`, orgId: 'o1', projectId: 'p1', type: type as ActivityEventType,
    summary: type, missionId, recommendationId: 'r1', agentRole: null, actorId: null, detail: null, at,
  }
}

function step(view: ReturnType<typeof buildMissionOperations>, phase: MissionPhase) {
  return view.steps.find((s) => s.phase === phase)!
}

describe('phase placement follows the mission stage', () => {
  const cases: [MissionStage, MissionPhase][] = [
    ['discovered', 'discovery'],
    ['scored', 'analysis'],
    ['planned', 'planning'],
    ['waiting-for-approval', 'approval'],
    ['approved', 'deployment'],
    ['deploying', 'deployment'],
    ['verifying', 'verification'],
    ['completed', 'complete'],
  ]
  for (const [stage, phase] of cases) {
    it(`puts a ${stage} mission in ${phase}`, () => {
      expect(buildMissionOperations(mission({ stage }), [], NOW).currentPhase).toBe(phase)
    })
  }

  it('sends a retrying mission back to analysis for another pass', () => {
    const view = buildMissionOperations(mission({ stage: 'retry' }), [], NOW)
    expect(view.currentPhase).toBe('analysis')
    expect(view.outcome).toBe('retrying')
  })

  it('distinguishes a cancellation before approval from one after it', () => {
    const before = buildMissionOperations(mission({ stage: 'failed' }), [], NOW)
    expect(before.currentPhase).toBe('approval')
    const after = buildMissionOperations(
      mission({ stage: 'failed' }),
      [event('approval.granted', '2026-07-29T11:00:00.000Z')],
      NOW,
    )
    expect(after.currentPhase).toBe('deployment')
    expect(after.outcome).toBe('canceled')
  })

  it('marks earlier phases done, the current one current, and later ones pending', () => {
    const view = buildMissionOperations(mission({ stage: 'waiting-for-approval' }), [], NOW)
    expect(view.steps.map((s) => s.status)).toEqual(['done', 'done', 'done', 'current', 'pending', 'pending', 'pending'])
    expect(view.steps.map((s) => s.phase)).toEqual(MISSION_PHASES)
  })
})

describe('timestamps come from real events, or the mission itself', () => {
  it('uses the recommendation.generated event as the discovery time', () => {
    const view = buildMissionOperations(
      mission({ stage: 'scored' }),
      [event('recommendation.generated', '2026-07-29T10:30:00.000Z')],
      NOW,
    )
    expect(step(view, 'discovery').enteredAt).toBe('2026-07-29T10:30:00.000Z')
  })

  it('falls back to the mission createdAt when no discovery event exists', () => {
    const view = buildMissionOperations(mission({ stage: 'scored' }), [], NOW)
    expect(step(view, 'discovery').enteredAt).toBe('2026-07-29T10:00:00.000Z')
  })

  it('ignores events belonging to a different mission', () => {
    const view = buildMissionOperations(
      mission({ stage: 'scored' }),
      [event('recommendation.generated', '2026-07-29T09:00:00.000Z', 'other-mission')],
      NOW,
    )
    expect(step(view, 'discovery').enteredAt).toBe('2026-07-29T10:00:00.000Z')
  })

  it('takes the earliest matching event when several were emitted', () => {
    const view = buildMissionOperations(
      mission({ stage: 'deploying' }),
      [
        event('approval.granted', '2026-07-29T11:30:00.000Z'),
        event('approval.granted', '2026-07-29T11:00:00.000Z'),
      ],
      NOW,
    )
    expect(step(view, 'deployment').enteredAt).toBe('2026-07-29T11:00:00.000Z')
  })

  it('measures the current phase against now', () => {
    const view = buildMissionOperations(
      mission({ stage: 'deploying' }),
      [event('approval.granted', '2026-07-29T11:00:00.000Z')],
      NOW,
    )
    expect(step(view, 'deployment').elapsedMs).toBe(60 * 60 * 1000)
  })

  it('measures a completed phase against the next phase it entered', () => {
    const view = buildMissionOperations(
      mission({ stage: 'deploying' }),
      [
        event('recommendation.generated', '2026-07-29T10:00:00.000Z'),
        event('approval.requested', '2026-07-29T10:15:00.000Z'),
        event('approval.granted', '2026-07-29T11:00:00.000Z'),
      ],
      NOW,
    )
    expect(step(view, 'approval').elapsedMs).toBe(45 * 60 * 1000)
  })

  it('reports an unknown duration as null, never as zero', () => {
    // A mission can reach deployment without an approval.granted event (an
    // auto-approved policy deploy emits none). Reporting the approval phase as
    // "0ms" claims it was instant; the truth is that we do not know.
    const view = buildMissionOperations(
      mission({ stage: 'deploying' }),
      [event('approval.requested', '2026-07-29T10:15:00.000Z')],
      NOW,
    )
    expect(step(view, 'deployment').enteredAt).toBeNull()
    expect(step(view, 'approval').elapsedMs).toBeNull()
  })

  it('leaves a pending phase with no time claim at all', () => {
    const view = buildMissionOperations(mission({ stage: 'discovered' }), [], NOW)
    expect(step(view, 'verification').elapsedMs).toBeNull()
  })

  it('never reports a negative duration when events arrive out of order', () => {
    const view = buildMissionOperations(
      mission({ stage: 'deploying' }),
      [
        event('approval.requested', '2026-07-29T11:30:00.000Z'),
        event('approval.granted', '2026-07-29T11:00:00.000Z'),
      ],
      NOW,
    )
    expect(step(view, 'approval').elapsedMs).toBe(0)
  })
})

describe('the view names an owner and a next action', () => {
  it('has no agent owner for the phases that wait on a human or are finished', () => {
    const view = buildMissionOperations(mission({ stage: 'waiting-for-approval' }), [], NOW)
    expect(step(view, 'approval').owner).toBeNull()
    expect(step(view, 'complete').owner).toBeNull()
    expect(step(view, 'deployment').owner).toBe('operator')
  })

  it('tells the user it is their turn while waiting for approval', () => {
    expect(buildMissionOperations(mission({ stage: 'waiting-for-approval' }), [], NOW).nextAction)
      .toBe('Waiting for your approval.')
  })

  it('surfaces the real blocking reason on a retry instead of a generic line', () => {
    const view = buildMissionOperations(
      mission({ stage: 'retry', blockingReason: 'Verification failed: value did not persist.' }),
      [], NOW,
    )
    expect(view.nextAction).toBe('Verification failed: value did not persist.')
    expect(view.blockingReason).toBe('Verification failed: value did not persist.')
  })

  it('says nothing is needed once complete', () => {
    expect(buildMissionOperations(mission({ stage: 'completed' }), [], NOW).nextAction)
      .toBe('No further action needed.')
  })
})
