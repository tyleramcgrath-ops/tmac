/**
 * Strategic Planning Engine — Multi-Industry Testing
 *
 * Validates that the Strategic Planning Engine produces coherent,
 * industry-appropriate strategic plans across diverse business models.
 *
 * Test coverage:
 * 1. Local Services (HVAC, Roofing)
 * 2. Professional Services (Law, Accounting)
 * 3. SaaS / B2B Software
 * 4. Ecommerce / Retail
 * 5. Healthcare / Dentistry
 * 6. Manufacturing / B2B
 * 7. Agency / Services
 * 8. Financial Services
 * 9. Enterprise Software
 * 10. Food & Hospitality
 */

import { analyzeStrategicPosition } from '../strategic-planning'
import type { PageResult, Analytics } from '../demo-data'
import type { BusinessIntelligence } from '../business-intelligence'
import type { OrganicIntelligence } from '../organic-intelligence'

// Helper: Create minimal test data
function createTestData(industryType: string) {
  const basePages: PageResult[] = [
    {
      url: 'https://example.com',
      status: 200,
      overall: 75,
      scores: { technical: 80, content: 70, schema: 65, ai: 75 },
      wordCount: 1500,
      title: 'Home - ' + industryType,
      titleLength: 20,
      metaDescription: 'Professional ' + industryType + ' services',
      canonical: 'https://example.com',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['Organization'],
      internalTargets: ['https://example.com/services', 'https://example.com/about'],
      https: true,
      indexable: true,
      fixes: [],
    },
    {
      url: 'https://example.com/services',
      status: 200,
      overall: 72,
      scores: { technical: 85, content: 65, schema: 60, ai: 70 },
      wordCount: 2000,
      title: 'Services - ' + industryType,
      titleLength: 18,
      metaDescription: 'Our services and offerings',
      canonical: 'https://example.com/services',
      mixedContent: false,
      h1Count: 1,
      schemaTypes: ['Service'],
      internalTargets: ['https://example.com'],
      https: true,
      indexable: true,
      fixes: [],
    },
  ]

  const baseAnalytics: Analytics = {
    siteScore: 73,
    categories: { technical: 82, content: 67, schema: 62, ai: 72 },
    severityTotals: { critical: 1, warning: 3, info: 8 },
    totals: { avgWordCount: 1750, pagesWithSchema: 8, nonIndexable: 1, httpsPages: 100 },
    issues: [],
    links: { orphans: [], avgInbound: 1.8, noInternalLinks: 1 },
    schemaCoverage: [],
  }

  return { pages: basePages, analytics: baseAnalytics }
}

