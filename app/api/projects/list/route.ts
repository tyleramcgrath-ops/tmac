import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organizationId') || session.organizationId

    if (!organizationId) {
      return Response.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const status = url.searchParams.get('status') || 'active'
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const order = url.searchParams.get('order') || 'desc'
    const search = url.searchParams.get('search') || ''

    const prisma = getPrismaClient()

    // Verify user has access to this organization
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session.userId,
        },
      },
    })

    if (!member) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build filter
    const filters: Record<string, any> = {
      organizationId,
    }

    if (status !== 'all') {
      filters.status = status
    }

    if (search) {
      filters.OR = [{ name: { contains: search, mode: 'insensitive' } }, { domain: { contains: search, mode: 'insensitive' } }]
    }

    // Fetch projects
    const projects = await prisma.project.findMany({
      where: filters,
      orderBy: {
        [sortBy]: order === 'asc' ? 'asc' : 'desc',
      },
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        isFavorite: true,
        monthlyVisits: true,
        valuePerVisit: true,
        createdAt: true,
        updatedAt: true,
        audits: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { siteScore: true, pageCount: true, criticalCount: true, startedAt: true },
        },
      },
    })

    const withLatest = projects.map(({ audits, ...p }: { audits: { siteScore: number; pageCount: number; criticalCount: number; startedAt: Date }[] } & Record<string, unknown>) => ({
      ...p,
      latestAudit: audits[0] ?? null,
    }))

    return Response.json({
      success: true,
      projects: withLatest,
      count: withLatest.length,
    })
  } catch (err) {
    console.error('[projects/list] Error', err)
    return Response.json(
      { error: `Failed to fetch projects: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
