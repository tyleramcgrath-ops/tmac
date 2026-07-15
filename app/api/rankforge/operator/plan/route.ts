import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { computeFocusPlan } from '@/lib/operator/operator'
import type { FocusWindow } from '@/lib/operator/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const VALID: FocusWindow[] = ['15m', '30m', '1h', 'half-day', 'full-day']

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const window = searchParams.get('window') as FocusWindow | null
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      if (!window || !VALID.includes(window)) {
        return Response.json(
          { error: `Missing/invalid window (allowed: ${VALID.join(', ')})` },
          { status: 400 },
        )
      }
      await requireProjectAccess(projectId)
      const plan = await computeFocusPlan({ projectId, window })
      return Response.json({ success: true, plan })
    } catch (error) {
      console.error('[operator:plan]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Focus plan failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
