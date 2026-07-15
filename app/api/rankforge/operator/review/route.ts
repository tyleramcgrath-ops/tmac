import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { executeSelfReview } from '@/lib/operator/self-review'
import { generateWhyNotAnalysis } from '@/lib/operator/why-not'
import { executeConsultantReview } from '@/lib/operator/consultant'
import { auditRecommendationConfidence } from '@/lib/operator/confidence-audit'
import { analyzeOpportunityCost } from '@/lib/operator/opportunity-cost'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ReviewRequest {
  projectId: string
  shortlist: Array<{
    id: string
    rank: number
    score: number
    source: string
    reasoning: string
    contentQuality?: number
  }>
  allCandidates?: Array<{
    id: string
    score: number
    contentQuality?: number
    relevanceScore?: number
    evidenceStrength?: number
    trafficPotential?: number
    lastCovered?: string
    sourcesCount?: number
    entityDetectionScore?: number
    hasGSC?: boolean
    hasGA4?: boolean
    graphEvidenceStrength?: number
  }>
  businessContext?: {
    industry?: string
    goals?: string[]
    timeline?: string
    budget?: number
  }
}

export async function POST(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const body: ReviewRequest = await req.json()
      const { projectId, shortlist, allCandidates, businessContext } = body

      if (!projectId || !shortlist) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 })
      }

      await requireProjectAccess(projectId)

      // Execute self-review
      const reviewResult = await executeSelfReview({
        projectId,
        shortlist,
        businessContext,
      })

      // Generate why-not analysis for final shortlist
      const candidates = allCandidates || []
      const whyNotAnalyses = await Promise.all(
        reviewResult.finalShortlist.map((candidateId) => {
          const allCandidatesData = candidates.length > 0
            ? candidates.map((c) => ({
                id: c.id,
                score: c.score,
                contentQuality: c.contentQuality,
                relevanceScore: c.relevanceScore,
                evidenceStrength: c.evidenceStrength,
                trafficPotential: c.trafficPotential,
                lastCovered: c.lastCovered ? new Date(c.lastCovered) : undefined,
              }))
            : shortlist.map((c) => ({
                id: c.id,
                score: c.score,
                contentQuality: c.contentQuality,
                relevanceScore: undefined,
                evidenceStrength: undefined,
                trafficPotential: undefined,
                lastCovered: undefined,
              }))

          return generateWhyNotAnalysis({
            projectId,
            selectedCandidateId: candidateId,
            allCandidates: allCandidatesData,
          })
        })
      )

      // Execute consultant review
      const consultantResult = await executeConsultantReview({
        projectId,
        shortlist: reviewResult.finalShortlist.map((id) => ({
          id,
          score: (candidates.find((c) => c.id === id)?.score ?? 0.5),
        })),
        businessContext,
      })

      // Audit confidence for each final candidate
      const confidenceAudits = await Promise.all(
        reviewResult.finalShortlist.map((candidateId) => {
          const candidateData = candidates.find((c) => c.id === candidateId)
          return auditRecommendationConfidence({
            projectId,
            candidateId,
            metadata: candidateData,
          })
        })
      )

      // Analyze opportunity costs
      const opportunityCosts = await Promise.all(
        reviewResult.finalShortlist.map((candidateId) =>
          analyzeOpportunityCost({
            projectId,
            selectedCandidateId: candidateId,
            allCandidates: candidates,
            estimatedCapacity: businessContext?.budget ? Math.ceil(businessContext.budget / 100) : 10,
          })
        )
      )

      return Response.json({
        success: true,
        data: {
          reviewCycle: reviewResult,
          whyNotAnalyses,
          consultantStrategies: consultantResult.strategies,
          recommendedStrategy: consultantResult.recommendation,
          confidenceAudits,
          opportunityCosts,
          summary: {
            originalCount: reviewResult.originalCount,
            finalCount: reviewResult.finalCount,
            totalDecisions: Object.values(reviewResult.decisionsCount).reduce((a, b) => a + b, 0),
            recommendedStrategyType: consultantResult.recommendation,
            averageConfidence:
              confidenceAudits.reduce((sum, a) => sum + a.audit.overallConfidence, 0) /
              confidenceAudits.length,
          },
        },
      })
    } catch (error) {
      console.error('Review endpoint error:', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
