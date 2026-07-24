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

import type { AtlasHistory, ContentBrief, Job, Project, Recommendation, Scan, WpDeployment } from '../types'
import type { OperatorMetrics } from '../operator/metrics'

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

// ── Operator — approved execution & deployment. Source: open recommendations
// (pending approval) + the most recent WordPress deployment. ──────────────
function buildOperator(project: Project, recs: Recommendation[], deployments: WpDeployment[], now: number): AgentRuntimeState {
  const base = {
    agentId: 'operator' as const,
    name: 'Operator',
    role: 'Executes approved fixes and deploys them safely.',
    project: { id: project.id, name: project.name },
    sourceWorkflow: 'operator-deploy' as const,
  }
  const latest = [...deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (latest && isRecent(latest.createdAt, now)) {
    if (latest.status === 'verify_failed' || latest.status === 'failed') {
      return {
        ...base,
        status: 'failed',
        currentActivity: null,
        progress: null,
        evidenceAt: latest.verification?.checkedAt ?? latest.createdAt,
        blockingReason: latest.verification?.note ?? 'The deploy could not be verified.',
        lastCompletedAction: null,
      }
    }
    return {
      ...base,
      status: 'completed',
      currentActivity: null,
      progress: null,
      evidenceAt: latest.verification?.checkedAt ?? latest.createdAt,
      blockingReason: null,
      lastCompletedAction: latest.status === 'rolled_back' ? `Rolled back the change on ${latest.postUrl}.` : `Deployed and verified the fix on ${latest.postUrl}.`,
    }
  }
  const pending = recs.filter((r) => r.status === 'open')
  if (pending.length > 0) {
    return {
      ...base,
      status: 'waiting-for-approval',
      currentActivity: `${pending.length} finding${pending.length === 1 ? '' : 's'} awaiting your approval.`,
      progress: null,
      evidenceAt: pending[0].createdAt,
      blockingReason: null,
      lastCompletedAction: null,
    }
  }
  return {
    ...base,
    status: 'idle',
    currentActivity: null,
    progress: null,
    evidenceAt: latest?.createdAt ?? null,
    blockingReason: null,
    lastCompletedAction: latest ? `Deployed and verified the fix on ${latest.postUrl}.` : null,
  }
}

// ── Sentinel — verification, monitoring, failure/regression detection.
// Source: regressed recommendations + monitor/outcome jobs + the most recent
// deployment's verification read-back. ────────────────────────────────────
function buildSentinel(project: Project, recs: Recommendation[], jobs: Job[], deployments: WpDeployment[], metrics: OperatorMetrics, now: number): AgentRuntimeState {
  const base = {
    agentId: 'sentinel' as const,
    name: 'Sentinel',
    role: 'Verifies every change by read-back and watches for regressions.',
    project: { id: project.id, name: project.name },
    sourceWorkflow: 'verification' as const,
  }
  const regressed = recs.filter((r) => r.status === 'regressed')
  if (regressed.length > 0) {
    return {
      ...base,
      status: 'failed',
      currentActivity: null,
      progress: null,
      evidenceAt: regressed[0].history[regressed[0].history.length - 1]?.at ?? null,
      blockingReason: `${regressed.length} previously-verified fix${regressed.length === 1 ? '' : 'es'} regressed since.`,
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
  const latestVerified = [...deployments]
    .filter((d) => d.verification)
    .sort((a, b) => (b.verification!.checkedAt).localeCompare(a.verification!.checkedAt))[0]
  if (latestVerified && isRecent(latestVerified.verification!.checkedAt, now)) {
    return {
      ...base,
      status: 'completed',
      currentActivity: null,
      progress: null,
      evidenceAt: latestVerified.verification!.checkedAt,
      blockingReason: null,
      lastCompletedAction: `Verified ${latestVerified.postUrl} by read-back.`,
    }
  }
  return {
    ...base,
    status: 'idle',
    currentActivity: null,
    progress: null,
    evidenceAt: latestVerified?.verification?.checkedAt ?? null,
    blockingReason: metrics.verificationFailureRate && metrics.verificationFailureRate > 0.2
      ? `Verification failure rate is elevated (${Math.round(metrics.verificationFailureRate * 100)}%).`
      : null,
    lastCompletedAction: latestVerified ? `Verified ${latestVerified.postUrl} by read-back.` : null,
  }
}

export function buildAgentRoster(input: {
  project: Project
  scans: Scan[]
  jobs: Job[]
  recommendations: Recommendation[]
  deployments: WpDeployment[]
  contentBriefs: ContentBrief[]
  atlasHistory: AtlasHistory | null
  operatorMetrics: OperatorMetrics
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
      buildOperator(input.project, input.recommendations, input.deployments, now),
      buildSentinel(input.project, input.recommendations, jobs, input.deployments, input.operatorMetrics, now),
    ],
  }
}
