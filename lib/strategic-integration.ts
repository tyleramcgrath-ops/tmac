/**
 * Strategic Integration Layer
 *
 * Bridges Strategic Planning Engine with Decision Engine and Operator.
 * Converts strategic initiatives into actionable quarterly missions and
 * operator candidates for daily execution.
 *
 * Flow:
 * Strategic Plan → Quarterly Goals → Operator Candidates → Daily Missions
 */

import type { StrategicPlan, QuarterlyGoal, MasterGrowthPlan } from './strategic-planning'
import { formatRoiPercent } from './roi'

// Re-export for convenience
export type StrategicInitiative = any // Type extracted from MasterGrowthPlan.phases values

import type { Candidate } from './operator/types'

export interface StrategicMission {
  id: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  initiativeId: string
  initiativeTitle: string
  businessObjective: string
  targetMetrics: {
    metric: string
    target: number
    unit: string
    baseline: number
  }[]
  expectedROI: number
  effort: {
    hours: number
    phases: number
    resources: string[]
  }
  timeline: string
  priority: 1 | 2 | 3 | 4 | 5
  confidence: number
  dependencies: string[]
  successCriteria: string[]
  milestone30Days: string
  milestone90Days: string
  riskFactors: string[]
  mitigation: string[]
}

export interface StrategicMissionSet {
  businessName: string
  year: number
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  missions: StrategicMission[]
  quarterlyBusinessObjective: string
  keyMetrics: { metric: string; target: number; unit: string }[]
  expectedQuarterlyROI: number
  successCriteria: string[]
  generatedAt: string
}

/**
 * Convert a Strategic Plan into quarterly mission sets for the Operator.
 * Creates a mission for each initiative in the appropriate quarter,
 * with milestones, success criteria, and risk mitigation.
 */
export function generateStrategicMissions(
  plan: StrategicPlan,
  currentQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q1'
): StrategicMissionSet[] {
  const quarters: ('Q1' | 'Q2' | 'Q3' | 'Q4')[] = ['Q1', 'Q2', 'Q3', 'Q4']
  const currentIndex = quarters.indexOf(currentQuarter)

  // Create quarterly mission sets
  return quarters.map((quarter, offset) => {
    const quarterIndex = (currentIndex + offset) % 4
    const quarterOffset = Math.floor((currentIndex + offset) / 4)
    const quarterlyGoal = plan.quarterlyGoals.find((g) => g.quarter === quarter)

    // Flatten all initiatives from all phases
    const allInitiatives = Object.values(plan.growthPlan.phases).flat() as any[]

    // Map initiatives to this quarter
    const initiativesForQuarter = allInitiatives
      .filter((init) => isInitiativeForQuarter(init.timeline, quarter, offset))
      .slice(0, 5) // Limit to 5 primary initiatives per quarter

    const missions: StrategicMission[] = initiativesForQuarter.map((init, idx) => ({
      id: `mission_${quarter.toLowerCase()}_${idx + 1}`,
      quarter: quarter as any,
      initiativeId: init.id,
      initiativeTitle: init.title,
      businessObjective: quarterlyGoal?.businessObjective ?? init.businessReason,
      targetMetrics: quarterlyGoal?.keyMetrics.map((km) => ({
        metric: km.metric,
        target: km.target,
        unit: km.unit,
        baseline: 0,
      })) ?? [
        { metric: 'Traffic Growth', target: 30, unit: '%', baseline: 0 },
        { metric: 'Revenue Impact', target: formatRoiPercent(init.expectedROI.revenue).percent, unit: '%', baseline: 0 },
      ],
      expectedROI: formatRoiPercent(init.expectedROI.revenue).percent,
      effort: init.effort,
      timeline: init.timeline,
      priority: init.priority,
      confidence: init.confidence,
      dependencies: init.dependencies,
      successCriteria: generateSuccessCriteria(init),
      milestone30Days: generateMilestone30(init),
      milestone90Days: generateMilestone90(init),
      riskFactors: init.evidence,
      mitigation: generateMitigation(init),
    }))

    return {
      businessName: plan.businessName,
      year: new Date().getFullYear() + quarterOffset,
      quarter,
      missions,
      quarterlyBusinessObjective: quarterlyGoal?.businessObjective ?? 'Execute quarterly strategy',
      keyMetrics: quarterlyGoal?.keyMetrics ?? [],
      expectedQuarterlyROI: quarterlyGoal?.expectedROI ?? 0,
      successCriteria: generateQuarterSuccessCriteria(quarter, missions),
      generatedAt: new Date().toISOString(),
    }
  })
}

