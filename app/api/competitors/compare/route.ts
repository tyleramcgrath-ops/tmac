// Side-by-side comparison between your project and a competitor

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const competitorId = url.searchParams.get('competitorId')

  if (!projectId || !competitorId) {
    return Response.json(
      { error: 'projectId and competitorId are required.' },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        audits: {
          where: { status: 'completed' },
          orderBy: { endedAt: 'desc' },
          take: 1,
        },
        googleSearchConsole: {
          orderBy: { syncedAt: 'desc' },
          take: 1,
        },
        googleAnalytics4: {
          orderBy: { syncedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!project) {
      return Response.json({ error: 'Project not found.' }, { status: 404 })
    }

    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        snapshots: {
          orderBy: { crawledAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!competitor) {
      return Response.json({ error: 'Competitor not found.' }, { status: 404 })
    }

    const yourLatestAudit = project.audits.length > 0 ? project.audits[0] : null
    const competitorLatestSnapshot = competitor.snapshots.length > 0 ? competitor.snapshots[0] : null

    // Build comparison report
    const comparison = {
      project: {
        domain: project.domain,
        lastAudit: yourLatestAudit?.endedAt || null,
        technical: {
          score: yourLatestAudit?.technicalScore || 0,
          issueCount: yourLatestAudit?.issueCount || 0,
        },
        content: {
          score: yourLatestAudit?.contentScore || 0,
          pageCount: yourLatestAudit?.pageCount || 0,
          schemaCoverage: yourLatestAudit?.schemaCoverage || 0,
        },
        schema: {
          score: yourLatestAudit?.schemaScore || 0,
        },
        search: {
          lastSync: project.googleSearchConsole.length > 0 ? project.googleSearchConsole[0].syncedAt : null,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        },
        analytics: {
          lastSync: project.googleAnalytics4.length > 0 ? project.googleAnalytics4[0].syncedAt : null,
          sessions: 0,
          engagement: 0,
          conversions: 0,
        },
        indexability: {
          indexed: yourLatestAudit?.pageCount || 0,
          crawlable: 0,
          noindex: 0,
        },
      },
      competitor: {
        domain: competitor.domain,
        displayName: competitor.displayName,
        lastCrawl: competitorLatestSnapshot?.crawledAt || null,
        technical: {
          score: competitorLatestSnapshot?.technicalScore || 0,
        },
        content: {
          score: competitorLatestSnapshot?.contentScore || 0,
          pageCount: competitorLatestSnapshot?.pageCount || 0,
          schemaCoverage: competitorLatestSnapshot?.schemaScore || 0,
        },
        schema: {
          score: competitorLatestSnapshot?.schemaScore || 0,
        },
      },
      analysis: {
        technicalGap: (yourLatestAudit?.technicalScore || 0) - (competitorLatestSnapshot?.technicalScore || 0),
        contentGap: (yourLatestAudit?.contentScore || 0) - (competitorLatestSnapshot?.contentScore || 0),
        schemaGap: (yourLatestAudit?.schemaScore || 0) - (competitorLatestSnapshot?.schemaScore || 0),
        sizeGap: (yourLatestAudit?.pageCount || 0) - (competitorLatestSnapshot?.pageCount || 0),
        recommendation: generateComparisonRecommendation(
          yourLatestAudit,
          competitorLatestSnapshot
        ),
      },
    }

    // Aggregate GSC metrics
    if (project.googleSearchConsole.length > 0) {
      const gsc = project.googleSearchConsole[0]
      comparison.project.search.clicks = gsc.clicks
      comparison.project.search.impressions = gsc.impressions
      comparison.project.search.ctr = gsc.ctr
      comparison.project.search.position = gsc.position
    }

    // Aggregate GA4 metrics
    if (project.googleAnalytics4.length > 0) {
      const ga4 = project.googleAnalytics4[0]
      comparison.project.analytics.sessions = ga4.sessions
      comparison.project.analytics.engagement = ga4.engagementRate
      comparison.project.analytics.conversions = ga4.conversions
    }

    return Response.json(comparison)
  } catch (err) {
    console.error('[competitors/compare] Error', err)
    return Response.json(
      { error: `Failed to compare: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

function generateComparisonRecommendation(
  yourAudit: any,
  competitorSnapshot: any
): string {
  if (!yourAudit) {
    return 'Run an audit to baseline your site metrics and begin competitive analysis'
  }

  if (!competitorSnapshot) {
    return 'Crawl competitor to establish baseline for comparison'
  }

  const technicalGap = (yourAudit.technicalScore || 0) - (competitorSnapshot.technicalScore || 0)
  const contentGap = (yourAudit.contentScore || 0) - (competitorSnapshot.contentScore || 0)
  const schemaGap = (yourAudit.schemaScore || 0) - (competitorSnapshot.schemaScore || 0)

  if (technicalGap < -20) {
    return 'Technical SEO gap: Fix critical issues first (canonical, noindex, indexability)'
  }

  if (contentGap < -20) {
    return 'Content gap: Competitor has more/better content. Expand your content clusters'
  }

  if (schemaGap < -20) {
    return 'Schema gap: Add schema markup to pages for AI readiness and rich snippets'
  }

  if (technicalGap > 10 && contentGap > 10) {
    return 'You are ahead on both technical and content. Monitor for competitive threats'
  }

  return 'Monitor both sites for changes. Keep technical health high and content current'
}
