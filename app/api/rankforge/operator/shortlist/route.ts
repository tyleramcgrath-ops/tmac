import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { computeNextAction } from '@/lib/operator/operator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const persist = searchParams.get('persist') !== 'false'
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)
      const readout = await computeNextAction({ projectId, persistProposals: persist })
      return Response.json({ success: true, shortlist: readout.shortlist, dataAvailability: readout.dataAvailability })
    } catch (error) {
      console.error('[operator:shortlist]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Shortlist failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
