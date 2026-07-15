import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const statusFilter = searchParams.get('status')
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)

      const prisma = getPrismaClient()
      const rows = await prisma.operatorMemory.findMany({
        where: {
          projectId,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: 200,
        include: { outcomes: { take: 5, orderBy: { createdAt: 'desc' } } },
      })
      return Response.json({ success: true, memory: rows })
    } catch (error) {
      console.error('[operator:memory]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Memory lookup failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
