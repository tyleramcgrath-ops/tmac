// Scan lifecycle + persistence (A6).
//
// The crawl runs client-side (batched /api/crawl loop). To guarantee results
// survive a browser close, the client:
//   1. POST {action:'start'}                 -> creates a 'running' scan, returns id
//   2. POST {action:'complete', scanId, ...} -> finalizes to completed/partial,
//                                               derives + persists recommendations
//   3. POST {action:'fail', scanId, error}   -> marks the scan 'failed' honestly
// A single-shot POST with pages (no action) is also accepted for convenience
// and stored as completed/partial in one call.
//
// The server recomputes nothing — it stores the verifiable crawl payload and
// derives evidence-backed recommendations from it.

import { randomUUID } from 'crypto'
import { audit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { generateRecommendationsFromScan, persistScanRecommendations } from '@/lib/foundation/recommendations'
import { getStore } from '@/lib/foundation/store'
import type { Scan } from '@/lib/foundation/types'

export const runtime = 'nodejs'

interface PageLike {
  overall?: number
}

function emptyScan(projectId: string, userId: string): Scan {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    projectId,
    createdBy: userId,
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

function finalize(scan: Scan, body: Record<string, unknown>, userId: string): Scan {
  const pages = Array.isArray(body.pages) ? body.pages : []
  const blocked = Array.isArray(body.blocked) ? body.blocked : []
  const typed = pages as PageLike[]
  const siteScore = Math.round(typed.reduce((n, p) => n + (p.overall ?? 0), 0) / Math.max(1, typed.length))
  return {
    ...scan,
    createdBy: scan.createdBy || userId,
    status: blocked.length > 0 ? 'partial' : 'completed',
    completedAt: new Date().toISOString(),
    error: null,
    summary: {
      pagesCrawled: pages.length,
      urlsDiscovered: Number(body.discovered ?? pages.length),
      blockedCount: blocked.length,
      siteScore,
      // Severity counts are filled from the recommendation engine below — the
      // SINGLE issue-evaluation source (Phase D.6 P3) — so the audit headline
      // can never disagree with the recommendations list. Placeholder here.
      critical: 0,
      warning: 0,
      info: 0,
    },
    pages,
    blocked,
  }
}

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'start') {
    const scan = emptyScan(projectId, user.id)
    await store.createScan(scan)
    await audit(project.orgId, user.id, 'scan.start', scan.id, project.domain)
    return Response.json({ scan: { id: scan.id, status: scan.status, createdAt: scan.createdAt } }, { status: 201 })
  }

  if (action === 'fail') {
    const scan = await store.getScan(String(body.scanId ?? ''))
    if (!scan || scan.projectId !== projectId) throw new HttpError(404, 'Scan not found.')
    scan.status = 'cancelled' === body.reason ? 'cancelled' : 'failed'
    scan.error = String(body.error ?? 'The crawl failed.').slice(0, 500)
    scan.completedAt = new Date().toISOString()
    await store.updateScan(scan)
    await audit(project.orgId, user.id, 'scan.fail', scan.id, scan.error)
    return Response.json({ scan: { id: scan.id, status: scan.status, error: scan.error } })
  }

  // 'complete' (finalize an existing running scan) or single-shot (no scanId).
  const pages = Array.isArray(body.pages) ? body.pages : []
  if (pages.length === 0) throw new HttpError(400, 'A scan needs at least one crawled page.')
  if (pages.length > 1000) throw new HttpError(413, 'Scan payload too large.')

  let scan: Scan
  let isUpdate = false
  if (body.scanId) {
    const existing = await store.getScan(String(body.scanId))
    if (!existing || existing.projectId !== projectId) throw new HttpError(404, 'Scan not found.')
    scan = finalize(existing, body, user.id)
    isUpdate = true
  } else {
    scan = finalize(emptyScan(projectId, user.id), body, user.id)
  }

  // V2 engine: page-type-aware, business-aware, with a self-evaluation. This is
  // the SINGLE issue-evaluation pipeline (Phase D.6 P3) — the audit summary's
  // severity counts are derived from the SAME recommendations shown in the
  // Recommendations list, so the two can never disagree.
  const { recommendations, selfEvaluation } = generateRecommendationsFromScan(scan, {
    industry: project.industry,
    businessProfile: project.businessProfile,
    goals: project.goals,
  })
  const sevCount = (sev: string) => recommendations.filter((r) => r.severity === sev).length
  scan.summary.critical = sevCount('critical')
  scan.summary.warning = sevCount('warning')
  scan.summary.info = sevCount('info')

  // Persist the scan with the reco-derived counts.
  if (isUpdate) await store.updateScan(scan)
  else await store.createScan(scan)

  // Stable-identity upsert (P1): preserve prior triage/history across rescans.
  const { created, updated } = await persistScanRecommendations(store, projectId, recommendations)
  await audit(
    project.orgId,
    user.id,
    'scan.complete',
    scan.id,
    `${scan.status}: ${pages.length} pages, ${recommendations.length} recs (${created} new, ${updated} updated), ${selfEvaluation.needsHumanReview} need review`
  )

  return Response.json(
    {
      scan: { id: scan.id, status: scan.status, createdAt: scan.createdAt, summary: scan.summary },
      recommendationCount: recommendations.length,
      selfEvaluation,
    },
    { status: 201 }
  )
})

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const url = new URL(request.url)
  const scanId = url.searchParams.get('id')
  if (scanId) {
    const scan = await store.getScan(scanId)
    if (!scan || scan.projectId !== projectId) {
      return Response.json({ error: 'Scan not found.' }, { status: 404 })
    }
    return Response.json({ scan })
  }
  const scans = await store.listScans(projectId, 20)
  return Response.json({
    scans: scans.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
      error: s.error,
      summary: s.summary,
    })),
  })
})
