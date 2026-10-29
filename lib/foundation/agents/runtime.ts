// Live Agent Roster (North Star Headquarters, Milestone 1).
//
// This is NOT an autonomous agent-worker engine. It is a read-time projection
// of real, already-persisted RankForge workflow state onto five named
// operational roles. Every field is derived from real records — a scan, a
// job, a recommendation, a deployment, a content brief, an atlas snapshot —
// never invented. When no real signal exists for a role, it reports 'idle'
// with an honest empty state, not a fabricated status.
//
// Each rule below is commented with exactly which record(s) and field(s)
// produced the status, so every displayed state is explainable.
//
// Design note (forward-compat): this module returns a stable, normalized
// shape (`AgentRosterSnapshot`). A future autonomous worker engine can
// populate the same shape (via push instead of poll) without any UI change —
// the UI only ever consumes this contract, never the raw records below.

import type { AtlasHistory, ContentBrief, Job, Project, Scan } from '../types'
import { missionsForAgent, type MissionQueueSnapshot } from '../missions/engine'

export type AgentId = 'scout' | 'atlas' | 'forge' | 'operator' | 'sentinel'

export type AgentRuntimeStatus =
  | 'idle'
  | 'active'
  | 'waiting-for-approval'
  | 'blocked'
  | 'failed'
  | 'verifying'
  | 'completed'

export interface AgentRuntimeState {
  agentId: AgentId
  name: string
  role: string
  status: AgentRuntimeStatus
  currentActivity: string | null
  project: { id: string; name: string } | null
  // Only ever a real, measurable number (e.g. N of M items in a bulk
  // operation). null whenever no genuine progress figure exists — never a
  // guessed or animated percentage.
  progress: number | null
  sourceWorkflow: 'scan' | 'atlas-intelligence' | 'content-studio' | 'operator-deploy' | 'verification'
  evidenceAt: string | null
  blockingReason: string | null
  lastCompletedAction: string | null
}

export interface AgentRosterSnapshot {
  generatedAt: string
  agents: AgentRuntimeState[]
}

const RECENT_MS = 5 * 60 * 1000 // "just finished" window before an agent settles back to idle

function isRecent(iso: string | null | undefined, now: number): boolean {
  if (!iso) return false
  return now - new Date(iso).getTime() < RECENT_MS
}

const JOB_LABEL: Record<Job['kind'], string> = {
  scheduled_scan: 'Running a scheduled crawl…',
  outcome_capture: 'Measuring deployment outcomes…',
  monitor: 'Monitoring for regressions…',
  competitor_refresh: 'Refreshing competitor intelligence…',
  rank_tracking: 'Checking keyword rankings…',
  ai_citation_check: 'Checking AI-answer citations…',
  backlink_refresh: 'Checking the backlink profile…',
}

