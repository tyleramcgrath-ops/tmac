import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { recordDecision } from '@/lib/operator/memory'
import type { MemoryStatus } from '@/lib/operator/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID: MemoryStatus[] = [
  'accepted',
  'rejected',
  'ignored',
  'deferred',
  'completed',
  'expired',
  'blocked',
]

export async function POST(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const body = await req.json().catch(() => ({}))
      const { projectId, pageUrl, recommendationType, status, reason, deferDays } = body
      if (!projectId || !pageUrl || !recommendationType || !status) {
        return Response.json(
          {
            error:
              'Missing one of: projectId, pageUrl, recommendationType, status',
          },
          { status: 400 },
        )
      }
      if (!VALID.includes(status)) {
        return Response.json({ error: `Invalid status (allowed: ${VALID.join(', ')})` }, { status: 400 })
      }
      const { project } = await requireProjectAccess(projectId)

      const memory = await recordDecision({
        organizationId: project.organizationId,
        projectId,
        pageUrl,
        recommendationType,
        status,
        reason,
        deferDays,
        decidedBy: (session as any)?.userId ?? 'user',
      })
      return Response.json({ success: true, memory })
    } catch (error) {
      console.error('[operator:decision]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Decision failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
