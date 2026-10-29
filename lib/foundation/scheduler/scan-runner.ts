// Scheduled job handler (RankForge): `scheduled_scan` drives a REAL server-side
// re-crawl of the project's domain, then refreshes recommendations + agent
// consensus from it — the interactive and scheduled paths converge on the same
// evidence-backed pipeline (generateRecommendationsFromScan /
// persistScanRecommendations / coordinateProject).
//
// The crawl itself is stateless + batched (lib/engine/crawl-batch.ts), exactly
// like the interactive client-driven crawl, but called in-process — there is no
// browser origin server-side. A single job invocation runs ONE bounded batch
// (a handful of pages, capped by wall-clock inside runCrawlBatch); if the crawl
// isn't done, the handler re-enqueues itself with the crawl cursor
// (visited/frontier) in the job payload, so a full site crawl completes across
// several cron ticks without ever exceeding a function's maxDuration. This is
// the server-side re-crawl driver described in SCHEDULER_DESIGN.md §6.
//
// Honest by construction: a scan is only ever marked completed/partial once a
// crawl round actually finishes; a hard crawl failure (e.g. the homepage is
// blocked) fails the job with the real reason and never leaves behind a
// fabricated "completed" scan.

import { randomUUID } from 'crypto'
import type { FoundationStore } from '../store'
import type { Job, Scan } from '../types'
import { generateRecommendationsFromScan, persistScanRecommendations } from '../recommendations'
import { coordinateProject } from '../agents/service'
import { isCrawlBatchError, runCrawlBatch } from '../../engine/crawl-batch'
import { makeJob } from './engine'
import { notifyRegressions } from './regression-alert'

// Marks scans/recommendations produced by the scheduler rather than a human
// click, for auditability (e.g. shown as "Automatic" in history).
export const SCHEDULER_ACTOR = 'system:scheduler'

interface ScanCursorPayload {
  scanId?: string
  visited?: string[]
  frontier?: string[]
  maxPages?: number
}

function emptyScan(projectId: string): Scan {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    projectId,
    createdBy: SCHEDULER_ACTOR,
    createdAt: now,
    status: 'running',
    startedAt: now,
    completedAt: null,
    error: null,
    summary: { pagesCrawled: 0, urlsDiscovered: 0, blockedCount: 0, siteScore: 0, critical: 0, warning: 0, info: 0 },
    pages: [],
    blocked: [],
  }
}

export async function runScheduledScan(store: FoundationStore, job: Job): Promise<Record<string, unknown>> {
  const project = await store.getProject(job.projectId)
  if (!project) throw new Error(`Project ${job.projectId} not found`)

  const payload = job.payload as ScanCursorPayload
  const maxPages = payload.maxPages ?? 150

  const batch = await runCrawlBatch({
    url: project.domain,
    maxPages,
    visited: payload.visited,
    frontier: payload.frontier,
  })

  if (isCrawlBatchError(batch)) {
    // Hard failure this round (e.g. homepage blocked). If a scan was already
    // in progress (a continuation), mark it honestly failed; otherwise no
    // scan record is created at all — never fabricate one for a crawl that
    // never produced a page.
    if (payload.scanId) {
      const existing = await store.getScan(payload.scanId)
      if (existing) {
        await store.updateScan({ ...existing, status: 'failed', error: batch.error, completedAt: new Date().toISOString() })
      }
    }
    throw new Error(batch.error)
  }

  const scan: Scan = payload.scanId
    ? await requireScan(store, payload.scanId)
    : emptyScan(project.id)
  if (!payload.scanId) await store.createScan(scan)

  const pages = [...(scan.pages as unknown[]), ...batch.pages]
  const blocked = [...(scan.blocked as unknown[]), ...batch.blocked]

  if (!batch.done) {
    await store.updateScan({ ...scan, pages, blocked })
    await store.enqueueJob(
      makeJob({
        orgId: job.orgId,
        projectId: job.projectId,
        kind: 'scheduled_scan',
        runAt: new Date(),
        payload: { scanId: scan.id, visited: batch.visited, frontier: batch.frontier, maxPages },
        now: new Date(),
      })
    )
    return { continued: true, scanId: scan.id, pagesSoFar: pages.length }
  }

  // Crawl complete — finalize exactly like the interactive completion path
  // (app/api/projects/[projectId]/scans/route.ts `finalize`), so scheduled and
  // manual scans produce identical, evidence-backed output.
  const typed = pages as { overall?: number }[]
  const siteScore = Math.round(typed.reduce((n, p) => n + (p.overall ?? 0), 0) / Math.max(1, typed.length))
  const finalized: Scan = {
    ...scan,
    status: blocked.length > 0 ? 'partial' : 'completed',
    completedAt: new Date().toISOString(),
    error: null,
    summary: {
      pagesCrawled: pages.length,
      urlsDiscovered: batch.discovered,
      blockedCount: blocked.length,
      siteScore,
      critical: 0,
      warning: 0,
      info: 0,
    },
    pages,
    blocked,
  }

  const { recommendations, selfEvaluation } = generateRecommendationsFromScan(finalized, {
    industry: project.industry,
    businessProfile: project.businessProfile,
    goals: project.goals,
  })
  const sevCount = (sev: string) => recommendations.filter((r) => r.severity === sev).length
  finalized.summary.critical = sevCount('critical')
  finalized.summary.warning = sevCount('warning')
  finalized.summary.info = sevCount('info')

  await store.updateScan(finalized)
  const { created, updated, regressed } = await persistScanRecommendations(store, project.id, recommendations)
  await coordinateProject(store, project)
  // Regression alert (monitoring, not just passive detection): only the
  // scheduled path emails — a human running an interactive audit already sees
  // the result immediately in the dashboard, no alert needed.
  if (regressed.length > 0) await notifyRegressions(store, project, regressed)

  return {
    scanId: finalized.id,
    status: finalized.status,
    pages: pages.length,
    blocked: blocked.length,
    recommendations: recommendations.length,
    created,
    updated,
    regressed: regressed.length,
    needsHumanReview: selfEvaluation.needsHumanReview,
  }
}

async function requireScan(store: FoundationStore, scanId: string): Promise<Scan> {
  const scan = await store.getScan(scanId)
  if (!scan) throw new Error(`Scan ${scanId} not found (continuation)`)
  return scan
}
