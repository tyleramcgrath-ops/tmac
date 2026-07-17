import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { ensureDefaultSchedules } from '@/lib/scheduling/bootstrap'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, name, domain, monthlyVisits, valuePerVisit } = body

    if (!organizationId || !name || !domain) {
      return Response.json(
        { error: 'organizationId, name, and domain are required' },
        { status: 400 }
      )
    }

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

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return Response.json({ error: 'Only owners and admins can create projects' }, { status: 403 })
    }

    // Check if project with this domain already exists in org
    const existing = await prisma.project.findUnique({
      where: {
        organizationId_domain: {
          organizationId,
          domain,
        },
      },
    })

    if (existing) {
      return Response.json({ error: 'Project with this domain already exists' }, { status: 409 })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        organizationId,
        name,
        domain,
        monthlyVisits: monthlyVisits || 0,
        valuePerVisit: valuePerVisit || 0,
        status: 'active',
        isFavorite: false,
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
      },
    })

    // Log event
    await prisma.event.create({
      data: {
        organizationId,
        projectId: project.id,
        type: 'project',
        action: 'created',
      },
    })

    // Initialize automation immediately — no separate manual step required.
    await ensureDefaultSchedules({ prisma, organizationId, projectId: project.id, createdBy: session.userId }).catch((err) => {
      console.error('[projects/create] Failed to ensure default schedules:', err instanceof Error ? err.message : err)
    })

    return Response.json({
      success: true,
      project,
    })
  } catch (err) {
    console.error('[projects/create] Error', err)
    return Response.json(
      { error: `Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
