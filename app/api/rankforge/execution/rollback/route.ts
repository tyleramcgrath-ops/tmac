import { performRollback } from '@/lib/execution/rollback'
import { getPrismaClient } from '@/lib/db'
import { withAuth, requireProjectAccess } from '@/lib/authorize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const body = await req.json()
      const { projectId, deploymentId, reason } = body

      if (!projectId || !deploymentId) {
        return Response.json(
          { error: 'Missing projectId or deploymentId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      const deployment = await prisma.executionDeployment.findUnique({
        where: { id: deploymentId },
      })

      if (!deployment) {
        return Response.json(
          { error: 'Deployment not found' },
          { status: 404 }
        )
      }

      // Verify project access via executionPlan
      const plan = await prisma.executionPlan.findUnique({
        where: { id: deployment.executionPlanId },
      })

      if (!plan || plan.projectId !== projectId) {
        return Response.json(
          { error: 'Unauthorized access to deployment' },
          { status: 403 }
        )
      }

      const rollbackResult = await performRollback({
        deploymentId,
        reason: reason || 'Manual rollback requested',
      })

      // Update deployment status
      await prisma.executionDeployment.update({
        where: { id: deploymentId },
        data: {
          actualStatus: rollbackResult.success ? 'rolled_back' : 'rollback_failed',
          rollbackExecuted: true,
          rollbackReason: reason || 'Manual rollback requested',
        },
      })

      return Response.json({
        success: rollbackResult.success,
        deploymentId,
        rollbackStatus: rollbackResult.rollbackStatus,
        changesReverted: rollbackResult.changesReverted,
        errors: rollbackResult.errors,
        timeToRollback: rollbackResult.timeToRollback,
      })
    } catch (error) {
      console.error('Rollback error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Rollback failed',
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
      const deploymentId = searchParams.get('deploymentId')
      const projectId = searchParams.get('projectId')

      if (!projectId || !deploymentId) {
        return Response.json(
          { error: 'Missing projectId or deploymentId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      const snapshot = await prisma.executionRollbackSnapshot.findFirst({
        where: {
          executionDeploymentId: deploymentId,
        },
      })

      return Response.json({
        success: true,
        deploymentId,
        snapshot: snapshot ? {
          changeType: snapshot.changeType,
          pageUrl: snapshot.pageUrl,
          previousValue: snapshot.previousValue,
          newValue: snapshot.newValue,
          timestamp: snapshot.createdAt,
          rollbackStatus: snapshot.rollbackStatus,
        } : null,
      })
    } catch (error) {
      console.error('Get rollback snapshots error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Failed to get snapshots',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
