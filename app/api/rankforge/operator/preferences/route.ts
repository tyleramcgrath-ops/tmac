import { withAuth, requireProjectAccess } from '@/lib/authorize'
import {
  inspectPreferences,
  resetPreferences,
} from '@/lib/operator/preferences'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)
      const preferences = await inspectPreferences(projectId, (session as any)?.userId ?? null)
      return Response.json({ success: true, preferences })
    } catch (error) {
      console.error('[operator:preferences]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Preferences lookup failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}

export async function DELETE(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const category = searchParams.get('category') ?? undefined
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)
      const result = await resetPreferences({
        projectId,
        userId: (session as any)?.userId ?? null,
        category,
      })
      return Response.json({ success: true, deleted: result.count })
    } catch (error) {
      console.error('[operator:preferences]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Reset failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
