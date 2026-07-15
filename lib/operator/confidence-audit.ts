import { getPrismaClient } from '@/lib/db'

/**
 * Confidence Audit Engine (Phase 8.2).
 *
 * Assesses the quality, freshness, and coverage of evidence backing each recommendation.
 * Tracks specific data gaps and uncertainties that could affect recommendation reliability.
 */

export interface ConfidenceAudit {
  overallConfidence: number // 0-1
  evidenceQuality: number // 0-1
  dataFreshness: number // 0-1
  dataSourceCoverage: number // 0-1
  assumptions: string[]
  unknownVariables: string[]
  missingData: string[]
  reasonsForCaution: string[]
  dataQualityFlags: {
    crawlIncomplete: boolean
    weakEntityDetection: boolean
    noGSC: boolean
    noGA4: boolean
    weakGraphEvidence: boolean
    limitedHistoricalData: boolean
  }
}

export interface AuditResult {
  candidateId: string
  audit: ConfidenceAudit
}

export async function auditRecommendationConfidence(input: {
  projectId: string
  candidateId: string
  metadata?: {
    contentQuality?: number
    trafficHistory?: Array<{ date: string; value: number }>
    lastUpdated?: Date
    sourcesCount?: number
    entityDetectionScore?: number
    hasGSC?: boolean
    hasGA4?: boolean
    graphEvidenceStrength?: number
  }
}): Promise<AuditResult> {
  const prisma = getPrismaClient()
  const meta = input.metadata || {}

  // Calculate individual confidence dimensions
  const evidenceQuality = calculateEvidenceQuality(meta)
  const dataFreshness = calculateDataFreshness(meta)
  const dataSourceCoverage = calculateSourceCoverage(meta)
  const overallConfidence = (evidenceQuality + dataFreshness + dataSourceCoverage) / 3

  // Identify data quality flags
  const flags = identifyDataQualityFlags(meta)

  // Enumerate assumptions, unknowns, and concerns
  const assumptions = extractAssumptions(meta)
  const unknownVariables = extractUnknownVariables(meta)
  const missingData = extractMissingData(meta)
  const reasonsForCaution = extractCautions(meta, flags)

  const audit: ConfidenceAudit = {
    overallConfidence,
    evidenceQuality,
    dataFreshness,
    dataSourceCoverage,
    assumptions,
    unknownVariables,
    missingData,
    reasonsForCaution,
    dataQualityFlags: flags,
  }

  // Get organization ID from project
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { organizationId: true },
  })
  if (!project) {
    throw new Error(`Project ${input.projectId} not found`)
  }

  // Persist audit to database
  await prisma.operatorConfidenceAudit.create({
    data: {
      organizationId: project.organizationId,
      projectId: input.projectId,
      candidateId: input.candidateId,
      overallConfidence,
      evidenceQuality,
      dataFreshness,
      dataSourceCoverage,
      assumptions,
      unknownVariables,
      missingData,
      reasonsForCaution,
      crawlIncomplete: flags.crawlIncomplete,
      weakEntityDetection: flags.weakEntityDetection,
      noGSC: flags.noGSC,
      noGA4: flags.noGA4,
      weakGraphEvidence: flags.weakGraphEvidence,
      limitedHistoricalData: flags.limitedHistoricalData,
    },
  })

  return {
    candidateId: input.candidateId,
    audit,
  }
}

function calculateEvidenceQuality(meta: {
  sourcesCount?: number
  entityDetectionScore?: number
  graphEvidenceStrength?: number
}): number {
  let score = 0.5 // Base score

  if (meta.sourcesCount && meta.sourcesCount > 5) score += 0.2
  else if (meta.sourcesCount && meta.sourcesCount > 2) score += 0.1

  if (meta.entityDetectionScore && meta.entityDetectionScore > 0.7) score += 0.2
  else if (meta.entityDetectionScore && meta.entityDetectionScore > 0.4) score += 0.1

  if (meta.graphEvidenceStrength && meta.graphEvidenceStrength > 0.7) score += 0.1

  return Math.min(1, score)
}

