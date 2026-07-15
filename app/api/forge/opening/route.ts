import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { computeNextAction } from '@/lib/operator/operator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Forge Opening — the proactive line Forge should show when the user lands
 * on the app. Sourced from the Operator, not from an LLM guess. Returns:
 *
 *   { openingLine: string, primary: <recommendation>, alternatives: [...] }
 *
 * The client should render `openingLine` verbatim and let the user tap it
 * to expand into full reasoning.
 */
export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      if (!projectId) return Response.json({ error: 'Missing projectId' }, { status: 400 })
      await requireProjectAccess(projectId)

      const readout = await computeNextAction({ projectId, persistProposals: true })
      const primary = readout.primaryRecommendation

      let openingLine: string
      if (!primary) {
        openingLine = readout.narrative
      } else {
        openingLine = `I found something. ${primary.headline}. ${primary.reasoning.whyNow}.`
        if (readout.alternatives.length > 0) {
          openingLine += ` I have ${readout.alternatives.length} other idea${readout.alternatives.length === 1 ? '' : 's'} if this isn't the one.`
        }
      }

      return Response.json({
        success: true,
        openingLine,
        primary,
        alternatives: readout.alternatives,
        dataAvailability: readout.dataAvailability,
      })
    } catch (error) {
      console.error('[forge:opening]', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Opening failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
