import { getPrismaClient } from '@/lib/db'
import { moneyPagePortfolio } from '@/lib/pipeline/graph/money-pages'
import { detectClusters } from '@/lib/pipeline/graph/clusters'
import { internalLinkOpportunities, orphanPages } from '@/lib/pipeline/graph/queries'
import type { Candidate } from './types'

/**
 * Collects raw candidates from every intelligence surface: graph, decision
 * engine, gap analysis, competitor signals. Judgment + memory + learning are
 * applied downstream in operator.ts.
 */
export async function collectCandidates(projectId: string): Promise<Candidate[]> {
  const prisma = getPrismaClient()
  const [
    moneyPortfolio,
    clusters,
    linkOps,
    orphans,
    gaps,
    decisionRecs,
    decayAlerts,
  ] = await Promise.all([
    moneyPagePortfolio({ projectId }),
    detectClusters({ projectId }),
    internalLinkOpportunities({ projectId }, 20),
    orphanPages({ projectId }, 20),
    prisma.contentGapAnalysis.findMany({ where: { projectId }, take: 100 }),
    prisma.recommendationDecision.findMany({
      where: { projectId },
      orderBy: [{ businessValue: 'desc' }, { seoOpportunity: 'desc' }],
      take: 50,
    }),
    prisma.contentDecayAlert.findMany({
      where: { projectId, isResolved: false },
      orderBy: { detectedAt: 'desc' },
      take: 20,
    }),
  ])

  const candidates: Candidate[] = []

  // 1. Money-page weaknesses (highest-conviction source)
  for (const mp of moneyPortfolio) {
    if (!mp.moneyPage.url) continue
    if (mp.weaknesses.length === 0) continue
    candidates.push({
      id: candidateId(mp.moneyPage.url, 'money_page_reinforcement'),
      pageUrl: mp.moneyPage.url,
      recommendationType: 'money_page_reinforcement',
      source: 'money_page_intelligence',
      estimatedMinutes: 60,
      rawScore: 55 + Math.min(mp.decisionEnginePriority / 2, 25),
      confidence: 0.85,
      evidence: [
        { label: 'weaknesses', detail: mp.weaknesses, source: 'money_page_intelligence' },
        { label: 'supports', detail: mp.supports.length, source: 'graph' },
        {
          label: 'traffic_risk',
          detail: mp.trafficRisk,
          source: 'money_page_intelligence',
        },
        {
          label: 'missing',
          detail: {
            entities: mp.missing.entities,
            schema: mp.missing.schema,
            topics: mp.missing.topics,
          },
          source: 'graph',
        },
      ],
      metadata: {
        isMoneyPage: true,
        supportingCount: mp.supports.length,
        trafficRisk: mp.trafficRisk,
        conversionOpportunity: mp.conversionOpportunity,
        missing: mp.missing,
      },
    })

    if (mp.missing.schema.length > 0) {
      candidates.push({
        id: candidateId(mp.moneyPage.url, 'add_faq_schema'),
        pageUrl: mp.moneyPage.url,
        recommendationType: 'add_faq_schema',
        source: 'graph_missing_schema',
        estimatedMinutes: 25,
        rawScore: 45,
        confidence: 0.8,
        evidence: [
          { label: 'missing_schema', detail: mp.missing.schema, source: 'graph' },
        ],
        metadata: { isMoneyPage: true, missingSchema: mp.missing.schema },
      })
    }

    if (mp.missing.entities.length > 0) {
      candidates.push({
        id: candidateId(mp.moneyPage.url, 'add_missing_entities'),
        pageUrl: mp.moneyPage.url,
        recommendationType: 'add_missing_entities',
        source: 'graph_missing_entity',
        estimatedMinutes: 45,
        rawScore: 40,
        confidence: 0.75,
        evidence: [
          { label: 'missing_entities', detail: mp.missing.entities, source: 'graph' },
        ],
        metadata: { isMoneyPage: true, missingEntities: mp.missing.entities },
      })
    }
  }

  // 2. Orphan pages — cheap to fix (add internal links)
  for (const orphan of orphans) {
    if (!orphan.page.nodeUrl) continue
    candidates.push({
      id: candidateId(orphan.page.nodeUrl, 'add_internal_links'),
      pageUrl: orphan.page.nodeUrl,
      recommendationType: 'add_internal_links',
      source: 'graph_orphan',
      estimatedMinutes: 15,
      rawScore: 30,
      confidence: 0.7,
      evidence: [{ label: 'orphan_reason', detail: orphan.reason, source: 'graph' }],
      metadata: { orphanReason: orphan.reason },
    })
  }

  // 3. Broken clusters
  for (const cluster of clusters.clusters.filter((c) => c.flags.brokenChain)) {
    for (const member of cluster.members.slice(0, 3)) {
      if (!member.pageUrl) continue
      candidates.push({
        id: candidateId(member.pageUrl, 'repair_topic_cluster'),
        pageUrl: member.pageUrl,
        recommendationType: 'repair_topic_cluster',
        source: 'graph_broken_cluster',
        estimatedMinutes: 45,
        rawScore: 35,
        confidence: 0.7,
        evidence: [
          {
            label: 'cluster',
            detail: { key: cluster.clusterKey, label: cluster.clusterLabel },
            source: 'graph',
          },
        ],
        metadata: { clusterKey: cluster.clusterKey },
      })
    }
  }

  // 4. Internal-link opportunities (from graph queries)
  for (const op of linkOps.slice(0, 10)) {
    if (!op.fromPage.nodeUrl || !op.toPage.nodeUrl) continue
    candidates.push({
      id: candidateId(op.fromPage.nodeUrl, `link_to::${op.toPage.nodeUrl}`),
      pageUrl: op.fromPage.nodeUrl,
      recommendationType: `link_to::${op.toPage.nodeUrl}`,
      source: 'graph_internal_link',
      estimatedMinutes: 10,
      rawScore: 20 + Math.min(op.sharedTopics * 3, 15),
      confidence: op.confidence,
      evidence: [
        { label: 'target', detail: op.toPage.nodeUrl, source: 'graph' },
        { label: 'shared_topics', detail: op.sharedTopics, source: 'graph' },
      ],
      metadata: { targetUrl: op.toPage.nodeUrl, sharedTopics: op.sharedTopics },
    })
  }

  // 5. Content gaps
  for (const gap of gaps.slice(0, 25)) {
    const url = gap.suggestedTitle ?? gap.suggestedTopic ?? gap.gapType
    const type = `close_gap::${gap.gapType}`
    candidates.push({
      id: candidateId(url, type),
      pageUrl: url,
      recommendationType: type,
      source: 'money_page_intelligence',
      estimatedMinutes: 90,
      rawScore: mapPriorityToScore(gap.priority) + 5,
      confidence: 0.65,
      evidence: [
        { label: 'gap_type', detail: gap.gapType, source: 'gap_analysis' },
        { label: 'rationale', detail: gap.rationale ?? gap.description, source: 'gap_analysis' },
      ],
      metadata: { gap },
    })
  }

  // 6. Decision engine top-N — the raw score is what the DE emitted
  for (const rec of decisionRecs) {
    candidates.push({
      id: candidateId(rec.pageUrl, rec.recommendationType),
      pageUrl: rec.pageUrl,
      recommendationType: rec.recommendationType,
      source: 'decision_engine',
      estimatedMinutes: rec.estimatedTime,
      rawScore: rec.businessValue * 0.6 + rec.seoOpportunity * 0.4,
      confidence: rec.confidence,
      evidence: [
        { label: 'why_this', detail: rec.whyThis, source: 'decision_engine' },
        { label: 'why_now', detail: rec.whyNow, source: 'decision_engine' },
      ],
      metadata: {
        businessValue: rec.businessValue,
        seoOpportunity: rec.seoOpportunity,
      },
    })
  }

  // 7. Content decay (traffic/CTR loss alerts)
  for (const alert of decayAlerts) {
    candidates.push({
      id: candidateId(alert.pageUrl, `decay::${alert.decayType}`),
      pageUrl: alert.pageUrl,
      recommendationType: `decay::${alert.decayType}`,
      source: 'decision_engine',
      estimatedMinutes: 45,
      rawScore: alert.severity === 'high' ? 65 : alert.severity === 'medium' ? 45 : 25,
      confidence: 0.9,
      evidence: [
        { label: 'decay_type', detail: alert.decayType, source: 'decay_detector' },
        { label: 'decay_pct', detail: alert.decayPercentage, source: 'decay_detector' },
      ],
      metadata: {
        decayType: alert.decayType,
        decayPercentage: alert.decayPercentage,
        severity: alert.severity,
      },
    })
  }

  // Deduplicate by candidate id, keeping highest score
  const dedup = new Map<string, Candidate>()
  for (const c of candidates) {
    const existing = dedup.get(c.id)
    if (!existing || existing.rawScore < c.rawScore) dedup.set(c.id, c)
  }
  return Array.from(dedup.values())
}

function candidateId(pageUrl: string, type: string): string {
  return `${pageUrl}::${type}`
}

function mapPriorityToScore(priority: string): number {
  switch (priority) {
    case 'critical':
      return 55
    case 'high':
      return 45
    case 'medium':
      return 30
    case 'low':
      return 15
    default:
      return 20
  }
}
