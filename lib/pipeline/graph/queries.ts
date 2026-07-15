import { getPrismaClient } from '@/lib/db'
import { EDGE_TYPES, NODE_TYPES } from '@/lib/pipeline/stages/knowledge-graph'
import type { KnowledgeGraphEdge, KnowledgeGraphNode } from '@prisma/client'

/**
 * Graph retrieval layer for Forge and Decision-Engine consumers.
 *
 * Every query is project-scoped and returns explainable results — the
 * evidence + confidence + source that produced the answer travel with it.
 */

export type GraphNode = KnowledgeGraphNode
export type GraphEdge = KnowledgeGraphEdge

interface Ctx {
  projectId: string
}

interface ClusterSummary {
  cluster: string
  topicCount: number
  pageCount: number
  averageConfidence: number
  strengthScore: number
  topics: Array<{ nodeId: string; label: string; frequency: number }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Topic-cluster strength (aggregate PAGE_HAS_TOPIC + TOPIC_RELATES_TO_TOPIC)
// ─────────────────────────────────────────────────────────────────────────────

async function summarizeClusters(ctx: Ctx): Promise<ClusterSummary[]> {
  const prisma = getPrismaClient()
  const [topics, pageHasTopic] = await Promise.all([
    prisma.knowledgeGraphNode.findMany({
      where: { projectId: ctx.projectId, nodeType: NODE_TYPES.TOPIC },
    }),
    prisma.knowledgeGraphEdge.findMany({
      where: { projectId: ctx.projectId, relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC },
      select: { toNodeId: true, fromNodeId: true, confidence: true },
    }),
  ])

  const pagesPerTopic = new Map<string, Set<string>>()
  const confSumPerTopic = new Map<string, { sum: number; count: number }>()
  for (const edge of pageHasTopic) {
    if (!pagesPerTopic.has(edge.toNodeId)) pagesPerTopic.set(edge.toNodeId, new Set())
    pagesPerTopic.get(edge.toNodeId)!.add(edge.fromNodeId)
    const bucket = confSumPerTopic.get(edge.toNodeId) ?? { sum: 0, count: 0 }
    bucket.sum += edge.confidence
    bucket.count += 1
    confSumPerTopic.set(edge.toNodeId, bucket)
  }

  const byCluster = new Map<string, ClusterSummary>()
  for (const topic of topics) {
    let cluster = 'ungrouped'
    if (topic.properties) {
      try {
        const parsed = JSON.parse(topic.properties)
        if (parsed && typeof parsed.cluster === 'string' && parsed.cluster.trim()) {
          cluster = parsed.cluster
        }
      } catch {
        // keep default
      }
    }

    if (!byCluster.has(cluster)) {
      byCluster.set(cluster, {
        cluster,
        topicCount: 0,
        pageCount: 0,
        averageConfidence: 0,
        strengthScore: 0,
        topics: [],
      })
    }
    const summary = byCluster.get(cluster)!
    const pageSet = pagesPerTopic.get(topic.nodeId) ?? new Set()
    const conf = confSumPerTopic.get(topic.nodeId)
    summary.topicCount += 1
    summary.pageCount += pageSet.size
    summary.averageConfidence += conf ? conf.sum / Math.max(conf.count, 1) : 0
    summary.topics.push({
      nodeId: topic.nodeId,
      label: topic.nodeLabel,
      frequency: topic.frequency,
    })
  }

  for (const summary of byCluster.values()) {
    summary.averageConfidence = summary.topicCount
      ? summary.averageConfidence / summary.topicCount
      : 0
    summary.strengthScore =
      summary.pageCount * 2 + summary.topicCount + summary.averageConfidence * 10
    summary.topics.sort((a, b) => b.frequency - a.frequency)
  }

  return Array.from(byCluster.values()).sort((a, b) => b.strengthScore - a.strengthScore)
}

export async function strongestTopicCluster(ctx: Ctx): Promise<ClusterSummary | null> {
  const clusters = await summarizeClusters(ctx)
  return clusters[0] ?? null
}

export async function weakestTopicCluster(ctx: Ctx): Promise<ClusterSummary | null> {
  const clusters = await summarizeClusters(ctx)
  return clusters[clusters.length - 1] ?? null
}

export async function allClusters(ctx: Ctx): Promise<ClusterSummary[]> {
  return summarizeClusters(ctx)
}

// ─────────────────────────────────────────────────────────────────────────────
// Orphan pages: page nodes with no outgoing links AND no supporting content
// ─────────────────────────────────────────────────────────────────────────────

export async function orphanPages(ctx: Ctx, limit = 50): Promise<
  Array<{ page: GraphNode; reason: string }>
> {
  const prisma = getPrismaClient()
  const pageNodes = await prisma.knowledgeGraphNode.findMany({
    where: {
      projectId: ctx.projectId,
      nodeType: { in: [NODE_TYPES.PAGE, NODE_TYPES.MONEY_PAGE] },
    },
  })

  const edges = await prisma.knowledgeGraphEdge.findMany({
    where: {
      projectId: ctx.projectId,
      relationshipType: {
        in: [EDGE_TYPES.PAGE_LINKS_TO_PAGE, EDGE_TYPES.PAGE_SUPPORTS_PAGE],
      },
    },
    select: { fromNodeId: true, toNodeId: true },
  })

  const hasOutgoing = new Set(edges.map((e) => e.fromNodeId))
  const hasIncoming = new Set(edges.map((e) => e.toNodeId))

  const orphans: Array<{ page: GraphNode; reason: string }> = []
  for (const page of pageNodes) {
    const noOut = !hasOutgoing.has(page.nodeId)
    const noIn = !hasIncoming.has(page.nodeId)
    if (noOut && noIn) {
      orphans.push({ page, reason: 'No supporting or linking pages detected' })
    } else if (noIn && page.nodeType === NODE_TYPES.MONEY_PAGE) {
      orphans.push({ page, reason: 'Money page has no supporting content' })
    }
  }
  return orphans.slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────────────────
// Weak money pages: money pages with low score or few supporting pages
// ─────────────────────────────────────────────────────────────────────────────

export async function weakMoneyPages(ctx: Ctx, limit = 20): Promise<
  Array<{
    moneyPage: GraphNode
    supportingCount: number
    averageSupportConfidence: number
    score: number
    weaknessReasons: string[]
  }>
> {
  const prisma = getPrismaClient()
  const money = await prisma.knowledgeGraphNode.findMany({
    where: { projectId: ctx.projectId, nodeType: NODE_TYPES.MONEY_PAGE },
  })

  const supportEdges = await prisma.knowledgeGraphEdge.findMany({
    where: {
      projectId: ctx.projectId,
      relationshipType: EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
    },
    select: { toNodeId: true, confidence: true },
  })

  const perMoney = new Map<string, { count: number; sum: number }>()
  for (const e of supportEdges) {
    const bucket = perMoney.get(e.toNodeId) ?? { count: 0, sum: 0 }
    bucket.count += 1
    bucket.sum += e.confidence
    perMoney.set(e.toNodeId, bucket)
  }

  const results = money.map((mp) => {
    const bucket = perMoney.get(mp.nodeId) ?? { count: 0, sum: 0 }
    const reasons: string[] = []
    if (bucket.count === 0) reasons.push('No supporting content')
    if (bucket.count < 3) reasons.push('Fewer than 3 supporting pages')
    if (mp.score < 50) reasons.push(`Low quality score (${Math.round(mp.score)})`)
    if (bucket.count > 0 && bucket.sum / bucket.count < 0.5) {
      reasons.push('Weak topical alignment with supporting content')
    }
    return {
      moneyPage: mp,
      supportingCount: bucket.count,
      averageSupportConfidence: bucket.count ? bucket.sum / bucket.count : 0,
      score: mp.score,
      weaknessReasons: reasons,
    }
  })

  return results
    .filter((r) => r.weaknessReasons.length > 0)
    .sort((a, b) => b.weaknessReasons.length - a.weaknessReasons.length)
    .slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────────────────
// Pages missing supporting content (money pages without support edges)
// ─────────────────────────────────────────────────────────────────────────────

export async function pagesMissingSupportingContent(ctx: Ctx, limit = 20): Promise<GraphNode[]> {
  const prisma = getPrismaClient()
  const money = await prisma.knowledgeGraphNode.findMany({
    where: { projectId: ctx.projectId, nodeType: NODE_TYPES.MONEY_PAGE },
  })
  const incoming = await prisma.knowledgeGraphEdge.findMany({
    where: {
      projectId: ctx.projectId,
      relationshipType: EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
    },
    select: { toNodeId: true },
  })
  const supported = new Set(incoming.map((e) => e.toNodeId))
  return money.filter((mp) => !supported.has(mp.nodeId)).slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────────────────
// Missing entities / services / locations
// ─────────────────────────────────────────────────────────────────────────────

async function missingCoreOfType(
  ctx: Ctx,
  nodeType: string,
  edgeType: string,
): Promise<GraphNode[]> {
  const prisma = getPrismaClient()
  const [nodes, edges] = await Promise.all([
    prisma.knowledgeGraphNode.findMany({
      where: { projectId: ctx.projectId, nodeType, isCore: true },
    }),
    prisma.knowledgeGraphEdge.findMany({
      where: { projectId: ctx.projectId, relationshipType: edgeType },
      select: { toNodeId: true },
    }),
  ])
  const referenced = new Set(edges.map((e) => e.toNodeId))
  return nodes.filter((n) => !referenced.has(n.nodeId))
}

export async function missingEntities(ctx: Ctx): Promise<GraphNode[]> {
  return missingCoreOfType(ctx, NODE_TYPES.ENTITY, EDGE_TYPES.PAGE_MENTIONS_ENTITY)
}
export async function missingServices(ctx: Ctx): Promise<GraphNode[]> {
  return missingCoreOfType(ctx, NODE_TYPES.SERVICE, EDGE_TYPES.PAGE_OFFERS_SERVICE)
}
export async function missingLocations(ctx: Ctx): Promise<GraphNode[]> {
  return missingCoreOfType(ctx, NODE_TYPES.LOCATION, EDGE_TYPES.PAGE_TARGETS_LOCATION)
}

// ─────────────────────────────────────────────────────────────────────────────
// Weak authority flow: money pages that terminate topic clusters (no support)
// ─────────────────────────────────────────────────────────────────────────────

export async function weakAuthorityFlow(ctx: Ctx): Promise<
  Array<{ moneyPage: GraphNode; supportCount: number; recommendedSupport: number }>
> {
  const weak = await weakMoneyPages(ctx, 100)
  return weak
    .filter((w) => w.supportingCount < 3)
    .map((w) => ({
      moneyPage: w.moneyPage,
      supportCount: w.supportingCount,
      recommendedSupport: Math.max(3, 5 - w.supportingCount),
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Broken topic clusters: clusters with < 2 pages
// ─────────────────────────────────────────────────────────────────────────────

export async function brokenTopicClusters(ctx: Ctx): Promise<ClusterSummary[]> {
  const clusters = await summarizeClusters(ctx)
  return clusters.filter((c) => c.pageCount < 2)
}

// ─────────────────────────────────────────────────────────────────────────────
// Content supporting a specific money page
// ─────────────────────────────────────────────────────────────────────────────

export async function contentSupportingMoneyPage(
  ctx: Ctx,
  moneyPageNodeId: string,
): Promise<
  Array<{ supportPage: GraphNode; confidence: number; evidence: unknown }>
> {
  const prisma = getPrismaClient()
  const edges = await prisma.knowledgeGraphEdge.findMany({
    where: {
      projectId: ctx.projectId,
      relationshipType: EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
      toNodeId: moneyPageNodeId,
    },
    include: { fromNode: true },
    orderBy: { confidence: 'desc' },
  })

  return edges
    .filter((e) => !!e.fromNode)
    .map((e) => ({
      supportPage: e.fromNode!,
      confidence: e.confidence,
      evidence: e.evidence ? safeParse(e.evidence) : null,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal link opportunities: pages sharing topics with no PAGE_LINKS_TO_PAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function internalLinkOpportunities(ctx: Ctx, limit = 50): Promise<
  Array<{
    fromPage: GraphNode
    toPage: GraphNode
    sharedTopics: number
    confidence: number
    reason: string
  }>
> {
  const prisma = getPrismaClient()

  const [pageHasTopic, existingLinks] = await Promise.all([
    prisma.knowledgeGraphEdge.findMany({
      where: { projectId: ctx.projectId, relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC },
      select: { fromNodeId: true, toNodeId: true },
    }),
    prisma.knowledgeGraphEdge.findMany({
      where: { projectId: ctx.projectId, relationshipType: EDGE_TYPES.PAGE_LINKS_TO_PAGE },
      select: { fromNodeId: true, toNodeId: true },
    }),
  ])

  const topicsPerPage = new Map<string, Set<string>>()
  for (const e of pageHasTopic) {
    if (!topicsPerPage.has(e.fromNodeId)) topicsPerPage.set(e.fromNodeId, new Set())
    topicsPerPage.get(e.fromNodeId)!.add(e.toNodeId)
  }
  const linkedPairs = new Set(existingLinks.map((e) => `${e.fromNodeId}|${e.toNodeId}`))

  const pageIds = Array.from(topicsPerPage.keys())
  const opportunities: Array<{
    fromId: string
    toId: string
    shared: number
  }> = []
  for (let i = 0; i < pageIds.length; i++) {
    for (let j = i + 1; j < pageIds.length; j++) {
      const a = pageIds[i]
      const b = pageIds[j]
      if (linkedPairs.has(`${a}|${b}`) && linkedPairs.has(`${b}|${a}`)) continue
      const ta = topicsPerPage.get(a)!
      const tb = topicsPerPage.get(b)!
      let shared = 0
      for (const t of ta) if (tb.has(t)) shared++
      if (shared >= 2) {
        opportunities.push({ fromId: a, toId: b, shared })
      }
    }
  }

  opportunities.sort((x, y) => y.shared - x.shared)
  const trimmed = opportunities.slice(0, limit)
  const nodeIds = Array.from(new Set(trimmed.flatMap((o) => [o.fromId, o.toId])))
  const nodes = await prisma.knowledgeGraphNode.findMany({
    where: { projectId: ctx.projectId, nodeId: { in: nodeIds } },
  })
  const nodeById = new Map(nodes.map((n) => [n.nodeId, n]))

  return trimmed
    .map((o) => {
      const fromPage = nodeById.get(o.fromId)
      const toPage = nodeById.get(o.toId)
      if (!fromPage || !toPage) return null
      return {
        fromPage,
        toPage,
        sharedTopics: o.shared,
        confidence: Math.min(0.5 + o.shared * 0.1, 0.95),
        reason: `Both pages cover ${o.shared} common topics`,
      }
    })
    .filter((o): o is NonNullable<typeof o> => !!o)
}

// ─────────────────────────────────────────────────────────────────────────────
// One-call retrieval helper for Forge
// ─────────────────────────────────────────────────────────────────────────────

export interface GraphContext {
  projectId: string
  totals: { nodes: number; edges: number; byNodeType: Record<string, number>; byEdgeType: Record<string, number> }
  strongestCluster: ClusterSummary | null
  weakestCluster: ClusterSummary | null
  orphanPages: Array<{ url: string; label: string; reason: string }>
  weakMoneyPages: Array<{
    url: string
    label: string
    supportingCount: number
    reasons: string[]
  }>
  missingEntities: string[]
  missingServices: string[]
  missingLocations: string[]
  topLinkOpportunities: Array<{
    fromUrl: string
    toUrl: string
    sharedTopics: number
    confidence: number
  }>
  generatedAt: string
}

export async function retrieveGraphContext(ctx: Ctx): Promise<GraphContext> {
  const prisma = getPrismaClient()
  const [nodes, edges, strong, weak, orphans, weakMoney, mEntities, mServices, mLocations, links] =
    await Promise.all([
      prisma.knowledgeGraphNode.groupBy({
        by: ['nodeType'],
        where: { projectId: ctx.projectId },
        _count: { _all: true },
      }),
      prisma.knowledgeGraphEdge.groupBy({
        by: ['relationshipType'],
        where: { projectId: ctx.projectId },
        _count: { _all: true },
      }),
      strongestTopicCluster(ctx),
      weakestTopicCluster(ctx),
      orphanPages(ctx, 10),
      weakMoneyPages(ctx, 10),
      missingEntities(ctx),
      missingServices(ctx),
      missingLocations(ctx),
      internalLinkOpportunities(ctx, 10),
    ])

  const byNodeType: Record<string, number> = {}
  let nodeTotal = 0
  for (const g of nodes) {
    byNodeType[g.nodeType] = g._count._all
    nodeTotal += g._count._all
  }
  const byEdgeType: Record<string, number> = {}
  let edgeTotal = 0
  for (const g of edges) {
    byEdgeType[g.relationshipType] = g._count._all
    edgeTotal += g._count._all
  }

  return {
    projectId: ctx.projectId,
    totals: { nodes: nodeTotal, edges: edgeTotal, byNodeType, byEdgeType },
    strongestCluster: strong,
    weakestCluster: weak,
    orphanPages: orphans.map((o) => ({
      url: o.page.nodeUrl ?? o.page.nodeId,
      label: o.page.nodeLabel,
      reason: o.reason,
    })),
    weakMoneyPages: weakMoney.map((w) => ({
      url: w.moneyPage.nodeUrl ?? w.moneyPage.nodeId,
      label: w.moneyPage.nodeLabel,
      supportingCount: w.supportingCount,
      reasons: w.weaknessReasons,
    })),
    missingEntities: mEntities.map((n) => n.nodeLabel),
    missingServices: mServices.map((n) => n.nodeLabel),
    missingLocations: mLocations.map((n) => n.nodeLabel),
    topLinkOpportunities: links.map((l) => ({
      fromUrl: l.fromPage.nodeUrl ?? l.fromPage.nodeId,
      toUrl: l.toPage.nodeUrl ?? l.toPage.nodeId,
      sharedTopics: l.sharedTopics,
      confidence: l.confidence,
    })),
    generatedAt: new Date().toISOString(),
  }
}

function safeParse(v: string): unknown {
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}
