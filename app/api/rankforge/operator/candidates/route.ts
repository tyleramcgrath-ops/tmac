import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const status = searchParams.get('status')
      const category = searchParams.get('category')
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)

      const prisma = getPrismaClient()
      const rows = await prisma.operatorCandidate.findMany({
        where: {
          projectId,
          ...(status ? { status } : {}),
          ...(category ? { category } : {}),
        },
        orderBy: { lastRecalculatedAt: 'desc' },
        take: 200,
      })
      return Response.json({ success: true, candidates: rows })
    } catch (error) {
      console.error('[operator:candidates]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Candidates lookup failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
