import { withAuth, requireProjectAccess } from '@/lib/authorize'
import {
  retrieveGraphContext,
  strongestTopicCluster,
  weakestTopicCluster,
  orphanPages,
  weakMoneyPages,
  pagesMissingSupportingContent,
  missingEntities,
  missingServices,
  missingLocations,
  weakAuthorityFlow,
  brokenTopicClusters,
  contentSupportingMoneyPage,
  internalLinkOpportunities,
  allClusters,
} from '@/lib/pipeline/graph/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const query = searchParams.get('query') || 'context'
      const target = searchParams.get('target') || undefined

      if (!projectId) {
        return Response.json({ error: 'Missing projectId' }, { status: 400 })
      }
      await requireProjectAccess(projectId)

      const ctx = { projectId }
      const result = await dispatch(query, ctx, target)
      return Response.json({ success: true, query, result })
    } catch (error) {
      console.error('[graph:retrieve] error', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Retrieval failed' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}

async function dispatch(query: string, ctx: { projectId: string }, target?: string) {
  switch (query) {
    case 'context':
      return retrieveGraphContext(ctx)
    case 'strongest_topic_cluster':
      return strongestTopicCluster(ctx)
    case 'weakest_topic_cluster':
      return weakestTopicCluster(ctx)
    case 'all_clusters':
      return allClusters(ctx)
    case 'orphan_pages':
      return orphanPages(ctx)
    case 'weak_money_pages':
      return weakMoneyPages(ctx)
    case 'pages_missing_supporting_content':
      return pagesMissingSupportingContent(ctx)
    case 'missing_entities':
      return missingEntities(ctx)
    case 'missing_services':
      return missingServices(ctx)
    case 'missing_locations':
      return missingLocations(ctx)
    case 'weak_authority_flow':
      return weakAuthorityFlow(ctx)
    case 'broken_topic_clusters':
      return brokenTopicClusters(ctx)
    case 'content_supporting_money_page':
      if (!target) throw new Error('target=<moneyPageNodeId> required')
      return contentSupportingMoneyPage(ctx, target)
    case 'internal_link_opportunities':
      return internalLinkOpportunities(ctx)
    default:
      throw new Error(`Unknown query "${query}"`)
  }
}
