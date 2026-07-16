// Read the Keyword Universe for a project — the persistent, project-scoped
// keyword list with current/previous/best positions and their data source.

import { getCurrentSession } from '@/lib/session'

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

  const view = url.searchParams.get('view') ?? 'all'
  const where: Record<string, unknown> = { projectId }
  switch (view) {
    case 'top3': where.currentPosition = { lte: 3, gt: 0 }; break
    case 'top10': where.currentPosition = { lte: 10, gt: 0 }; break
    case 'top20': where.currentPosition = { lte: 20, gt: 0 }; break
    case 'page2': where.currentPosition = { gte: 11, lte: 20 }; break
    case 'cannibalized': where.status = 'cannibalized'; break
    case 'unassigned': where.targetPageUrl = null; break
    case 'questions': where.type = 'question'; break
    case 'local': where.intent = 'local'; break
    case 'branded': where.intent = 'branded'; break
  }

  const keywords = await prisma.keyword.findMany({
    where,
    orderBy: [{ currentPosition: { sort: 'asc', nulls: 'last' } }, { confidence: 'desc' }],
    take: 500,
    select: {
      id: true, keyword: true, normalizedKeyword: true, type: true, intent: true, status: true,
      confidence: true, estimatedDemand: true, targetPageUrl: true,
      currentPosition: true, previousPosition: true, bestPosition: true, rankingUrl: true,
      dataSource: true, lastCheckedAt: true, firstDiscoveredAt: true,
    },
  })

  const withChange = keywords.map((k: any) => ({
    ...k,
    change: k.currentPosition !== null && k.previousPosition !== null
      ? k.previousPosition - k.currentPosition
      : null,
  }))

  const ranked = withChange.filter((k: any) => k.currentPosition !== null)
  return Response.json({
    ok: true,
    projectId,
    total: withChange.length,
    summary: {
      total: withChange.length,
      tracked: ranked.length,
      top3: ranked.filter((k: any) => k.currentPosition <= 3).length,
      top10: ranked.filter((k: any) => k.currentPosition <= 10).length,
      top20: ranked.filter((k: any) => k.currentPosition <= 20).length,
      page2: ranked.filter((k: any) => k.currentPosition >= 11 && k.currentPosition <= 20).length,
      gainers: withChange.filter((k: any) => k.change !== null && k.change > 0).length,
      losers: withChange.filter((k: any) => k.change !== null && k.change < 0).length,
      cannibalized: withChange.filter((k: any) => k.status === 'cannibalized').length,
    },
    keywords: withChange,
  })
}
