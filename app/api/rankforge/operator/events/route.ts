import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { listEvents } from '@/lib/operator/events'
import type { OperatorEventKind } from '@/lib/operator/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const kind = searchParams.get('kind') as OperatorEventKind | null
      const sinceParam = searchParams.get('since')
      const limit = Math.min(Number(searchParams.get('limit') || 100), 500)
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)

      const events = await listEvents({
        projectId,
        kind: kind ?? undefined,
        since: sinceParam ? new Date(sinceParam) : undefined,
        limit,
      })
      return Response.json({ success: true, events })
    } catch (error) {
      console.error('[operator:events]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Events lookup failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
