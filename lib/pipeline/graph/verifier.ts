import { getPrismaClient } from '@/lib/db'
import { EDGE_TYPES, NODE_TYPES } from '@/lib/pipeline/stages/knowledge-graph'

export interface VerificationFinding {
  category:
    | 'duplicate_node'
    | 'circular_relationship'
    | 'weak_confidence'
    | 'orphan_node'
    | 'broken_reference'
    | 'invalid_relationship'
    | 'self_loop'
  severity: 'info' | 'warning' | 'critical'
  message: string
  nodeIds?: string[]
  edgeIds?: string[]
  repaired?: boolean
}

export interface VerificationReport {
  projectId: string
  totals: { nodes: number; edges: number }
  findings: VerificationFinding[]
  repaired: number
  generatedAt: string
}

const WEAK_CONFIDENCE_THRESHOLD = 0.35

// Valid (fromType, edgeType, toType) tuples — anything else is invalid.
const VALID_EDGE_SHAPES: Record<string, Array<{ from: string; to: string }>> = {
  [EDGE_TYPES.PAGE_HAS_TOPIC]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.TOPIC },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.TOPIC },
  ],
  [EDGE_TYPES.PAGE_MENTIONS_ENTITY]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.ENTITY },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.ENTITY },
  ],
  [EDGE_TYPES.PAGE_SUPPORTS_PAGE]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.PAGE },
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.MONEY_PAGE },
  ],
  [EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.MONEY_PAGE },
  ],
  [EDGE_TYPES.PAGE_LINKS_TO_PAGE]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.PAGE },
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.MONEY_PAGE },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.PAGE },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.MONEY_PAGE },
  ],
  [EDGE_TYPES.PAGE_TARGETS_LOCATION]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.LOCATION },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.LOCATION },
  ],
  [EDGE_TYPES.PAGE_OFFERS_SERVICE]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.SERVICE },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.SERVICE },
  ],
  [EDGE_TYPES.PAGE_DESCRIBES_PRODUCT]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.PRODUCT },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.PRODUCT },
  ],
  [EDGE_TYPES.PAGE_CONTAINS_SCHEMA]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.SCHEMA_TYPE },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.SCHEMA_TYPE },
  ],
  [EDGE_TYPES.PAGE_HAS_FAQ]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.FAQ },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.FAQ },
  ],
  [EDGE_TYPES.PAGE_TARGETS_OBJECTIVE]: [
    { from: NODE_TYPES.PAGE, to: NODE_TYPES.BUSINESS_OBJECTIVE },
    { from: NODE_TYPES.MONEY_PAGE, to: NODE_TYPES.BUSINESS_OBJECTIVE },
  ],
  [EDGE_TYPES.ENTITY_RELATES_TO_ENTITY]: [{ from: NODE_TYPES.ENTITY, to: NODE_TYPES.ENTITY }],
  [EDGE_TYPES.TOPIC_RELATES_TO_TOPIC]: [{ from: NODE_TYPES.TOPIC, to: NODE_TYPES.TOPIC }],
  [EDGE_TYPES.SERVICE_RELATES_TO_LOCATION]: [
    { from: NODE_TYPES.SERVICE, to: NODE_TYPES.LOCATION },
  ],
  [EDGE_TYPES.CATEGORY_CONTAINS_PRODUCT]: [
    { from: NODE_TYPES.CATEGORY, to: NODE_TYPES.PRODUCT },
  ],
  [EDGE_TYPES.AUTHOR_WROTE_PAGE]: [
    { from: NODE_TYPES.AUTHOR, to: NODE_TYPES.PAGE },
    { from: NODE_TYPES.AUTHOR, to: NODE_TYPES.MONEY_PAGE },
  ],
}

/**
 * Runs a full verification pass on the project's knowledge graph.
 *
 * When `repair` is true, safe repairs are applied:
 *  - self-loop edges are deleted
 *  - broken-reference edges are deleted
 *  - invalid-shape edges are deleted
 *  - duplicate nodes (case-insensitive label collision within the same type)
 *    are collapsed into the highest-frequency survivor
 */
