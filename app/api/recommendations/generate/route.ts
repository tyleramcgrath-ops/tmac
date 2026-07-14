// Generate prioritized recommendations for a page based on all data sources

import { getPrismaClient } from '@/lib/db'
import { generateRecommendations } from '@/lib/recommendation-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const pageUrl = url.searchParams.get('pageUrl')

  if (!projectId || !pageUrl) {
    return Response.json(
      { error: 'projectId and pageUrl are required.' },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Get all data sources
    const [gscMetric, ga4Metric, latestAudit] = await Promise.all([
      prisma.googleSearchConsoleMetric.findUnique({
        where: {
          organizationId_projectId_url: {
            organizationId: project.organizationId,
            projectId,
            url: pageUrl,
          },
        },
      }),
      prisma.googleAnalytics4Metric.findUnique({
        where: {
          organizationId_projectId_url: {
            organizationId: project.organizationId,
            projectId,
            url: pageUrl,
          },
        },
      }),
      prisma.audit.findFirst({
        where: {
          projectId,
          status: 'completed',
        },
        orderBy: { endedAt: 'desc' },
      }),
    ])

    let crawlData = null
    if (latestAudit) {
      crawlData = await prisma.page.findUnique({
        where: {
          auditId_url: {
            auditId: latestAudit.id,
            url: pageUrl,
          },
        },
      })
    }

    // Prepare data sources
    const dataSources = {
      gsc: gscMetric
        ? {
            clicks: gscMetric.clicks,
            impressions: gscMetric.impressions,
            ctr: gscMetric.ctr,
            position: gscMetric.position,
            topQueries: gscMetric.topQueries ? JSON.parse(gscMetric.topQueries) : [],
          }
        : null,
      ga4: ga4Metric
        ? {
            users: ga4Metric.users,
            sessions: ga4Metric.sessions,
            engagementRate: ga4Metric.engagementRate,
            bounceRate: ga4Metric.bounceRate,
            avgSessionDuration: ga4Metric.avgSessionDuration,
            conversions: ga4Metric.conversions,
            conversionRate: ga4Metric.conversionRate,
            revenue: ga4Metric.revenue,
          }
        : null,
      crawl: crawlData
        ? {
            title: crawlData.title,
            metaDescription: crawlData.metaDescription,
            status: crawlData.status,
            contentLength: crawlData.contentLength,
            technicalScore: crawlData.technicalScore,
            contentScore: crawlData.contentScore,
            schemaScore: crawlData.schemaScore,
            aiScore: crawlData.aiScore,
            issueCount: (await prisma.issue.count({
              where: {
                pageId: crawlData.id,
              },
            })) || 0,
            hasNoindex: crawlData.hasNoindex,
          }
        : null,
    }

    // Generate recommendations
    const recommendations = generateRecommendations(
      pageUrl,
      dataSources,
      project.valuePerVisit
    )

    return Response.json({
      url: pageUrl,
      dataAvailable: {
        gsc: !!gscMetric,
        ga4: !!ga4Metric,
        crawl: !!crawlData,
      },
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        why: rec.why,
        impact: rec.impact,
        confidence: rec.confidence,
        action: rec.action,
      })),
      summary: {
        total: recommendations.length,
        critical: recommendations.filter((r) => r.priority === 'critical').length,
        high: recommendations.filter((r) => r.priority === 'high').length,
        medium: recommendations.filter((r) => r.priority === 'medium').length,
        low: recommendations.filter((r) => r.priority === 'low').length,
        estimatedTraffic: recommendations.reduce((sum, r) => sum + (r.impact.traffic || 0), 0),
        estimatedRevenue: recommendations.reduce((sum, r) => sum + (r.impact.revenue || 0), 0),
      },
    })
  } catch (err) {
    console.error('[recommendations/generate] Error', err)
    return Response.json(
      { error: `Failed to generate recommendations: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
