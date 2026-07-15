import { getPrismaClient } from '@/lib/db'
import { scorePageForObjective, rankPagesForObjective } from '@/lib/content-engine/decision-engine-improved'
import type { Page } from '@prisma/client'
import { buildNodeId, NODE_TYPES, EDGE_TYPES } from '../stages/knowledge-graph'
import { moneyPageIntelligence } from '../graph/money-pages'

export async function calculateDecisionEngine(
  pages: Page[],
  context: { organizationId: string; projectId: string; auditId: string },
) {
  const prisma = getPrismaClient()
  let pagesScored = 0

  try {
    // Get business profile to determine industry
    const businessProfile = await prisma.businessProfile.findFirst({
      where: { projectId: context.projectId },
    })

    const industry = (businessProfile?.industry || 'saas') as any

    // Score each page for different objectives
    const objectives = ['lead_generation', 'authority', 'conversion', 'brand_awareness', 'retention']

    // Pre-load graph signals in bulk — one query, not one-per-page.
    const graphSignals = await loadGraphSignals(context.projectId, pages.map((p) => p.url))

    for (const page of pages) {
      try {
        const classification = await prisma.pageClassification.findUnique({
          where: {
            projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url },
          },
        })

        const signals = graphSignals.get(page.url) ?? emptyGraphSignals()

        // Prepare page data for scoring
        const pageData = {
          url: page.url,
          pageType: classification?.primaryClassification || 'informational',
          wordCount: page.contentLength,
          industry,
          metadata: {
            hasSchema: page.schemaTypes ? JSON.parse(page.schemaTypes).length > 0 : false,
            internalLinks: page.internalLinks,
            inboundCount: page.inboundCount,
          },
        }

        // Score for each objective
        for (const objective of objectives) {
          try {
            const score = scorePageForObjective(pageData, objective as any)

            // Boost business value / SEO opportunity with graph evidence so
            // the ranking reflects money-page support, topic coverage, and
            // objective alignment — not just page-local metrics.
            const graphBoost = computeGraphBoost(objective, signals)
            const businessValue = clamp(
              Math.round(score.components.baseScore + graphBoost.businessValue),
              0,
              100,
            )
            const seoOpportunity = clamp(
              Math.round(score.components.objectiveScore + graphBoost.seoOpportunity),
              0,
              100,
            )
            const confidence = clamp(score.score / 100 + graphBoost.confidenceLift, 0, 1)

            await prisma.recommendationDecision.upsert({
              where: {
                projectId_pageUrl_recommendationType: {
                  projectId: context.projectId,
                  pageUrl: page.url,
                  recommendationType: objective,
                },
              },
              create: {
                organizationId: context.organizationId,
                projectId: context.projectId,
                pageUrl: page.url,
                recommendationType: objective,
                businessValue,
                seoOpportunity,
                expectedBusinessReturn: {
                  scoreComponents: score.components,
                  reasoning: score.reasoning,
                  graphSignals: JSON.parse(JSON.stringify(signals)),
                  graphBoost: JSON.parse(JSON.stringify(graphBoost)),
                },
                difficulty: 5,
                riskLevel: 'Low',
                estimatedTime: 60,
                timeToWin: 'Short Term',
                dependencies: [],
                whyThis: buildWhyThis(objective, signals),
                whyNow: buildWhyNow(objective, signals),
                whyThisPage: `${pageData.pageType} — ${signals.isMoneyPage ? 'money page' : 'content page'}; ${signals.supportingCount} supporting pages, ${signals.topicCount} topics`,
                whyThisPriority: buildWhyPriority(objective, signals),
                confidence,
                dataSupporting: {
                  score: score.score,
                  components: score.components,
                  reasoning: score.reasoning,
                  graphSignals: JSON.parse(JSON.stringify(signals)),
                  graphBoost: JSON.parse(JSON.stringify(graphBoost)),
                },
              },
              update: {
                businessValue,
                seoOpportunity,
                confidence,
                expectedBusinessReturn: {
                  scoreComponents: score.components,
                  reasoning: score.reasoning,
                  graphSignals: JSON.parse(JSON.stringify(signals)),
                  graphBoost: JSON.parse(JSON.stringify(graphBoost)),
                },
                whyThis: buildWhyThis(objective, signals),
                whyNow: buildWhyNow(objective, signals),
              },
            })
          } catch (e) {
            console.error(`Failed to score ${page.url} for objective ${objective}:`, e)
          }
        }

        pagesScored++
      } catch (error) {
        console.error(`Failed to process page ${page.url}:`, error)
      }
    }

    return { pagesScored }
  } catch (error) {
    console.error('Failed to calculate decision engine scores:', error)
    return { pagesScored }
  }
}

interface GraphSignals {
  isMoneyPage: boolean
  supportingCount: number
  topicCount: number
  entityCount: number
  objectiveAligned: boolean
  weakness: number // 0-1 (higher = weaker)
}

function emptyGraphSignals(): GraphSignals {
  return {
    isMoneyPage: false,
    supportingCount: 0,
    topicCount: 0,
    entityCount: 0,
    objectiveAligned: false,
    weakness: 0,
  }
}

