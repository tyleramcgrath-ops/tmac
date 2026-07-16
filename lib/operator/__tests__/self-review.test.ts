import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { executeSelfReview } from '../self-review'
import { generateWhyNotAnalysis } from '../why-not'
import { executeConsultantReview } from '../consultant'
import { auditRecommendationConfidence } from '../confidence-audit'
import { analyzeOpportunityCost } from '../opportunity-cost'
import {
  calculateRecommendationAccuracy,
  calculateCoverageBreadth,
  calculateDecisionConfidence,
  calculateEvidenceQuality,
  calculateTierDistribution,
  calculateConflictResolution,
  calculateLearningVelocity,
  calculateBusinessImpact,
} from '../quality-metrics'
import { getPrismaClient } from '@/lib/db'
import type { Organization, Project } from '@prisma/client'

describe('Phase 8.2: Self-Review Engine', () => {
  let org: Organization
  let project: Project
  const prisma = getPrismaClient()

  beforeAll(async () => {
    // Create test org and project
    org = await prisma.organization.create({
      data: {
        name: 'test-self-review-org',
        slug: `test-self-review-${Date.now()}`,
      },
    })

    project = await prisma.project.create({
      data: {
        organizationId: org.id,
        name: 'test-self-review-project',
        slug: `test-self-review-${Date.now()}`,
      },
    })
  })

  afterAll(async () => {
    await prisma.operatorReviewCycle.deleteMany({ where: { projectId: project.id } })
    await prisma.operatorWhyNot.deleteMany({ where: { projectId: project.id } })
    await prisma.operatorStrategy.deleteMany({ where: { projectId: project.id } })
    await prisma.operatorConfidenceAudit.deleteMany({ where: { projectId: project.id } })
    await prisma.operatorOpportunityCost.deleteMany({ where: { projectId: project.id } })
    await prisma.project.delete({ where: { id: project.id } })
    await prisma.organization.delete({ where: { id: org.id } })
  })

  describe('self-review engine', () => {
    it('creates review cycle with initial shortlist', async () => {
      const shortlist = [
        { id: 'c1', rank: 1, score: 0.85, source: 'ranker', reasoning: 'high relevance' },
        { id: 'c2', rank: 2, score: 0.72, source: 'ranker', reasoning: 'good fit' },
        { id: 'c3', rank: 3, score: 0.45, source: 'fallback', reasoning: 'low relevance' },
      ]

      const result = await executeSelfReview({
        projectId: project.id,
        shortlist,
      })

      expect(result.projectId).toBe(project.id)
      expect(result.originalCount).toBe(3)
      expect(result.reviewCycleId).toBeDefined()
    })

    it('suppresses low-confidence fallback candidates', async () => {
      const shortlist = [
        { id: 'c1', rank: 1, score: 0.9, source: 'ranker', reasoning: 'high relevance' },
        { id: 'c2', rank: 2, score: 0.8, source: 'ranker', reasoning: 'good fit' },
        { id: 'c3', rank: 3, score: 0.3, source: 'fallback', reasoning: 'very low score' },
      ]

      const result = await executeSelfReview({
        projectId: project.id,
        shortlist,
      })

      const suppressions = result.decisions.filter((d) => d.action === 'suppress')
      expect(suppressions.length).toBeGreaterThan(0)
    })

    it('promotes high-quality candidates despite lower initial rank', async () => {
      const shortlist = [
        { id: 'c1', rank: 1, score: 0.8, source: 'ranker', reasoning: 'good' },
        {
          id: 'c2',
          rank: 2,
          score: 0.6,
          source: 'ranker',
          reasoning: 'acceptable',
          contentQuality: 0.95,
        },
      ]

      const result = await executeSelfReview({
        projectId: project.id,
        shortlist,
      })

      const promotions = result.decisions.filter((d) => d.action === 'promote')
      expect(promotions.length).toBeGreaterThan(0)
    })

    it('identifies merge opportunities for similar candidates', async () => {
      const shortlist = [
        { id: 'c1', rank: 1, score: 0.8, source: 'graph', reasoning: 'from graph' },
        { id: 'c2', rank: 2, score: 0.75, source: 'graph', reasoning: 'from graph' },
        { id: 'c3', rank: 3, score: 0.5, source: 'different', reasoning: 'other source' },
      ]

      const result = await executeSelfReview({
        projectId: project.id,
        shortlist,
      })

      const merges = result.decisions.filter((d) => d.action === 'merge')
      expect(merges.length).toBeGreaterThan(0)
    })

    it('tracks decision counts correctly', async () => {
      const shortlist = [
        { id: 'c1', rank: 1, score: 0.85, source: 'ranker', reasoning: 'high relevance' },
        { id: 'c2', rank: 2, score: 0.72, source: 'ranker', reasoning: 'good fit' },
        { id: 'c3', rank: 3, score: 0.40, source: 'fallback', reasoning: 'low relevance' },
      ]

      const result = await executeSelfReview({
        projectId: project.id,
        shortlist,
      })

      const totalDecisions =
        result.decisionsCount.promotions +
        result.decisionsCount.demotions +
        result.decisionsCount.merges +
        result.decisionsCount.replacements +
        result.decisionsCount.suppressions +
        result.decisionsCount.escalations

      expect(totalDecisions).toBeLessThanOrEqual(shortlist.length * 2)
    })

    it('generates final shortlist from review decisions', async () => {
      const shortlist = [
        { id: 'c1', rank: 1, score: 0.9, source: 'ranker', reasoning: 'high relevance' },
        { id: 'c2', rank: 2, score: 0.7, source: 'ranker', reasoning: 'acceptable' },
        { id: 'c3', rank: 3, score: 0.2, source: 'fallback', reasoning: 'very low' },
      ]

      const result = await executeSelfReview({
        projectId: project.id,
        shortlist,
      })

      expect(result.finalShortlist.length).toBeLessThanOrEqual(result.originalCount)
      expect(result.finalShortlist).toContain('c1')
    })
  })

  describe('why-not analysis engine', () => {
    it('generates why-not explanations for selected candidate', async () => {
      const allCandidates = [
        {
          id: 'selected',
          score: 0.9,
          contentQuality: 0.85,
          relevanceScore: 0.9,
          evidenceStrength: 0.8,
        },
        {
          id: 'rejected1',
          score: 0.7,
          contentQuality: 0.6,
          relevanceScore: 0.7,
          evidenceStrength: 0.6,
        },
        {
          id: 'rejected2',
          score: 0.75,
          contentQuality: 0.7,
          relevanceScore: 0.8,
          evidenceStrength: 0.75,
        },
      ]

      const result = await generateWhyNotAnalysis({
        projectId: project.id,
        selectedCandidateId: 'selected',
        allCandidates,
      })

      expect(result.selectedCandidateId).toBe('selected')
      expect(result.alternatives.length).toBeGreaterThan(0)
    })

    it('explains quality-based rejection', async () => {
      const allCandidates = [
        { id: 'winner', score: 0.9, contentQuality: 0.95, relevanceScore: 0.9, evidenceStrength: 0.85 },
        { id: 'loser', score: 0.8, contentQuality: 0.6, relevanceScore: 0.9, evidenceStrength: 0.85 },
      ]

      const result = await generateWhyNotAnalysis({
        projectId: project.id,
        selectedCandidateId: 'winner',
        allCandidates,
      })

      const qualityEntry = result.alternatives.find((a) => a.reason === 'lower_content_quality')
      expect(qualityEntry).toBeDefined()
    })

    it('explains relevance-based rejection', async () => {
      const allCandidates = [
        { id: 'winner', score: 0.9, contentQuality: 0.8, relevanceScore: 0.95, evidenceStrength: 0.8 },
        { id: 'loser', score: 0.85, contentQuality: 0.8, relevanceScore: 0.6, evidenceStrength: 0.8 },
      ]

      const result = await generateWhyNotAnalysis({
        projectId: project.id,
        selectedCandidateId: 'winner',
        allCandidates,
      })

      const relevanceEntry = result.alternatives.find((a) => a.reason === 'less_relevant')
      expect(relevanceEntry).toBeDefined()
    })

    it('ranks why-not alternatives by magnitude', async () => {
      const allCandidates = [
        { id: 'selected', score: 0.9, contentQuality: 0.8, relevanceScore: 0.8, evidenceStrength: 0.8 },
        { id: 'close', score: 0.85, contentQuality: 0.78, relevanceScore: 0.78, evidenceStrength: 0.78 },
        { id: 'far', score: 0.5, contentQuality: 0.4, relevanceScore: 0.4, evidenceStrength: 0.4 },
      ]

      const result = await generateWhyNotAnalysis({
        projectId: project.id,
        selectedCandidateId: 'selected',
        allCandidates,
      })

      if (result.alternatives.length >= 2) {
        expect(result.alternatives[0].magnitude).toBeGreaterThanOrEqual(result.alternatives[1].magnitude)
      }
    })
  })

  describe('consultant review engine', () => {
    it('generates three alternative strategies', async () => {
      const result = await executeConsultantReview({
        projectId: project.id,
        shortlist: [
          { id: 'c1', score: 0.9 },
          { id: 'c2', score: 0.7 },
          { id: 'c3', score: 0.5 },
        ],
      })

      expect(result.strategies.length).toBe(3)
      const types = result.strategies.map((s) => s.strategyType)
      expect(types).toContain('fastest_roi')
      expect(types).toContain('long_term_authority')
      expect(types).toContain('lowest_risk')
    })

    it('fastest_roi strategy has shortest timeline', async () => {
      const result = await executeConsultantReview({
        projectId: project.id,
        shortlist: [{ id: 'c1', score: 0.9 }],
      })

      const fastest = result.strategies.find((s) => s.strategyType === 'fastest_roi')
      const longterm = result.strategies.find((s) => s.strategyType === 'long_term_authority')

      expect(fastest?.timelineWeeks).toBeLessThan(longterm?.timelineWeeks ?? 999)
    })

    it('long_term_authority strategy has highest expected ROI', async () => {
      const result = await executeConsultantReview({
        projectId: project.id,
        shortlist: [{ id: 'c1', score: 0.9 }],
      })

      const fastest = result.strategies.find((s) => s.strategyType === 'fastest_roi')
      const longterm = result.strategies.find((s) => s.strategyType === 'long_term_authority')

      expect(longterm?.expectedROI).toBeGreaterThan(fastest?.expectedROI ?? 0)
    })

    it('marks recommended strategy based on business context', async () => {
      const result = await executeConsultantReview({
        projectId: project.id,
        shortlist: [{ id: 'c1', score: 0.9 }],
        businessContext: {
          goals: ['Build long-term authority and brand strength'],
          timeline: 'Q2-Q3',
        },
      })

      const recommended = result.strategies.find((s) => s.isRecommended)
      expect(recommended?.strategyType).toBe('long_term_authority')
    })

    it('recommends fastest_roi for urgent timelines', async () => {
      const result = await executeConsultantReview({
        projectId: project.id,
        shortlist: [{ id: 'c1', score: 0.9 }],
        businessContext: {
          timeline: 'This week is critical',
        },
      })

      const recommended = result.strategies.find((s) => s.isRecommended)
      expect(recommended?.strategyType).toBe('fastest_roi')
    })

    it('each strategy has distinct steps and rationale', async () => {
      const result = await executeConsultantReview({
        projectId: project.id,
        shortlist: [{ id: 'c1', score: 0.9 }],
      })

      const stepSets = result.strategies.map((s) => JSON.stringify(s.steps))
      const uniqueSteps = new Set(stepSets)
      expect(uniqueSteps.size).toBe(3)
    })
  })

  describe('confidence audit engine', () => {
    it('audits recommendation confidence with quality flags', async () => {
      const result = await auditRecommendationConfidence({
        projectId: project.id,
        candidateId: 'test-c1',
        metadata: {
          contentQuality: 0.8,
          sourcesCount: 5,
          hasGSC: true,
          hasGA4: true,
          graphEvidenceStrength: 0.8,
          entityDetectionScore: 0.75,
        },
      })

      expect(result.audit.overallConfidence).toBeGreaterThan(0)
      expect(result.audit.evidenceQuality).toBeGreaterThan(0)
      expect(result.audit.dataFreshness).toBeGreaterThan(0)
      expect(result.audit.dataSourceCoverage).toBeGreaterThan(0)
    })

    it('flags missing GSC data', async () => {
      const result = await auditRecommendationConfidence({
        projectId: project.id,
        candidateId: 'test-c2',
        metadata: { hasGSC: false, hasGA4: true },
      })

      expect(result.audit.dataQualityFlags.noGSC).toBe(true)
      expect(result.audit.missingData).toContain(expect.stringContaining('Google Search Console'))
    })

    it('flags missing GA4 data', async () => {
      const result = await auditRecommendationConfidence({
        projectId: project.id,
        candidateId: 'test-c3',
        metadata: { hasGSC: true, hasGA4: false },
      })

      expect(result.audit.dataQualityFlags.noGA4).toBe(true)
      expect(result.audit.missingData).toContain(expect.stringContaining('Analytics'))
    })

    it('flags weak entity detection', async () => {
      const result = await auditRecommendationConfidence({
        projectId: project.id,
        candidateId: 'test-c4',
        metadata: { entityDetectionScore: 0.3 },
      })

      expect(result.audit.dataQualityFlags.weakEntityDetection).toBe(true)
      expect(result.audit.reasonsForCaution).toContain(expect.stringContaining('Entity detection'))
    })

    it('lists assumptions and unknowns', async () => {
      const result = await auditRecommendationConfidence({
        projectId: project.id,
        candidateId: 'test-c5',
        metadata: { contentQuality: 0.5 },
      })

      expect(result.audit.assumptions.length).toBeGreaterThan(0)
      expect(result.audit.unknownVariables.length).toBeGreaterThan(0)
    })

    it('higher confidence with GSC, GA4, and good sources', async () => {
      const result = await auditRecommendationConfidence({
        projectId: project.id,
        candidateId: 'test-c6',
        metadata: {
          hasGSC: true,
          hasGA4: true,
          sourcesCount: 8,
          entityDetectionScore: 0.9,
          graphEvidenceStrength: 0.9,
        },
      })

      expect(result.audit.overallConfidence).toBeGreaterThan(0.6)
    })
  })

  describe('opportunity cost analysis', () => {
    it('analyzes delayed candidates and business impact', async () => {
      const result = await analyzeOpportunityCost({
        projectId: project.id,
        selectedCandidateId: 'selected',
        allCandidates: [
          { id: 'selected', score: 0.9, trafficPotential: 0.8, urgencyLevel: 'high' },
          { id: 'delayed1', score: 0.7, trafficPotential: 0.7, urgencyLevel: 'high' },
          { id: 'delayed2', score: 0.6, trafficPotential: 0.5, urgencyLevel: 'medium' },
        ],
      })

      expect(result.selectedCandidateId).toBe('selected')
      expect(result.costs.length).toBeGreaterThan(0)
    })

    it('assigns high cost to delayed high-traffic urgent items', async () => {
      const result = await analyzeOpportunityCost({
        projectId: project.id,
        selectedCandidateId: 'selected',
        allCandidates: [
          { id: 'selected', score: 0.9 },
          { id: 'delayed', score: 0.85, trafficPotential: 0.9, urgencyLevel: 'high' },
        ],
      })

      const cost = result.costs.find((c) => c.delayedCandidateId === 'delayed')
      expect(cost?.costMagnitude).toBe('high')
    })

    it('assigns low cost to delayed low-priority items', async () => {
      const result = await analyzeOpportunityCost({
        projectId: project.id,
        selectedCandidateId: 'selected',
        allCandidates: [
          { id: 'selected', score: 0.9 },
          { id: 'delayed', score: 0.5, trafficPotential: 0.2, urgencyLevel: 'low' },
        ],
      })

      const cost = result.costs.find((c) => c.delayedCandidateId === 'delayed')
      expect(cost?.costMagnitude).toBe('low')
    })

    it('calculates reasonable delay estimates', async () => {
      const result = await analyzeOpportunityCost({
        projectId: project.id,
        selectedCandidateId: 'selected',
        allCandidates: [
          { id: 'selected', score: 0.9 },
          { id: 'delayed', score: 0.7 },
        ],
        estimatedCapacity: 20,
      })

      const cost = result.costs[0]
      expect(cost.estimatedDelay).toBeGreaterThan(0)
      expect(cost.estimatedDelay).toBeLessThan(60)
    })

    it('includes business impact description', async () => {
      const result = await analyzeOpportunityCost({
        projectId: project.id,
        selectedCandidateId: 'selected',
        allCandidates: [
          { id: 'selected', score: 0.9 },
          { id: 'delayed', score: 0.75, trafficPotential: 0.7 },
        ],
      })

      expect(result.costs[0].businessImpact).toBeTruthy()
      expect(result.costs[0].businessImpact.length).toBeGreaterThan(0)
    })
  })

  describe('quality metrics calculations', () => {
    it('calculates recommendation accuracy from outcomes', async () => {
      const accuracy = await calculateRecommendationAccuracy({
        projectId: project.id,
        recommendations: ['c1', 'c2'],
        outcomes: [
          { candidateId: 'c1', trafficLift: 100, conversionLift: 0.05 },
          { candidateId: 'c2', trafficLift: -50, conversionLift: 0 },
        ],
        period: 'week',
      })

      expect(accuracy).toBeGreaterThan(0)
      expect(accuracy).toBeLessThanOrEqual(1)
    })

    it('calculates coverage breadth', async () => {
      const breadth = await calculateCoverageBreadth({
        projectId: project.id,
        shortlistSize: 5,
        totalCandidates: 20,
      })

      expect(breadth).toBe(0.25)
    })

    it('calculates decision confidence', async () => {
      const confidence = await calculateDecisionConfidence({
        projectId: project.id,
        recommendations: [
          { candidateId: 'c1', confidenceScore: 0.9 },
          { candidateId: 'c2', confidenceScore: 0.7 },
        ],
      })

      expect(confidence).toBeCloseTo(0.8)
    })

    it('calculates evidence quality', async () => {
      const quality = await calculateEvidenceQuality({
        projectId: project.id,
        recommendations: [
          { candidateId: 'c1', evidenceQuality: 0.8 },
          { candidateId: 'c2', evidenceQuality: 0.6 },
        ],
      })

      expect(quality).toBeCloseTo(0.7)
    })

    it('calculates tier distribution alignment', async () => {
      const distribution = await calculateTierDistribution({
        projectId: project.id,
        primaryMission: 1,
        nextBest: 3,
        watch: 3,
        deferred: 2,
      })

      expect(distribution).toBeGreaterThan(0)
      expect(distribution).toBeLessThanOrEqual(1)
    })

    it('calculates conflict resolution rate', async () => {
      const resolution = await calculateConflictResolution({
        projectId: project.id,
        conflictsCaught: 8,
        conflictsTotal: 10,
      })

      expect(resolution).toBeCloseTo(0.8)
    })

    it('handles zero conflicts gracefully', async () => {
      const resolution = await calculateConflictResolution({
        projectId: project.id,
        conflictsCaught: 0,
        conflictsTotal: 0,
      })

      expect(resolution).toBe(1)
    })

    it('calculates learning velocity', async () => {
      const velocity = await calculateLearningVelocity({
        projectId: project.id,
        previousMetric: 0.5,
        currentMetric: 0.65,
        weeksObserved: 4,
      })

      expect(velocity).toBeGreaterThan(0.5)
    })

    it('calculates business impact from traffic and conversion gains', async () => {
      const impact = await calculateBusinessImpact({
        projectId: project.id,
        trafficGain: 500,
        conversionGain: 25,
        revenueGain: 250,
      })

      expect(impact).toBeGreaterThan(0)
      expect(impact).toBeLessThanOrEqual(1)
    })
  })

  describe('cross-module integration', () => {
    it('orchestrates review cycle with all sub-engines', async () => {
      const shortlist = [
        { id: 'c1', rank: 1, score: 0.9, source: 'ranker', reasoning: 'top pick' },
        { id: 'c2', rank: 2, score: 0.7, source: 'ranker', reasoning: 'backup' },
        { id: 'c3', rank: 3, score: 0.3, source: 'fallback', reasoning: 'filler' },
      ]

      // Run self-review
      const reviewResult = await executeSelfReview({
        projectId: project.id,
        shortlist,
      })

      expect(reviewResult.finalShortlist.length).toBeGreaterThan(0)

      // Generate why-not for top candidate
      const topCandidate = reviewResult.finalShortlist[0]
      const whyNotResult = await generateWhyNotAnalysis({
        projectId: project.id,
        selectedCandidateId: topCandidate,
        allCandidates: shortlist.map((c) => ({
          ...c,
          contentQuality: Math.random(),
          relevanceScore: Math.random(),
          evidenceStrength: Math.random(),
        })),
      })

      expect(whyNotResult.alternatives.length).toBeGreaterThan(0)
    })
  })
})