// ── Scout — crawl, audit, discovery. Source: the scan pipeline (rf_scans). ──
function buildScout(project: Project, scans: Scan[], now: number): AgentRuntimeState {
  const base = {
    agentId: 'scout' as const,
    name: 'Scout',
    role: 'Crawls, audits, and discovers what changed on the site.',
    project: { id: project.id, name: project.name },
    sourceWorkflow: 'scan' as const,
  }
  const latest = scans[0]
  if (!latest) {
    return { ...base, status: 'idle', currentActivity: null, progress: null, evidenceAt: null, blockingReason: null, lastCompletedAction: null }
  }
  if (latest.status === 'queued' || latest.status === 'running') {
    return {
      ...base,
      status: 'active',
      currentActivity: latest.status === 'queued' ? `Preparing to crawl ${project.domain}…` : `Auditing ${project.domain}…`,
      // The scan record only carries final counts on completion — no
      // incremental page-count is persisted mid-crawl, so no fabricated %.
      progress: null,
      evidenceAt: latest.startedAt ?? latest.createdAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  if (latest.status === 'failed' || latest.status === 'cancelled') {
    return {
      ...base,
      status: 'failed',
      currentActivity: null,
      progress: null,
      evidenceAt: latest.completedAt ?? latest.createdAt,
      blockingReason: latest.error ?? 'The last crawl did not complete.',
      lastCompletedAction: null,
    }
  }
  const summary = `Audited ${latest.summary.pagesCrawled} page${latest.summary.pagesCrawled === 1 ? '' : 's'} — site score ${latest.summary.siteScore}.`
  return {
    ...base,
    status: isRecent(latest.completedAt, now) ? 'completed' : 'idle',
    currentActivity: null,
    progress: null,
    evidenceAt: latest.completedAt,
    blockingReason: null,
    lastCompletedAction: summary,
  }
}

// ── Atlas — prioritization & external intelligence. Source: competitor/rank/
// citation/backlink jobs + the last assembled Mission Atlas snapshot. ──────
const ATLAS_JOB_KINDS: Job['kind'][] = ['competitor_refresh', 'rank_tracking', 'ai_citation_check', 'backlink_refresh']
function buildAtlas(project: Project, jobs: Job[], atlasHistory: AtlasHistory | null, now: number): AgentRuntimeState {
  const base = {
    agentId: 'atlas' as const,
    name: 'Atlas',
    role: 'Gathers external intelligence and reprioritizes the plan.',
    project: { id: project.id, name: project.name },
    sourceWorkflow: 'atlas-intelligence' as const,
  }
  const relevant = jobs.filter((j) => ATLAS_JOB_KINDS.includes(j.kind))
  const running = relevant.find((j) => j.status === 'queued' || j.status === 'running')
  if (running) {
    return {
      ...base,
      status: 'active',
      currentActivity: JOB_LABEL[running.kind],
      progress: null,
      evidenceAt: running.updatedAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  const recentFailure = relevant.find((j) => j.status === 'failed' && isRecent(j.updatedAt, now))
  if (recentFailure) {
    return {
      ...base,
      status: 'failed',
      currentActivity: null,
      progress: null,
      evidenceAt: recentFailure.updatedAt,
      blockingReason: recentFailure.lastError ?? `${JOB_LABEL[recentFailure.kind]} failed.`,
      lastCompletedAction: null,
    }
  }
  if (atlasHistory) {
    return {
      ...base,
      status: isRecent(atlasHistory.capturedAt, now) ? 'completed' : 'idle',
      currentActivity: null,
      progress: null,
      evidenceAt: atlasHistory.capturedAt,
      blockingReason: null,
      lastCompletedAction: 'Refreshed external intelligence and the morning briefing.',
    }
  }
  return { ...base, status: 'idle', currentActivity: null, progress: null, evidenceAt: null, blockingReason: null, lastCompletedAction: null }
}

// ── Forge — content & optimization generation. Source: Content Studio briefs
// (generation is synchronous, so "active" only appears for the requesting
// tab; other tabs see the real result the moment it lands). ──────────────
function buildForge(project: Project, briefs: ContentBrief[], now: number): AgentRuntimeState {
  const base = {
    agentId: 'forge' as const,
    name: 'Forge',
    role: 'Drafts content and on-page optimizations from real research.',
    project: { id: project.id, name: project.name },
    sourceWorkflow: 'content-studio' as const,
  }
  const latest = briefs[0]
  if (!latest) {
    return { ...base, status: 'idle', currentActivity: null, progress: null, evidenceAt: null, blockingReason: null, lastCompletedAction: null }
  }
  const summary = `Drafted "${latest.title}" for "${latest.keyword}".`
  return {
    ...base,
    status: isRecent(latest.createdAt, now) ? 'completed' : 'idle',
    currentActivity: null,
    progress: null,
    evidenceAt: latest.createdAt,
    blockingReason: null,
    lastCompletedAction: summary,
  }
}

// ── Operator — approved execution & deployment. Milestone 2: the mission
// queue (lib/foundation/missions/engine.ts) is the single source of truth for
// work — Operator's status is derived from which missions it is CURRENTLY
// responsible for, not by independently re-scanning recommendations/
// deployments. "The mission owns the work; the agent moves it along." ─────
function buildOperator(project: Project, missionQueue: MissionQueueSnapshot, now: number): AgentRuntimeState {
  const base = {
    agentId: 'operator' as const,
    name: 'Operator',
    role: 'Executes approved fixes and deploys them safely.',
    project: { id: project.id, name: project.name },
    sourceWorkflow: 'operator-deploy' as const,
  }
  const mine = missionsForAgent(missionQueue, 'operator')

  const retrying = mine.find((m) => m.stage === 'retry')
  if (retrying) {
    return {
      ...base,
      status: 'failed',
      currentActivity: null,
      progress: null,
      evidenceAt: retrying.updatedAt,
      blockingReason: retrying.blockingReason,
      lastCompletedAction: null,
    }
  }
  const inFlight = mine.find((m) => m.stage === 'executing' || m.stage === 'deploying' || m.stage === 'verifying')
  if (inFlight) {
    return {
      ...base,
      status: inFlight.stage === 'verifying' ? 'verifying' : 'active',
      currentActivity: `Deploying "${inFlight.title}".`,
      progress: null,
      evidenceAt: inFlight.updatedAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  // Distinct from the awaiting-approval case below: an 'approved' mission is
  // no longer waiting on the USER — it's queued for Operator to deploy. That
  // is real, actionable work, not idle waiting, so it reads as 'active'
  // rather than reusing the "awaiting your approval" message (which would be
  // false the moment someone approves it).
  const readyToDeploy = mine.filter((m) => m.stage === 'approved')
  if (readyToDeploy.length > 0) {
    return {
      ...base,
      status: 'active',
      currentActivity: `${readyToDeploy.length} mission${readyToDeploy.length === 1 ? '' : 's'} approved — ready to deploy.`,
      progress: null,
      evidenceAt: readyToDeploy[0].updatedAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  const waiting = mine.filter((m) => m.stage === 'waiting-for-approval')
  if (waiting.length > 0) {
    return {
      ...base,
      status: 'waiting-for-approval',
      currentActivity: `${waiting.length} mission${waiting.length === 1 ? '' : 's'} awaiting your approval.`,
      progress: null,
      evidenceAt: waiting[0].updatedAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  const recentlyDone = [...missionQueue.missions]
    .filter((m) => m.stage === 'completed' && m.deployment)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  return {
    ...base,
    status: recentlyDone && isRecent(recentlyDone.updatedAt, now) ? 'completed' : 'idle',
    currentActivity: null,
    progress: null,
    evidenceAt: recentlyDone?.updatedAt ?? null,
    blockingReason: null,
    lastCompletedAction: recentlyDone?.deployment ? `Deployed and verified the fix on ${recentlyDone.deployment.postUrl}.` : null,
  }
}

// ── Sentinel — verification, monitoring, failure/regression detection.
// Missions it currently owns (verifying / retry-after-regression) come from
// the mission queue; monitor/outcome_capture jobs cover the ambient
// background watch that isn't itself a mission. ──────────────────────────
function buildSentinel(project: Project, missionQueue: MissionQueueSnapshot, jobs: Job[], now: number): AgentRuntimeState {
  const base = {
    agentId: 'sentinel' as const,
    name: 'Sentinel',
    role: 'Verifies every change by read-back and watches for regressions.',
    project: { id: project.id, name: project.name },
    sourceWorkflow: 'verification' as const,
  }
  const mine = missionsForAgent(missionQueue, 'sentinel')

  const regressedOrFailed = mine.find((m) => m.stage === 'retry')
  if (regressedOrFailed) {
    return {
      ...base,
      status: 'failed',
      currentActivity: null,
      progress: null,
      evidenceAt: regressedOrFailed.updatedAt,
      blockingReason: regressedOrFailed.blockingReason,
      lastCompletedAction: null,
    }
  }
  const verifying = mine.find((m) => m.stage === 'verifying')
  if (verifying) {
    return {
      ...base,
      status: 'verifying',
      currentActivity: `Verifying "${verifying.title}" by read-back.`,
      progress: null,
      evidenceAt: verifying.updatedAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  const watching = jobs.find((j) => (j.kind === 'monitor' || j.kind === 'outcome_capture') && (j.status === 'queued' || j.status === 'running'))
  if (watching) {
    return {
      ...base,
      status: 'active',
      currentActivity: JOB_LABEL[watching.kind],
      progress: null,
      evidenceAt: watching.updatedAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  const recentlyVerified = [...missionQueue.missions]
    .filter((m) => m.stage === 'completed' && m.deployment)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  return {
    ...base,
    status: recentlyVerified && isRecent(recentlyVerified.updatedAt, now) ? 'completed' : 'idle',
    currentActivity: null,
    progress: null,
    evidenceAt: recentlyVerified?.updatedAt ?? null,
    blockingReason: null,
    lastCompletedAction: recentlyVerified?.deployment ? `Verified ${recentlyVerified.deployment.postUrl} by read-back.` : null,
  }
}

export function buildAgentRoster(input: {
  project: Project
  scans: Scan[]
  jobs: Job[]
  contentBriefs: ContentBrief[]
  atlasHistory: AtlasHistory | null
  // The single source of truth for Operator/Sentinel — see the module
  // comment above and lib/foundation/missions/engine.ts.
  missionQueue: MissionQueueSnapshot
  now?: number
}): AgentRosterSnapshot {
  const now = input.now ?? Date.now()
  const scans = [...input.scans].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const jobs = [...input.jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const briefs = [...input.contentBriefs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    generatedAt: new Date(now).toISOString(),
    agents: [
      buildScout(input.project, scans, now),
      buildAtlas(input.project, jobs, input.atlasHistory, now),
      buildForge(input.project, briefs, now),
      buildOperator(input.project, input.missionQueue, now),
      buildSentinel(input.project, input.missionQueue, jobs, now),
    ],
  }
}
