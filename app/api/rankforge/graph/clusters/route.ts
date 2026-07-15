import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { detectClusters } from '@/lib/pipeline/graph/clusters'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)
      const report = await detectClusters({ projectId })
      return Response.json({ success: true, report })
    } catch (error) {
      console.error('[graph:clusters] error', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Cluster detection failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
