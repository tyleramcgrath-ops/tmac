// Get daily insights (morning briefing)

import { getPrismaClient } from '@/lib/db'
import { generateInsights } from '@/lib/insight-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const date = url.searchParams.get('date') // optional, defaults to today

  if (!projectId) {
    return Response.json({ error: 'projectId is required.' }, { status: 400 })
  }

  try {
    const prisma = getPrismaClient()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    // Get date (default to today)
    const targetDate = date ? new Date(date) : new Date()
    const yesterday = new Date(targetDate)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayStr = targetDate.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Get yesterday's metrics
    const yesterdayGSC = await prisma.googleSearchConsoleMetric.findFirst({
      where: {
        projectId,
        dataDate: {
          gte: new Date(`${yesterdayStr}T00:00:00Z`),
          lt: new Date(`${yesterdayStr}T23:59:59Z`),
        },
      },
      orderBy: { syncedAt: 'desc' },
    })

    const yesterdayGA4 = await prisma.googleAnalytics4Metric.findFirst({
      where: {
        projectId,
        dataDate: {
          gte: new Date(`${yesterdayStr}T00:00:00Z`),
          lt: new Date(`${yesterdayStr}T23:59:59Z`),
        },
      },
      orderBy: { syncedAt: 'desc' },
    })

    // Get today's metrics
    const todayGSC = await prisma.googleSearchConsoleMetric.findFirst({
      where: {
        projectId,
        dataDate: {
          gte: new Date(`${todayStr}T00:00:00Z`),
          lt: new Date(`${todayStr}T23:59:59Z`),
        },
      },
      orderBy: { syncedAt: 'desc' },
    })

    const todayGA4 = await prisma.googleAnalytics4Metric.findFirst({
      where: {
        projectId,
        dataDate: {
          gte: new Date(`${todayStr}T00:00:00Z`),
          lt: new Date(`${todayStr}T23:59:59Z`),
        },
      },
      orderBy: { syncedAt: 'desc' },
    })

    // Get audits for today and yesterday
    const yesterdayAudit = await prisma.audit.findFirst({
      where: {
        projectId,
        endedAt: {
          gte: new Date(`${yesterdayStr}T00:00:00Z`),
          lt: new Date(`${yesterdayStr}T23:59:59Z`),
        },
        status: 'completed',
      },
      orderBy: { endedAt: 'desc' },
    })

    const todayAudit = await prisma.audit.findFirst({
      where: {
        projectId,
        endedAt: {
          gte: new Date(`${todayStr}T00:00:00Z`),
          lt: new Date(`${todayStr}T23:59:59Z`),
        },
        status: 'completed',
      },
      orderBy: { endedAt: 'desc' },
    })

    // Aggregate yesterday's metrics
    const yesterdayGSCMetrics = yesterdayAudit
      ? await prisma.googleSearchConsoleMetric.aggregate({
          where: { projectId },
          _sum: {
            clicks: true,
            impressions: true,
          },
          _avg: {
            ctr: true,
          },
        })
      : null

    const yesterdayGA4Metrics = yesterdayAudit
      ? await prisma.googleAnalytics4Metric.aggregate({
          where: { projectId },
          _sum: {
            users: true,
            sessions: true,
            conversions: true,
          },
          _avg: {
            bounceRate: true,
          },
        })
      : null

    // Aggregate today's metrics
    const todayGSCMetrics = todayAudit
      ? await prisma.googleSearchConsoleMetric.aggregate({
          where: { projectId },
          _sum: {
            clicks: true,
            impressions: true,
          },
          _avg: {
            ctr: true,
          },
        })
      : null

    const todayGA4Metrics = todayAudit
      ? await prisma.googleAnalytics4Metric.aggregate({
          where: { projectId },
          _sum: {
            users: true,
            sessions: true,
            conversions: true,
          },
          _avg: {
            bounceRate: true,
          },
        })
      : null

    // Generate insights
    const briefing = generateInsights(
      {
        gsc: yesterdayGSCMetrics
          ? {
              clicks: yesterdayGSCMetrics._sum.clicks || 0,
              impressions: yesterdayGSCMetrics._sum.impressions || 0,
              ctr: yesterdayGSCMetrics._avg.ctr || 0,
            }
          : undefined,
        ga4: yesterdayGA4Metrics
          ? {
              users: yesterdayGA4Metrics._sum.users || 0,
              sessions: yesterdayGA4Metrics._sum.sessions || 0,
              bounceRate: yesterdayGA4Metrics._avg.bounceRate || 0,
              conversions: yesterdayGA4Metrics._sum.conversions || 0,
            }
          : undefined,
        crawl: yesterdayAudit
          ? {
              pageCount: yesterdayAudit.pageCount,
              issueCount: yesterdayAudit.issueCount,
            }
          : undefined,
      },
      {
        gsc: todayGSCMetrics
          ? {
              clicks: todayGSCMetrics._sum.clicks || 0,
              impressions: todayGSCMetrics._sum.impressions || 0,
              ctr: todayGSCMetrics._avg.ctr || 0,
            }
          : undefined,
        ga4: todayGA4Metrics
          ? {
              users: todayGA4Metrics._sum.users || 0,
              sessions: todayGA4Metrics._sum.sessions || 0,
              bounceRate: todayGA4Metrics._avg.bounceRate || 0,
              conversions: todayGA4Metrics._sum.conversions || 0,
            }
          : undefined,
        crawl: todayAudit
          ? {
              pageCount: todayAudit.pageCount,
              issueCount: todayAudit.issueCount,
              newPages: [], // would need to compare URLs from yesterday vs today
            }
          : undefined,
      },
      yesterdayAudit?.issueCount || 0,
      todayAudit?.issueCount || 0,
      [] // competitor changes would come from competitor tracking
    )

    return Response.json(briefing)
  } catch (err) {
    console.error('[insights/daily] Error', err)
    return Response.json(
      { error: `Failed to generate insights: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
