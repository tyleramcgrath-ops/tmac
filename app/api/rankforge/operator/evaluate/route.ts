import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { computeNextAction } from '@/lib/operator/operator'
import { logEvent } from '@/lib/operator/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Manual trigger for the Operator's background loop. Callers (crawl-completion
 * hooks, GSC sync jobs, GA4 sync jobs, competitor sync, deployment callbacks,
 * business-context edits, or a scheduler) should POST here so the shortlist,
 * candidates, memory and events are refreshed idempotently.
 *
 * Body: { projectId, trigger: "crawl_completed" | "gsc_synced" | "ga4_synced"
 *         | "competitor_updated" | "deployment_finished" | "context_updated"
 *         | "user_feedback" | "manual" | "scheduled" }
 */
export async function POST(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const body = await req.json().catch(() => ({}))
      const { projectId, trigger = 'manual' } = body
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      const { project } = await requireProjectAccess(projectId)

      const readout = await computeNextAction({ projectId, persistProposals: true })
      await logEvent({
        organizationId: project.organizationId,
        projectId,
        kind: 'mission_selected',
        summary: `Operator re-evaluated (trigger=${trigger})`,
        payload: {
          trigger,
          primary: readout.primaryRecommendation?.headline ?? null,
          shortlistSizes: {
            critical: readout.shortlist?.criticalAlerts.length ?? 0,
            nextBest: readout.shortlist?.nextBestActions.length ?? 0,
            watch: readout.shortlist?.watchList.length ?? 0,
            deferred: readout.shortlist?.deferredOpportunities.length ?? 0,
          },
        },
      })
      return Response.json({ success: true, readout })
    } catch (error) {
      console.error('[operator:evaluate]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Evaluation failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
