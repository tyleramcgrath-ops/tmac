import { NextRequest, NextResponse } from 'next/server'
import { analyzeStrategicPosition } from '@/lib/strategic-planning'
import { createStrategicOperatorWorkflow } from '@/lib/strategic-integration'
import { analyzeBusinessIntelligence } from '@/lib/business-intelligence'
import { analyzeOrganic } from '@/lib/organic-intelligence'
import type { PageResult, Analytics } from '@/lib/demo-data'

/**
 * GET /api/strategic/candidates
 *
 * Get operator candidates from the strategic plan.
 * Each strategic initiative is converted into an operator candidate that can be
 * recommended as a daily mission.
 *
 * Query params:
 * - projectId: string (optional, uses demo if not provided)
 * - quarter: Q1|Q2|Q3|Q4 (optional, current quarter if not provided)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quarter = (searchParams.get('quarter') || getCurrentQuarter()) as any

    // Generate a strategic plan (demo)
    const demoPages: PageResult[] = [
      {
        url: 'https://example.com',
        status: 200,
        overall: 85,
        scores: { technical: 90, content: 80, schema: 75, ai: 85 },
        wordCount: 2000,
        title: 'Example Page',
        titleLength: 12,
        metaDescription: 'Example description',
        canonical: 'https://example.com',
        mixedContent: false,
        h1Count: 1,
        schemaTypes: ['Organization'],
        internalTargets: [],
        https: true,
        indexable: true,
        fixes: [],
      },
    ]

    const demoAnalytics: Analytics = {
      siteScore: 78,
      categories: { technical: 82, content: 75, schema: 70, ai: 80 },
      severityTotals: { critical: 2, warning: 5, info: 10 },
      totals: { avgWordCount: 1500, pagesWithSchema: 45, nonIndexable: 3, httpsPages: 98 },
      issues: [],
      links: {
        orphans: [],
        avgInbound: 2.5,
        noInternalLinks: 3,
      },
      schemaCoverage: [],
    }

    const businessName = 'Demo Business'
    const monthlyVisits = 5000
    const valuePerVisit = 150
    const business = analyzeBusinessIntelligence(demoPages, demoAnalytics, businessName, monthlyVisits, valuePerVisit)
    const organic = analyzeOrganic(demoPages, demoAnalytics, businessName)
    const plan = analyzeStrategicPosition(demoPages, demoAnalytics, business, organic, businessName, monthlyVisits, valuePerVisit)

    // Create operator workflow
    const workflow = createStrategicOperatorWorkflow(plan)

    // Get quarterly missions
    const missions = workflow.getCurrentQuarterMissions()
    const nextMission = workflow.getNextMission()

    return NextResponse.json({
      success: true,
      quarter: missions.quarter,
      year: missions.year,
      candidateCount: missions.missions.length,
      nextMissionId: nextMission?.id,
      nextMissionTitle: nextMission?.initiativeTitle,
      nextMissionPriority: nextMission?.priority,
      candidates: missions.missions.map((m) => ({
        id: m.id,
        initiativeId: m.initiativeId,
        title: m.initiativeTitle,
        businessObjective: m.businessObjective,
        expectedROI: m.expectedROI,
        effort: m.effort.hours,
        priority: m.priority,
        confidence: m.confidence,
        timeline: m.timeline,
        quarter: missions.quarter,
      })),
      summary: {
        totalMissions: missions.missions.length,
        averageEffort: Math.round(missions.missions.reduce((sum, m) => sum + m.effort.hours, 0) / missions.missions.length),
        averageConfidence: Math.round(
          (missions.missions.reduce((sum, m) => sum + m.confidence * 100, 0) / missions.missions.length)
        ),
        totalExpectedROI: missions.missions.reduce((sum, m) => sum + m.expectedROI, 0),
      },
      _meta: {
        generatedAt: plan.generatedAt,
        planConfidence: plan.confidence,
      },
    })
  } catch (error) {
    console.error('[strategic/candidates]', error)
    return NextResponse.json(
      { error: 'Failed to fetch strategic candidates', details: (error as any).message },
      { status: 500 }
    )
  }
}

function getCurrentQuarter(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const month = new Date().getMonth()
  if (month < 3) return 'Q1'
  if (month < 6) return 'Q2'
  if (month < 9) return 'Q3'
  return 'Q4'
}
