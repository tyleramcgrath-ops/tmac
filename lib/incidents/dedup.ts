// Incident deduplication — the same underlying problem often surfaces through
// several signals (a stale source shows up as a freshness alert, a blocked job,
// AND a decision blocker). Counting it five times inflates the noise and buries
// the real count. We collapse raw alerts into canonical incidents keyed by a
// stable id so one problem is one incident.

export type IncidentSeverity = 'critical' | 'warning' | 'info'

export interface RawAlert {
  // What kind of problem — e.g. 'stale_source', 'job_failed', 'job_blocked',
  // 'decision_blocker', 'deploy_regression', 'measurement_declining'.
  kind: string
  // The scope the problem attaches to — a source name, job type, page url, etc.
  scope: string
  projectId: string
  severity: IncidentSeverity
  title: string
  detail?: string
  // Optional: which surface raised it (for provenance).
  source?: string
}

export interface Incident {
  id: string // canonical, stable
  kind: string
  scope: string
  projectId: string
  severity: IncidentSeverity
  title: string
  detail?: string
  // How many raw alerts collapsed into this incident, and from where.
  occurrences: number
  sources: string[]
}

// Some kinds are really the same incident even when raised under different kind
// labels. We normalize those to a single canonical kind so, e.g., a stale GSC
// source and a blocked gsc_sync job dedupe together.
const KIND_ALIASES: Record<string, string> = {
  job_blocked: 'source_unavailable',
  job_failed: 'source_unavailable',
  stale_source: 'source_unavailable',
  missing_source: 'source_unavailable',
}

// Map a job type to the source it feeds, so a blocked job and a stale source on
// the same underlying data collapse to the same scope.
const JOB_TO_SCOPE: Record<string, string> = {
  gsc_sync: 'gsc', ga4_sync: 'ga4', crawl: 'crawl',
  priority_rankings: 'rankings', full_rankings: 'rankings',
  fusion: 'fusion', opportunities: 'opportunities',
  portfolio_priority: 'portfolio_priority', daily_mission: 'daily_mission',
}

function canonicalKind(kind: string): string {
  return KIND_ALIASES[kind] ?? kind
}

function canonicalScope(scope: string): string {
  return JOB_TO_SCOPE[scope] ?? scope
}

export function canonicalIncidentId(projectId: string, kind: string, scope: string): string {
  return `${projectId}:${canonicalKind(kind)}:${canonicalScope(scope)}`
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = { critical: 3, warning: 2, info: 1 }

/**
 * Collapse raw alerts into canonical incidents. When multiple alerts share an
 * id, we keep the highest severity, the most descriptive title, sum occurrences,
 * and union the reporting sources.
 */
export function dedupeIncidents(alerts: RawAlert[]): Incident[] {
  const byId = new Map<string, Incident>()
  for (const a of alerts) {
    const id = canonicalIncidentId(a.projectId, a.kind, a.scope)
    const existing = byId.get(id)
    if (!existing) {
      byId.set(id, {
        id, kind: canonicalKind(a.kind), scope: canonicalScope(a.scope), projectId: a.projectId,
        severity: a.severity, title: a.title, detail: a.detail,
        occurrences: 1, sources: a.source ? [a.source] : [],
      })
      continue
    }
    existing.occurrences++
    if (a.source && !existing.sources.includes(a.source)) existing.sources.push(a.source)
    if (SEVERITY_RANK[a.severity] > SEVERITY_RANK[existing.severity]) {
      existing.severity = a.severity
      existing.title = a.title
      existing.detail = a.detail
    }
  }
  return [...byId.values()].sort((x, y) => SEVERITY_RANK[y.severity] - SEVERITY_RANK[x.severity] || y.occurrences - x.occurrences)
}
