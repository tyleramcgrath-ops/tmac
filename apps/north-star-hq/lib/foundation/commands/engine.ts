// Command Engine (Engine -> API -> UI). No React, no UI concerns, fully
// testable in isolation. The Command Bar's entire job is: normalize a
// request, classify it against a fixed registry, validate permission and
// context, execute ONLY through the real recommendation/operator pipelines,
// and record a real audit event. Nothing here fabricates data, invents a
// status transition, or bypasses the existing approval/deploy/verify/
// rollback machinery — every mutating handler below calls the exact same
// domain functions the existing routes call.

import type { FoundationStore } from '../store'
import type { Project, Recommendation, Role } from '../types'
import { audit } from '../auth'
import { coordinateProject } from '../agents/service'
import { buildAgentRoster } from '../agents/runtime'
import { buildMissionQueue, type Mission, type MissionQueueSnapshot } from '../missions/engine'
import { canTransition } from '../reco/transitions'
import { latestScanPages, policyOf } from '../operator/context'
import { buildOperatorPreview, signalsForRecommendation } from '../operator/pipeline'
import { deployOneRecommendation, applyDeploymentOutcome } from '../operator/deploy-one'
import { rollbackWpDeployment } from '../wp-execution'
import { emitActivity } from '../activity/emit'
import { searchProject } from '../search/engine'
import { classifyCommand } from './classify'
import type { CommandActionType, CommandExecutionStatus, CommandRequest, CommandResult, CommandRiskLevel } from './types'

export type { CommandActionType, CommandRequest, CommandResult } from './types'

const RISK_LEVEL: Record<CommandActionType, CommandRiskLevel> = {
  'summarize-project': 'read-only',
  'list-approvals': 'read-only',
  'list-active-missions': 'read-only',
  'list-blocked-missions': 'read-only',
  'list-completed-today': 'read-only',
  'explain-mission': 'read-only',
  'scout-findings': 'read-only',
  'atlas-recommendation': 'read-only',
  'list-deployments': 'read-only',
  'list-failed': 'read-only',
  'mission-detail': 'read-only',
  'next-best-action': 'read-only',
  'preview-change': 'read-only',
  'verify-deployment': 'read-only',
  'search-project': 'read-only',
  'prioritize-mission': 'reversible',
  'pause-mission': 'reversible',
  'resume-mission': 'reversible',
  'focus-mission': 'reversible',
  'approve-mission': 'consequential',
  'deploy-mission': 'consequential',
  'retry-mission': 'consequential',
  'cancel-mission': 'consequential',
  'rollback-deployment': 'consequential',
}

// The role each action actually requires downstream, mirroring the real
// endpoints exactly — NOT derived from risk level. 'approve' is consequential
// but only a status write (member, same as the recommendations route);
// 'deploy'/'rollback' are real WordPress writes and require admin, same as
// the operator/execute route. Getting this wrong would be a privilege-
// escalation bug, so it is checked per action, never assumed.
const REQUIRED_ROLE: Record<CommandActionType, Role> = {
  'summarize-project': 'member', 'list-approvals': 'member', 'list-active-missions': 'member',
  'list-blocked-missions': 'member', 'list-completed-today': 'member', 'explain-mission': 'member',
  'scout-findings': 'member', 'atlas-recommendation': 'member', 'list-deployments': 'member',
  'list-failed': 'member', 'mission-detail': 'member', 'next-best-action': 'member',
  'preview-change': 'member', 'verify-deployment': 'member', 'search-project': 'member',
  'prioritize-mission': 'member', 'pause-mission': 'member', 'resume-mission': 'member', 'focus-mission': 'member',
  'approve-mission': 'member', 'retry-mission': 'member', 'cancel-mission': 'member',
  'deploy-mission': 'admin', 'rollback-deployment': 'admin',
}

const ROLE_RANK: Record<Role, number> = { member: 1, admin: 2, owner: 3 }

export interface CommandContext {
  store: FoundationStore
  project: Project
  userId: string
  userRole: Role
}