export async function verifyGraph(
  ctx: { projectId: string },
  options: { repair?: boolean } = {},
): Promise<VerificationReport> {
  const prisma = getPrismaClient()
  const findings: VerificationFinding[] = []
  let repairedCount = 0

  const [nodes, edges] = await Promise.all([
    prisma.knowledgeGraphNode.findMany({ where: { projectId: ctx.projectId } }),
    prisma.knowledgeGraphEdge.findMany({ where: { projectId: ctx.projectId } }),
  ])
  const nodesById = new Map(nodes.map((n) => [n.nodeId, n]))

  // ── 1. Broken references ──────────────────────────────────────────────────
  for (const edge of edges) {
    const from = nodesById.get(edge.fromNodeId)
    const to = nodesById.get(edge.toNodeId)
    if (!from || !to) {
      findings.push({
        category: 'broken_reference',
        severity: 'critical',
        message: `Edge ${edge.id} references missing node(s)`,
        edgeIds: [edge.id],
        repaired: options.repair,
      })
      if (options.repair) {
        await prisma.knowledgeGraphEdge.delete({ where: { id: edge.id } })
        repairedCount++
      }
    }
  }

  // ── 2. Self-loops ─────────────────────────────────────────────────────────
  for (const edge of edges) {
    if (edge.fromNodeId === edge.toNodeId) {
      findings.push({
        category: 'self_loop',
        severity: 'warning',
        message: `Edge ${edge.id} (${edge.relationshipType}) is a self-loop`,
        edgeIds: [edge.id],
        repaired: options.repair,
      })
      if (options.repair) {
        await prisma.knowledgeGraphEdge.delete({ where: { id: edge.id } }).catch(() => {})
        repairedCount++
      }
    }
  }

  // ── 3. Invalid relationships (unknown type or wrong node-type pair) ───────
  for (const edge of edges) {
    const shapes = VALID_EDGE_SHAPES[edge.relationshipType]
    if (!shapes) {
      findings.push({
        category: 'invalid_relationship',
        severity: 'warning',
        message: `Edge ${edge.id} uses unknown relationship type "${edge.relationshipType}"`,
        edgeIds: [edge.id],
      })
      continue
    }
    const from = nodesById.get(edge.fromNodeId)
    const to = nodesById.get(edge.toNodeId)
    if (!from || !to) continue // already reported
    const valid = shapes.some((s) => s.from === from.nodeType && s.to === to.nodeType)
    if (!valid) {
      findings.push({
        category: 'invalid_relationship',
        severity: 'warning',
        message: `Edge ${edge.id} shape (${from.nodeType} -${edge.relationshipType}-> ${to.nodeType}) is not permitted`,
        edgeIds: [edge.id],
        repaired: options.repair,
      })
      if (options.repair) {
        await prisma.knowledgeGraphEdge.delete({ where: { id: edge.id } }).catch(() => {})
        repairedCount++
      }
    }
  }

  // ── 4. Weak confidence ────────────────────────────────────────────────────
  for (const edge of edges) {
    if (edge.confidence < WEAK_CONFIDENCE_THRESHOLD) {
      findings.push({
        category: 'weak_confidence',
        severity: 'info',
        message: `Edge ${edge.id} confidence ${edge.confidence.toFixed(2)} below threshold`,
        edgeIds: [edge.id],
      })
    }
  }

  // ── 5. Orphan nodes ───────────────────────────────────────────────────────
  const referenced = new Set<string>()
  for (const e of edges) {
    referenced.add(e.fromNodeId)
    referenced.add(e.toNodeId)
  }
  for (const node of nodes) {
    if (!referenced.has(node.nodeId)) {
      findings.push({
        category: 'orphan_node',
        severity: 'info',
        message: `Node ${node.nodeId} (${node.nodeType}) has no relationships`,
        nodeIds: [node.nodeId],
      })
    }
  }

  // ── 6. Duplicate nodes (case-insensitive label within same type) ──────────
  const dupBuckets = new Map<string, typeof nodes>()
  for (const node of nodes) {
    const key = `${node.nodeType}:${node.nodeLabel.toLowerCase().trim()}`
    if (!dupBuckets.has(key)) dupBuckets.set(key, [])
    dupBuckets.get(key)!.push(node)
  }
  for (const bucket of dupBuckets.values()) {
    if (bucket.length < 2) continue
    const survivor = [...bucket].sort((a, b) => b.frequency - a.frequency)[0]
    const dupes = bucket.filter((n) => n.id !== survivor.id)
    findings.push({
      category: 'duplicate_node',
      severity: 'warning',
      message: `${bucket.length} nodes share label "${survivor.nodeLabel}" (type ${survivor.nodeType})`,
      nodeIds: bucket.map((n) => n.nodeId),
      repaired: options.repair,
    })
    if (options.repair) {
      for (const dupe of dupes) {
        // Redirect edges from the dupe to the survivor
        await prisma.knowledgeGraphEdge.updateMany({
          where: { projectId: ctx.projectId, fromNodeId: dupe.nodeId },
          data: { fromNodeId: survivor.nodeId },
        }).catch(() => {})
        await prisma.knowledgeGraphEdge.updateMany({
          where: { projectId: ctx.projectId, toNodeId: dupe.nodeId },
          data: { toNodeId: survivor.nodeId },
        }).catch(() => {})
        await prisma.knowledgeGraphNode.delete({ where: { id: dupe.id } }).catch(() => {})
        repairedCount++
      }
    }
  }

  // ── 7. Circular relationships (2-hop cycles in undirected sense are ok;
  // detect strict directed cycles A -> B -> A of the same relationship type) ─
  const outByType = new Map<string, Map<string, Set<string>>>() // type -> from -> tos
  for (const edge of edges) {
    if (!outByType.has(edge.relationshipType)) outByType.set(edge.relationshipType, new Map())
    const bucket = outByType.get(edge.relationshipType)!
    if (!bucket.has(edge.fromNodeId)) bucket.set(edge.fromNodeId, new Set())
    bucket.get(edge.fromNodeId)!.add(edge.toNodeId)
  }
  for (const [type, bucket] of outByType.entries()) {
    for (const [from, tos] of bucket.entries()) {
      for (const to of tos) {
        const back = bucket.get(to)
        if (back && back.has(from) && from !== to) {
          findings.push({
            category: 'circular_relationship',
            severity: 'info',
            message: `Cycle detected: ${from} <-${type}-> ${to}`,
            nodeIds: [from, to],
          })
        }
      }
    }
  }

  return {
    projectId: ctx.projectId,
    totals: { nodes: nodes.length, edges: edges.length },
    findings,
    repaired: repairedCount,
    generatedAt: new Date().toISOString(),
  }
}
