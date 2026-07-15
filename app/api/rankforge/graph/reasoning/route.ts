import { withAuth, requireProjectAccess } from '@/lib/authorize'
import {
  explainPageImportance,
  explainMoneyPage,
  explainRecommendation,
  explainWeakestEntities,
} from '@/lib/pipeline/graph/reasoning'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Graph reasoning: every "why?" question is answered by traversing the graph
 * and returning explainable evidence, not by asking an LLM to guess.
 *
 * GET /api/rankforge/graph/reasoning?projectId=&question=<name>&target=<pageUrl>&aux=<objective>
 */
export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const question = searchParams.get('question') || 'page_importance'
      const target = searchParams.get('target') || ''
      const aux = searchParams.get('aux') || ''

      if (!projectId) {
        return Response.json({ error: 'Missing projectId' }, { status: 400 })
      }
      await requireProjectAccess(projectId)

      const ctx = { projectId }
      let result
      switch (question) {
        case 'page_importance':
          if (!target) return Response.json({ error: 'target=<pageUrl> required' }, { status: 400 })
          result = await explainPageImportance(ctx, target)
          break
        case 'money_page':
          if (!target) return Response.json({ error: 'target=<pageUrl> required' }, { status: 400 })
          result = await explainMoneyPage(ctx, target)
          break
        case 'recommendation':
          if (!target || !aux) {
            return Response.json(
              { error: 'target=<pageUrl>&aux=<objective> required' },
              { status: 400 },
            )
          }
          result = await explainRecommendation(ctx, target, aux)
          break
        case 'weak_entities':
          result = await explainWeakestEntities(ctx)
          break
        default:
          return Response.json({ error: `Unknown question "${question}"` }, { status: 400 })
      }

      return Response.json({ success: true, question, result })
    } catch (error) {
      console.error('[graph:reasoning] error', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Reasoning failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}
