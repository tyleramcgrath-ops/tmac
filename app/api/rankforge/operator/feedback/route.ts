import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { adjustPreference } from '@/lib/operator/preferences'
import { logEvent } from '@/lib/operator/events'
import { canonicalizeActionType } from '@/lib/operator/consolidate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FEEDBACK_TO_SIGNAL: Record<string, 'accept' | 'reject' | 'defer' | 'ignore'> = {
  helpful: 'accept',
  not_helpful: 'reject',
  wrong_priority: 'reject',
  wrong_page: 'reject',
  wrong_estimate: 'ignore',
  already_completed: 'ignore',
  too_risky: 'defer',
  not_relevant: 'reject',
  needs_more_evidence: 'defer',
}

export async function POST(request: Request) {
  const handler = await withAuth(async (session, req) => {
    try {
      const body = await req.json().catch(() => ({}))
      const { projectId, recommendationType, feedback, note } = body
      if (!projectId || !recommendationType || !feedback) {
        return Response.json(
          { error: 'Missing one of: projectId, recommendationType, feedback' },
          { status: 400 },
        )
      }
      const signal = FEEDBACK_TO_SIGNAL[feedback]
      if (!signal) {
        return Response.json(
          {
            error: `Unknown feedback (allowed: ${Object.keys(FEEDBACK_TO_SIGNAL).join(', ')})`,
          },
          { status: 400 },
        )
      }
      const { project } = await requireProjectAccess(projectId)

      const category = canonicalizeActionType(recommendationType)
      await adjustPreference({
        organizationId: project.organizationId,
        projectId,
        userId: (session as any)?.userId ?? null,
        category,
        signal,
        detail: { feedback, note },
      })

      await logEvent({
        organizationId: project.organizationId,
        projectId,
        kind: 'learning_adjustment_made',
        summary: `User feedback "${feedback}" on ${recommendationType}`,
        payload: { feedback, note, signal, category },
      })

      return Response.json({ success: true })
    } catch (error) {
      console.error('[operator:feedback]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Feedback failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