/**
 * Convert Strategic Initiatives into Operator Candidates.
 * Each initiative becomes a candidate that the Operator can recommend.
 */
export function initiativeToCandidate(
  initiative: StrategicInitiative,
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
): Candidate {
  return {
    id: `strategic_${initiative.id}`,
    projectId: '', // Will be set by caller
    type: mapInitiativeTypeToAction(initiative.type),
    actionUrl: `strategic/${initiative.id}`,
    source: 'strategic-plan',
    businessValue: formatRoiPercent(initiative.expectedROI.revenue).percent,
    seoValue: formatRoiPercent(initiative.expectedROI.traffic).percent,
    effort: estimateEffortHours(initiative),
    confidence: initiative.confidence,
    rationale: initiative.description,
    explainability: {
      whyThis: initiative.businessReason,
      whyNow: `Part of ${quarter} strategic initiative`,
      evidence: initiative.evidence,
      risks: [],
      upside: `+${formatRoiPercent(initiative.expectedROI.revenue).percent}% revenue impact (estimated)`,
    },
    dependencies: initiative.dependencies,
    timeframe: quarter,
    tags: [initiative.type, 'strategic', quarter.toLowerCase()],
    createdAt: new Date().toISOString(),
  } as any
}

/**
 * Determine if an initiative should be included in a specific quarter.
 */
function isInitiativeForQuarter(
  timeline: 'first_30_days' | 'days_31_90' | 'months_4_6' | 'months_7_12',
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  quarterOffset: number
): boolean {
  // Q1 (first 30 days = first_30_days and early days_31_90)
  // Q1-Q2 (30-90 days = rest of days_31_90)
  // Q2-Q3 (4-6 months = months_4_6)
  // Q3-Q4 (7-12 months = months_7_12)

  const quarterMap: Record<string, string[]> = {
    Q1: ['first_30_days', 'days_31_90'],
    Q2: ['days_31_90', 'months_4_6'],
    Q3: ['months_4_6', 'months_7_12'],
    Q4: ['months_7_12'],
  }

  return quarterMap[quarter]?.includes(timeline) ?? false
}

/**
 * Map strategic initiative types to Operator action types.
 */
function mapInitiativeTypeToAction(
  type: string
): 'content' | 'technical' | 'authority' | 'conversion' | 'other' {
  const typeMap: Record<string, 'content' | 'technical' | 'authority' | 'conversion' | 'other'> = {
    expand_locations: 'conversion',
    comparison_content: 'content',
    authority_building: 'authority',
    service_clusters: 'content',
    trust_content: 'content',
    topical_authority: 'authority',
    ai_visibility: 'technical',
    conversion_paths: 'conversion',
    revenue_pages: 'conversion',
    content_production: 'content',
    technical_foundation: 'technical',
  }
  return typeMap[type] ?? 'other'
}

/**
 * Estimate total effort hours for an initiative.
 */
function estimateEffortHours(init: StrategicInitiative): number {
  const timelineMap: Record<string, number> = {
    first_30_days: 40,
    days_31_90: 80,
    months_4_6: 120,
    months_7_12: 200,
  }
  return timelineMap[init.timeline] ?? 80
}

/**
 * Generate success criteria from an initiative.
 */
function generateSuccessCriteria(init: StrategicInitiative): string[] {
  const traffic = formatRoiPercent(init.expectedROI.traffic)
  const revenue = formatRoiPercent(init.expectedROI.revenue)
  const leads = Math.max(0, Math.min(1000, Math.round(init.expectedROI.leads || 0)))
  return [
    `Achieve an estimated +${traffic.percent}% traffic growth`,
    `Generate an estimated +${revenue.percent}% revenue impact`,
    `Capture an estimated +${leads} leads from new content`,
    `Complete within ${init.effort.phases} phase(s)`,
    `Maintain >90% confidence throughout execution`,
  ]
}

