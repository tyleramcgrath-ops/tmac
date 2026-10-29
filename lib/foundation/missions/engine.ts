// Mission Queue — the domain engine (Engine -> API -> UI). No React, no UI
// concerns, fully testable in isolation. This is the single source of truth
// for "work" inside North Star: a Mission is one recommendation's real
// lifecycle, not something an agent independently invents. Agents don't own
// work — they are attributed to a mission's current stage; the mission owns
// the work.
//
// Lifecycle (the canonical model):
//   discovered -> scored -> planned -> waiting-for-approval -> approved
//     -> executing -> deploying -> verifying -> completed | failed
//     -> retry / rolled-back
//
// Honesty note (read before changing the derivation below): coordinateProject()
// computes the full multi-agent consensus for every recommendation at read
// time, so a recommendation is never observed here without confidence,
// expectedImpact, AND coordination all present together. That collapses
// 'discovered'/'scored'/'planned' into a single always-already-there moment —
// they remain part of the type for forward compatibility (e.g. if scoring is
// ever split into a separate async step) but `deriveStage` cannot honestly
// produce them today, and does not pretend to. Likewise 'executing'/
// 'deploying' are real only within the acting session's own live request
// (see the client that calls POST .../operator/execute) — deploys are executed
// synchronously today, so no other poller ever observes an in-flight write.
// A future async deploy worker would persist real intermediate states, and
// this same function would start producing them without any API/UI change.

import type { Recommendation, WpDeployment } from '../types'
import type { CoordinationResult } from '../agents/orchestrator'
import type { AgentId, AgentTask } from '../agents/types'

export type MissionStage =
  | 'discovered'
  | 'scored'
  | 'planned'
  | 'waiting-for-approval'
  | 'approved'
  | 'executing'
  | 'deploying'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'retry'

export type MissionAgentRole = 'scout' | 'atlas' | 'forge' | 'operator' | 'sentinel'

// The ONLY place that translates between the 9-agent consensus/task-chain
// roster (lib/foundation/agents/registry.ts) and the 5 operational roles the
// Headquarters roster shows (Milestone 1). technical/content/local/authority/
// cro all produce the actual fix for their category — consolidated as Forge.
// qa's pre-deploy challenge and operator's post-deploy verification are both
// "trustworthiness" concerns — consolidated as Sentinel, matching Milestone 1.
export const AGENT_ROLE_MAP: Record<AgentId, MissionAgentRole> = {
  scout: 'scout',
  strategist: 'atlas',
  technical: 'forge',
  content: 'forge',
  local: 'forge',
  authority: 'forge',
  cro: 'forge',
  operator: 'operator',
  qa: 'sentinel',
}

export interface Mission {
  id: string // the recommendation's issueId — stable across rescans
  recommendationId: string
  title: string
  category: string
  severity: 'critical' | 'warning' | 'info'
  stage: MissionStage
  currentAgent: MissionAgentRole | null
  project: { id: string; name: string }
  createdAt: string
  updatedAt: string
  confidence: number
  expectedImpactSize: 'high' | 'medium' | 'low'
  blockingReason: string | null
  deployment: { id: string; postUrl: string; status: string } | null
}

export interface MissionQueueSummary {
  total: number
  waitingForApproval: number
  approved: number
  active: number // executing/deploying/verifying — genuinely in flight
  completed: number
  failed: number
  retry: number
}

export interface MissionQueueSnapshot {
  generatedAt: string
  missions: Mission[]
  // The single most-recently-touched non-terminal mission, or null when
  // nothing is in flight. Pre-computed here (not in the UI) so the UI layer
  // stays pure presentation with no duplicated grouping/filtering logic.
  currentMission: Mission | null
  summary: MissionQueueSummary
}

function latestDeploymentFor(recId: string, deployments: WpDeployment[]): WpDeployment | null {
  let latest: WpDeployment | null = null
  for (const d of deployments) {
    if (d.recommendationId !== recId) continue
    if (!latest || d.createdAt > latest.createdAt) latest = d
  }
  return latest
}

