// Generate opportunities from competitor changes

import { getPrismaClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const competitorId = url.searchParams.get('competitorId')
  const onlyActionable = url.searchParams.get('onlyActionable') === 'true'

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

    // Get opportunities, optionally filtered by competitor
    const whereClause: Record<string, unknown> = {
      competitor: { projectId },
      dismissed: false,
    }

    if (competitorId) {
      whereClause.competitorId = competitorId
    }

    const opportunities = await prisma.competitorOpportunity.findMany({
      where: whereClause,
      include: {
        competitor: {
          select: {
            id: true,
            domain: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ detectedAt: 'desc' }],
    })

    // Filter high-priority opportunities
    const highPriorityOpportunities = opportunities.filter((opp) => {
      if (onlyActionable && !opp.recommendedAction) {
        return false
      }
      return opp.opportunity || opp.competitive_threat
    })

    // Group by type
    const grouped: Record<string, typeof opportunities> = {}
    for (const opp of highPriorityOpportunities) {
      if (!grouped[opp.changeType]) {
        grouped[opp.changeType] = []
      }
      grouped[opp.changeType].push(opp)
    }

    return Response.json({
      projectId,
      total: opportunities.length,
      actionable: highPriorityOpportunities.length,
      opportunities: highPriorityOpportunities.map((opp) => ({
        id: opp.id,
        competitorDomain: opp.competitor.domain,
        competitorDisplayName: opp.competitor.displayName,
        changeType: opp.changeType,
        title: opp.title,
        description: opp.description,
        competitive_threat: opp.competitive_threat,
        opportunity: opp.opportunity,
        recommendedAction: opp.recommendedAction,
        actionType: opp.actionType,
        estimatedTraffic: opp.estimatedTraffic,
        estimatedDifficulty: opp.estimatedDifficulty,
        estimatedTime: opp.estimatedTime,
        detectedAt: opp.detectedAt,
      })),
      grouped: Object.entries(grouped).map(([type, items]) => ({
        type,
        count: items.length,
      })),
    })
  } catch (err) {
    console.error('[competitors/opportunities] Error', err)
    return Response.json(
      { error: `Failed to get opportunities: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const competitorChangeId = String(body.competitorChangeId ?? '')
  const actionType = body.actionType ? String(body.actionType) : undefined

  if (!competitorChangeId) {
    return Response.json(
      { error: 'competitorChangeId is required.' },
      { status: 400 }
    )
  }

  try {
    const prisma = getPrismaClient()

    const change = await prisma.competitorChange.findUnique({
      where: { id: competitorChangeId },
    })

    if (!change) {
      return Response.json({ error: 'Change not found.' }, { status: 404 })
    }

    // Generate opportunity from change using AI logic
    const opportunity = generateOpportunityFromChange(change, actionType)

    // Store opportunity
    const stored = await prisma.competitorOpportunity.create({
      data: {
        competitorId: change.competitorId,
        changeType: change.type,
        title: opportunity.title,
        description: opportunity.description,
        competitive_threat: opportunity.competitive_threat,
        opportunity: opportunity.opportunity,
        recommendedAction: opportunity.recommendedAction,
        actionType: opportunity.actionType,
        estimatedTraffic: opportunity.estimatedTraffic,
        estimatedDifficulty: opportunity.estimatedDifficulty,
        estimatedTime: opportunity.estimatedTime,
      },
    })

    return Response.json({
      success: true,
      opportunity: {
        id: stored.id,
        title: stored.title,
        description: stored.description,
        recommendedAction: stored.recommendedAction,
        actionType: stored.actionType,
        estimatedTraffic: stored.estimatedTraffic,
        estimatedDifficulty: stored.estimatedDifficulty,
        estimatedTime: stored.estimatedTime,
      },
    })
  } catch (err) {
    console.error('[competitors/opportunities] POST Error', err)
    return Response.json(
      { error: `Failed to create opportunity: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

function generateOpportunityFromChange(
  change: {
    type: string
    description: string
    count: number
    impact?: string
    impactReason?: string
  },
  actionType?: string
): {
  title: string
  description: string
  competitive_threat: boolean
  opportunity: boolean
  recommendedAction: string
  actionType: string
  estimatedTraffic?: number
  estimatedDifficulty?: string
  estimatedTime?: number
} {
  const baseOpportunity = {
    competitive_threat: change.impact === 'competitive_threat',
    opportunity: change.impact === 'opportunity',
  }

  // Generate type-specific opportunity details
  switch (change.type) {
    case 'contentExpansion':
      return {
        title: `Competitor expanding topical authority`,
        description: `Your competitor is building content clusters. ${change.description}. ${change.impactReason || ''}`,
        recommendedAction: `Create matching content cluster to maintain competitive parity`,
        actionType: actionType || 'create_cluster',
        estimatedTraffic: 50 * change.count,
        estimatedDifficulty: 'high',
        estimatedTime: 40 * change.count,
        ...baseOpportunity,
      }

    case 'newPages':
      return {
        title: `Competitor published new pages`,
        description: `${change.count} new pages detected. ${change.impactReason || 'Monitor for keyword overlap.'}`,
        recommendedAction: `Analyze topic gaps and create equivalent content if strategic`,
        actionType: actionType || 'analyze_gap',
        estimatedTraffic: 20 * change.count,
        estimatedDifficulty: 'medium',
        estimatedTime: 15 * change.count,
        ...baseOpportunity,
      }

    case 'schemaChanges':
      return {
        title: `Competitor improving schema/AI readiness`,
        description: `Schema added to ${change.count} pages. ${change.impactReason || 'They are optimizing for rich snippets and AI.'}`,
        recommendedAction: `Add matching schema markup to your equivalent pages`,
        actionType: actionType || 'add_schema',
        estimatedTraffic: 30 * change.count,
        estimatedDifficulty: 'easy',
        estimatedTime: 5 * change.count,
        ...baseOpportunity,
      }

    case 'linkingChanges':
      return {
        title: `Competitor restructured internal linking`,
        description: `${change.description}. ${change.impactReason || ''}`,
        recommendedAction: `Review your internal linking strategy vs. their new structure`,
        actionType: actionType || 'improve_linking',
        estimatedTraffic: 15,
        estimatedDifficulty: 'medium',
        estimatedTime: 8,
        ...baseOpportunity,
      }

    case 'removedPages':
      return {
        title: `Pages removed from competitor site`,
        description: `${change.count} pages no longer crawlable. ${change.impactReason || 'Content opportunity if still valuable.'}`,
        recommendedAction: `Check if these topics are now unserved. Create content to capture searches`,
        actionType: actionType || 'capture_gap',
        estimatedTraffic: 25 * change.count,
        estimatedDifficulty: 'medium',
        estimatedTime: 20 * change.count,
        ...baseOpportunity,
      }

    case 'titleChanges':
      return {
        title: `Competitor updated titles across pages`,
        description: `${change.count} title changes detected. ${change.impactReason || 'May indicate keyword strategy shift.'}`,
        recommendedAction: `Monitor rankings. Update your titles if targeting same keywords`,
        actionType: actionType || 'analyze_keyword_shift',
        estimatedTraffic: 10 * change.count,
        estimatedDifficulty: 'easy',
        estimatedTime: 3 * change.count,
        ...baseOpportunity,
      }

    default:
      return {
        title: change.description,
        description: change.impactReason || 'Monitor competitor activity',
        recommendedAction: 'Review and assess competitive impact',
        actionType: actionType || 'monitor',
        estimatedTraffic: 0,
        estimatedDifficulty: 'low',
        estimatedTime: 0,
        ...baseOpportunity,
      }
  }
}
