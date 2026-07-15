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
      const deploymentId = searchParams.get('deploymentId')
      const executionPlanId = searchParams.get('executionPlanId')

      if (!projectId) {
        return Response.json(
          { error: 'Missing projectId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      let deployment
      let plan
      if (deploymentId) {
        deployment = await prisma.executionDeployment.findUnique({
          where: { id: deploymentId },
          include: {
            executionPlan: true,
          },
        })

        if (!deployment) {
          return Response.json(
            { error: 'Deployment not found' },
            { status: 404 }
          )
        }

        plan = deployment.executionPlan
        if (plan.projectId !== projectId) {
          return Response.json(
            { error: 'Unauthorized' },
            { status: 403 }
          )
        }
      } else if (executionPlanId) {
        plan = await prisma.executionPlan.findUnique({
          where: { id: executionPlanId },
        })

        if (!plan || plan.projectId !== projectId) {
          return Response.json(
            { error: 'Execution plan not found' },
            { status: 404 }
          )
        }

        deployment = await prisma.executionDeployment.findFirst({
          where: {
            executionPlanId,
          },
          include: {
            executionPlan: true,
          },
        })

        if (!deployment) {
          return Response.json(
            { error: 'No deployment found for this execution plan' },
            { status: 404 }
          )
        }
      } else {
        return Response.json(
          { error: 'Missing deploymentId or executionPlanId' },
          { status: 400 }
        )
      }

      // Get verifications
      const verifications = await prisma.executionVerification.findMany({
        where: {
          deploymentId: deployment.id,
        },
      })

      // Get rollback snapshot
      let rollbackSnapshot = null
      if (deployment.rollbackExecuted) {
        rollbackSnapshot = await prisma.executionRollbackSnapshot.findFirst({
          where: {
            executionDeploymentId: deployment.id,
          },
        })
      }

      return Response.json({
        success: true,
        deployment: {
          id: deployment.id,
          executionPlanId: deployment.executionPlanId,
          status: deployment.actualStatus,
          deployedAt: deployment.createdAt,
          completedAt: deployment.completedAt,
          deployedBy: deployment.deployedByUserId,
          errors: deployment.errors,
          rollbackExecuted: deployment.rollbackExecuted,
          rollbackReason: deployment.rollbackReason,
          changes: deployment.changes,
          verifications: verifications.map((v) => ({
            id: v.id,
            status: v.status,
            details: v.details,
            createdAt: v.createdAt,
          })),
          rollbackSnapshot,
        },
      })
    } catch (error) {
      console.error('Status check error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Failed to check status',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
