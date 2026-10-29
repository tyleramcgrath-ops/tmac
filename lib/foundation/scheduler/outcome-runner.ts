// Outcome-measurement flywheel (SCHEDULER_DESIGN.md §11): did a deployed fix
// actually move Search Console metrics for the affected URL? Runs ~14 days
// after a verified WordPress deployment (enqueued by wp-execution.ts),
// compares two 14-day windows straddling the deployment, and stores the
// delta on the deployment record.
//
// Honest by construction: no Search Console connection, an
// unauthorized/expired credential, or a permanent API error never fabricates
// a reading — it's recorded as `skipped` with the real reason. A transient
// failure (rate-limited, a momentary network error) instead throws so the
// job's normal retry/backoff applies; only once retries are exhausted does it
// fall back to an honest skip, so the deployment always ends up with SOME
// recorded outcome rather than silently staying unset forever.

import type { FoundationStore } from '../store'
import type { DeploymentOutcome, DeploymentOutcomeWindow, Job } from '../types'
import { connectedProviderSet, type ProviderSet } from '../external/service'
import type { ProviderOutcome } from '../external/types'
import type { GscPageMetrics } from '../external/providers/search-console'

const WINDOW_MS = 14 * 24 * 3600 * 1000

function ymd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function toWindow(m: GscPageMetrics): DeploymentOutcomeWindow {
  return { from: m.range.from, to: m.range.to, clicks: m.clicks, impressions: m.impressions, ctr: m.ctr, position: m.position }
}

export type ResolveProviders = (
  store: FoundationStore,
  projectId: string,
  project: { domain: string },
  nowMs: number
) => Promise<Pick<ProviderSet, 'searchConsole'>>

export async function runOutcomeCapture(
  store: FoundationStore,
  job: Job,
  opts: { resolveProviders?: ResolveProviders } = {}
): Promise<Record<string, unknown>> {
  const resolveProviders = opts.resolveProviders ?? connectedProviderSet
  const deploymentId = String(job.payload.deploymentId ?? '')
  const dep = await store.getWpDeployment(deploymentId)
  if (!dep) throw new Error(`Deployment ${deploymentId} not found`)

  const project = await store.getProject(dep.projectId)
  if (!project) throw new Error(`Project ${dep.projectId} not found`)

  const anchorMs = new Date(dep.approvedAt).getTime()
  const nowMs = Date.now()
  const providers = await resolveProviders(store, project.id, project, nowMs)

  const before = await providers.searchConsole.fetchPageMetrics(dep.postUrl, ymd(anchorMs - WINDOW_MS), ymd(anchorMs))
  const after = await providers.searchConsole.fetchPageMetrics(dep.postUrl, ymd(anchorMs), ymd(anchorMs + WINDOW_MS))
  const capturedAt = new Date(nowMs).toISOString()

  const failed: ProviderOutcome<GscPageMetrics> | null = !before.ok ? before : !after.ok ? after : null
  if (failed && !failed.ok) {
    // 'disconnected' is permanent for this window — retrying changes nothing.
    // Anything else is potentially transient; retry until attempts run out,
    // then fall back to an honest, permanent skip so the deployment always
    // ends up with a recorded outcome.
    const isLastAttempt = job.attempts >= job.maxAttempts
    if (failed.reason !== 'disconnected' && !isLastAttempt) {
      throw new Error(`outcome_capture: ${failed.reason} — ${failed.detail}`)
    }
    const outcome: DeploymentOutcome = { capturedAt, skipped: true, reason: `${failed.reason}: ${failed.detail}` }
    await store.updateWpDeployment({ ...dep, outcome })
    return { deploymentId: dep.id, captured: false, reason: outcome.reason }
  }

  // TS can't see the narrowing above across two `before`/`after` outcomes; the
  // `failed` check guarantees both are ok here.
  const beforeOk = before as Extract<typeof before, { ok: true }>
  const afterOk = after as Extract<typeof after, { ok: true }>

  const outcome: DeploymentOutcome = {
    capturedAt,
    skipped: false,
    before: toWindow(beforeOk.data),
    after: toWindow(afterOk.data),
    delta: {
      clicks: afterOk.data.clicks - beforeOk.data.clicks,
      impressions: afterOk.data.impressions - beforeOk.data.impressions,
      ctr: afterOk.data.ctr - beforeOk.data.ctr,
      position: afterOk.data.position - beforeOk.data.position,
    },
  }
  await store.updateWpDeployment({ ...dep, outcome })
  return { deploymentId: dep.id, captured: true, delta: outcome.delta }
}
