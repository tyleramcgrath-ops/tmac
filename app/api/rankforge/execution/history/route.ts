import { getPrismaClient } from '@/lib/db'
import { withAuth, requireProjectAccess } from '@/lib/authorize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')
      const status = searchParams.get('status')

      if (!projectId) {
        return Response.json(
          { error: 'Missing projectId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      // First get all execution plans for this project
      const plans = await prisma.executionPlan.findMany({
        where: { projectId },
        select: { id: true },
      })

      const planIds = plans.map((p) => p.id)

      const where: any = {
        executionPlanId: { in: planIds },
      }
      if (status) {
        where.actualStatus = status
      }

      const deployments = await prisma.executionDeployment.findMany({
        where,
        include: {
          executionPlan: {
            select: {
              id: true,
              executionType: true,
              pageUrl: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      })

      // Get verification for each deployment
      const verificationsMap = new Map()
      for (const d of deployments) {
        const verification = await prisma.executionVerification.findFirst({
          where: {
            deploymentId: d.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        verificationsMap.set(d.id, verification)
      }

      const total = await prisma.executionDeployment.count({
        where,
      })

      return Response.json({
        success: true,
        total,
        limit,
        offset,
        deployments: deployments.map((d) => ({
          id: d.id,
          executionPlanId: d.executionPlanId,
          executionType: d.executionPlan.executionType,
          pageUrl: d.executionPlan.pageUrl,
          description: d.executionPlan.description,
          status: d.actualStatus,
          deployedAt: d.createdAt,
          completedAt: d.completedAt,
          deployedBy: d.deployedByUserId,
          rollbackExecuted: d.rollbackExecuted,
          verification: verificationsMap.get(d.id) || null,
        })),
      })
    } catch (error) {
      console.error('History fetch error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Failed to fetch history',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
