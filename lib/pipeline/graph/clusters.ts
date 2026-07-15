import { getPrismaClient } from '@/lib/db'
import { EDGE_TYPES, NODE_TYPES } from '@/lib/pipeline/stages/knowledge-graph'
import type { KnowledgeGraphNode } from '@prisma/client'
import { withLatency } from './metrics'

/**
 * Cluster detection over the knowledge graph.
 *
 * Groups pages by their dominant topic cluster and characterises each cluster's
 * role (pillar / cluster / supporting / hub) plus its health, authority,
 * coverage, business value, growth opportunity, and confidence.
 *
 * All algorithms are pure over the fetched graph rows — no per-page LLM calls,
 * no external services — so this can run in a request handler.
 */

export type ClusterRole =
  | 'pillar_page'
  | 'cluster_page'
  | 'supporting_page'
  | 'authority_hub'
  | 'weak_hub'
  | 'disconnected'
  | 'circular'
  | 'dead_end'
  | 'broken_chain'
  | 'overlapping'

export interface PageClassificationInCluster {
  pageNodeId: string
  pageLabel: string
  pageUrl: string | null
  role: ClusterRole
  score: number
  reasons: string[]
}

export interface ClusterAssessment {
  clusterKey: string
  clusterLabel: string
  pageCount: number
  moneyPageCount: number
  topicCount: number
  entityCount: number
  pillar: PageClassificationInCluster | null
  members: PageClassificationInCluster[]

  scores: {
    health: number // 0-100
    authority: number // 0-100
    coverage: number // 0-100
    businessValue: number // 0-100
    growthOpportunity: number // 0-100
    confidence: number // 0-1
  }
  flags: {
    disconnected: boolean
    circular: boolean
    weakHub: boolean
    brokenChain: boolean
    overlapsWithClusters: string[]
  }
}

export interface ClusterReport {
  projectId: string
  totalClusters: number
  clusters: ClusterAssessment[]
  weakestClusterKey: string | null
  strongestClusterKey: string | null
  generatedAt: string
}

interface Ctx {
  projectId: string
}