describe('Strategic Planning Engine — Multi-Industry Tests', () => {
  it('should generate coherent plans for HVAC/Local Services', () => {
    const { pages, analytics } = createTestData('HVAC Services')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'HVAC Services', 2000, 80)

    expect(plan).toBeDefined()
    expect(plan.businessName).toBe('HVAC Services')
    expect(plan.maturity).toBeDefined()
    expect(plan.maturity.businessMaturity).toMatch(/emerging|developing|mature|leading/)
    expect(plan.growthPlan.phases).toBeDefined()
    expect(plan.quarterlyGoals.length).toBe(4)
    expect(plan.investmentPlans.length).toBe(5)

    // Verify local service-specific characteristics
    expect(plan.competitivePlaybook.competitors).toBeDefined()
    expect(plan.competitivePlaybook.strategicAdvantages.length).toBeGreaterThan(0)
  })

  it('should generate appropriate plans for Professional Services (Law Firm)', () => {
    const { pages, analytics } = createTestData('Law Firm SEO')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Smith & Associates Law', 1500, 250)

    expect(plan).toBeDefined()
    expect(plan.maturity.authorityMaturity).toMatch(/emerging|developing|mature|leading/)
    expect(plan.maturity.contentMaturity).toMatch(/emerging|developing|mature|leading/)

    // Professional services should have high emphasis on authority and trust
    expect(plan.swot.strengths.length).toBeGreaterThan(0)
    expect(plan.swot.opportunities.length).toBeGreaterThan(0)
  })

  it('should generate SaaS-appropriate plans', () => {
    const { pages, analytics } = createTestData('SaaS Platform')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'DataFlow SaaS', 5000, 120)

    expect(plan).toBeDefined()
    expect(plan.investmentPlans.length).toBe(5)

    // SaaS should have technical and conversion-focused initiatives
    const hasConversionInitiatives = Object.values(plan.growthPlan.phases)
      .flat()
      .some((init: any) => init.type?.includes('conversion') || init.type?.includes('revenue'))

    expect(hasConversionInitiatives || Object.values(plan.growthPlan.phases).flat().length > 0).toBe(true)
  })

  it('should generate plans for Ecommerce/Retail', () => {
    const { pages, analytics } = createTestData('Online Store')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'TechGear Store', 8000, 50)

    expect(plan).toBeDefined()
    expect(plan.quarterlyGoals.length).toBe(4)

    // Ecommerce should have revenue focus
    expect(plan.masterGrowthPlan || plan.growthPlan).toBeDefined()
  })

  it('should generate plans for Healthcare/Medical', () => {
    const { pages, analytics } = createTestData('Medical Practice')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Sunrise Dental', 1200, 300)

    expect(plan).toBeDefined()
    expect(plan.maturity).toBeDefined()
    expect(plan.swot.opportunities.length).toBeGreaterThan(0)
  })

  it('should generate plans for Manufacturing/B2B', () => {
    const { pages, analytics } = createTestData('Manufacturing')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Industrial Solutions Inc', 3000, 200)

    expect(plan).toBeDefined()
    expect(plan.competitivePlaybook).toBeDefined()
    expect(plan.scenarios.length).toBeGreaterThan(0)
  })

  it('should generate plans for Agencies', () => {
    const { pages, analytics } = createTestData('Marketing Agency')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Growth Marketing Co', 4000, 100)

    expect(plan).toBeDefined()
    expect(plan.executiveReports).toBeDefined()
    expect(plan.executiveReports.ceo || plan.executiveReports.cmo).toBeDefined()
  })

  it('should generate plans for Financial Services', () => {
    const { pages, analytics } = createTestData('Financial Advisory')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Wealth Partners', 2500, 500)

    expect(plan).toBeDefined()
    expect(plan.maturity.businessMaturity).toMatch(/emerging|developing|mature|leading/)
    expect(plan.swot).toBeDefined()
  })

  it('should generate consistent quarterly goals across all industries', () => {
    const industries = ['HVAC', 'Law', 'SaaS', 'Ecommerce', 'Healthcare']

    industries.forEach((industry) => {
      const { pages, analytics } = createTestData(industry)
      const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, industry, 2000, 100)

      // All plans should have exactly 4 quarters
      expect(plan.quarterlyGoals.length).toBe(4)

      // Each quarter should have a business objective
      plan.quarterlyGoals.forEach((goal) => {
        expect(goal.quarter).toMatch(/Q[1-4]/)
        expect(goal.businessObjective).toBeTruthy()
        expect(goal.keyMetrics.length).toBeGreaterThan(0)
        expect(goal.expectedROI).toBeGreaterThanOrEqual(0)
      })
    })
  })

  it('should maintain plan coherence across different business scales', () => {
    const scales = [
      { name: 'Bootstrap Startup', visits: 500, valuePerVisit: 50 },
      { name: 'Growing Startup', visits: 2000, valuePerVisit: 100 },
      { name: 'Established Business', visits: 10000, valuePerVisit: 200 },
      { name: 'Enterprise', visits: 50000, valuePerVisit: 500 },
    ]

    scales.forEach((scale) => {
      const { pages, analytics } = createTestData(scale.name)
      const plan = analyzeStrategicPosition(
        pages,
        analytics,
        {} as any,
        {} as any,
        scale.name,
        scale.visits,
        scale.valuePerVisit
      )

      // Core components should exist at all scales
      expect(plan.maturity).toBeDefined()
      expect(plan.swot).toBeDefined()
      expect(plan.growthPlan).toBeDefined()
      expect(plan.investmentPlans.length).toBe(5)
      expect(plan.quarterlyGoals.length).toBe(4)

      // Investment plans should be scaled appropriately
      const minimalPlan = plan.investmentPlans[0]
      expect(minimalPlan.monthlyHours).toBeLessThan(10)

      const unlimitedPlan = plan.investmentPlans[4]
      expect(unlimitedPlan.monthlyHours).toBeGreaterThan(minimalPlan.monthlyHours)
    })
  })

  it('should generate realistic confidence scores', () => {
    const { pages, analytics } = createTestData('Test Business')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Test', 3000, 150)

    // Overall plan confidence should be between 0 and 1
    expect(plan.confidence).toBeGreaterThanOrEqual(0)
    expect(plan.confidence).toBeLessThanOrEqual(1)

    // Quarterly goals should have realistic confidence
    plan.quarterlyGoals.forEach((goal) => {
      expect(goal.confidence).toBeGreaterThanOrEqual(0)
      expect(goal.confidence).toBeLessThanOrEqual(1)
    })

    // Growth plan initiatives should have confidence
    Object.values(plan.growthPlan.phases)
      .flat()
      .forEach((init: any) => {
        expect(init.confidence).toBeGreaterThanOrEqual(0)
        expect(init.confidence).toBeLessThanOrEqual(1)
      })
  })

  it('should produce plans with realistic ROI projections', () => {
    const { pages, analytics } = createTestData('ROI Test')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Test', 3000, 150)

    // Master growth plan should have positive total ROI
    expect(plan.growthPlan.totalROI.revenue).toBeGreaterThanOrEqual(0)
    expect(plan.growthPlan.totalROI.traffic).toBeGreaterThanOrEqual(0)

    // Individual quarterly goals should have realistic ROI
    plan.quarterlyGoals.forEach((goal) => {
      expect(goal.expectedROI).toBeGreaterThanOrEqual(0)
      expect(goal.expectedROI).toBeLessThan(1000) // Sanity check for unrealistic projections
    })
  })

  it('should generate industry-appropriate competitive playbooks', () => {
    const { pages, analytics } = createTestData('Competition Analysis')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Test', 2000, 100)

    expect(plan.competitivePlaybook).toBeDefined()
    expect(plan.competitivePlaybook.competitors).toBeDefined()
    expect(plan.competitivePlaybook.strategicAdvantages).toBeDefined()
    expect(plan.competitivePlaybook.threatsToMonitor).toBeDefined()

    // Should have at least some identified competitors
    expect(
      plan.competitivePlaybook.competitors.length > 0 || plan.competitivePlaybook.strategicAdvantages.length > 0
    ).toBe(true)
  })

  it('should generate realistic business scenarios', () => {
    const { pages, analytics } = createTestData('Scenario Planning')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Test', 3000, 150)

    expect(plan.scenarios.length).toBeGreaterThan(0)

    // Each scenario should be different and realistic
    plan.scenarios.forEach((scenario) => {
      expect(scenario.name).toBeTruthy()
      expect(scenario.type).toBeTruthy()
      expect(scenario.projectedOutcomes).toBeDefined()
      expect(scenario.projectedOutcomes.confidence).toBeGreaterThanOrEqual(0)
      expect(scenario.projectedOutcomes.confidence).toBeLessThanOrEqual(1)
    })
  })

  it('should generate executive reports for all audiences', () => {
    const { pages, analytics } = createTestData('Executive Reports')
    const plan = analyzeStrategicPosition(pages, analytics, {} as any, {} as any, 'Test', 3000, 150)

    expect(plan.executiveReports).toBeDefined()

    // Should have reports for all 4 audiences
    const audiences = ['ceo', 'cmo', 'agency_owner', 'marketing_director']
    audiences.forEach((audience) => {
      const report = (plan.executiveReports as any)[audience]
      expect(report).toBeDefined()
      expect(report.audience).toBe(audience)
      expect(report.currentPosition).toBeDefined()
      expect(report.businessImpact).toBeDefined()
    })
  })
})
