import { withAuth, requireProjectAccess } from '@/lib/authorize'
import { getPrismaClient } from '@/lib/db'
import {
  trackQualityMetric,
  calculateRecommendationAccuracy,
  calculateDecisionConfidence,
  calculateEvidenceQuality,
  calculateTierDistribution,
  calculateConflictResolution,
  calculateBusinessImpact,
  getQualityMetricsReport,
} from '@/lib/operator/quality-metrics'
import type { MetricType, TimePeriod } from '@/lib/operator/quality-metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface MetricTrackingRequest {
  projectId: string
  metricType?: MetricType
  value?: number
  samples?: number
  period: TimePeriod
  computeMetrics?: boolean
  outcomes?: Array<{
    candidateId: string
    trafficLift?: number
    conversionLift?: number
  }>
  recommendations?: Array<{
    candidateId: string
    confidenceScore?: number
    evidenceQuality?: number
  }>
  tierBreakdown?: {
    primaryMission?: number
    nextBest?: number
    watch?: number
    deferred?: number
  }
  conflictMetrics?: {
    caught: number
    total: number
  }
  businessMetrics?: {
    trafficGain?: number
    conversionGain?: number
    revenueGain?: number
    estimatedValue?: number
  }
}

export async function GET(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const projectId = searchParams.get('projectId')
      const period = (searchParams.get('period') as TimePeriod) || 'week'

      if (!projectId) {
        return Response.json({ error: 'projectId is required' }, { status: 400 })
      }

      await requireProjectAccess(projectId)

      const prisma = getPrismaClient()
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return Response.json({ error: 'Project not found' }, { status: 404 })
      }

      const report = await getQualityMetricsReport({
        organizationId: project.organizationId,
        period,
      })

      return Response.json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error('Metrics GET endpoint error:', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
  return handler(request)
}

export async function POST(request: Request) {
  const handler = await withAuth(async (_session, req) => {
    try {
      const body: MetricTrackingRequest = await req.json()
      const { projectId, period, computeMetrics, outcomes, recommendations } = body

      if (!projectId) {
        return Response.json({ error: 'projectId is required' }, { status: 400 })
      }

      await requireProjectAccess(projectId)

      const prisma = getPrismaClient()
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!project) {
        return Response.json({ error: 'Project not found' }, { status: 404 })
      }

      const orgId = project.organizationId
      const trackedMetrics: Array<{
        metricType: MetricType
        value: number
        samples: number
      }> = []

      // If specific metric provided, track it
      if (body.metricType && body.value !== undefined && body.samples !== undefined) {
        await trackQualityMetric({
          organizationId: orgId,
          projectId,
          metricType: body.metricType,
          value: body.value,
          samples: body.samples,
          period,
        })

        trackedMetrics.push({
          metricType: body.metricType,
          value: body.value,
          samples: body.samples,
        })
      }

      // If compute flag, calculate all metrics from provided data
      if (computeMetrics) {
        if (outcomes && recommendations) {
          // Calculate recommendation accuracy
          const accuracy = await calculateRecommendationAccuracy({
            projectId,
            recommendations: recommendations.map((r) => r.candidateId),
            outcomes,
            period,
          })

          await trackQualityMetric({
            organizationId: orgId,
            projectId,
            metricType: 'recommendation_accuracy',
            value: accuracy,
            samples: recommendations.length,
            period,
          })

          trackedMetrics.push({
            metricType: 'recommendation_accuracy',
            value: accuracy,
            samples: recommendations.length,
          })

          // Calculate decision confidence
          const confidence = await calculateDecisionConfidence({
            projectId,
            recommendations: recommendations.map((r) => ({
              candidateId: r.candidateId,
              confidenceScore: r.confidenceScore ?? 0.5,
            })),
          })

          await trackQualityMetric({
            organizationId: orgId,
            projectId,
            metricType: 'decision_confidence',
            value: confidence,
            samples: recommendations.length,
            period,
          })

          trackedMetrics.push({
            metricType: 'decision_confidence',
            value: confidence,
            samples: recommendations.length,
          })

          // Calculate evidence quality
          const evidenceQuality = await calculateEvidenceQuality({
            projectId,
            recommendations: recommendations.map((r) => ({
              candidateId: r.candidateId,
              evidenceQuality: r.evidenceQuality ?? 0.5,
            })),
          })

          await trackQualityMetric({
            organizationId: orgId,
            projectId,
            metricType: 'evidence_quality',
            value: evidenceQuality,
            samples: recommendations.length,
            period,
          })

          trackedMetrics.push({
            metricType: 'evidence_quality',
            value: evidenceQuality,
            samples: recommendations.length,
          })

          // Calculate tier distribution
          if (body.tierBreakdown) {
            const tierDist = await calculateTierDistribution({
              projectId,
              ...body.tierBreakdown,
            })

            await trackQualityMetric({
              organizationId: orgId,
              projectId,
              metricType: 'tier_distribution',
              value: tierDist,
              samples: 1,
              period,
            })

            trackedMetrics.push({
              metricType: 'tier_distribution',
              value: tierDist,
              samples: 1,
            })
          }

          // Calculate conflict resolution
          if (body.conflictMetrics) {
            const conflictResolution = await calculateConflictResolution({
              projectId,
              conflictsCaught: body.conflictMetrics.caught,
              conflictsTotal: body.conflictMetrics.total,
            })

            await trackQualityMetric({
              organizationId: orgId,
              projectId,
              metricType: 'conflict_resolution',
              value: conflictResolution,
              samples: body.conflictMetrics.total,
              period,
            })

            trackedMetrics.push({
              metricType: 'conflict_resolution',
              value: conflictResolution,
              samples: body.conflictMetrics.total,
            })
          }

          // Calculate business impact
          if (body.businessMetrics) {
            const businessImpact = await calculateBusinessImpact({
              projectId,
              ...body.businessMetrics,
            })

            await trackQualityMetric({
              organizationId: orgId,
              projectId,
              metricType: 'business_impact',
              value: businessImpact,
              samples: 1,
              period,
            })

            trackedMetrics.push({
              metricType: 'business_impact',
              value: businessImpact,
              samples: 1,
            })
          }
        }
      }

      return Response.json({
        success: true,
        data: {
          trackedMetrics,
          message: `Tracked ${trackedMetrics.length} metric(s)`,
        },
      })
    } catch (error) {
      console.error('Metrics POST endpoint error:', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
  return handler(request)
}
