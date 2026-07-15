import { executePipeline } from '@/lib/pipeline'
import { getPrismaClient } from '@/lib/db'
import { withAuth, requireProjectAccess } from '@/lib/authorize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const body = await req.json()
      const { auditId, projectId } = body

      if (!auditId || !projectId) {
        return Response.json({ error: 'Missing auditId or projectId' }, { status: 400 })
      }

      // Verify project access
      await requireProjectAccess(projectId)

      // Verify audit belongs to project
      const audit = await prisma.audit.findFirst({
        where: {
          id: auditId,
          projectId,
        },
      })

      if (!audit) {
        return Response.json({ error: 'Audit not found' }, { status: 404 })
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return Response.json({ error: 'Project not found' }, { status: 404 })
      }

      // Check for concurrent pipeline runs
      const existingRun = await prisma.pipelineRun.findFirst({
        where: {
          auditId,
          status: { in: ['queued', 'running'] },
        },
      })

      if (existingRun) {
        return Response.json(
          { error: 'Pipeline already running for this audit', runId: existingRun.id },
          { status: 409 },
        )
      }

      // Execute pipeline
      const result = await executePipeline({
        organizationId: project.organizationId,
        projectId,
        auditId,
        skipUnchangedPages: body.skipUnchangedPages ?? true,
      })

      return Response.json({
        success: true,
        ...result,
      })
    } catch (error) {
      console.error('Pipeline execution error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Pipeline execution failed',
        },
        { status: 500 },
      )
    }
  })
  return handler(request)
}

// GET endpoint to check pipeline status
export async function GET(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const prisma = getPrismaClient()
      const { searchParams } = new URL(req.url)
      const runId = searchParams.get('runId')
      const auditId = searchParams.get('auditId')

      if (!runId && !auditId) {
        return Response.json({ error: 'Missing runId or auditId' }, { status: 400 })
      }

      // Get pipeline run status
      const run = await prisma.pipelineRun.findFirst({
        where: runId ? { id: runId } : { auditId: auditId! },
        include: {
          stages: true,
        },
      })

      if (!run) {
        return Response.json({ error: 'Pipeline run not found' }, { status: 404 })
      }

      // Verify project access
      await requireProjectAccess(run.projectId)

      return Response.json({
        success: true,
        run,
      })
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Failed to get pipeline status' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