async function loadGraphSignals(
  projectId: string,
  urls: string[],
): Promise<Map<string, GraphSignals>> {
  const prisma = getPrismaClient()
  const nodeIds = urls.flatMap((u) => [
    buildNodeId(NODE_TYPES.PAGE, u),
    buildNodeId(NODE_TYPES.MONEY_PAGE, u),
  ])

  const [nodes, incomingSupport, outgoingTopic, outgoingEntity, outgoingObjective] =
    await Promise.all([
      prisma.knowledgeGraphNode.findMany({
        where: { projectId, nodeId: { in: nodeIds } },
      }),
      prisma.knowledgeGraphEdge.groupBy({
        by: ['toNodeId'],
        where: {
          projectId,
          toNodeId: { in: nodeIds },
          relationshipType: EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
        },
        _count: { _all: true },
      }),
      prisma.knowledgeGraphEdge.groupBy({
        by: ['fromNodeId'],
        where: {
          projectId,
          fromNodeId: { in: nodeIds },
          relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC,
        },
        _count: { _all: true },
      }),
      prisma.knowledgeGraphEdge.groupBy({
        by: ['fromNodeId'],
        where: {
          projectId,
          fromNodeId: { in: nodeIds },
          relationshipType: EDGE_TYPES.PAGE_MENTIONS_ENTITY,
        },
        _count: { _all: true },
      }),
      prisma.knowledgeGraphEdge.findMany({
        where: {
          projectId,
          fromNodeId: { in: nodeIds },
          relationshipType: EDGE_TYPES.PAGE_TARGETS_OBJECTIVE,
        },
        select: { fromNodeId: true },
      }),
    ])

  const supportByNode = new Map(incomingSupport.map((r) => [r.toNodeId, r._count._all]))
  const topicByNode = new Map(outgoingTopic.map((r) => [r.fromNodeId, r._count._all]))
  const entityByNode = new Map(outgoingEntity.map((r) => [r.fromNodeId, r._count._all]))
  const objectiveByNode = new Set(outgoingObjective.map((r) => r.fromNodeId))

  const byUrl = new Map<string, GraphSignals>()
  for (const url of urls) {
    const pageNodeId = buildNodeId(NODE_TYPES.PAGE, url)
    const moneyNodeId = buildNodeId(NODE_TYPES.MONEY_PAGE, url)
    const nodeMatch = nodes.find((n) => n.nodeId === pageNodeId || n.nodeId === moneyNodeId)
    const nodeId = nodeMatch?.nodeId
    const isMoneyPage = nodeMatch?.nodeType === NODE_TYPES.MONEY_PAGE
    const supportingCount = nodeId ? supportByNode.get(nodeId) ?? 0 : 0
    const topicCount = nodeId ? topicByNode.get(nodeId) ?? 0 : 0
    const entityCount = nodeId ? entityByNode.get(nodeId) ?? 0 : 0
    const objectiveAligned = nodeId ? objectiveByNode.has(nodeId) : false

    const weakness = clamp(
      (isMoneyPage && supportingCount === 0 ? 0.4 : 0) +
        (topicCount === 0 ? 0.25 : 0) +
        (entityCount === 0 ? 0.15 : 0) +
        (isMoneyPage && !objectiveAligned ? 0.2 : 0),
      0,
      1,
    )
    byUrl.set(url, {
      isMoneyPage,
      supportingCount,
      topicCount,
      entityCount,
      objectiveAligned,
      weakness,
    })
  }
  return byUrl
}

function computeGraphBoost(
  objective: string,
  signals: GraphSignals,
): { businessValue: number; seoOpportunity: number; confidenceLift: number } {
  let businessValue = 0
  let seoOpportunity = 0
  let confidenceLift = 0

  if (signals.isMoneyPage) {
    businessValue += 15
    if (signals.supportingCount === 0) {
      seoOpportunity += 20 // huge opportunity: money page with no support
      confidenceLift += 0.05
    } else {
      seoOpportunity += Math.min(signals.supportingCount * 2, 10)
    }
    if (objective === 'conversion' || objective === 'lead_generation') businessValue += 10
  }
  if (signals.objectiveAligned) businessValue += 8
  if (signals.topicCount >= 3) seoOpportunity += 5
  if (signals.weakness > 0.5) {
    // Weaker pages get a bigger uplift because fixing them yields more headroom
    seoOpportunity += Math.round(signals.weakness * 10)
    confidenceLift += 0.05
  }
  return { businessValue, seoOpportunity, confidenceLift }
}

function buildWhyThis(objective: string, s: GraphSignals): string {
  if (s.isMoneyPage && s.supportingCount === 0) {
    return `Money page has no supporting content — prioritized for ${objective}`
  }
  if (s.isMoneyPage) {
    return `Money page with ${s.supportingCount} supporting page(s), tuned for ${objective}`
  }
  if (s.topicCount >= 3) return `Broad topic coverage (${s.topicCount} topics) — reinforces ${objective}`
  return `Prioritized for ${objective} based on graph coverage`
}
function buildWhyNow(_objective: string, s: GraphSignals): string {
  if (s.weakness > 0.5) return 'Highest graph-derived opportunity — significant gaps detected'
  if (s.supportingCount === 0 && s.isMoneyPage) return 'Money page currently lacks supporting content'
  return 'Business opportunity identified in the knowledge graph'
}
function buildWhyPriority(_objective: string, s: GraphSignals): string {
  const parts: string[] = []
  if (s.isMoneyPage) parts.push('money page')
  if (s.objectiveAligned) parts.push('aligned with active objective')
  if (s.weakness > 0.5) parts.push('high weakness score')
  return parts.length ? parts.join(', ') : 'Strategic business value'
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