function resolveMission(queue: MissionQueueSnapshot, missionId: string | null | undefined, hint: string | null): Mission | null {
  if (missionId) return queue.missions.find((m) => m.id === missionId || m.recommendationId === missionId) ?? null
  if (hint) {
    const needle = hint.toLowerCase()
    return queue.missions.find((m) => m.title.toLowerCase().includes(needle)) ?? null
  }
  return null
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function result(base: CommandRequest, patch: Partial<CommandResult>): CommandResult {
  return {
    commandId: base.commandId,
    raw: base.raw,
    intent: 'unsupported',
    riskLevel: null,
    projectId: base.projectId,
    missionId: base.missionId ?? null,
    targetResource: null,
    requestedParams: base.params ?? {},
    permission: 'allowed',
    confirmationRequired: false,
    status: 'executed',
    message: '',
    evidence: null,
    auditedAt: null,
    ...patch,
  }
}

// The generic Activity Stream layer for the Command Bar: every command that
// reaches a final (non-pending) outcome is recorded here, regardless of
// which specific domain event(s) its handler also emitted. This is what lets
// a future notification center or timeline show "12 commands run today"
// without knowing about every individual action type.
async function emitCommandOutcome(ctx: CommandContext, req: CommandRequest, r: CommandResult): Promise<CommandResult> {
  if (r.status === 'pending-confirmation') return r
  await emitActivity(ctx.store, {
    orgId: ctx.project.orgId,
    projectId: ctx.project.id,
    type: r.status === 'executed' ? 'command.executed' : 'command.failed',
    summary: r.status === 'executed' ? `Command executed: "${req.raw}"` : `Command failed: "${req.raw}" — ${r.message}`,
    missionId: r.missionId,
    actorId: ctx.userId,
  })
  return r
}

export async function runCommand(ctx: CommandContext, req: CommandRequest): Promise<CommandResult> {
  const classified = classifyCommand(req.raw)
  if (classified.action === 'unsupported') {
    return emitCommandOutcome(ctx, req, result(req, {
      intent: 'unsupported',
      status: 'rejected-unsupported',
      message:
        "I don't recognize that one yet. Try: \"what needs my approval\", \"what is North Star working on\", \"show blocked missions\", \"summarize this project\", \"find <keyword>\", or \"what should I do next\".",
    }))
  }

  const action = classified.action
  const riskLevel = RISK_LEVEL[action]
  const requiredRole = REQUIRED_ROLE[action]

  if (ROLE_RANK[ctx.userRole] < ROLE_RANK[requiredRole]) {
    return emitCommandOutcome(ctx, req, result(req, {
      intent: action,
      riskLevel,
      permission: 'denied',
      status: 'rejected-permission',
      message: `This action requires the ${requiredRole} role.`,
    }))
  }

  // Everything below needs the current real state — computed fresh, never
  // cached, same philosophy as coordinateProject()'s own doc comment.
  const [coordination, deployments, scans, jobs, contentBriefs, atlasHistory] = await Promise.all([
    coordinateProject(ctx.store, ctx.project),
    ctx.store.listWpDeployments(ctx.project.id),
    ctx.store.listScans(ctx.project.id, 5),
    ctx.store.listJobs(ctx.project.id, 20),
    ctx.store.listContentBriefs(ctx.project.id),
    ctx.store.getAtlasHistory(ctx.project.id),
  ])
  const missionQueue = buildMissionQueue({ project: { id: ctx.project.id, name: ctx.project.name }, coordination, deployments })
  const roster = buildAgentRoster({ project: ctx.project, scans, jobs, contentBriefs, atlasHistory, missionQueue })

  const needsMission: CommandActionType[] = [
    'explain-mission', 'mission-detail', 'prioritize-mission', 'pause-mission', 'resume-mission',
    'focus-mission', 'preview-change', 'approve-mission', 'deploy-mission', 'retry-mission', 'cancel-mission',
  ]
  const mission = resolveMission(missionQueue, req.missionId, classified.missionHint)
  if (needsMission.includes(action) && !mission) {
    return emitCommandOutcome(ctx, req, result(req, {
      intent: action,
      riskLevel,
      status: 'rejected-invalid',
      message: 'Which mission? Select one in the Mission Queue first, or name it in your command.',
    }))
  }

  // ── Level 1: read-only, executes immediately ──────────────────────────
  if (riskLevel === 'read-only') {
    return emitCommandOutcome(ctx, req, await executeReadOnly(ctx, req, action, { missionQueue, roster, deployments, contentBriefs, mission, searchQuery: classified.searchQuery }))
  }

  // ── Level 2/3: plan on the first call, execute only when confirmed ─────
  if (!req.confirmed) {
    return await planMutation(ctx, req, action, riskLevel, { missionQueue, mission, deployments })
  }
  return emitCommandOutcome(ctx, req, await executeMutation(ctx, req, action, riskLevel, { missionQueue, mission, deployments }))
}

// ─────────────────────────────────────────────────────────────────────────
// Level 1 handlers — read real state, never mutate.
// ─────────────────────────────────────────────────────────────────────────
async function executeReadOnly(
  ctx: CommandContext,
  req: CommandRequest,
  action: CommandActionType,
  data: {
    missionQueue: MissionQueueSnapshot
    roster: ReturnType<typeof buildAgentRoster>
    deployments: Awaited<ReturnType<FoundationStore['listWpDeployments']>>
    contentBriefs: Awaited<ReturnType<FoundationStore['listContentBriefs']>>
    mission: Mission | null
    searchQuery: string | null
  }
): Promise<CommandResult> {
  const { missionQueue, roster, deployments, contentBriefs, mission, searchQuery } = data
  const base = { intent: action, riskLevel: 'read-only' as const, status: 'executed' as const, missionId: mission?.id ?? req.missionId ?? null }

  switch (action) {
    case 'summarize-project': {
      const s = missionQueue.summary
      const activeAgents = roster.agents.filter((a) => a.status === 'active' || a.status === 'verifying').map((a) => a.name)
      return result(req, {
        ...base,
        message: `${ctx.project.name}: ${s.total} mission${s.total === 1 ? '' : 's'} — ${s.waitingForApproval} awaiting approval, ${s.active} in flight, ${s.retry} needing retry, ${s.failed} failed, ${s.completed} completed.${activeAgents.length ? ` Active now: ${activeAgents.join(', ')}.` : ''}`,
        evidence: { summary: s, activeAgents },
      })
    }
    case 'list-approvals': {
      const waiting = missionQueue.missions.filter((m) => m.stage === 'waiting-for-approval')
      return result(req, {
        ...base,
        message: waiting.length ? `${waiting.length} mission${waiting.length === 1 ? '' : 's'} need your approval: ${waiting.map((m) => m.title).join(', ')}.` : 'Nothing needs your approval right now.',
        evidence: waiting,
      })
    }
    case 'list-active-missions': {
      const active = missionQueue.missions.filter((m) => m.stage !== 'completed' && m.stage !== 'failed')
      return result(req, {
        ...base,
        message: active.length ? `${active.length} mission${active.length === 1 ? '' : 's'} in progress: ${active.map((m) => `"${m.title}" (${m.stage})`).join(', ')}.` : 'North Star has nothing in progress right now.',
        evidence: active,
      })
    }
    case 'list-blocked-missions': {
      const blocked = missionQueue.missions.filter((m) => m.blockingReason)
      return result(req, {
        ...base,
        message: blocked.length ? `${blocked.length} mission${blocked.length === 1 ? '' : 's'} blocked: ${blocked.map((m) => `"${m.title}" — ${m.blockingReason}`).join('; ')}.` : 'Nothing is blocked.',
        evidence: blocked,
      })
    }
    case 'list-completed-today': {
      const today = todayUtc()
      const done = missionQueue.missions.filter((m) => m.stage === 'completed' && m.updatedAt.slice(0, 10) === today)
      return result(req, {
        ...base,
        message: done.length ? `${done.length} completed today: ${done.map((m) => m.title).join(', ')}.` : 'Nothing has completed yet today.',
        evidence: done,
      })
    }
    case 'explain-mission': {
      if (!mission) return result(req, { ...base, status: 'rejected-invalid', message: 'Which mission?' })
      const why = mission.blockingReason ?? (mission.stage === 'waiting-for-approval' ? 'It has a ready fix and is waiting on your approval.' : `It is currently ${mission.stage}.`)
      return result(req, { ...base, message: `"${mission.title}" — ${why}`, evidence: mission })
    }
    case 'mission-detail': {
      if (!mission) return result(req, { ...base, status: 'rejected-invalid', message: 'I could not find that mission.' })
      return result(req, { ...base, message: `"${mission.title}" is ${mission.stage}${mission.currentAgent ? `, with ${mission.currentAgent} responsible` : ''}.`, evidence: mission })
    }
    case 'next-best-action': {
      const m = missionQueue.currentMission
      return result(req, {
        ...base,
        message: m ? `Next: "${m.title}" — ${m.stage}${m.currentAgent ? ` (${m.currentAgent})` : ''}.` : 'Nothing is waiting on you right now.',
        evidence: m,
      })
    }
    case 'scout-findings': {
      const scout = roster.agents.find((a) => a.agentId === 'scout')!
      return result(req, { ...base, message: scout.currentActivity ?? scout.lastCompletedAction ?? 'Scout has nothing to report yet.', evidence: scout })
    }
    case 'atlas-recommendation': {
      const atlas = roster.agents.find((a) => a.agentId === 'atlas')!
      return result(req, { ...base, message: atlas.currentActivity ?? atlas.lastCompletedAction ?? 'Atlas has nothing to report yet.', evidence: atlas })
    }
    case 'list-deployments': {
      const recent = [...deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
      return result(req, {
        ...base,
        message: recent.length ? `${recent.length} recent deployment${recent.length === 1 ? '' : 's'}: ${recent.map((d) => `${d.postUrl} (${d.status})`).join(', ')}.` : 'No deployments yet.',
        evidence: recent,
      })
    }
    case 'list-failed': {
      const failed = missionQueue.missions.filter((m) => m.stage === 'failed')
      return result(req, {
        ...base,
        message: failed.length ? `${failed.length} failed: ${failed.map((m) => m.title).join(', ')}.` : 'Nothing has failed.',
        evidence: failed,
      })
    }
    case 'preview-change': {
      if (!mission) return result(req, { ...base, status: 'rejected-invalid', message: 'Which mission?' })
      const preview = await buildPreview(ctx, mission.recommendationId)
      if (!preview) return result(req, { ...base, status: 'failed', message: 'No page signals are available to build a preview (re-run the scan).' })
      return result(req, {
        ...base,
        message: preview.preview.deployable ? `Proposed: "${preview.preview.proposedValue}".` : `Not deployable yet: ${preview.preview.reason}.`,
        evidence: preview,
      })
    }
    case 'verify-deployment': {
      const latest = mission?.deployment
        ? deployments.find((d) => d.id === mission.deployment!.id)
        : [...deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (!latest) return result(req, { ...base, message: 'No deployment to verify yet.' })
      return result(req, {
        ...base,
        message: latest.verification
          ? `${latest.postUrl}: ${latest.verification.note}`
          : `${latest.postUrl} has not been verified yet.`,
        evidence: latest.verification,
      })
    }
    case 'search-project': {
      if (!searchQuery) return result(req, { ...base, status: 'rejected-invalid', message: 'Search for what? Try "find missing meta description".' })
      const found = searchProject(searchQuery, { missionQueue, roster, deployments, contentBriefs })
      return result(req, {
        ...base,
        message: found.length
          ? `${found.length} result${found.length === 1 ? '' : 's'} for "${searchQuery}": ${found.map((r) => r.title).join(', ')}.`
          : `Nothing found for "${searchQuery}".`,
        missionId: found.find((r) => r.missionId)?.missionId ?? base.missionId,
        evidence: found,
      })
    }
    default:
      return result(req, { ...base, status: 'rejected-unsupported', message: 'That read is not supported yet.' })
  }
}

async function buildPreview(ctx: CommandContext, recommendationId: string) {
  const rec = await ctx.store.getRecommendation(recommendationId)
  if (!rec) return null
  const pages = await latestScanPages(ctx.store, ctx.project.id)
  const sitePages = pages.map((p) => ({ url: String(p.url ?? ''), title: String((p.title as string) ?? '') })).filter((p) => p.url)
  const policy = policyOf(ctx.project)
  const signals = signalsForRecommendation(rec, pages)
  if (!signals) return null
  return buildOperatorPreview(rec, signals, policy, { sitePages })
}

// ─────────────────────────────────────────────────────────────────────────
// Level 2/3 — plan (first call): resolve the target, describe the real
// expected effect, never mutate. Confirmation is a SEPARATE, later call.
// ─────────────────────────────────────────────────────────────────────────
async function planMutation(
  ctx: CommandContext,
  req: CommandRequest,
  action: CommandActionType,
  riskLevel: CommandRiskLevel,
  data: { missionQueue: MissionQueueSnapshot; mission: Mission | null; deployments: Awaited<ReturnType<FoundationStore['listWpDeployments']>> }
): Promise<CommandResult> {
  const { mission, deployments } = data
  const base = { intent: action, riskLevel, missionId: mission?.id ?? null, confirmationRequired: true, status: 'pending-confirmation' as const }

  switch (action) {
    case 'prioritize-mission':
      return result(req, { ...base, message: `Move "${mission!.title}" to top priority?`, evidence: mission })
    case 'pause-mission': {
      if (!mission) return result(req, { ...base, status: 'rejected-invalid', message: 'Which mission?' })
      const rec = await ctx.store.getRecommendation(mission.recommendationId)
      if (!rec || !canTransition(rec.status, 'dismissed')) {
        return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: `"${mission.title}" cannot be paused from its current state.` })
      }
      return result(req, { ...base, message: `Pause "${mission.title}"? It will be set aside until you resume it.`, evidence: mission })
    }
    case 'resume-mission': {
      if (!mission) return result(req, { ...base, status: 'rejected-invalid', message: 'Which mission?' })
      const rec = await ctx.store.getRecommendation(mission.recommendationId)
      if (!rec || !canTransition(rec.status, 'open')) {
        return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: `"${mission.title}" is already active.` })
      }
      return result(req, { ...base, message: `Resume "${mission.title}"?`, evidence: mission })
    }
    case 'focus-mission':
      return result(req, { ...base, message: `"${mission!.title}" is already tracked as a mission — bring it into focus?`, evidence: mission })
    case 'approve-mission': {
      const rec = await ctx.store.getRecommendation(mission!.recommendationId)
      if (!rec || !canTransition(rec.status, 'accepted')) {
        return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: `"${mission!.title}" cannot be approved from its current state.` })
      }
      return result(req, { ...base, message: `Approve "${mission!.title}"? This authorizes it for deployment but does not deploy it yet.`, evidence: mission })
    }
    case 'retry-mission': {
      const rec = await ctx.store.getRecommendation(mission!.recommendationId)
      if (!rec || !canTransition(rec.status, 'open')) {
        return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: `"${mission!.title}" is not in a retryable state.` })
      }
      return result(req, { ...base, message: `Retry "${mission!.title}"? It will reopen for another attempt.`, evidence: mission })
    }
    case 'cancel-mission': {
      const rec = await ctx.store.getRecommendation(mission!.recommendationId)
      if (!rec || !canTransition(rec.status, 'rejected')) {
        return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: `"${mission!.title}" cannot be cancelled from its current state.` })
      }
      return result(req, { ...base, message: `Cancel "${mission!.title}"? This can be reopened later if needed.`, evidence: mission })
    }
    case 'deploy-mission': {
      const preview = await buildPreview(ctx, mission!.recommendationId)
      if (!preview || !preview.preview.deployable) {
        return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: `"${mission!.title}" is not ready to deploy: ${preview?.preview.reason ?? 'no deployable fix available'}.` })
      }
      return result(req, {
        ...base,
        message: `Deploy "${mission!.title}" — proposed: "${preview.preview.proposedValue}". Real WordPress write, verified by read-back.`,
        evidence: { mission, preview, rollbackAvailable: true },
      })
    }
    case 'rollback-deployment': {
      const dep = mission?.deployment
        ? deployments.find((d) => d.id === mission.deployment!.id)
        : [...deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (!dep) return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: 'No deployment to roll back.' })
      if (dep.status === 'rolled_back' || dep.status === 'failed') {
        return result(req, { ...base, confirmationRequired: false, status: 'rejected-invalid', message: `Cannot roll back a ${dep.status} deployment.` })
      }
      return result(req, {
        ...base,
        targetResource: dep.postUrl,
        message: `Roll back the deployment on ${dep.postUrl}? This restores the previous title/meta and re-verifies.`,
        evidence: dep,
      })
    }
    default:
      return result(req, { ...base, confirmationRequired: false, status: 'rejected-unsupported', message: 'That action is not supported yet.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Level 2/3 — execute (second call, after explicit confirmation). Every
// mutating path calls the same real function the existing routes call, then
// writes a real audit event.
// ─────────────────────────────────────────────────────────────────────────
async function executeMutation(
  ctx: CommandContext,
  req: CommandRequest,
  action: CommandActionType,
  riskLevel: CommandRiskLevel,
  data: { missionQueue: MissionQueueSnapshot; mission: Mission | null; deployments: Awaited<ReturnType<FoundationStore['listWpDeployments']>> }
): Promise<CommandResult> {
  const { mission, deployments } = data
  const base = { intent: action, riskLevel, missionId: mission?.id ?? null }
  const auditedAt = new Date().toISOString()

  async function transitionAndAudit(
    to: Recommendation['status'],
    auditAction: string,
    activityType: 'approval.granted' | 'mission.paused' | 'mission.resumed' | 'mission.canceled' | 'mission.retried'
  ) {
    const rec = await ctx.store.getRecommendation(mission!.recommendationId)
    if (!rec) return result(req, { ...base, status: 'failed', message: 'That recommendation no longer exists.' })
    if (!canTransition(rec.status, to)) {
      return result(req, { ...base, status: 'rejected-invalid', message: `Cannot move "${mission!.title}" from ${rec.status} to ${to}.` })
    }
    rec.history.push({ at: auditedAt, by: ctx.userId, from: rec.status, to })
    rec.status = to
    await ctx.store.updateRecommendation(rec)
    await audit(ctx.project.orgId, ctx.userId, auditAction, rec.id, `${rec.title}: → ${to} (via command bar)`)
    await emitActivity(ctx.store, {
      orgId: ctx.project.orgId,
      projectId: ctx.project.id,
      type: activityType,
      summary: `"${rec.title}" is now ${to}.`,
      missionId: mission!.id,
      recommendationId: rec.id,
      actorId: ctx.userId,
    })
    return result(req, { ...base, status: 'executed', message: `"${mission!.title}" is now ${to}.`, evidence: rec, auditedAt })
  }

  switch (action) {
    case 'prioritize-mission': {
      const rec = await ctx.store.getRecommendation(mission!.recommendationId)
      if (!rec) return result(req, { ...base, status: 'failed', message: 'That recommendation no longer exists.' })
      rec.userPriority = 1
      await ctx.store.updateRecommendation(rec)
      await audit(ctx.project.orgId, ctx.userId, 'recommendation.priority', rec.id, `${rec.title}: priority=1 (via command bar)`)
      await emitActivity(ctx.store, {
        orgId: ctx.project.orgId,
        projectId: ctx.project.id,
        type: 'mission.prioritized',
        summary: `"${rec.title}" was moved to top priority.`,
        missionId: mission!.id,
        recommendationId: rec.id,
        agentRole: 'atlas',
        actorId: ctx.userId,
      })
      return result(req, { ...base, status: 'executed', message: `"${mission!.title}" is now top priority.`, evidence: rec, auditedAt })
    }
    case 'pause-mission':
      return await transitionAndAudit('dismissed', 'recommendation.status', 'mission.paused')
    case 'resume-mission':
      return await transitionAndAudit('open', 'recommendation.status', 'mission.resumed')
    case 'approve-mission':
      return await transitionAndAudit('accepted', 'recommendation.status', 'approval.granted')
    case 'retry-mission':
      return await transitionAndAudit('open', 'recommendation.status', 'mission.retried')
    case 'cancel-mission':
      return await transitionAndAudit('rejected', 'recommendation.status', 'mission.canceled')
    case 'focus-mission':
      return result(req, { ...base, status: 'executed', message: `"${mission!.title}" is in focus.`, evidence: mission, auditedAt })
    case 'deploy-mission': {
      const rec = await ctx.store.getRecommendation(mission!.recommendationId)
      if (!rec) return result(req, { ...base, status: 'failed', message: 'That recommendation no longer exists.' })
      const conn = await ctx.store.getWpConnection(ctx.project.id)
      if (!conn) return result(req, { ...base, status: 'failed', message: 'Connect WordPress first.' })
      const pages = await latestScanPages(ctx.store, ctx.project.id)
      const sitePages = pages.map((p) => ({ url: String(p.url ?? ''), title: String((p.title as string) ?? '') })).filter((p) => p.url)
      const policy = policyOf(ctx.project)
      const deployResult = await deployOneRecommendation({
        store: ctx.store, project: ctx.project, rec, scanPages: pages, sitePages, conn, policy,
        approvedBy: ctx.userId, approve: true, dryRun: false,
      })
      await audit(ctx.project.orgId, ctx.userId, 'operator.deploy', rec.id, `${rec.title}: ${deployResult.ok ? 'deployed' : 'failed'} (via command bar)`)
      return result(req, {
        ...base,
        status: deployResult.ok ? 'executed' : 'failed',
        message: deployResult.ok ? `Deployed and ${deployResult.verified ? 'verified' : 'awaiting verification'}: "${mission!.title}".` : `Deploy failed: ${deployResult.error ?? 'unknown error'}.`,
        evidence: deployResult,
        auditedAt,
      })
    }
    case 'rollback-deployment': {
      const dep = mission?.deployment
        ? deployments.find((d) => d.id === mission.deployment!.id)
        : [...deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (!dep) return result(req, { ...base, status: 'failed', message: 'No deployment to roll back.' })
      const conn = await ctx.store.getWpConnection(ctx.project.id)
      if (!conn) return result(req, { ...base, status: 'failed', message: 'WordPress is not connected.' })
      try {
        const updated = await rollbackWpDeployment({ deployment: dep, connection: conn, actorId: ctx.userId })
        if (dep.recommendationId) {
          const rec = await ctx.store.getRecommendation(dep.recommendationId)
          if (rec) await applyDeploymentOutcome(ctx.store, rec, ctx.userId, 'rolled_back', '')
        }
        await audit(ctx.project.orgId, ctx.userId, 'operator.rollback', dep.id, `${dep.postUrl}: rolled back (via command bar)`)
        return result(req, { ...base, status: 'executed', targetResource: dep.postUrl, message: `Rolled back ${dep.postUrl}.`, evidence: updated, auditedAt })
      } catch (err) {
        return result(req, { ...base, status: 'failed', message: err instanceof Error ? err.message : 'Rollback failed.' })
      }
    }
    default:
      return result(req, { ...base, status: 'rejected-unsupported', message: 'That action is not supported yet.' })
  }
}
