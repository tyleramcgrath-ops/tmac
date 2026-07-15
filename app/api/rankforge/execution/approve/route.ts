import { getPrismaClient } from '@/lib/db'
import { withAuth, requireProjectAccess } from '@/lib/authorize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const body = await req.json()
      const { projectId, executionPlanId } = body

      if (!projectId || !executionPlanId) {
        return Response.json(
          { error: 'Missing projectId or executionPlanId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      const plan = await prisma.executionPlan.findUnique({
        where: { id: executionPlanId },
      })

      if (!plan || plan.projectId !== projectId) {
        return Response.json(
          { error: 'Execution plan not found' },
          { status: 404 }
        )
      }

      if (plan.status !== 'pending') {
        return Response.json(
          { error: `Plan is ${plan.status}, cannot approve` },
          { status: 409 }
        )
      }

      // Create approval record
      const approval = await prisma.executionApproval.create({
        data: {
          organizationId: plan.organizationId,
          executionPlanId,
          approverUserId: session.user.id,
          status: 'approved',
          approvedAt: new Date(),
        },
      })

      // Update plan status
      await prisma.executionPlan.update({
        where: { id: executionPlanId },
        data: {
          status: 'approved',
        },
      })

      return Response.json({
        success: true,
        approvalId: approval.id,
        executionPlanId,
        approvedAt: approval.approvedAt,
        approvedBy: session.user.id,
      })
    } catch (error) {
      console.error('Approval error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Approval failed',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}

export async function GET(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const executionPlanId = searchParams.get('executionPlanId')

      if (!projectId) {
        return Response.json(
          { error: 'Missing projectId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      const where: any = {}
      if (executionPlanId) {
        where.executionPlanId = executionPlanId
      } else {
        // Get all approvals for execution plans in this project
        const plans = await prisma.executionPlan.findMany({
          where: { projectId },
          select: { id: true },
        })
        where.executionPlanId = { in: plans.map((p) => p.id) }
      }

      const approvals = await prisma.executionApproval.findMany({
        where,
        include: {
          approverUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          approvedAt: 'desc',
        },
      })

      return Response.json({
        success: true,
        approvals: approvals.map((a) => ({
          id: a.id,
          executionPlanId: a.executionPlanId,
          approvedAt: a.approvedAt,
          approverUser: a.approverUser,
          status: a.status,
        })),
      })
    } catch (error) {
      console.error('Get approvals error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Failed to get approvals',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
