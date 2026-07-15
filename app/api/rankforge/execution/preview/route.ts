import { generatePreview } from '@/lib/execution/preview'
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

      const preview = await generatePreview({
        projectId,
        executionPlanId,
      })

      return Response.json({
        success: true,
        preview,
      })
    } catch (error) {
      console.error('Preview generation error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Preview generation failed',
        },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
