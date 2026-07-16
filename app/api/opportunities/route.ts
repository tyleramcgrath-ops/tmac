// SEO Opportunities Center data — one normalized, ranked opportunity list.
//
// Consolidates opportunities from the Keyword Universe (page-2, drops, lost,
// cannibalization) and the latest audit's aggregated issues, per project or
// across the whole portfolio. Every record shares the normalized shape so the
// UI can rank by business impact and flow each into the fix workflow.

import { getCurrentSession } from '@/lib/session'
import { buildOpportunities, summarizeOpportunities, type KeywordInput, type CrawlIssueInput, type Opportunity } from '@/lib/opportunities/build'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SummaryIssue { severity?: string; category?: string; title?: string; affectedPages?: number }

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
  const projectFilter = url.searchParams.get('projectId')
  const typeFilter = url.searchParams.get('type')

  const projects = await prisma.project.findMany({
    where: {
      organizationId: session.organizationId,
      status: 'active',
      ...(projectFilter ? { id: projectFilter } : {}),
    },
    select: {
      id: true, name: true, domain: true,
      keywords: {
        select: { keyword: true, currentPosition: true, previousPosition: true, status: true, targetPageUrl: true, confidence: true, intent: true },
      },
      audits: {
        orderBy: { startedAt: 'desc' }, take: 1,
        select: { summary: true },
      },
    },
  })

  const projectMeta = new Map<string, { name: string; domain: string }>()
  let all: Opportunity[] = []

  for (const p of projects) {
    projectMeta.set(p.id, { name: p.name, domain: p.domain })

    const keywords: KeywordInput[] = p.keywords.map((k: any) => ({
      keyword: k.keyword,
      currentPosition: k.currentPosition,
      previousPosition: k.previousPosition,
      status: k.status,
      targetPageUrl: k.targetPageUrl,
      confidence: k.confidence ?? 0.5,
      intent: k.intent ?? 'informational',
    }))

    // Aggregated crawl issues from the latest audit's stored summary.
    let crawlIssues: CrawlIssueInput[] = []
    const summaryRaw = p.audits[0]?.summary
    if (summaryRaw) {
      try {
        const parsed = JSON.parse(summaryRaw)
        const topIssues: SummaryIssue[] = Array.isArray(parsed?.topIssues) ? parsed.topIssues : []
        crawlIssues = topIssues
          .filter((i) => i.title && i.severity)
          .map((i) => ({
            pageUrl: null,
            severity: (i.severity === 'critical' || i.severity === 'warning' ? i.severity : 'info') as CrawlIssueInput['severity'],
            category: i.category ?? 'Technical',
            title: i.title as string,
            affectedPages: i.affectedPages,
          }))
      } catch { /* summary not parseable — skip */ }
    }

    all = all.concat(buildOpportunities({ projectId: p.id, keywords, crawlIssues }))
  }

  // Global sort across the portfolio by business value.
  all.sort((a, b) => b.businessValue - a.businessValue || b.expectedReturn - a.expectedReturn)

  const filtered = typeFilter ? all.filter((o) => o.type === typeFilter) : all

  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: summarizeOpportunities(all),
    opportunities: filtered.map((o) => ({
      ...o,
      projectName: projectMeta.get(o.projectId)?.name ?? null,
      domain: projectMeta.get(o.projectId)?.domain ?? null,
    })),
  })
}
