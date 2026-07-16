import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { analyzeStrategicPosition } from '@/lib/strategic-planning'
import { generateStrategicMissions, createStrategicOperatorWorkflow } from '@/lib/strategic-integration'
import { analyzeBusinessIntelligence } from '@/lib/business-intelligence'
import { analyzeOrganic } from '@/lib/organic-intelligence'
import { demoStrategicPages, demoStrategicAnalytics, DEMO_BUSINESS_NAME, DEMO_MONTHLY_VISITS, DEMO_VALUE_PER_VISIT } from '@/lib/fixtures/demo-strategic-data'

/**
 * GET /api/strategic/missions
 *
 * Get quarterly strategic missions for a project.
 * Converts the strategic plan into actionable missions with milestones.
 *
 * Query params:
 * - projectId: string (optional, uses demo if not provided)
 * - quarter: Q1|Q2|Q3|Q4 (optional, current quarter if not provided)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const quarter = (searchParams.get('quarter') || 'Q1') as any

    // For demo: generate a sample strategic plan from realistic fixture data.
    // In production: fetch from database.
    const demoPages = demoStrategicPages
    const demoAnalytics = demoStrategicAnalytics

    // Generate a strategic plan
    const businessName = DEMO_BUSINESS_NAME
    const monthlyVisits = DEMO_MONTHLY_VISITS
    const valuePerVisit = DEMO_VALUE_PER_VISIT
    const business = analyzeBusinessIntelligence(demoPages, demoAnalytics, businessName, monthlyVisits, valuePerVisit)
    const organic = analyzeOrganic(demoPages, demoAnalytics, businessName)
    const plan = analyzeStrategicPosition(demoPages, demoAnalytics, business, organic, businessName, monthlyVisits, valuePerVisit)

    // Convert to missions
    const missions = generateStrategicMissions(plan, quarter)

    // Get current quarter missions
    const currentQuarter = missions.find((m) => m.quarter === quarter)

    if (!currentQuarter) {
      return NextResponse.json(
        { error: 'Quarter not found', available: missions.map((m) => m.quarter) },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      businessName: plan.businessName,
      quarter: currentQuarter.quarter,
      year: currentQuarter.year,
      missions: currentQuarter.missions,
      quarterlyObjective: currentQuarter.quarterlyBusinessObjective,
      keyMetrics: currentQuarter.keyMetrics,
      expectedROI: currentQuarter.expectedQuarterlyROI,
      successCriteria: currentQuarter.successCriteria,
      generatedAt: currentQuarter.generatedAt,
      _meta: {
        totalMissions: currentQuarter.missions.length,
        totalExpectedROI: currentQuarter.missions.reduce((sum, m) => sum + m.expectedROI, 0),
        averagePriority:
          currentQuarter.missions.reduce((sum, m) => sum + m.priority, 0) / currentQuarter.missions.length,
      },
    })
  } catch (error) {
    console.error('[strategic/missions]', error)
    return NextResponse.json(
      { error: 'Failed to fetch strategic missions', details: (error as any).message },
      { status: 500 }
    )
  }
}
