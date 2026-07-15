import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { auditRecommendationConfidence } from '@/lib/operator/confidence-audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ValidationRequest {
  projectId: string
  candidates: Array<{
    id: string
    metadata?: {
      contentQuality?: number
      trafficHistory?: Array<{ date: string; value: number }>
      lastUpdated?: string
      sourcesCount?: number
      entityDetectionScore?: number
      hasGSC?: boolean
      hasGA4?: boolean
      graphEvidenceStrength?: number
    }
  }>
}

interface ValidationResult {
  candidateId: string
  isValid: boolean
  confidenceScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  issues: Array<{
    type: 'warning' | 'error'
    message: string
    suggestion?: string
  }>
  audit: {
    overallConfidence: number
    evidenceQuality: number
    dataFreshness: number
    dataSourceCoverage: number
    dataQualityFlags: Record<string, boolean>
  }
}

export async function POST(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const body: ValidationRequest = await req.json()
      const { projectId, candidates } = body

      if (!projectId || !candidates || candidates.length === 0) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 })
      }

      await requireProjectAccess(projectId)

      // Validate each candidate
      const validationResults: ValidationResult[] = []

      for (const candidate of candidates) {
        const auditResult = await auditRecommendationConfidence({
          projectId,
          candidateId: candidate.id,
          metadata: candidate.metadata
            ? {
                ...candidate.metadata,
                lastUpdated: candidate.metadata.lastUpdated
                  ? new Date(candidate.metadata.lastUpdated)
                  : undefined,
                trafficHistory: candidate.metadata.trafficHistory,
              }
            : undefined,
        })

        const issues: ValidationResult['issues'] = []
        let riskLevel: ValidationResult['riskLevel'] = 'low'

        // Assess data quality issues
        if (auditResult.audit.dataQualityFlags.crawlIncomplete) {
          issues.push({
            type: 'warning',
            message: 'Crawl data is incomplete',
            suggestion: 'Consider running a fresh crawl before implementation',
          })
          riskLevel = 'medium'
        }

        if (auditResult.audit.dataQualityFlags.noGSC) {
          issues.push({
            type: 'warning',
            message: 'Google Search Console data is not available',
            suggestion: 'Connect GSC to track search performance',
          })
          riskLevel = 'medium'
        }

        if (auditResult.audit.dataQualityFlags.noGA4) {
          issues.push({
            type: 'warning',
            message: 'Google Analytics 4 data is not available',
            suggestion: 'Set up GA4 to track user behavior',
          })
          riskLevel = 'medium'
        }

        if (auditResult.audit.dataQualityFlags.weakEntityDetection) {
          issues.push({
            type: 'error',
            message: 'Topic entity detection score is below threshold',
            suggestion: 'Verify content actually covers the intended topic',
          })
          riskLevel = 'high'
        }

        if (auditResult.audit.dataQualityFlags.weakGraphEvidence) {
          issues.push({
            type: 'warning',
            message: 'Knowledge graph evidence is weak',
            suggestion: 'Consider additional validation before prioritization',
          })
          if (riskLevel === 'low') riskLevel = 'medium'
        }

        if (auditResult.audit.dataQualityFlags.limitedHistoricalData) {
          issues.push({
            type: 'warning',
            message: 'Limited historical data available',
            suggestion: 'Wait for more data before finalizing prioritization',
          })
          if (riskLevel === 'low') riskLevel = 'medium'
        }

        // Overall confidence assessment
        if (auditResult.audit.overallConfidence < 0.4) {
          issues.push({
            type: 'error',
            message: 'Overall confidence is critically low',
            suggestion: 'Do not implement without additional validation',
          })
          riskLevel = 'critical'
        }

        if (auditResult.audit.overallConfidence < 0.6 && riskLevel !== 'critical') {
          riskLevel = 'high'
        }

        const isValid =
          riskLevel !== 'critical' &&
          !issues.some((i) => i.type === 'error') &&
          auditResult.audit.overallConfidence > 0.3

        validationResults.push({
          candidateId: candidate.id,
          isValid,
          confidenceScore: auditResult.audit.overallConfidence,
          riskLevel,
          issues,
          audit: {
            overallConfidence: auditResult.audit.overallConfidence,
            evidenceQuality: auditResult.audit.evidenceQuality,
            dataFreshness: auditResult.audit.dataFreshness,
            dataSourceCoverage: auditResult.audit.dataSourceCoverage,
            dataQualityFlags: auditResult.audit.dataQualityFlags,
          },
        })
      }

      // Calculate summary stats
      const summary = {
        totalCandidates: candidates.length,
        validCandidates: validationResults.filter((r) => r.isValid).length,
        averageConfidence:
          validationResults.reduce((sum, r) => sum + r.confidenceScore, 0) / candidates.length,
        riskDistribution: {
          low: validationResults.filter((r) => r.riskLevel === 'low').length,
          medium: validationResults.filter((r) => r.riskLevel === 'medium').length,
          high: validationResults.filter((r) => r.riskLevel === 'high').length,
          critical: validationResults.filter((r) => r.riskLevel === 'critical').length,
        },
        overallValidation: validationResults.every((r) => r.isValid),
      }

      // Sort by confidence (highest first)
      validationResults.sort((a, b) => b.confidenceScore - a.confidenceScore)

      return Response.json({
        success: true,
        data: {
          validationResults,
          summary,
        },
      })
    } catch (error) {
      console.error('Validation endpoint error:', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
