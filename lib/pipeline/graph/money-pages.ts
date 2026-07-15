import { getPrismaClient } from '@/lib/db'
import { EDGE_TYPES, NODE_TYPES } from '@/lib/pipeline/stages/knowledge-graph'
import type { KnowledgeGraphNode } from '@prisma/client'
import { withLatency } from './metrics'

/**
 * Money-page intelligence: everything RankForge needs to know about a single
 * money page or the full money-page portfolio, sourced from the graph.
 */

export interface MoneyPageIntelligence {
  moneyPage: {
    nodeId: string
    label: string
    url: string | null
    score: number
    isCore: boolean
  }
  supports: Array<{ pageNodeId: string; label: string; url: string | null; confidence: number }>
  weaknesses: string[]
  missing: {
    supportingContent: number
    internalLinks: number
    entities: string[]
    schema: string[]
    topics: string[]
  }
  trafficRisk: 'low' | 'medium' | 'high'
  conversionOpportunity: 'low' | 'medium' | 'high'
  decisionEnginePriority: number
  expectedBusinessReturn: {
    label: string
    reasoning: string
  }
  generatedAt: string
}

interface Ctx {
  projectId: string
}

export async function moneyPageIntelligence(
  ctx: Ctx,
  pageUrl: string,
): Promise<MoneyPageIntelligence | null> {
  return withLatency('moneyPageIntelligence', async () => {
    const prisma = getPrismaClient()
    const node = await prisma.knowledgeGraphNode.findFirst({
      where: {
        projectId: ctx.projectId,
        nodeType: NODE_TYPES.MONEY_PAGE,
        nodeUrl: pageUrl,
      },
    })
    if (!node) return null

    const [supportEdges, mentionEdges, schemaEdges, topicEdges] = await Promise.all([
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
          relationshipType: EDGE_TYPES.PAGE_MENTIONS_ENTITY,
        },
        include: { toNode: true },
      }),
      prisma.knowledgeGraphEdge.findMany({
        where: {
          projectId: ctx.projectId,
          fromNodeId: node.nodeId,
          relationshipType: EDGE_TYPES.PAGE_CONTAINS_SCHEMA,
        },
        include: { toNode: true },
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

    const [coreEntities, expectedSchema, peerTopics] = await Promise.all([
      prisma.knowledgeGraphNode.findMany({
        where: { projectId: ctx.projectId, nodeType: NODE_TYPES.ENTITY, isCore: true },
      }),
      expectedSchemaForMoneyPage(ctx, node),
      peerMoneyPageTopics(ctx, node),
    ])

    const missingEntities = coreEntities
      .filter((e) => !mentionEdges.some((m) => m.toNode?.nodeId === e.nodeId))
      .map((e) => e.nodeLabel)
      .slice(0, 10)

    const missingSchema = expectedSchema
      .filter((s) => !schemaEdges.some((se) => se.toNode?.nodeLabel === s))
      .slice(0, 10)

    const currentTopicIds = new Set(topicEdges.map((e) => e.toNode?.nodeId))
    const missingTopics = peerTopics.filter((t) => !currentTopicIds.has(t.id)).map((t) => t.label)

    const weaknesses: string[] = []
    if (supportEdges.length === 0) weaknesses.push('No supporting content')
    if (supportEdges.length < 3) weaknesses.push('Fewer than 3 supporting pages')
    if (node.score < 50) weaknesses.push(`Low quality score (${Math.round(node.score)})`)
    if (missingEntities.length) weaknesses.push(`Missing ${missingEntities.length} core entities`)
    if (missingSchema.length) weaknesses.push(`Missing ${missingSchema.length} recommended schema types`)
    if (missingTopics.length >= 3) weaknesses.push('Weaker topic coverage than peer money pages')

    const trafficRisk: MoneyPageIntelligence['trafficRisk'] =
      supportEdges.length === 0 || node.score < 30
        ? 'high'
        : supportEdges.length < 3 || node.score < 60
          ? 'medium'
          : 'low'

    const conversionOpportunity: MoneyPageIntelligence['conversionOpportunity'] =
      missingEntities.length > 3 || missingSchema.length > 2
        ? 'high'
        : missingEntities.length > 0
          ? 'medium'
          : 'low'

    const decisionEnginePriority =
      (trafficRisk === 'high' ? 40 : trafficRisk === 'medium' ? 20 : 5) +
      (conversionOpportunity === 'high' ? 40 : conversionOpportunity === 'medium' ? 20 : 5) +
      (node.isCore ? 20 : 0)

    return {
      moneyPage: {
        nodeId: node.nodeId,
        label: node.nodeLabel,
        url: node.nodeUrl,
        score: node.score,
        isCore: node.isCore,
      },
      supports: supportEdges.map((e) => ({
        pageNodeId: e.fromNode?.nodeId ?? e.fromNodeId,
        label: e.fromNode?.nodeLabel ?? e.fromNodeId,
        url: e.fromNode?.nodeUrl ?? null,
        confidence: e.confidence,
      })),
      weaknesses,
      missing: {
        supportingContent: Math.max(0, 5 - supportEdges.length),
        internalLinks: Math.max(0, 3 - supportEdges.filter((e) => e.confidence > 0.7).length),
        entities: missingEntities,
        schema: missingSchema,
        topics: missingTopics.slice(0, 10),
      },
      trafficRisk,
      conversionOpportunity,
      decisionEnginePriority,
      expectedBusinessReturn: {
        label:
          trafficRisk === 'high' && conversionOpportunity === 'high'
            ? 'High'
            : trafficRisk === 'low' && conversionOpportunity === 'low'
              ? 'Maintenance'
              : 'Medium',
        reasoning: `Traffic risk ${trafficRisk}, conversion opportunity ${conversionOpportunity}, ${supportEdges.length} supporting pages, ${missingEntities.length} missing entities`,
      },
      generatedAt: new Date().toISOString(),
    }
  })
}

export async function moneyPagePortfolio(ctx: Ctx): Promise<MoneyPageIntelligence[]> {
  return withLatency('moneyPagePortfolio', async () => {
    const prisma = getPrismaClient()
    const moneyPages = await prisma.knowledgeGraphNode.findMany({
      where: { projectId: ctx.projectId, nodeType: NODE_TYPES.MONEY_PAGE },
    })
    const results: MoneyPageIntelligence[] = []
    // Serial to keep DB load predictable; portfolios are typically small (<200).
    for (const mp of moneyPages) {
      if (!mp.nodeUrl) continue
      const intel = await moneyPageIntelligence(ctx, mp.nodeUrl)
      if (intel) results.push(intel)
    }
    return results.sort((a, b) => b.decisionEnginePriority - a.decisionEnginePriority)
  })
}

async function expectedSchemaForMoneyPage(
  ctx: Ctx,
  node: KnowledgeGraphNode,
): Promise<string[]> {
  const prisma = getPrismaClient()
  const businessProfile = await prisma.businessProfile.findFirst({
    where: { projectId: ctx.projectId },
  })
  const industry = businessProfile?.industry ?? ''

  // Sensible per-industry defaults; tuned defensively to avoid false positives.
  const defaults = ['LocalBusiness', 'Service', 'BreadcrumbList']
  if (industry.includes('law')) return [...defaults, 'LegalService', 'AttorneyService']
  if (industry.includes('medic') || industry.includes('dental'))
    return [...defaults, 'MedicalBusiness', 'MedicalService']
  if (industry.includes('ecommerce')) return ['Product', 'Offer', 'AggregateRating', 'Review']
  if (industry.includes('saas'))
    return ['SoftwareApplication', 'Product', 'AggregateRating', 'Organization']
  return defaults
}

async function peerMoneyPageTopics(
  ctx: Ctx,
  node: KnowledgeGraphNode,
): Promise<Array<{ id: string; label: string }>> {
  const prisma = getPrismaClient()
  const edges = await prisma.knowledgeGraphEdge.findMany({
    where: {
      projectId: ctx.projectId,
      relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC,
      fromNode: {
        nodeType: NODE_TYPES.MONEY_PAGE,
        nodeId: { not: node.nodeId },
      },
    },
    include: { toNode: true },
  })
  const seen = new Map<string, { id: string; label: string }>()
  for (const e of edges) {
    if (!e.toNode) continue
    seen.set(e.toNode.nodeId, { id: e.toNode.nodeId, label: e.toNode.nodeLabel })
  }
  return Array.from(seen.values())
}
