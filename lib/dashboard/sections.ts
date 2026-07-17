// Dashboard section builders — pure functions that turn gathered DB data into
// the exact sections the /app/today and /app/projects/[id] dashboards render.
// No I/O here; the API routes gather the inputs and call these. Everything is
// evidence-based: a job is "requiring attention" because its status says so, a
// win is a win because a measurement window reached a successful/verified state.

import { classifyFreshness, type FreshnessSource, type FreshnessResult } from '@/lib/freshness/policy'
import { dedupeIncidents, type RawAlert, type Incident } from '@/lib/incidents/dedup'

// The 8 data sources a project tracks freshness for.
export const FRESHNESS_SOURCES: FreshnessSource[] = [
  'crawl', 'priority_rankings', 'full_rankings', 'gsc', 'ga4', 'fusion', 'portfolio_priority', 'opportunities',
]

export interface JobLite {
  id: string
  projectId: string
  jobType: string
  status: string
  enabled: boolean
  lastSuccessAt: Date | null
  lastFailureAt: Date | null
  nextRunAt: Date | null
  failureReason: string | null
  failureClass: string | null
  retryCount: number
  maxRetries: number
}

export interface MeasurementLite {
  id: string
  projectId: string
  page: string | null
  keyword: string | null
  changeType: string
  status: string
  confidence: number
  reviewAt: Date | null
  updatedAt: Date
  notes: string | null
}

// ── Schedule health ─────────────────────────────────────────────────────────
export function scheduleHealth(jobs: JobLite[]) {
  const total = jobs.length
  const running = jobs.filter((j) => j.status === 'running').length
  const failed = jobs.filter((j) => j.status === 'failed').length
  const retrying = jobs.filter((j) => j.status === 'retrying').length
  const blocked = jobs.filter((j) => j.status === 'blocked' || j.status === 'not_configured').length
  const paused = jobs.filter((j) => !j.enabled || j.status === 'paused').length
  const healthy = jobs.filter((j) => j.status === 'completed' || j.status === 'completed_with_warnings' || j.status === 'scheduled' || j.status === 'queued').length
  const score = total === 0 ? 0 : Math.round((healthy / total) * 100)
  return { total, running, failed, retrying, blocked, paused, healthy, score }
}

// ── Data freshness (8 sources) ──────────────────────────────────────────────
export function dataFreshness(jobs: JobLite[], now: Date): FreshnessResult[] {
  const byType = new Map(jobs.map((j) => [j.jobType, j]))
  // gsc/ga4 freshness maps from gsc_sync/ga4_sync jobs.
  const sourceJob: Record<FreshnessSource, string> = {
    crawl: 'crawl', priority_rankings: 'priority_rankings', full_rankings: 'full_rankings',
    gsc: 'gsc_sync', ga4: 'ga4_sync', fusion: 'fusion', portfolio_priority: 'portfolio_priority',
    daily_mission: 'daily_mission', morning_briefing: 'morning_briefing', opportunities: 'opportunities',
    deployment_verification: 'deployment_verification',
  }
  return FRESHNESS_SOURCES.map((source) => {
    const j = byType.get(sourceJob[source])
    return classifyFreshness({
      source,
      configured: j ? j.status !== 'not_configured' && j.status !== 'blocked' : false,
      lastSuccessAt: j?.lastSuccessAt ?? null,
      lastFailureAt: j?.lastFailureAt ?? null,
      now,
    })
  })
}

// ── Jobs requiring attention ────────────────────────────────────────────────
export function jobsRequiringAttention(jobs: JobLite[]) {
  return jobs
    .filter((j) => j.status === 'failed' || j.status === 'blocked' || j.status === 'not_configured' || (j.status === 'retrying' && j.retryCount >= 1))
    .map((j) => ({
      id: j.id, projectId: j.projectId, jobType: j.jobType, status: j.status,
      failureClass: j.failureClass, failureReason: j.failureReason,
      retryable: j.failureClass === 'retryable' || j.status === 'retrying',
      needsUser: j.failureClass === 'waiting_for_user_action',
      needsConfig: j.failureClass === 'waiting_for_configuration' || j.status === 'not_configured',
    }))
}

// ── Decision blockers (deduped incidents) ───────────────────────────────────
// A decision blocker is anything preventing a confident decision: a stale/failed
// source, a blocked job, or missing integration. We build raw alerts, then
// collapse them by canonical incident id so the same root problem counts once.
export function decisionBlockers(projectId: string, jobs: JobLite[], freshness: FreshnessResult[]): Incident[] {
  const alerts: RawAlert[] = []
  for (const j of jobs) {
    if (j.status === 'blocked' || j.status === 'not_configured') {
      alerts.push({ kind: 'job_blocked', scope: j.jobType, projectId, severity: 'warning', title: `${j.jobType.replace(/_/g, ' ')} is ${j.status.replace(/_/g, ' ')}`, detail: j.failureReason ?? undefined, source: 'schedules' })
    } else if (j.status === 'failed') {
      alerts.push({ kind: 'job_failed', scope: j.jobType, projectId, severity: 'critical', title: `${j.jobType.replace(/_/g, ' ')} failed`, detail: j.failureReason ?? undefined, source: 'schedules' })
    }
  }
  for (const f of freshness) {
    if (f.status === 'stale' || f.status === 'failed' || f.status === 'missing') {
      alerts.push({ kind: 'stale_source', scope: f.source, projectId, severity: f.status === 'failed' ? 'critical' : 'warning', title: `${f.source.replace(/_/g, ' ')} data is ${f.status}`, detail: f.reason, source: 'freshness' })
    }
  }
  return dedupeIncidents(alerts)
}

// ── Measuring outcomes / results ────────────────────────────────────────────
const MEASURING_STATUSES = new Set(['awaiting_data', 'too_early', 'improving', 'neutral', 'needs_review', 'declining', 'inconclusive'])
const WIN_STATUSES = new Set(['successful'])

export function measuringOutcomes(windows: MeasurementLite[]) {
  return windows
    .filter((w) => MEASURING_STATUSES.has(w.status))
    .map((w) => ({ id: w.id, projectId: w.projectId, page: w.page, keyword: w.keyword, changeType: w.changeType, status: w.status, confidence: w.confidence, reviewAt: w.reviewAt, notes: w.notes }))
}

// ── Recent wins (measured/verified only) ────────────────────────────────────
export function recentWins(windows: MeasurementLite[], sinceDays = 7, now = new Date()) {
  const since = now.getTime() - sinceDays * 24 * 3600 * 1000
  return windows
    .filter((w) => WIN_STATUSES.has(w.status) && w.updatedAt.getTime() >= since)
    .map((w) => ({ id: w.id, projectId: w.projectId, page: w.page, keyword: w.keyword, changeType: w.changeType, confidence: w.confidence, at: w.updatedAt, notes: w.notes }))
}

// ── Ready to deploy ─────────────────────────────────────────────────────────
// Fused opportunities whose capability says they can be deployed now.
const READY_CAPABILITIES = new Set(['ready_to_deploy', 'ready_for_approval'])
export function readyToDeploy(opportunities: Array<{ id: string; projectId?: string; capability: string; title: string; page: string | null; businessValue: number; recommendedFix: string }>) {
  return opportunities
    .filter((o) => READY_CAPABILITIES.has(o.capability))
    .sort((a, b) => b.businessValue - a.businessValue)
    .map((o) => ({ id: o.id, projectId: o.projectId ?? null, title: o.title, page: o.page, businessValue: o.businessValue, capability: o.capability, recommendedFix: o.recommendedFix }))
}