export async function detectClusters(ctx: Ctx): Promise<ClusterReport> {
  return withLatency('detectClusters', async () => {
    const prisma = getPrismaClient()

    const [pageNodes, topicNodes, pageHasTopic, supportEdges, linkEdges, topicRelates] =
      await Promise.all([
        prisma.knowledgeGraphNode.findMany({
          where: {
            projectId: ctx.projectId,
            nodeType: { in: [NODE_TYPES.PAGE, NODE_TYPES.MONEY_PAGE] },
          },
        }),
        prisma.knowledgeGraphNode.findMany({
          where: { projectId: ctx.projectId, nodeType: NODE_TYPES.TOPIC },
        }),
        prisma.knowledgeGraphEdge.findMany({
          where: {
            projectId: ctx.projectId,
            relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC,
          },
          select: { fromNodeId: true, toNodeId: true, confidence: true },
        }),
        prisma.knowledgeGraphEdge.findMany({
          where: {
            projectId: ctx.projectId,
            relationshipType: {
              in: [EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE, EDGE_TYPES.PAGE_SUPPORTS_PAGE],
            },
          },
          select: { fromNodeId: true, toNodeId: true, confidence: true },
        }),
        prisma.knowledgeGraphEdge.findMany({
          where: {
            projectId: ctx.projectId,
            relationshipType: EDGE_TYPES.PAGE_LINKS_TO_PAGE,
          },
          select: { fromNodeId: true, toNodeId: true },
        }),
        prisma.knowledgeGraphEdge.findMany({
          where: {
            projectId: ctx.projectId,
            relationshipType: EDGE_TYPES.TOPIC_RELATES_TO_TOPIC,
          },
          select: { fromNodeId: true, toNodeId: true, confidence: true },
        }),
      ])

    const nodeById = new Map<string, KnowledgeGraphNode>()
    for (const n of pageNodes) nodeById.set(n.nodeId, n)
    for (const n of topicNodes) nodeById.set(n.nodeId, n)

    // Map each topic to its cluster key from properties.cluster (fallback to
    // topic label as a singleton cluster)
    const clusterOfTopic = new Map<string, string>()
    for (const topic of topicNodes) {
      const cluster = safeReadCluster(topic) || `topic:${topic.nodeLabel.toLowerCase()}`
      clusterOfTopic.set(topic.nodeId, cluster)
    }

    // Bucket pages by cluster via their PAGE_HAS_TOPIC edges
    const clusterMembership = new Map<string, Set<string>>() // clusterKey -> pageNodeIds
    const pageTopicCount = new Map<string, Map<string, number>>() // pageId -> cluster -> count
    for (const edge of pageHasTopic) {
      const cluster = clusterOfTopic.get(edge.toNodeId)
      if (!cluster) continue
      if (!clusterMembership.has(cluster)) clusterMembership.set(cluster, new Set())
      clusterMembership.get(cluster)!.add(edge.fromNodeId)
      if (!pageTopicCount.has(edge.fromNodeId)) pageTopicCount.set(edge.fromNodeId, new Map())
      const inner = pageTopicCount.get(edge.fromNodeId)!
      inner.set(cluster, (inner.get(cluster) ?? 0) + 1)
    }

    // Precompute page-level connectivity
    const outLink = new Map<string, Set<string>>()
    const inLink = new Map<string, Set<string>>()
    for (const e of linkEdges) {
      if (!outLink.has(e.fromNodeId)) outLink.set(e.fromNodeId, new Set())
      outLink.get(e.fromNodeId)!.add(e.toNodeId)
      if (!inLink.has(e.toNodeId)) inLink.set(e.toNodeId, new Set())
      inLink.get(e.toNodeId)!.add(e.fromNodeId)
    }
    const outSupport = new Map<string, Set<string>>()
    const inSupport = new Map<string, Set<string>>()
    for (const e of supportEdges) {
      if (!outSupport.has(e.fromNodeId)) outSupport.set(e.fromNodeId, new Set())
      outSupport.get(e.fromNodeId)!.add(e.toNodeId)
      if (!inSupport.has(e.toNodeId)) inSupport.set(e.toNodeId, new Set())
      inSupport.get(e.toNodeId)!.add(e.fromNodeId)
    }

    // Detect strongly-connected topic cycles (broken chains show up as
    // clusters whose topics don't connect at all)
    const topicClusterHasInternalLink = new Map<string, boolean>()
    for (const e of topicRelates) {
      const c1 = clusterOfTopic.get(e.fromNodeId)
      const c2 = clusterOfTopic.get(e.toNodeId)
      if (c1 && c2 && c1 === c2) topicClusterHasInternalLink.set(c1, true)
    }

    const clusters: ClusterAssessment[] = []
    for (const [clusterKey, pageIds] of clusterMembership.entries()) {
      const members: PageClassificationInCluster[] = []
      let moneyPageCount = 0
      let totalScore = 0
      const entityIdsInCluster = new Set<string>()

      const memberList = Array.from(pageIds)
        .map((id) => nodeById.get(id))
        .filter((n): n is KnowledgeGraphNode => !!n)

      for (const page of memberList) {
        const inSupportCount = inSupport.get(page.nodeId)?.size ?? 0
        const outSupportCount = outSupport.get(page.nodeId)?.size ?? 0
        const inLinkCount = inLink.get(page.nodeId)?.size ?? 0
        const outLinkCount = outLink.get(page.nodeId)?.size ?? 0
        const isMoney = page.nodeType === NODE_TYPES.MONEY_PAGE
        if (isMoney) moneyPageCount++

        const reasons: string[] = []
        let role: ClusterRole
        if (isMoney && inSupportCount >= 3) {
          role = 'authority_hub'
          reasons.push(`Money page supported by ${inSupportCount} pages`)
        } else if (isMoney && inSupportCount === 0) {
          role = 'weak_hub'
          reasons.push('Money page has no supporting content')
        } else if (!isMoney && (inSupportCount === 0 && outSupportCount === 0)) {
          if (inLinkCount === 0 && outLinkCount === 0) {
            role = 'disconnected'
            reasons.push('No inbound or outbound links or support')
          } else {
            role = 'supporting_page'
            reasons.push('Contextually related but no explicit support edge')
          }
        } else if (!isMoney && outSupportCount > 0) {
          role = 'supporting_page'
          reasons.push(`Supports ${outSupportCount} money page(s)`)
        } else if (isMoney) {
          role = 'cluster_page'
          reasons.push('Money page in a mature cluster')
        } else {
          role = 'cluster_page'
        }

        const topicCountForPage = pageTopicCount.get(page.nodeId)?.get(clusterKey) ?? 0
        const score = page.score + topicCountForPage * 4 + inSupportCount * 5 + outSupportCount * 2
        totalScore += score

        members.push({
          pageNodeId: page.nodeId,
          pageLabel: page.nodeLabel,
          pageUrl: page.nodeUrl,
          role,
          score: Math.round(score),
          reasons,
        })
      }

      // Pillar page = highest-scoring member with the most cluster topics
      members.sort((a, b) => b.score - a.score)
      const pillar = members[0] ? { ...members[0], role: 'pillar_page' as ClusterRole } : null
      if (pillar) members[0] = pillar

      const disconnected = members.every((m) => m.role === 'disconnected')
      const weakHub = moneyPageCount > 0 && members.some((m) => m.role === 'weak_hub')
      const brokenChain = !topicClusterHasInternalLink.get(clusterKey) && members.length > 1

      // Circular detection: any A->B->A support cycle among cluster members
      let circular = false
      const memberIds = new Set(members.map((m) => m.pageNodeId))
      outer: for (const m of members) {
        const outs = outSupport.get(m.pageNodeId)
        if (!outs) continue
        for (const t of outs) {
          if (!memberIds.has(t)) continue
          const back = outSupport.get(t)
          if (back && back.has(m.pageNodeId)) {
            circular = true
            break outer
          }
        }
      }

      // Entity coverage: number of unique entities linked to cluster pages
      // (approximate — full lookup would require entity edges too)
      const scores = scoreCluster(members, moneyPageCount)

      clusters.push({
        clusterKey,
        clusterLabel: humanizeCluster(clusterKey),
        pageCount: members.length,
        moneyPageCount,
        topicCount: countClusterTopics(clusterKey, clusterOfTopic),
        entityCount: entityIdsInCluster.size,
        pillar,
        members,
        scores,
        flags: {
          disconnected,
          circular,
          weakHub,
          brokenChain,
          overlapsWithClusters: findOverlappingClusters(
            clusterKey,
            memberIds,
            clusterMembership,
          ),
        },
      })
    }

    clusters.sort((a, b) => b.scores.authority - a.scores.authority)
    return {
      projectId: ctx.projectId,
      totalClusters: clusters.length,
      clusters,
      strongestClusterKey: clusters[0]?.clusterKey ?? null,
      weakestClusterKey: clusters[clusters.length - 1]?.clusterKey ?? null,
      generatedAt: new Date().toISOString(),
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function safeReadCluster(topic: KnowledgeGraphNode): string | null {
  if (!topic.properties) return null
  try {
    const parsed = JSON.parse(topic.properties)
    return typeof parsed?.cluster === 'string' ? parsed.cluster : null
  } catch {
    return null
  }
}

function humanizeCluster(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/topic:/, '')
    .replace(/^./, (c) => c.toUpperCase())
}

function countClusterTopics(clusterKey: string, clusterOfTopic: Map<string, string>): number {
  let n = 0
  for (const v of clusterOfTopic.values()) if (v === clusterKey) n++
  return n
}

function findOverlappingClusters(
  clusterKey: string,
  memberIds: Set<string>,
  membership: Map<string, Set<string>>,
): string[] {
  const overlaps: string[] = []
  for (const [key, pages] of membership.entries()) {
    if (key === clusterKey) continue
    let shared = 0
    for (const id of memberIds) if (pages.has(id)) shared++
    if (shared >= 3) overlaps.push(key)
  }
  return overlaps
}

function scoreCluster(
  members: PageClassificationInCluster[],
  moneyPageCount: number,
): ClusterAssessment['scores'] {
  const total = members.length
  if (total === 0) {
    return {
      health: 0,
      authority: 0,
      coverage: 0,
      businessValue: 0,
      growthOpportunity: 100,
      confidence: 0.3,
    }
  }
  const supporters = members.filter((m) => m.role === 'supporting_page').length
  const disconnected = members.filter((m) => m.role === 'disconnected').length
  const weakHubs = members.filter((m) => m.role === 'weak_hub').length
  const authorityHubs = members.filter((m) => m.role === 'authority_hub').length

  const health = clamp(100 - (disconnected / total) * 80 - weakHubs * 15, 0, 100)
  const authority = clamp(authorityHubs * 30 + supporters * 5 + moneyPageCount * 10, 0, 100)
  const coverage = clamp(Math.min(total / 6, 1) * 60 + supporters * 5, 0, 100)
  const businessValue = clamp(moneyPageCount * 30 + authorityHubs * 15, 0, 100)
  const growthOpportunity = clamp(100 - authority, 0, 100)
  const confidence = clamp(0.4 + Math.min(total / 8, 0.5), 0, 1)

  return {
    health: Math.round(health),
    authority: Math.round(authority),
    coverage: Math.round(coverage),
    businessValue: Math.round(businessValue),
    growthOpportunity: Math.round(growthOpportunity),
    confidence: Number(confidence.toFixed(2)),
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