function calculateDataFreshness(meta: { lastUpdated?: Date; trafficHistory?: Array<{ date: string; value: number }> }): number {
  let score = 0.5

  if (meta.lastUpdated) {
    const daysSinceUpdate = (Date.now() - meta.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate < 7) score = 0.95
    else if (daysSinceUpdate < 30) score = 0.8
    else if (daysSinceUpdate < 90) score = 0.6
    else score = 0.3
  }

  if (meta.trafficHistory && meta.trafficHistory.length > 30) score = Math.min(1, score + 0.15)

  return Math.min(1, score)
}

function calculateSourceCoverage(meta: { hasGSC?: boolean; hasGA4?: boolean; sourcesCount?: number }): number {
  let score = 0.4

  if (meta.hasGSC) score += 0.25
  if (meta.hasGA4) score += 0.25
  if (meta.sourcesCount && meta.sourcesCount > 3) score += 0.1

  return Math.min(1, score)
}

function identifyDataQualityFlags(meta: {
  entityDetectionScore?: number
  sourcesCount?: number
  hasGSC?: boolean
  hasGA4?: boolean
  graphEvidenceStrength?: number
  trafficHistory?: Array<{ date: string; value: number }>
}): ConfidenceAudit['dataQualityFlags'] {
  return {
    crawlIncomplete: !meta.sourcesCount || meta.sourcesCount < 3,
    weakEntityDetection: !meta.entityDetectionScore || meta.entityDetectionScore < 0.5,
    noGSC: !meta.hasGSC,
    noGA4: !meta.hasGA4,
    weakGraphEvidence: !meta.graphEvidenceStrength || meta.graphEvidenceStrength < 0.6,
    limitedHistoricalData: !meta.trafficHistory || meta.trafficHistory.length < 14,
  }
}

function extractAssumptions(meta: { contentQuality?: number }): string[] {
  const assumptions: string[] = []

  assumptions.push('Candidate ranking is based on available historical data and current market conditions')

  if (!meta.contentQuality || meta.contentQuality < 0.7) {
    assumptions.push('Content quality assessment relies on automated detection metrics')
  }

  assumptions.push('Future performance will follow historical patterns within ±20% variance')

  return assumptions
}

function extractUnknownVariables(meta: { trafficHistory?: Array<{ date: string; value: number }> }): string[] {
  const unknowns: string[] = []

  unknowns.push('Exact user intent distribution and conversion behavior by segment')
  unknowns.push('Impact of external algorithm changes or competitive moves')
  unknowns.push('Long-term content decay rate and freshness requirements')

  if (!meta.trafficHistory || meta.trafficHistory.length < 30) {
    unknowns.push('Seasonal patterns may not be fully captured in training data')
  }

  unknowns.push('Probability of viral or unexpected traffic spikes')

  return unknowns
}

function extractMissingData(meta: { hasGSC?: boolean; hasGA4?: boolean; sourcesCount?: number }): string[] {
  const missing: string[] = []

  if (!meta.hasGSC) {
    missing.push('Google Search Console data (query performance, CTR, impressions)')
  }

  if (!meta.hasGA4) {
    missing.push('Google Analytics 4 user behavior metrics')
  }

  if (!meta.sourcesCount || meta.sourcesCount < 5) {
    missing.push('Third-party validation from multiple authoritative sources')
  }

  missing.push('Direct user feedback and sentiment signals')

  return missing
}

function extractCautions(meta: { trafficHistory?: Array<{ date: string; value: number }> }, flags: ConfidenceAudit['dataQualityFlags']): string[] {
  const cautions: string[] = []

  if (flags.noGSC || flags.noGA4) {
    cautions.push('Recommendation lacks direct performance measurement from Google')
  }

  if (flags.weakEntityDetection) {
    cautions.push('Entity detection for topic relevance is below optimal threshold')
  }

  if (flags.limitedHistoricalData) {
    cautions.push('Limited historical data may underestimate volatility or miss seasonality')
  }

  if (meta.trafficHistory) {
    const recentTraffic = meta.trafficHistory.slice(-7)
    const trend = recentTraffic.length > 0 ? recentTraffic[recentTraffic.length - 1].value - recentTraffic[0].value : 0
    if (trend < 0) {
      cautions.push('Recent traffic trend is negative—investigate before implementation')
    }
  }

  if (flags.weakGraphEvidence) {
    cautions.push('Knowledge graph evidence is weak—consider additional validation')
  }

  return cautions
}
