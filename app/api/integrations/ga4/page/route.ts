// Get GA4 metrics for a page merged with crawl data and GSC

import { getPrismaClient } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ConversionInsight {
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export async function GET(request: Request) {
  const session = await getCurrentSession()
  if (!session || !session.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    if (!project || project.organizationId !== session.organizationId) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Get GA4 metrics
    const ga4Metric = await prisma.googleAnalytics4Metric.findUnique({
      where: {
        organizationId_projectId_url: {
          organizationId: project.organizationId,
          projectId,
          url: pageUrl,
        },
      },
    })

    // Get GSC metrics
    const gscMetric = await prisma.googleSearchConsoleMetric.findUnique({
      where: {
        organizationId_projectId_url: {
          organizationId: project.organizationId,
          projectId,
          url: pageUrl,
        },
      },
    })

    // Get crawl data (from latest audit)
    const latestAudit = await prisma.audit.findFirst({
      where: {
        projectId,
        status: 'completed',
      },
      orderBy: { endedAt: 'desc' },
    })

    let crawlData = null
    if (latestAudit) {
      crawlData = await prisma.page.findUnique({
        where: {
          auditId_url: {
            auditId: latestAudit.id,
            url: pageUrl,
          },
        },
        include: {
          issues: true,
        },
      })
    }

    // Merge all data sources
    const merged = {
      url: pageUrl,
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
            canonicalCanonical: crawlData.canonical,
            technicalScore: crawlData.technicalScore,
            contentScore: crawlData.contentScore,
            schemaScore: crawlData.schemaScore,
            aiScore: crawlData.aiScore,
            issues: crawlData.issues.length,
          }
        : null,
      insights: buildConversionInsights(ga4Metric, gscMetric, project.monthlyVisits > 0 ? project.valuePerVisit : 0),
    }

    return Response.json(merged)
  } catch (err) {
    console.error('[ga4/page] Error', err)
    return Response.json(
      { error: `Failed to fetch page data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

function buildConversionInsights(
  ga4Metric: { users: number; sessions: number; conversions: number; conversionRate: number; bounceRate: number; revenue: number; engagementRate: number } | null,
  gscMetric: { impressions: number; clicks: number } | null,
  valuePerVisit: number
): ConversionInsight[] {
  const insights: ConversionInsight[] = []

  if (!ga4Metric) return insights

  // High traffic, low conversions
  if (ga4Metric.sessions > 100 && ga4Metric.conversionRate < 0.01) {
    insights.push({
      type: 'low_conversion_rate',
      title: 'High traffic, low conversions',
      description: `${ga4Metric.sessions} sessions with ${(ga4Metric.conversionRate * 100).toFixed(2)}% conversion rate. Improve CTA, page layout, or form.`,
      priority: 'high',
    })
  }

  // High bounce rate
  if (ga4Metric.bounceRate > 0.6) {
    insights.push({
      type: 'high_bounce_rate',
      title: 'Bounce rate above 60%',
      description: 'Visitors leave without engaging. Check: page relevance, load time, content quality, UX.',
      priority: 'high',
    })
  }

  // Low engagement
  if (ga4Metric.sessions > 50 && ga4Metric.engagementRate < 0.2) {
    insights.push({
      type: 'low_engagement',
      title: 'Low engagement rate',
      description: 'Visitors land but don\'t engage. Add compelling content, CTAs, or interactive elements.',
      priority: 'medium',
    })
  }

  // Traffic opportunity from GSC
  if (gscMetric && gscMetric.impressions > 100 && ga4Metric.sessions === 0) {
    insights.push({
      type: 'ctr_improvement_opportunity',
      title: 'Ranking but not getting clicks',
      description: `Page has ${gscMetric.impressions} impressions but ${ga4Metric.sessions} sessions. Improve title, meta, and snippets.`,
      priority: 'high',
    })
  }

  // Revenue opportunity (if value per visit is set)
  if (valuePerVisit > 0 && ga4Metric.conversions < ga4Metric.sessions * 0.02) {
    const potentialRevenue = ga4Metric.sessions * 0.02 * valuePerVisit
    const currentRevenue = ga4Metric.revenue
    const delta = potentialRevenue - currentRevenue

    if (delta > 100) {
      insights.push({
        type: 'revenue_opportunity',
        title: `$${Math.round(delta)} revenue opportunity`,
        description: `Reaching just 2% conversion rate could generate $${Math.round(delta)} more revenue. Current: ${(ga4Metric.conversionRate * 100).toFixed(2)}%.`,
        priority: 'high',
      })
    }
  }

  return insights
}
