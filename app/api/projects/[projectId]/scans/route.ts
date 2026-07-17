// Persist a completed crawl as a Scan and derive stored, evidence-backed
// recommendations from it (A8). The client runs the batched /api/crawl loop
// and posts the final result here; the server recomputes nothing but stores
// the verifiable payload plus derived recommendations with provenance.

import { randomUUID } from 'crypto'
import { audit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { buildRecommendationsFromScan } from '@/lib/foundation/recommendations'
import { getStore } from '@/lib/foundation/store'
import type { Scan } from '@/lib/foundation/types'

export const runtime = 'nodejs'

interface PageLike {
  overall?: number
  fixes?: { severity: string }[]
}

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const pages = Array.isArray(body.pages) ? body.pages : []
  const blocked = Array.isArray(body.blocked) ? body.blocked : []
  if (pages.length === 0) {
    return Response.json({ error: 'A scan needs at least one crawled page.' }, { status: 400 })
  }
  if (pages.length > 1000) {
    return Response.json({ error: 'Scan payload too large.' }, { status: 413 })
  }

  const typedPages = pages as PageLike[]
  const severityCount = (sev: string) =>
    typedPages.reduce((n, p) => n + (p.fixes ?? []).filter((f) => f.severity === sev).length, 0)
  const siteScore = Math.round(
    typedPages.reduce((n, p) => n + (p.overall ?? 0), 0) / Math.max(1, typedPages.length)
  )

  const scan: Scan = {
    id: randomUUID(),
    projectId,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    summary: {
      pagesCrawled: pages.length,
      urlsDiscovered: Number(body.discovered ?? pages.length),
      blockedCount: blocked.length,
      siteScore,
      critical: severityCount('critical'),
      warning: severityCount('warning'),
      info: severityCount('info'),
    },
    pages,
    blocked,
  }

  const store = await getStore()
  await store.createScan(scan)
  const recommendations = buildRecommendationsFromScan(scan)
  await store.createRecommendations(recommendations)
  await audit(project.orgId, user.id, 'scan.create', scan.id, `${pages.length} pages, ${recommendations.length} recommendations`)

  return Response.json(
    { scan: { id: scan.id, createdAt: scan.createdAt, summary: scan.summary }, recommendationCount: recommendations.length },
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
    scans: scans.map((s) => ({ id: s.id, createdAt: s.createdAt, summary: s.summary })),
  })
})
