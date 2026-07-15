import type { Candidate } from './types'

export interface ConfidenceReport {
  overall: number      // 0-1
  evidenceQuality: number
  dataFreshness: number
  dataSourceCoverage: number
  assumptions: string[]
  unknowns: string[]
  reasonsForCaution: string[]
}

interface ConfidenceInput {
  candidate: Candidate
  evidenceAgeDays: number | null
  hasGsc: boolean
  hasGa4: boolean
  crawlCoveragePercent: number  // 0-1
  classificationConfidence: number  // 0-1
  businessContextComplete: boolean
  historicalSamples: number
}

export function computeConfidence(input: ConfidenceInput): ConfidenceReport {
  const assumptions: string[] = []
  const unknowns: string[] = []
  const cautions: string[] = []

  const evidenceQuality = Math.min(
    1,
    0.2 + input.candidate.evidence.length * 0.1 + input.candidate.confidence * 0.4,
  )
  if (input.candidate.evidence.length === 0) cautions.push('No graph evidence attached')

  const dataFreshness = (() => {
    if (input.evidenceAgeDays === null) {
      unknowns.push('Evidence timestamp unknown')
      return 0.6
    }
    if (input.evidenceAgeDays > 30) {
      cautions.push(`Evidence is ${Math.round(input.evidenceAgeDays)} days old`)
      return 0.3
    }
    if (input.evidenceAgeDays > 7) return 0.6
    return 0.9
  })()

  const sourceCoverage =
    (input.hasGsc ? 0.35 : 0) +
    (input.hasGa4 ? 0.35 : 0) +
    Math.min(input.crawlCoveragePercent, 1) * 0.3
  if (!input.hasGsc) cautions.push('Search Console not connected — no click/impression signal')
  if (!input.hasGa4) cautions.push('GA4 not connected — no engagement / conversion signal')
  if (input.crawlCoveragePercent < 0.6) cautions.push('Crawl coverage is partial')

  if (!input.businessContextComplete) cautions.push('Business profile is incomplete')
  if (input.classificationConfidence < 0.7)
    cautions.push(`Page classification confidence is low (${input.classificationConfidence.toFixed(2)})`)
  if (input.historicalSamples < 4)
    cautions.push('Insufficient historical outcomes to calibrate — using default weight')

  // Blended confidence — no fake precision, capped at 0.95
  const overall = Math.min(
    0.95,
    input.candidate.confidence * 0.4 +
      evidenceQuality * 0.2 +
      dataFreshness * 0.2 +
      sourceCoverage * 0.2,
  )

  return {
    overall,
    evidenceQuality: round(evidenceQuality),
    dataFreshness: round(dataFreshness),
    dataSourceCoverage: round(sourceCoverage),
    assumptions,
    unknowns,
    reasonsForCaution: cautions,
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
