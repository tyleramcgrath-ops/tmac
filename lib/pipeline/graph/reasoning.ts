import { getPrismaClient } from '@/lib/db'
import { EDGE_TYPES, NODE_TYPES, buildNodeId } from '@/lib/pipeline/stages/knowledge-graph'
import type { KnowledgeGraphEdge, KnowledgeGraphNode } from '@prisma/client'
import { withLatency } from './metrics'

/**
 * Graph reasoning engine — every RankForge "why?" question is answered here
 * by traversing the knowledge graph and returning explainable evidence.
 *
 * Callers get:
 *   - the answer (importance score, priority, weaknesses, etc.)
 *   - the graph path that produced it (nodes + edges walked)
 *   - the underlying evidence (per-edge evidence blobs)
 *   - a confidence score
 */

export interface Explanation<T = unknown> {
  question: string
  answer: T
  evidence: EvidenceItem[]
  graphPath: PathHop[]
  confidence: number
  generatedAt: string
  latencyMs: number
}

export interface EvidenceItem {
  kind: 'node' | 'edge'
  ref: string
  label: string
  detail?: unknown
  confidence?: number
}

export interface PathHop {
  fromNodeId: string
  fromLabel: string
  fromType: string
  relationshipType: string
  toNodeId: string
  toLabel: string
  toType: string
  confidence: number
}

