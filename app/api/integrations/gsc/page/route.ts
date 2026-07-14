// Get GSC metrics for a page merged with crawl data

import { getPrismaClient } from '@/lib/db'

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

    // Merge GSC with crawl data
    const merged = {
      url: pageUrl,
      gsc: gscMetric
        ? {
            clicks: gscMetric.clicks,
            impressions: gscMetric.impressions,
            ctr: gscMetric.ctr,
            position: gscMetric.position,
            topQueries: gscMetric.topQueries ? JSON.parse(gscMetric.topQueries) : [],
            lastSync: gscMetric.syncedAt,
          }
        : null,
      crawl: crawlData
        ? {
            title: crawlData.title,
            metaDescription: crawlData.metaDescription,
            h1: crawlData.h1,
            status: crawlData.status,
            canonical: crawlData.canonical,
            hasNoindex: crawlData.hasNoindex,
            contentLength: crawlData.contentLength,
            internalLinks: crawlData.internalLinks,
            technicalScore: crawlData.technicalScore,
            contentScore: crawlData.contentScore,
            schemaScore: crawlData.schemaScore,
            aiScore: crawlData.aiScore,
            schemaTypes: crawlData.schemaTypes ? JSON.parse(crawlData.schemaTypes) : [],
            issues: crawlData.issues.map((issue) => ({
              type: issue.type,
              severity: issue.severity,
              title: issue.title,
              description: issue.description,
            })),
          }
        : null,
      insights: buildInsights(gscMetric, crawlData),
    }

    return Response.json(merged)
  } catch (err) {
    console.error('[gsc/page] Error', err)
    return Response.json(
      { error: `Failed to fetch page data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

interface GSCMetric {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface CrawlPage {
  title: string | null
  metaDescription: string | null
  technicalScore: number
  contentScore: number
  schemaScore: number
  status: number
}

interface Insight {
  type: string
  title: string
  description: string
  action?: string
  priority: 'high' | 'medium' | 'low'
}

function buildInsights(gscMetric: { clicks: number; impressions: number; ctr: number; position: number } | null, crawlData: CrawlPage | null): Insight[] {
  const insights: Insight[] = []

  if (!gscMetric || !crawlData) return insights

  // High impressions but low CTR
  if (gscMetric.impressions > 100 && gscMetric.ctr < 2) {
    insights.push({
      type: 'low_ctr',
      title: 'Low CTR despite high impressions',
      description: `${gscMetric.impressions.toLocaleString()} impressions with only ${gscMetric.ctr.toFixed(1)}% CTR. Improve title and meta description.`,
      action: 'Rewrite title and meta',
      priority: 'high',
    })
  }

  // Ranking outside top 10
  if (gscMetric.position > 10 && gscMetric.position < 50) {
    insights.push({
      type: 'outside_top_10',
      title: `Ranking at position ${Math.round(gscMetric.position)}`,
      description: 'This page is close to top 10. Incremental improvements could move it to rank #1-10.',
      action: 'Review content and schema',
      priority: 'high',
    })
  }

  // No impressions but good crawl score
  if (gscMetric.impressions === 0 && crawlData.status === 200 && crawlData.technicalScore > 70) {
    insights.push({
      type: 'not_ranking',
      title: 'Good page not ranking',
      description: 'This page passes all technical checks but isn\'t showing in search. May need backlinks or better keyword targeting.',
      priority: 'medium',
    })
  }

  // Missing title or meta
  if ((gscMetric.impressions > 0 || gscMetric.clicks > 0) && (!crawlData.title || !crawlData.metaDescription)) {
    insights.push({
      type: 'missing_metadata',
      title: 'Missing title or meta description',
      description: 'Pages with traffic need compelling on-page metadata. Complete both title and meta description.',
      action: 'Generate with Forge',
      priority: 'high',
    })
  }

  // Low technical score despite traffic
  if (gscMetric.clicks > 50 && crawlData.technicalScore < 60) {
    insights.push({
      type: 'technical_debt',
      title: 'Technical issues on high-traffic page',
      description: 'This page has traffic but technical problems. Fix these for better performance and rankings.',
      action: 'View technical issues',
      priority: 'high',
    })
  }

  return insights
}
