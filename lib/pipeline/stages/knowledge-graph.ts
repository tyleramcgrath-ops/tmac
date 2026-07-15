import { getPrismaClient } from '@/lib/db'
import type { Page } from '@prisma/client'

export const KG_BUILDER_VERSION = 1

// ─────────────────────────────────────────────────────────────────────────────
// Node & edge type registries. Kept as string constants (not enums) so external
// callers can extend without a schema migration.
// ─────────────────────────────────────────────────────────────────────────────

export const NODE_TYPES = {
  PAGE: 'page',
  TOPIC: 'topic',
  ENTITY: 'entity',
  SERVICE: 'service',
  PRODUCT: 'product',
  LOCATION: 'location',
  CATEGORY: 'category',
  FAQ: 'faq',
  AUTHOR: 'author',
  SCHEMA_TYPE: 'schema_type',
  MONEY_PAGE: 'money_page',
  BUSINESS_OBJECTIVE: 'business_objective',
} as const

export const EDGE_TYPES = {
  PAGE_HAS_TOPIC: 'PAGE_HAS_TOPIC',
  PAGE_MENTIONS_ENTITY: 'PAGE_MENTIONS_ENTITY',
  PAGE_SUPPORTS_PAGE: 'PAGE_SUPPORTS_PAGE',
  PAGE_SUPPORTS_MONEY_PAGE: 'PAGE_SUPPORTS_MONEY_PAGE',
  PAGE_LINKS_TO_PAGE: 'PAGE_LINKS_TO_PAGE',
  PAGE_TARGETS_LOCATION: 'PAGE_TARGETS_LOCATION',
  PAGE_OFFERS_SERVICE: 'PAGE_OFFERS_SERVICE',
  PAGE_DESCRIBES_PRODUCT: 'PAGE_DESCRIBES_PRODUCT',
  PAGE_CONTAINS_SCHEMA: 'PAGE_CONTAINS_SCHEMA',
  PAGE_HAS_FAQ: 'PAGE_HAS_FAQ',
  PAGE_TARGETS_OBJECTIVE: 'PAGE_TARGETS_OBJECTIVE',
  ENTITY_RELATES_TO_ENTITY: 'ENTITY_RELATES_TO_ENTITY',
  TOPIC_RELATES_TO_TOPIC: 'TOPIC_RELATES_TO_TOPIC',
  SERVICE_RELATES_TO_LOCATION: 'SERVICE_RELATES_TO_LOCATION',
  CATEGORY_CONTAINS_PRODUCT: 'CATEGORY_CONTAINS_PRODUCT',
  AUTHOR_WROTE_PAGE: 'AUTHOR_WROTE_PAGE',
} as const

type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES]
type EdgeType = (typeof EDGE_TYPES)[keyof typeof EDGE_TYPES]

interface NodeInput {
  nodeType: NodeType
  nodeLabel: string
  nodeUrl?: string
  isCore?: boolean
  coreReason?: string
  properties?: Record<string, unknown>
  score?: number
}

interface EdgeInput {
  fromNodeId: string
  toNodeId: string
  relationshipType: EdgeType
  confidence: number
  evidence?: Record<string, unknown> | string
  source?: string
  sources?: string[]
}

interface GraphBuildResult {
  nodesCreated: number
  nodesUpdated: number
  edgesCreated: number
  edgesUpdated: number
  breakdown: {
    nodesByType: Record<string, number>
    edgesByType: Record<string, number>
  }
}

export function buildNodeId(nodeType: NodeType, label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
  return `${nodeType}:${slug || 'unknown'}`
}

/**
 * Builds the full SEO knowledge graph from persisted pipeline data.
 *
 * Emits typed nodes for pages, topics, entities, services, products,
 * locations, categories, faqs, authors, schema types, money pages and
 * business objectives — plus the rich relationship set from Phase 7.8G.
 * Every edge is written with confidence + evidence + source + version.
 */