/**
 * Generate 30-day milestone from initiative details.
 */
function generateMilestone30(init: StrategicInitiative): string {
  if (init.timeline === 'first_30_days') {
    return `Complete ${init.title} deployment and initial content creation`
  }
  if (init.timeline === 'days_31_90') {
    return `Complete 30% of ${init.title} implementation`
  }
  return `Begin ${init.title} planning and resource allocation`
}

/**
 * Generate 90-day milestone from initiative details.
 */
function generateMilestone90(init: StrategicInitiative): string {
  if (init.timeline === 'first_30_days') {
    return `Full optimization and performance validation complete`
  }
  if (init.timeline === 'days_31_90') {
    return `Complete ${init.title} deployment, begin measurement`
  }
  if (init.timeline === 'months_4_6') {
    return `50% completion with positive early signals`
  }
  return `90 days of planning and infrastructure setup complete`
}

/**
 * Generate risk mitigation strategies from initiative evidence.
 */
function generateMitigation(init: StrategicInitiative): string[] {
  return [
    'Weekly progress tracking against milestones',
    'Bi-weekly ROI verification against targets',
    'Real-time performance monitoring of new content/features',
    'Rollback plan if confidence drops below 70%',
    'Resource reallocation if effort exceeds estimates by >20%',
  ]
}

/**
 * Generate quarter-level success criteria from missions.
 */
function generateQuarterSuccessCriteria(
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  missions: StrategicMission[]
): string[] {
  const avgROI = Math.round(missions.reduce((a, m) => a + m.expectedROI, 0) / missions.length)
  return [
    `Execute ${missions.length} strategic initiatives`,
    `Achieve average +${avgROI}% ROI across initiatives`,
    `Complete all Priority 1-2 initiatives on schedule`,
    `Maintain >80% execution confidence throughout quarter`,
    `Document all lessons learned for next quarter`,
  ]
}

/**
 * Integrate Strategic Plan with Operator workflow.
 * Periodically converts strategic initiatives into missions and candidates.
 */
export function createStrategicOperatorWorkflow(plan: StrategicPlan) {
  return {
    /**
     * Get current quarter missions for Operator.
     */
    getCurrentQuarterMissions(): StrategicMissionSet {
      const now = new Date()
      const month = now.getMonth()
      const currentQuarter = (
        month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4'
      ) as 'Q1' | 'Q2' | 'Q3' | 'Q4'

      const allMissions = generateStrategicMissions(plan, currentQuarter)
      return allMissions[0]
    },

    /**
     * Get all annual missions for strategic view.
     */
    getAnnualMissions(): StrategicMissionSet[] {
      return generateStrategicMissions(plan, 'Q1')
    },

    /**
     * Convert current quarter missions to Operator candidates.
     */
    toOperatorCandidates(): Candidate[] {
      const allInitiatives = Object.values(plan.growthPlan.phases).flat() as any[]
      const currentMissions = this.getCurrentQuarterMissions()
      return currentMissions.missions.flatMap((mission) =>
        allInitiatives
          .filter((init) => init.id === mission.initiativeId)
          .map((init) => initiativeToCandidate(init, currentMissions.quarter))
      )
    },

    /**
     * Get next recommended mission for daily work.
     */
    getNextMission(): StrategicMission | null {
      const current = this.getCurrentQuarterMissions()
      return current.missions.sort((a, b) => b.priority - a.priority)[0] ?? null
    },

    /**
     * Track mission progress and update strategic memory.
     */
    recordMissionProgress(missionId: string, status: 'started' | 'progressing' | 'blocked' | 'completed', notes: string) {
      return {
        missionId,
        status,
        notes,
        timestamp: new Date().toISOString(),
        // In real implementation, persist to strategic memory
      }
    },
  }
}
