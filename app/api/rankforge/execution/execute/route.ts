import { executeOnWordPress } from '@/lib/execution/wordpress/executor'
import { getPrismaClient } from '@/lib/db'
import { withAuth, requireProjectAccess } from '@/lib/authorize'
import type { ExecutionType } from '@/lib/execution/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const body = await req.json()
      const { projectId, executionPlanId, skipApprovalCheck, auth } = body

      if (!projectId || !executionPlanId) {
        return Response.json(
          { error: 'Missing projectId or executionPlanId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      const plan = await prisma.executionPlan.findUnique({
        where: { id: executionPlanId },
        include: {
          approvals: {
            where: { status: 'approved' },
          },
        },
      })

      if (!plan || plan.projectId !== projectId) {
        return Response.json(
          { error: 'Execution plan not found' },
          { status: 404 }
        )
      }

      if (!skipApprovalCheck && plan.approvals.length === 0) {
        return Response.json(
          { error: 'Execution plan requires approval before execution' },
          { status: 403 }
        )
      }

      if (!['draft', 'pending_approval', 'approved'].includes(plan.status)) {
        return Response.json(
          { error: `Cannot execute plan with status: ${plan.status}` },
          { status: 409 }
        )
      }

      // Check if already deployed
      const existingDeployment = await prisma.executionDeployment.findFirst({
        where: {
          executionPlanId,
          actualStatus: { in: ['queued', 'in_progress', 'success'] },
        },
      })

      if (existingDeployment) {
        return Response.json(
          {
            error: 'Execution plan already deployed or in progress',
            deploymentId: existingDeployment.id,
          },
          { status: 409 }
        )
      }

      // Get changes from expectedOutputs
      const expectedOutputs = (plan.expectedOutputs as Record<string, unknown>) || {}
      const detectedPlugins = (Array.isArray(body.detectedPlugins) ? body.detectedPlugins : []) as string[]

      // Execute on WordPress if auth is provided
      if (!auth) {
        return Response.json(
          { error: 'WordPress authentication required for execution' },
          { status: 400 }
        )
      }

      const wpResult = await executeOnWordPress({
        pageUrl: plan.pageUrl,
        postId: undefined,
        executionType: plan.executionType as ExecutionType,
        changes: expectedOutputs,
        auth,
        detectedPlugins: detectedPlugins as any[],
        dryRun: false,
      })

      // Create deployment record with initial changes
      const deployment = await prisma.executionDeployment.create({
        data: {
          executionPlanId,
          organizationId: plan.organizationId,
          deployedByUserId: session.user.id,
          actualStatus: wpResult.success ? 'success' : 'failed',
          changes: wpResult.changes as any,
          errors: wpResult.errors,
          warnings: wpResult.warnings,
          completedAt: new Date(),
        },
      })

      // Create rollback snapshot if deployment succeeded
      if (wpResult.success && wpResult.changes.length > 0) {
        const firstChange = wpResult.changes[0]
        await prisma.executionRollbackSnapshot.create({
          data: {
            organizationId: plan.organizationId,
            executionDeploymentId: deployment.id,
            previousValue: firstChange.previousValue as any,
            newValue: firstChange.newValue as any,
            changeType: firstChange.field,
            pageUrl: wpResult.pageUrl,
          },
        })
      }

      // Update plan status
      await prisma.executionPlan.update({
        where: { id: executionPlanId },
        data: {
          status: wpResult.success ? 'completed' : 'failed',
        },
      })

      return Response.json({
        success: wpResult.success,
        deploymentId: deployment.id,
        pageUrl: wpResult.pageUrl,
        changes: wpResult.changes,
        errors: wpResult.errors,
        warnings: wpResult.warnings,
      })
    } catch (error) {
      console.error('Execution error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Execution failed',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
