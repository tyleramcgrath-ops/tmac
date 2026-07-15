import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { getPrismaClient } from '@/lib/db'
import { recordOutcome } from '@/lib/operator/memory'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const body = await req.json().catch(() => ({}))
      const {
        projectId,
        memoryId,
        trafficDelta,
        ctrDelta,
        rankingDelta,
        conversionDelta,
        revenueDelta,
        windowStart,
        windowEnd,
        notes,
      } = body
      if (!projectId || !memoryId || !windowStart || !windowEnd) {
        return Response.json(
          { error: 'Missing one of: projectId, memoryId, windowStart, windowEnd' },
          { status: 400 },
        )
      }
      const { project } = await requireProjectAccess(projectId)

      const prisma = getPrismaClient()
      const memory = await prisma.operatorMemory.findUnique({ where: { id: memoryId } })
      if (!memory || memory.projectId !== projectId) {
        return Response.json({ error: 'Memory not found for project' }, { status: 404 })
      }

      const outcome = await recordOutcome({
        organizationId: project.organizationId,
        projectId,
        memoryId,
        trafficDelta,
        ctrDelta,
        rankingDelta,
        conversionDelta,
        revenueDelta,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd),
        notes,
      })
      return Response.json({ success: true, outcome })
    } catch (error) {
      console.error('[operator:outcome]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Outcome recording failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
