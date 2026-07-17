// Data Fusion Engine API — unified page + keyword intelligence for a project.
//
// Reads whatever signals exist (latest audit's pages, the Keyword Universe,
// and GSC/GA4 metrics if those integrations have synced) and fuses them. GSC
// and GA4 are treated as connected only when an OAuthCredential exists for the
// project AND metric rows are present; otherwise they fold in as null (not
// connected) — the engine still produces a full result.

import { getCurrentSession } from '@/lib/session'
import { gatherProjectFusion, mapPageRows, mapKeywordRows, PAGE_SELECT, KEYWORD_SELECT } from '@/lib/fusion/gather'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  let prisma: any
  try {
    const { getPrismaClient } = await import('@/lib/db')
    prisma = getPrismaClient()
  } catch {
    return Response.json({ error: 'Database is not configured.' }, { status: 503 })
  }

  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  if (!projectId) return Response.json({ error: 'Missing projectId.' }, { status: 400 })

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project || project.organizationId !== session.organizationId) {
    return Response.json({ error: 'Project not found.' }, { status: 404 })
  }

  // Latest audit's pages.
  const latestAudit = await prisma.audit.findFirst({
    where: { projectId }, orderBy: { startedAt: 'desc' },
    select: { id: true, startedAt: true },
  })
  const pageRows = latestAudit
    ? await prisma.page.findMany({ where: { auditId: latestAudit.id }, select: PAGE_SELECT })
    : []
  const pages = mapPageRows(pageRows)

  // Keyword Universe.
  const kwRows = await prisma.keyword.findMany({ where: { projectId }, select: KEYWORD_SELECT })
  const keywords = mapKeywordRows(kwRows)

  // GSC / GA4 fused — connected iff there's an OAuthCredential AND metric rows exist.
  const { fusion: result } = await gatherProjectFusion({
    prisma, projectId, domain: project.domain, pages, keywords,
    crawlLastSuccessAt: latestAudit?.startedAt ?? null, projectUpdatedAt: project.updatedAt, now: new Date(),
  })

  return Response.json({
    ok: true,
    lastCrawlAt: latestAudit?.startedAt ?? null,
    ...result,
  })
}