function deriveStage(rec: Recommendation, deployment: WpDeployment | null): MissionStage {
  switch (rec.status) {
    case 'rejected':
    case 'dismissed':
      return 'failed'
    case 'regressed':
    case 'rolled_back':
      return 'retry'
    case 'verified':
      return 'completed'
    case 'deployed':
      // Real, but only reachable in the instant between a write and its
      // synchronous read-back verify — see the honesty note above.
      return 'verifying'
    case 'accepted':
    case 'modified':
      return 'approved'
    case 'open':
    default:
      // A verify-failed or failed deploy reopens the recommendation to 'open'
      // (see lib/foundation/operator/pipeline.ts's outcomeForDeployment) —
      // surfaced honestly as 'retry' ("tried, didn't stick, ready for
      // another look"), not a fresh, never-touched 'waiting-for-approval'.
      if (deployment && (deployment.status === 'verify_failed' || deployment.status === 'failed')) {
        return 'retry'
      }
      return 'waiting-for-approval'
  }
}

function blockingReasonFor(rec: Recommendation, stage: MissionStage, deployment: WpDeployment | null): string | null {
  if (stage === 'failed') {
    const last = rec.history[rec.history.length - 1]
    return last ? `Marked ${rec.status} by ${last.by === 'system' ? 'the system' : last.by}.` : null
  }
  if (stage === 'retry') {
    if (rec.status === 'regressed') return 'A later scan found this issue again after it was previously verified fixed.'
    if (rec.status === 'rolled_back') return 'Rolled back to the previous value — ready to try a different approach.'
    if (deployment?.status === 'verify_failed') return deployment.verification?.note ?? 'The last deploy could not be verified — reopened for another attempt.'
    if (deployment?.status === 'failed') return 'The last deploy attempt failed — reopened for another attempt.'
  }
  return null
}

// Who is currently responsible for advancing this mission: the first 'open'
// task in its real task chain (lib/foundation/agents/tasks.ts), mapped to a
// Headquarters role. null once the mission is done (completed/failed).
function currentAgentFor(issueId: string, tasks: AgentTask[]): MissionAgentRole | null {
  const chain = tasks.filter((t) => t.issueId === issueId)
  const nextOpen = chain.find((t) => t.status === 'open')
  const agentId = nextOpen?.toAgent ?? chain[chain.length - 1]?.toAgent
  return agentId ? AGENT_ROLE_MAP[agentId] : null
}

export function buildMissionQueue(input: {
  project: { id: string; name: string }
  coordination: CoordinationResult
  deployments: WpDeployment[]
  now?: number
}): MissionQueueSnapshot {
  const now = input.now ?? Date.now()

  const missions: Mission[] = input.coordination.coordinated.map((rec) => {
    const deployment = latestDeploymentFor(rec.id, input.deployments)
    const stage = deriveStage(rec, deployment)
    const terminal = stage === 'completed' || stage === 'failed'
    return {
      id: rec.issueId,
      recommendationId: rec.id,
      title: rec.title,
      category: rec.category,
      severity: rec.severity,
      stage,
      currentAgent: terminal ? null : currentAgentFor(rec.issueId, input.coordination.tasks),
      project: input.project,
      createdAt: rec.createdAt,
      updatedAt: rec.history[rec.history.length - 1]?.at ?? rec.createdAt,
      confidence: rec.confidence,
      expectedImpactSize: rec.expectedImpact.size,
      blockingReason: blockingReasonFor(rec, stage, deployment),
      deployment: deployment ? { id: deployment.id, postUrl: deployment.postUrl, status: deployment.status } : null,
    }
  })

  // Most recently touched first — the queue reads top-to-bottom as "what
  // moved last", which is what makes it feel like a live heartbeat.
  missions.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const inFlightStages: MissionStage[] = ['executing', 'deploying', 'verifying']
  const nonTerminal = (m: Mission) => m.stage !== 'completed' && m.stage !== 'failed'

  const summary: MissionQueueSummary = {
    total: missions.length,
    waitingForApproval: missions.filter((m) => m.stage === 'waiting-for-approval').length,
    approved: missions.filter((m) => m.stage === 'approved').length,
    active: missions.filter((m) => inFlightStages.includes(m.stage)).length,
    completed: missions.filter((m) => m.stage === 'completed').length,
    failed: missions.filter((m) => m.stage === 'failed').length,
    retry: missions.filter((m) => m.stage === 'retry').length,
  }

  return {
    generatedAt: new Date(now).toISOString(),
    missions,
    currentMission: missions.find(nonTerminal) ?? null,
    summary,
  }
}

// Convenience projections other engines (the Milestone 1 roster, the morning
// brief, notifications, reports — everything the roadmap says should
// eventually read from the mission queue) can reuse instead of re-deriving
// their own view of "what's going on".
export function missionsForAgent(snapshot: MissionQueueSnapshot, role: MissionAgentRole): Mission[] {
  return snapshot.missions.filter((m) => m.currentAgent === role)
}
