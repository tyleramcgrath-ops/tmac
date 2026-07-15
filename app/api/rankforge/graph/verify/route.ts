import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { verifyGraph } from '@/lib/pipeline/graph/verifier'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const body = await req.json().catch(() => ({}))
      const projectId = body.projectId
      const repair = !!body.repair

      if (!projectId) {
        return Response.json({ error: 'Missing projectId' }, { status: 400 })
      }
      await requireProjectAccess(projectId)

      const report = await verifyGraph({ projectId }, { repair })
      return Response.json({ success: true, report })
    } catch (error) {
      console.error('[graph:verify] error', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Verification failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      if (!projectId) {
        return Response.json({ error: 'Missing projectId' }, { status: 400 })
      }
      await requireProjectAccess(projectId)
      const report = await verifyGraph({ projectId }, { repair: false })
      return Response.json({ success: true, report })
    } catch (error) {
      console.error('[graph:verify] error', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Verification failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
