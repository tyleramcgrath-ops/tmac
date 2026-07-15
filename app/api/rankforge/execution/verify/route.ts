import { verifyExecution } from '@/lib/execution/verification'
import { performRollback } from '@/lib/execution/rollback'
import { getPrismaClient } from '@/lib/db'
import { withAuth, requireProjectAccess } from '@/lib/authorize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const body = await req.json()
      const { projectId, deploymentId } = body

      if (!projectId || !deploymentId) {
        return Response.json(
          { error: 'Missing projectId or deploymentId' },
          { status: 400 }
        )
      }

      await requireProjectAccess(projectId)

      const deployment = await prisma.executionDeployment.findUnique({
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

      // Verify project access via executionPlan
      if (deployment.executionPlan.projectId !== projectId) {
        return Response.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      const plan = deployment.executionPlan

      // Get expected outputs from plan
      const expectedOutputs = (plan.expectedOutputs as Record<string, unknown>) || {}

      // Run verification checks
      const verificationResult = await verifyExecution({
        deploymentId,
        executionPlanId: deployment.executionPlanId,
        executionType: plan.executionType,
        pageUrl: plan.pageUrl,
        expectedChanges: expectedOutputs,
        maxRetries: 3,
      })

      // Save verification result
      await prisma.executionVerification.create({
        data: {
          organizationId: deployment.organizationId,
          executionPlanId: deployment.executionPlanId,
          deploymentId,
          status: verificationResult.status,
          verifyType: 'all',
          details: {
            checks: verificationResult.checks,
            summary: verificationResult.summary,
          } as any,
          passedChecks: verificationResult.checks.filter((c: any) => c.status === 'passed').map((c: any) => c.checkName),
          failedChecks: verificationResult.checks.filter((c: any) => c.status === 'failed').map((c: any) => c.checkName),
          automatedRollback: verificationResult.shouldAutoRollback,
        },
      })

      // If auto-rollback triggered, perform it
      if (verificationResult.shouldAutoRollback) {
        const rollbackResult = await performRollback({
          deploymentId,
          reason: verificationResult.rollbackReason || 'Verification failed',
        })

        // Update deployment status
        await prisma.executionDeployment.update({
          where: { id: deploymentId },
          data: {
            actualStatus: rollbackResult.success ? 'rolled_back' : 'rollback_failed',
          },
        })

        return Response.json({
          success: false,
          verificationStatus: verificationResult.status,
          autoRollback: {
            triggered: true,
            success: rollbackResult.success,
            changesReverted: rollbackResult.changesReverted,
            errors: rollbackResult.errors,
          },
          checks: verificationResult.checks,
          summary: verificationResult.summary,
        })
      }

      // Update deployment status based on verification
      await prisma.executionDeployment.update({
        where: { id: deploymentId },
        data: {
          actualStatus: verificationResult.status === 'success' ? 'verified' : 'verification_failed',
        },
      })

      return Response.json({
        success: verificationResult.status === 'success',
        verificationStatus: verificationResult.status,
        autoRollback: {
          triggered: false,
        },
        checks: verificationResult.checks,
        summary: verificationResult.summary,
      })
    } catch (error) {
      console.error('Verification error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Verification failed',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
