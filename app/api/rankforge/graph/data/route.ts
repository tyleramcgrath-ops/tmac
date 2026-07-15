import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Streams the full graph (nodes + edges) for the visualization page.
 *
 * Supports optional filtering:
 *   ?nodeType=page,money_page,topic
 *   ?relationshipType=PAGE_HAS_TOPIC,PAGE_SUPPORTS_MONEY_PAGE
 *   ?limit=1000 (caps returned nodes; edges are then filtered to that subset)
 */
export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      if (!projectId) {
        return Response.json({ error: 'Missing projectId' }, { status: 400 })
      }
      await requireProjectAccess(projectId)

      const prisma = getPrismaClient()
      const nodeTypes = split(searchParams.get('nodeType'))
      const edgeTypes = split(searchParams.get('relationshipType'))
      const limit = Math.min(Number(searchParams.get('limit') || 500), 2000)

      const nodes = await prisma.knowledgeGraphNode.findMany({
        where: {
          projectId,
          ...(nodeTypes.length ? { nodeType: { in: nodeTypes } } : {}),
        },
        orderBy: [{ isCore: 'desc' }, { frequency: 'desc' }, { score: 'desc' }],
        take: limit,
      })
      const nodeIdSet = new Set(nodes.map((n) => n.nodeId))

      const edges = await prisma.knowledgeGraphEdge.findMany({
        where: {
          projectId,
          fromNodeId: { in: Array.from(nodeIdSet) },
          toNodeId: { in: Array.from(nodeIdSet) },
          ...(edgeTypes.length ? { relationshipType: { in: edgeTypes } } : {}),
        },
        take: limit * 4,
      })

      return Response.json({
        success: true,
        nodes: nodes.map((n) => ({
          id: n.nodeId,
          label: n.nodeLabel,
          type: n.nodeType,
          url: n.nodeUrl,
          isCore: n.isCore,
          coreReason: n.coreReason,
          frequency: n.frequency,
          score: n.score,
          properties: n.properties ? safeParse(n.properties) : null,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          from: e.fromNodeId,
          to: e.toNodeId,
          type: e.relationshipType,
          confidence: e.confidence,
          strength: e.strength,
          evidence: e.evidence ? safeParse(e.evidence) : null,
          source: e.source,
          detectedAt: e.detectedAt,
        })),
      })
    } catch (error) {
      console.error('[graph:data] error', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Failed to load graph' },
        { status: 500 },
      )
    }
  })
  return handler(request)
}

function split(v: string | null): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []
}
function safeParse(v: string): unknown {
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}
