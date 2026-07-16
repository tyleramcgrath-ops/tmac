// Data Fusion Engine API — unified page + keyword intelligence for a project.
//
// Reads whatever signals exist (latest audit's pages, the Keyword Universe,
// and GSC/GA4 metrics if those integrations have synced) and fuses them. GSC
// and GA4 are treated as connected only when an OAuthCredential exists for the
// project AND metric rows are present; otherwise they fold in as null (not
// connected) — the engine still produces a full result.

import { getCurrentSession } from '@/lib/session'
import { fuse, type CrawlPageInput, type KeywordInput, type GscRowInput, type Ga4RowInput } from '@/lib/fusion/engine'

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
    ? await prisma.page.findMany({
        where: { auditId: latestAudit.id },
        select: {
          url: true, status: true, title: true, metaDescription: true, h1Count: true,
          contentLength: true, canonical: true, hasNoindex: true, hasMixedContent: true,
          schemaTypes: true, internalLinks: true, inboundCount: true,
          technicalScore: true, contentScore: true, schemaScore: true, aiScore: true,
        },
      })
    : []
  const pages: CrawlPageInput[] = pageRows.map((p: any) => ({
    url: p.url, status: p.status, title: p.title, metaDescription: p.metaDescription,
    h1Count: p.h1Count, contentLength: p.contentLength, canonical: p.canonical,
    hasNoindex: p.hasNoindex, hasMixedContent: p.hasMixedContent,
    schemaTypes: p.schemaTypes ? (() => { try { return JSON.parse(p.schemaTypes) } catch { return [] } })() : [],
    internalLinks: p.internalLinks, inboundCount: p.inboundCount,
    technicalScore: p.technicalScore, contentScore: p.contentScore, schemaScore: p.schemaScore, aiScore: p.aiScore,
  }))

  // Keyword Universe.
  const kwRows = await prisma.keyword.findMany({
    where: { projectId },
    select: {
      keyword: true, normalizedKeyword: true, intent: true, type: true, status: true,
      targetPageUrl: true, currentPosition: true, previousPosition: true, bestPosition: true,
      dataSource: true, confidence: true, estimatedDemand: true,
    },
  })
  const keywords: KeywordInput[] = kwRows.map((k: any) => ({
    keyword: k.keyword, normalizedKeyword: k.normalizedKeyword, intent: k.intent ?? 'informational',
    type: k.type ?? 'primary', status: k.status ?? 'tracking', targetPageUrl: k.targetPageUrl,
    currentPosition: k.currentPosition, previousPosition: k.previousPosition, bestPosition: k.bestPosition,
    dataSource: k.dataSource, confidence: k.confidence ?? 0.5, estimatedDemand: k.estimatedDemand,
  }))

  // GSC / GA4 — connected iff there's an OAuthCredential AND metric rows exist.
  const cred = await prisma.oAuthCredential.findFirst({ where: { projectId, provider: 'google' } })
  const gscRows = cred ? await prisma.googleSearchConsoleMetric.findMany({ where: { projectId } }) : []
  const ga4Rows = cred ? await prisma.googleAnalytics4Metric.findMany({ where: { projectId } }) : []

  const gsc: GscRowInput[] | null = cred && gscRows.length > 0
    ? gscRows.map((g: any) => ({ url: g.url, clicks: g.clicks, impressions: g.impressions, ctr: g.ctr, position: g.position, dataDate: g.dataDate?.toISOString() ?? null }))
    : null
  const ga4: Ga4RowInput[] | null = cred && ga4Rows.length > 0
    ? ga4Rows.map((g: any) => ({ url: g.url, sessions: g.sessions, users: g.users, engagementRate: g.engagementRate, conversions: g.conversions, revenue: g.revenue, dataDate: g.dataDate?.toISOString() ?? null }))
    : null

  const result = fuse({ projectId, domain: project.domain, pages, keywords, gsc, ga4 })

  return Response.json({
    ok: true,
    lastCrawlAt: latestAudit?.startedAt ?? null,
    ...result,
  })
}