export async function buildKnowledgeGraph(
  context: { organizationId: string; projectId: string },
  _entityResults: unknown[],
  _topicResults: unknown[],
): Promise<GraphBuildResult> {
  const prisma = getPrismaClient()

  const nodesByType: Record<string, number> = {}
  const edgesByType: Record<string, number> = {}
  let nodesCreated = 0
  let nodesUpdated = 0
  let edgesCreated = 0
  let edgesUpdated = 0

  const bumpNode = (t: string, created: boolean) => {
    nodesByType[t] = (nodesByType[t] || 0) + 1
    if (created) nodesCreated++
    else nodesUpdated++
  }
  const bumpEdge = (t: string, created: boolean) => {
    edgesByType[t] = (edgesByType[t] || 0) + 1
    if (created) edgesCreated++
    else edgesUpdated++
  }

  const upsertNode = async (n: NodeInput): Promise<string> => {
    const nodeId = buildNodeId(n.nodeType, n.nodeUrl ?? n.nodeLabel)
    const properties = n.properties ? JSON.stringify(n.properties) : null
    const existing = await prisma.knowledgeGraphNode.findUnique({
      where: { projectId_nodeId: { projectId: context.projectId, nodeId } },
      select: { id: true, version: true },
    })
    await prisma.knowledgeGraphNode.upsert({
      where: { projectId_nodeId: { projectId: context.projectId, nodeId } },
      create: {
        organizationId: context.organizationId,
        projectId: context.projectId,
        nodeId,
        nodeType: n.nodeType,
        nodeLabel: n.nodeLabel,
        nodeUrl: n.nodeUrl,
        properties,
        isCore: n.isCore ?? false,
        coreReason: n.coreReason,
        score: n.score ?? 0,
        version: KG_BUILDER_VERSION,
      },
      update: {
        nodeLabel: n.nodeLabel,
        nodeUrl: n.nodeUrl,
        properties,
        isCore: n.isCore ?? undefined,
        coreReason: n.coreReason ?? undefined,
        score: n.score ?? undefined,
        frequency: { increment: 1 },
        version: KG_BUILDER_VERSION,
      },
    })
    bumpNode(n.nodeType, !existing)
    return nodeId
  }

  const upsertEdge = async (e: EdgeInput): Promise<void> => {
    if (e.fromNodeId === e.toNodeId) return // no self-loops
    const evidence =
      typeof e.evidence === 'string' ? e.evidence : e.evidence ? JSON.stringify(e.evidence) : null
    const existing = await prisma.knowledgeGraphEdge.findUnique({
      where: {
        projectId_fromNodeId_toNodeId_relationshipType: {
          projectId: context.projectId,
          fromNodeId: e.fromNodeId,
          toNodeId: e.toNodeId,
          relationshipType: e.relationshipType,
        },
      },
      select: { id: true },
    })
    await prisma.knowledgeGraphEdge.upsert({
      where: {
        projectId_fromNodeId_toNodeId_relationshipType: {
          projectId: context.projectId,
          fromNodeId: e.fromNodeId,
          toNodeId: e.toNodeId,
          relationshipType: e.relationshipType,
        },
      },
      create: {
        organizationId: context.organizationId,
        projectId: context.projectId,
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        relationshipType: e.relationshipType,
        confidence: clamp01(e.confidence),
        evidence,
        source: e.source ?? 'pipeline',
        sources: e.sources ?? [],
        version: KG_BUILDER_VERSION,
        detectedAt: new Date(),
      },
      update: {
        confidence: clamp01(Math.max(e.confidence, 0)),
        evidence: evidence ?? undefined,
        source: e.source ?? undefined,
        sources: e.sources && e.sources.length ? { set: dedupe(e.sources) } : undefined,
        strength: { increment: 1 },
        version: KG_BUILDER_VERSION,
        detectedAt: new Date(),
      },
    })
    bumpEdge(e.relationshipType, !existing)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Load persisted signals
  // ───────────────────────────────────────────────────────────────────────────

  const latestAudit = await prisma.audit.findFirst({
    where: { projectId: context.projectId },
    orderBy: { startedAt: 'desc' },
  })
  const pages: Page[] = latestAudit
    ? await prisma.page.findMany({ where: { auditId: latestAudit.id } })
    : []

  const [entities, topics, classifications, businessProfile, objectives] = await Promise.all([
    prisma.contentEntity.findMany({ where: { projectId: context.projectId } }),
    prisma.contentTopic.findMany({ where: { projectId: context.projectId } }),
    prisma.pageClassification.findMany({ where: { projectId: context.projectId } }),
    prisma.businessProfile.findFirst({ where: { projectId: context.projectId } }),
    prisma.businessObjective.findMany({
      where: { projectId: context.projectId, isActive: true },
    }),
  ])

  type ClassificationRow = (typeof classifications)[number]
  const classificationByUrl = new Map<string, ClassificationRow>(
    classifications.map((c) => [c.pageUrl, c]),
  )

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Page nodes (one per crawled URL, tagged as money_page when applicable)
  // ───────────────────────────────────────────────────────────────────────────

  const pageNodeIds = new Map<string, string>()
  for (const page of pages) {
    const cls = classificationByUrl.get(page.url)
    const primary = cls?.primaryClassification ?? 'informational'
    const isMoney = MONEY_PAGE_TYPES.has(primary)

    const nodeId = await upsertNode({
      nodeType: isMoney ? NODE_TYPES.MONEY_PAGE : NODE_TYPES.PAGE,
      nodeLabel: page.title || page.h1 || page.url,
      nodeUrl: page.url,
      isCore: isMoney,
      coreReason: isMoney ? `Classified as ${primary}` : undefined,
      score: (page.aiScore + page.technicalScore + page.contentScore + page.schemaScore) / 4,
      properties: {
        classification: primary,
        wordCount: page.contentLength,
        internalLinks: page.internalLinks,
        noindex: page.hasNoindex,
        canonical: page.canonical,
        schemaTypes: safeParseJsonArray(page.schemaTypes),
      },
    })
    pageNodeIds.set(page.url, nodeId)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Topic nodes + PAGE_HAS_TOPIC + TOPIC_RELATES_TO_TOPIC (cooccurrence)
  // ───────────────────────────────────────────────────────────────────────────

  const topicNodeIds = new Map<string, string>()
  const topicsPerPage = new Map<string, Set<string>>() // pageUrl -> Set<topicNodeId>

  for (const topic of topics) {
    const key = topic.topicName.toLowerCase()
    let nodeId = topicNodeIds.get(key)
    if (!nodeId) {
      nodeId = await upsertNode({
        nodeType: NODE_TYPES.TOPIC,
        nodeLabel: topic.topicName,
        properties: {
          cluster: topic.topicCluster,
          confidence: topic.confidence,
          detectionSignals: topic.detectionSignals,
        },
      })
      topicNodeIds.set(key, nodeId)
    }

    const pageNode = pageNodeIds.get(topic.pageUrl)
    if (pageNode) {
      await upsertEdge({
        fromNodeId: pageNode,
        toNodeId: nodeId,
        relationshipType: EDGE_TYPES.PAGE_HAS_TOPIC,
        confidence: topic.confidence,
        evidence: { signals: topic.detectionSignals, cluster: topic.topicCluster },
        source: 'pipeline',
        sources: [topic.pageUrl],
      })

      if (!topicsPerPage.has(topic.pageUrl)) topicsPerPage.set(topic.pageUrl, new Set())
      topicsPerPage.get(topic.pageUrl)!.add(nodeId)
    }
  }

  // Topic-to-topic cooccurrence edges
  const topicPairCounts = new Map<string, { a: string; b: string; count: number; pages: Set<string> }>()
  for (const [pageUrl, topicSet] of topicsPerPage.entries()) {
    const list = Array.from(topicSet)
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]].sort()
        const key = `${a}::${b}`
        const rec = topicPairCounts.get(key) ?? { a, b, count: 0, pages: new Set<string>() }
        rec.count++
        rec.pages.add(pageUrl)
        topicPairCounts.set(key, rec)
      }
    }
  }
  for (const { a, b, count, pages: pageSet } of topicPairCounts.values()) {
    if (count < 2) continue // require cooccurrence on 2+ pages
    await upsertEdge({
      fromNodeId: a,
      toNodeId: b,
      relationshipType: EDGE_TYPES.TOPIC_RELATES_TO_TOPIC,
      confidence: Math.min(0.5 + count * 0.1, 0.95),
      evidence: { cooccurrence: count },
      sources: Array.from(pageSet).slice(0, 10),
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Entity nodes + PAGE_MENTIONS_ENTITY + ENTITY_RELATES_TO_ENTITY
  // ───────────────────────────────────────────────────────────────────────────

  const entityNodeIds = new Map<string, string>()
  const entitiesPerPage = new Map<string, Set<string>>()

  for (const entity of entities) {
    const key = entity.entityName.toLowerCase()
    let nodeId = entityNodeIds.get(key)
    if (!nodeId) {
      nodeId = await upsertNode({
        nodeType: NODE_TYPES.ENTITY,
        nodeLabel: entity.entityName,
        properties: {
          entityType: entity.entityType,
          detectionSource: entity.detectionSource,
          confidence: entity.confidence,
        },
      })
      entityNodeIds.set(key, nodeId)
    }

    const pageNode = pageNodeIds.get(entity.pageUrl)
    if (pageNode) {
      await upsertEdge({
        fromNodeId: pageNode,
        toNodeId: nodeId,
        relationshipType: EDGE_TYPES.PAGE_MENTIONS_ENTITY,
        confidence: entity.confidence,
        evidence: {
          entityType: entity.entityType,
          detectionSource: entity.detectionSource,
          mentions: entity.mentions,
        },
        sources: [entity.pageUrl],
      })

      if (!entitiesPerPage.has(entity.pageUrl)) entitiesPerPage.set(entity.pageUrl, new Set())
      entitiesPerPage.get(entity.pageUrl)!.add(nodeId)
    }
  }

  const entityPairCounts = new Map<string, { a: string; b: string; count: number; pages: Set<string> }>()
  for (const [pageUrl, entitySet] of entitiesPerPage.entries()) {
    const list = Array.from(entitySet)
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]].sort()
        const key = `${a}::${b}`
        const rec = entityPairCounts.get(key) ?? { a, b, count: 0, pages: new Set<string>() }
        rec.count++
        rec.pages.add(pageUrl)
        entityPairCounts.set(key, rec)
      }
    }
  }
  for (const { a, b, count, pages: pageSet } of entityPairCounts.values()) {
    if (count < 2) continue
    await upsertEdge({
      fromNodeId: a,
      toNodeId: b,
      relationshipType: EDGE_TYPES.ENTITY_RELATES_TO_ENTITY,
      confidence: Math.min(0.4 + count * 0.1, 0.95),
      evidence: { cooccurrence: count },
      sources: Array.from(pageSet).slice(0, 10),
    })
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Schema-type nodes + PAGE_CONTAINS_SCHEMA
  // ───────────────────────────────────────────────────────────────────────────

  const schemaNodeIds = new Map<string, string>()
  for (const page of pages) {
    const schemas = safeParseJsonArray(page.schemaTypes)
    for (const schemaType of schemas) {
      let nodeId = schemaNodeIds.get(schemaType)
      if (!nodeId) {
        nodeId = await upsertNode({
          nodeType: NODE_TYPES.SCHEMA_TYPE,
          nodeLabel: schemaType,
          properties: { schemaOrg: true },
        })
        schemaNodeIds.set(schemaType, nodeId)
      }

      const pageNode = pageNodeIds.get(page.url)
      if (pageNode) {
        await upsertEdge({
          fromNodeId: pageNode,
          toNodeId: nodeId,
          relationshipType: EDGE_TYPES.PAGE_CONTAINS_SCHEMA,
          confidence: 0.95,
          evidence: { schemaType },
          sources: [page.url],
        })

        // FAQ detection
        if (schemaType === 'FAQPage') {
          const faqNodeId = await upsertNode({
            nodeType: NODE_TYPES.FAQ,
            nodeLabel: `FAQ: ${page.title || page.url}`,
            nodeUrl: page.url,
            properties: { source: 'schema.FAQPage' },
          })
          await upsertEdge({
            fromNodeId: pageNode,
            toNodeId: faqNodeId,
            relationshipType: EDGE_TYPES.PAGE_HAS_FAQ,
            confidence: 0.95,
            evidence: { source: 'schema.FAQPage' },
            sources: [page.url],
          })
        }
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Business profile: services, products, locations, objectives
  // ───────────────────────────────────────────────────────────────────────────

  const serviceNodeIds = new Map<string, string>()
  const locationNodeIds = new Map<string, string>()
  const productNodeIds = new Map<string, string>()
  const objectiveNodeIds = new Map<string, string>()

  if (businessProfile) {
    for (const service of collectStringItems(businessProfile.primaryServices)) {
      const id = await upsertNode({
        nodeType: NODE_TYPES.SERVICE,
        nodeLabel: service,
        isCore: service === businessProfile.highestValueService,
        coreReason: service === businessProfile.highestValueService ? 'Highest-value service' : undefined,
        properties: { tier: 'primary' },
      })
      serviceNodeIds.set(service.toLowerCase(), id)
    }
    for (const service of businessProfile.secondaryServices ?? []) {
      const id = await upsertNode({
        nodeType: NODE_TYPES.SERVICE,
        nodeLabel: service,
        properties: { tier: 'secondary' },
      })
      serviceNodeIds.set(service.toLowerCase(), id)
    }

    for (const loc of collectStringItems(businessProfile.primaryLocations)) {
      const id = await upsertNode({
        nodeType: NODE_TYPES.LOCATION,
        nodeLabel: loc,
        isCore: true,
        coreReason: 'Primary location',
      })
      locationNodeIds.set(loc.toLowerCase(), id)
    }
    for (const loc of businessProfile.expansionLocations ?? []) {
      const id = await upsertNode({
        nodeType: NODE_TYPES.LOCATION,
        nodeLabel: loc,
        properties: { tier: 'expansion' },
      })
      locationNodeIds.set(loc.toLowerCase(), id)
    }

    // Cross-links: each service is offered in each primary location
    for (const serviceId of serviceNodeIds.values()) {
      for (const locId of locationNodeIds.values()) {
        await upsertEdge({
          fromNodeId: serviceId,
          toNodeId: locId,
          relationshipType: EDGE_TYPES.SERVICE_RELATES_TO_LOCATION,
          confidence: 0.85,
          evidence: { source: 'businessProfile' },
          source: 'schema',
        })
      }
    }
  }

  for (const objective of objectives) {
    const id = await upsertNode({
      nodeType: NODE_TYPES.BUSINESS_OBJECTIVE,
      nodeLabel: objective.customObjective || objective.objectiveType,
      isCore: objective.isActive,
      properties: {
        type: objective.objectiveType,
        target: objective.targetMetric,
        priorityPageTypes: objective.priorityPageTypes,
      },
    })
    objectiveNodeIds.set(objective.id, id)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Page ↔ Service / Location matching (from title/h1/url)
  // ───────────────────────────────────────────────────────────────────────────

  for (const page of pages) {
    const pageNode = pageNodeIds.get(page.url)
    if (!pageNode) continue
    const haystack = [page.url, page.title ?? '', page.h1 ?? '', page.metaDescription ?? '']
      .join(' ')
      .toLowerCase()

    for (const [serviceLabel, serviceNode] of serviceNodeIds.entries()) {
      if (containsToken(haystack, serviceLabel)) {
        await upsertEdge({
          fromNodeId: pageNode,
          toNodeId: serviceNode,
          relationshipType: EDGE_TYPES.PAGE_OFFERS_SERVICE,
          confidence: 0.8,
          evidence: { matched: 'title/h1/url', term: serviceLabel },
          sources: [page.url],
        })
      }
    }

    for (const [locLabel, locNode] of locationNodeIds.entries()) {
      if (containsToken(haystack, locLabel)) {
        await upsertEdge({
          fromNodeId: pageNode,
          toNodeId: locNode,
          relationshipType: EDGE_TYPES.PAGE_TARGETS_LOCATION,
          confidence: 0.8,
          evidence: { matched: 'title/h1/url', term: locLabel },
          sources: [page.url],
        })
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Page ↔ Objective, PAGE_SUPPORTS_MONEY_PAGE (topic overlap heuristic)
  // ───────────────────────────────────────────────────────────────────────────

  const moneyPageEntries = Array.from(pageNodeIds.entries()).filter(
    ([url]) => MONEY_PAGE_TYPES.has(classificationByUrl.get(url)?.primaryClassification ?? ''),
  )
  const supportPageEntries = Array.from(pageNodeIds.entries()).filter(
    ([url]) => !MONEY_PAGE_TYPES.has(classificationByUrl.get(url)?.primaryClassification ?? ''),
  )

  for (const [supportUrl, supportNode] of supportPageEntries) {
    const supportTopics = topicsPerPage.get(supportUrl) ?? new Set<string>()
    if (supportTopics.size === 0) continue

    for (const [moneyUrl, moneyNode] of moneyPageEntries) {
      const moneyTopics = topicsPerPage.get(moneyUrl) ?? new Set<string>()
      if (moneyTopics.size === 0) continue

      const overlap = intersectionCount(supportTopics, moneyTopics)
      if (overlap === 0) continue

      const confidence = Math.min(0.4 + overlap * 0.15, 0.95)
      await upsertEdge({
        fromNodeId: supportNode,
        toNodeId: moneyNode,
        relationshipType: EDGE_TYPES.PAGE_SUPPORTS_MONEY_PAGE,
        confidence,
        evidence: { sharedTopics: overlap },
        sources: [supportUrl, moneyUrl],
      })
      await upsertEdge({
        fromNodeId: supportNode,
        toNodeId: moneyNode,
        relationshipType: EDGE_TYPES.PAGE_SUPPORTS_PAGE,
        confidence,
        evidence: { sharedTopics: overlap },
        sources: [supportUrl, moneyUrl],
      })
    }
  }

  // Wire pages to active objectives when their classification matches priority page types
  for (const objective of objectives) {
    const objectiveNodeId = objectiveNodeIds.get(objective.id)
    if (!objectiveNodeId) continue
    const priorityTypes = new Set((objective.priorityPageTypes ?? []).map((s) => s.toLowerCase()))
    if (priorityTypes.size === 0) continue

    for (const [url, pageNode] of pageNodeIds.entries()) {
      const cls = classificationByUrl.get(url)?.primaryClassification?.toLowerCase()
      if (cls && priorityTypes.has(cls)) {
        await upsertEdge({
          fromNodeId: pageNode,
          toNodeId: objectiveNodeId,
          relationshipType: EDGE_TYPES.PAGE_TARGETS_OBJECTIVE,
          confidence: 0.85,
          evidence: { matchedClassification: cls, objective: objective.objectiveType },
          sources: [url],
        })
      }
    }
  }

  return {
    nodesCreated,
    nodesUpdated,
    edgesCreated,
    edgesUpdated,
    breakdown: { nodesByType, edgesByType },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONEY_PAGE_TYPES = new Set([
  'service_page',
  'product_page',
  'location_page',
  'contact_page',
  'lead_form',
  'pricing_page',
])

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function safeParseJsonArray(input: string | null | undefined): string[] {
  if (!input) return []
  try {
    const parsed = JSON.parse(input)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function dedupe<T>(list: T[]): T[] {
  return Array.from(new Set(list))
}

function containsToken(haystack: string, needle: string): boolean {
  if (!needle) return false
  const n = needle.toLowerCase().trim()
  if (n.length < 3) return false
  return haystack.includes(n)
}

function intersectionCount<T>(a: Set<T>, b: Set<T>): number {
  let n = 0
  for (const x of a) if (b.has(x)) n++
  return n
}

/**
 * BusinessProfile stores service/location entries as JSON strings inside
 * a `String[]` column. Each entry may be either a plain string like
 * "Personal Injury" or a JSON object like {"name":"Personal Injury","value":50000}.
 */
function collectStringItems(items: string[]): string[] {
  const out: string[] = []
  for (const raw of items ?? []) {
    if (!raw) continue
    if (raw.startsWith('{')) {
      try {
        const obj = JSON.parse(raw)
        if (obj && typeof obj === 'object') {
          const name = obj.name || obj.label || obj.title || obj.city
          if (typeof name === 'string' && name.trim()) out.push(name.trim())
          continue
        }
      } catch {
        // fall through
      }
    }
    out.push(raw.trim())
  }
  return dedupe(out).filter(Boolean)
}