interface Ctx {
  projectId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function explainPageImportance(
  ctx: Ctx,
  pageUrl: string,
): Promise<Explanation<{ score: number; factors: string[]; classification: string | null }>> {
  return withLatency('explainPageImportance', async () => {
    const { node: page, prisma } = await loadPageNode(ctx, pageUrl)
    if (!page) {
      return emptyExplanation(`Why is ${pageUrl} important?`, {
        score: 0,
        factors: ['Page not present in the knowledge graph'],
        classification: null,
      })
    }

    const [outgoing, incoming] = await Promise.all([
      prisma.knowledgeGraphEdge.findMany({
        where: { projectId: ctx.projectId, fromNodeId: page.nodeId },
        take: 500,
      }),
      prisma.knowledgeGraphEdge.findMany({
        where: { projectId: ctx.projectId, toNodeId: page.nodeId },
        take: 500,
      }),
    ])

    const supportsMoney = outgoing.filter(
      (e) => e.relationshipType === EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
    )
    const supportedBy = incoming.filter(
      (e) => e.relationshipType === EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
    )
    const topics = outgoing.filter((e) => e.relationshipType === EDGE_TYPES.PAGE_HAS_TOPIC)
    const entities = outgoing.filter((e) => e.relationshipType === EDGE_TYPES.PAGE_MENTIONS_ENTITY)
    const targetsObjective = outgoing.filter(
      (e) => e.relationshipType === EDGE_TYPES.PAGE_TARGETS_OBJECTIVE,
    )

    const factors: string[] = []
    if (page.nodeType === NODE_TYPES.MONEY_PAGE) factors.push('Classified as a money page')
    if (page.isCore) factors.push(page.coreReason ?? 'Marked as core business asset')
    if (topics.length) factors.push(`Covers ${topics.length} topic${topics.length === 1 ? '' : 's'}`)
    if (entities.length)
      factors.push(`Mentions ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}`)
    if (supportsMoney.length)
      factors.push(`Supports ${supportsMoney.length} money page${supportsMoney.length === 1 ? '' : 's'}`)
    if (supportedBy.length)
      factors.push(`Supported by ${supportedBy.length} page${supportedBy.length === 1 ? '' : 's'}`)
    if (targetsObjective.length) factors.push(`Aligned with an active business objective`)

    const score =
      page.score * 0.4 +
      topics.length * 4 +
      entities.length * 2 +
      supportsMoney.length * 8 +
      supportedBy.length * 6 +
      targetsObjective.length * 5 +
      (page.isCore ? 15 : 0)

    const evidence = [
      ...topics.slice(0, 5).map((e) => toEvidence('edge', e)),
      ...entities.slice(0, 5).map((e) => toEvidence('edge', e)),
      ...supportsMoney.slice(0, 3).map((e) => toEvidence('edge', e)),
      ...supportedBy.slice(0, 3).map((e) => toEvidence('edge', e)),
    ]
    const paths = await hopsFor(
      ctx,
      [...topics.slice(0, 3), ...supportsMoney.slice(0, 2), ...supportedBy.slice(0, 2)],
    )

    return {
      question: `Why is ${pageUrl} important?`,
      answer: {
        score: Math.round(score),
        factors,
        classification: page.nodeType,
      },
      evidence,
      graphPath: paths,
      confidence: normalizedConfidence(evidence),
      generatedAt: new Date().toISOString(),
      latencyMs: 0,
    }
  })
}

export async function explainRecommendation(
  ctx: Ctx,
  pageUrl: string,
  recommendationType: string,
): Promise<Explanation<{ rank: number | null; supporting: number; opposing: number }>> {
  return withLatency('explainRecommendation', async () => {
    const prisma = getPrismaClient()
    const rec = await prisma.recommendationDecision.findFirst({
      where: { projectId: ctx.projectId, pageUrl, recommendationType },
    })
    if (!rec) {
      return emptyExplanation(
        `Why is ${recommendationType} for ${pageUrl} recommended?`,
        { rank: null, supporting: 0, opposing: 0 },
      )
    }

    const rankRows = await prisma.recommendationDecision.findMany({
      where: { projectId: ctx.projectId, recommendationType },
      orderBy: [{ businessValue: 'desc' }, { seoOpportunity: 'desc' }],
      select: { pageUrl: true },
    })
    const rank = rankRows.findIndex((r) => r.pageUrl === pageUrl) + 1

    const pageNodeId = buildNodeId(NODE_TYPES.MONEY_PAGE, pageUrl)
    const pageNodeAltId = buildNodeId(NODE_TYPES.PAGE, pageUrl)
    const supportingEdges = await prisma.knowledgeGraphEdge.findMany({
      where: {
        projectId: ctx.projectId,
        toNodeId: { in: [pageNodeId, pageNodeAltId] },
        relationshipType: {
          in: [EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE, EDGE_TYPES.PAGE_SUPPORTS_PAGE],
        },
      },
      take: 25,
    })

    const answer = {
      rank: rank > 0 ? rank : null,
      supporting: supportingEdges.length,
      opposing: 0,
    }
    const evidence: EvidenceItem[] = [
      {
        kind: 'node',
        ref: `${pageUrl}::${recommendationType}`,
        label: `Decision (${recommendationType})`,
        detail: {
          businessValue: rec.businessValue,
          seoOpportunity: rec.seoOpportunity,
          confidence: rec.confidence,
          whyThis: rec.whyThis,
          whyNow: rec.whyNow,
          whyThisPage: rec.whyThisPage,
        },
      },
      ...supportingEdges.slice(0, 10).map((e) => toEvidence('edge', e)),
    ]

    return {
      question: `Why is ${recommendationType} for ${pageUrl} recommended?`,
      answer,
      evidence,
      graphPath: await hopsFor(ctx, supportingEdges.slice(0, 5)),
      confidence: (rec.confidence + Math.min(supportingEdges.length / 5, 1)) / 2,
      generatedAt: new Date().toISOString(),
      latencyMs: 0,
    }
  })
}

export async function explainMoneyPage(
  ctx: Ctx,
  pageUrl: string,
): Promise<
  Explanation<{
    supporting: string[]
    weaknesses: string[]
    missingTopics: string[]
  }>
> {
  return withLatency('explainMoneyPage', async () => {
    const { node, prisma } = await loadPageNode(ctx, pageUrl)
    if (!node) {
      return emptyExplanation(`Why does ${pageUrl} matter?`, {
        supporting: [],
        weaknesses: ['Money page not present in graph'],
        missingTopics: [],
      })
    }

    const [supports, hasTopic] = await Promise.all([
      prisma.knowledgeGraphEdge.findMany({
        where: {
          projectId: ctx.projectId,
          toNodeId: node.nodeId,
          relationshipType: EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
        },
        include: { fromNode: true },
      }),
      prisma.knowledgeGraphEdge.findMany({
        where: {
          projectId: ctx.projectId,
          fromNodeId: node.nodeId,
          relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC,
        },
        include: { toNode: true },
      }),
    ])

    const weaknesses: string[] = []
    if (supports.length === 0) weaknesses.push('No supporting content in the site')
    if (supports.length < 3) weaknesses.push('Fewer than 3 supporting pages')
    if (hasTopic.length === 0) weaknesses.push('No topics extracted for this page')
    if (node.score < 50) weaknesses.push(`Low quality score (${Math.round(node.score)})`)

    const supportingSummaries = supports
      .map((e) => e.fromNode?.nodeLabel ?? e.fromNodeId)
      .slice(0, 20)
    const missingTopics = await discoverMissingTopicsForMoneyPage(ctx, node, hasTopic)

    const evidence: EvidenceItem[] = [
      ...supports.slice(0, 10).map((e) => toEvidence('edge', e)),
      ...hasTopic.slice(0, 5).map((e) => toEvidence('edge', e)),
    ]

    return {
      question: `Why does ${pageUrl} matter?`,
      answer: {
        supporting: supportingSummaries,
        weaknesses,
        missingTopics,
      },
      evidence,
      graphPath: await hopsFor(ctx, [...supports.slice(0, 3), ...hasTopic.slice(0, 3)]),
      confidence: normalizedConfidence(evidence),
      generatedAt: new Date().toISOString(),
      latencyMs: 0,
    }
  })
}

export async function explainWeakestEntities(
  ctx: Ctx,
  limit = 20,
): Promise<Explanation<Array<{ label: string; mentionCount: number; reason: string }>>> {
  return withLatency('explainWeakestEntities', async () => {
    const prisma = getPrismaClient()
    const entities = await prisma.knowledgeGraphNode.findMany({
      where: { projectId: ctx.projectId, nodeType: NODE_TYPES.ENTITY, isCore: true },
    })
    const mentionEdges = await prisma.knowledgeGraphEdge.findMany({
      where: {
        projectId: ctx.projectId,
        relationshipType: EDGE_TYPES.PAGE_MENTIONS_ENTITY,
        toNodeId: { in: entities.map((e) => e.nodeId) },
      },
      select: { toNodeId: true, confidence: true },
    })
    const counts = new Map<string, { count: number; avgConf: number }>()
    for (const e of mentionEdges) {
      const bucket = counts.get(e.toNodeId) ?? { count: 0, avgConf: 0 }
      bucket.count += 1
      bucket.avgConf += e.confidence
      counts.set(e.toNodeId, bucket)
    }

    const rows = entities
      .map((n) => {
        const c = counts.get(n.nodeId) ?? { count: 0, avgConf: 0 }
        return {
          label: n.nodeLabel,
          mentionCount: c.count,
          avgConfidence: c.count ? c.avgConf / c.count : 0,
          isCore: n.isCore,
        }
      })
      .sort((a, b) => a.mentionCount - b.mentionCount)
      .slice(0, limit)
      .map((r) => ({
        label: r.label,
        mentionCount: r.mentionCount,
        reason:
          r.mentionCount === 0
            ? 'Core entity never mentioned on-site'
            : r.mentionCount < 3
              ? 'Weak coverage — mentioned on fewer than 3 pages'
              : `Low average confidence (${r.avgConfidence.toFixed(2)})`,
      }))

    return {
      question: 'Which core entities are weak?',
      answer: rows,
      evidence: rows.map((r) => ({
        kind: 'node',
        ref: r.label,
        label: r.label,
        detail: { mentionCount: r.mentionCount },
      })),
      graphPath: [],
      confidence: 0.9,
      generatedAt: new Date().toISOString(),
      latencyMs: 0,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

async function loadPageNode(ctx: Ctx, pageUrl: string) {
  const prisma = getPrismaClient()
  const candidates = [
    buildNodeId(NODE_TYPES.MONEY_PAGE, pageUrl),
    buildNodeId(NODE_TYPES.PAGE, pageUrl),
  ]
  const node = await prisma.knowledgeGraphNode.findFirst({
    where: { projectId: ctx.projectId, nodeId: { in: candidates } },
  })
  return { node, prisma }
}

async function hopsFor(ctx: Ctx, edges: KnowledgeGraphEdge[]): Promise<PathHop[]> {
  if (edges.length === 0) return []
  const prisma = getPrismaClient()
  const nodeIds = new Set<string>()
  for (const e of edges) {
    nodeIds.add(e.fromNodeId)
    nodeIds.add(e.toNodeId)
  }
  const nodes = await prisma.knowledgeGraphNode.findMany({
    where: { projectId: ctx.projectId, nodeId: { in: Array.from(nodeIds) } },
  })
  const byId = new Map(nodes.map((n) => [n.nodeId, n]))
  return edges
    .map((e) => {
      const from = byId.get(e.fromNodeId)
      const to = byId.get(e.toNodeId)
      if (!from || !to) return null
      return {
        fromNodeId: from.nodeId,
        fromLabel: from.nodeLabel,
        fromType: from.nodeType,
        relationshipType: e.relationshipType,
        toNodeId: to.nodeId,
        toLabel: to.nodeLabel,
        toType: to.nodeType,
        confidence: e.confidence,
      }
    })
    .filter((p): p is PathHop => !!p)
}

function toEvidence(
  kind: 'node' | 'edge',
  item: KnowledgeGraphEdge | KnowledgeGraphNode,
): EvidenceItem {
  if (isEdge(item)) {
    return {
      kind,
      ref: item.id,
      label: `${item.relationshipType} (${item.confidence.toFixed(2)})`,
      confidence: item.confidence,
      detail: item.evidence ? safeParse(item.evidence) : undefined,
    }
  }
  return {
    kind,
    ref: item.nodeId,
    label: item.nodeLabel,
    detail: item.properties ? safeParse(item.properties) : undefined,
  }
}

function isEdge(item: any): item is KnowledgeGraphEdge {
  return typeof item?.relationshipType === 'string'
}

function safeParse(v: string): unknown {
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

function emptyExplanation<T>(question: string, answer: T): Explanation<T> {
  return {
    question,
    answer,
    evidence: [],
    graphPath: [],
    confidence: 0,
    generatedAt: new Date().toISOString(),
    latencyMs: 0,
  }
}

function normalizedConfidence(evidence: EvidenceItem[]): number {
  if (evidence.length === 0) return 0
  const confs = evidence.map((e) => e.confidence ?? 0.5)
  const avg = confs.reduce((s, n) => s + n, 0) / confs.length
  const density = Math.min(evidence.length / 10, 1)
  return Math.min(0.4 + avg * 0.4 + density * 0.2, 0.99)
}

async function discoverMissingTopicsForMoneyPage(
  ctx: Ctx,
  moneyPage: KnowledgeGraphNode,
  currentTopicEdges: KnowledgeGraphEdge[],
): Promise<string[]> {
  const prisma = getPrismaClient()
  const currentTopicIds = new Set(currentTopicEdges.map((e) => e.toNodeId))
  // Topics on other money pages within the same project — the ones this money
  // page lacks are the highest-leverage "missing topic" candidates.
  const peerEdges = await prisma.knowledgeGraphEdge.findMany({
    where: {
      projectId: ctx.projectId,
      relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC,
      fromNode: { nodeType: NODE_TYPES.MONEY_PAGE, nodeId: { not: moneyPage.nodeId } },
    },
    include: { toNode: true },
  })
  const missing = new Map<string, string>()
  for (const e of peerEdges) {
    if (currentTopicIds.has(e.toNodeId)) continue
    if (!e.toNode) continue
    missing.set(e.toNode.nodeId, e.toNode.nodeLabel)
  }
  return Array.from(missing.values()).slice(0, 10)
}
