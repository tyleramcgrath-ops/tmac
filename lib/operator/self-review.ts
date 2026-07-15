import { getPrismaClient } from '@/lib/db'
import type { Prisma } from '@prisma/client'

/**
 * Self-Review Engine (Phase 8.2).
 *
 * Second-pass reasoning that challenges the initial shortlist,
 * then promotes, demotes, merges, replaces, suppresses, or escalates
 * recommendations before final presentation.
 */

export interface ReviewDecision {
  candidateId: string
  action: 'promote' | 'demote' | 'merge' | 'replace' | 'suppress' | 'escalate'
  reasoning: string
  confidence: number // 0-1
  alternativeCandidateId?: string // for merge/replace
}

export interface SelfReviewResult {
  reviewCycleId: string
  projectId: string
  originalCount: number
  finalCount: number
  decisionsCount: {
    promotions: number
    demotions: number
    merges: number
    replacements: number
    suppressions: number
    escalations: number
  }
  decisions: ReviewDecision[]
  consultantReview?: {
    strategyType: 'fastest_roi' | 'long_term_authority' | 'lowest_risk'
    headline: string
    steps: string[]
    expectedROI?: number
    timelineWeeks?: number
    riskLevel: 'low' | 'medium' | 'high'
    rationale: string
  }
  finalShortlist: string[]
}

interface CandidateContext {
  id: string
  rank: number
  score: number
  source: string
  reasoning: string
  contentQuality?: number
}

export async function executeSelfReview(input: {
  projectId: string
  shortlist: CandidateContext[]
  businessContext?: {
    industry?: string
    goals?: string[]
    constraints?: string[]
  }
}): Promise<SelfReviewResult> {
  const prisma = getPrismaClient()

  // Get organization ID from project
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { organizationId: true },
  })
  if (!project) {
    throw new Error(`Project ${input.projectId} not found`)
  }

  // Create review cycle record
  const reviewCycle = await prisma.operatorReviewCycle.create({
    data: {
      organizationId: project.organizationId,
      projectId: input.projectId,
      originalShortlist: input.shortlist.map((c) => c.id),
      reviewDecisions: [],
      finalShortlist: input.shortlist.map((c) => c.id),
      promotions: 0,
      demotions: 0,
      merges: 0,
      replacements: 0,
      suppressions: 0,
      escalations: 0,
    },
  })

  const decisions: ReviewDecision[] = []

  // Phase 1: Challenge each recommendation
  for (let i = 0; i < input.shortlist.length; i++) {
    const candidate = input.shortlist[i]

    // Check for suppression triggers
    if (shouldSuppress(candidate, input.shortlist, i)) {
      decisions.push({
        candidateId: candidate.id,
        action: 'suppress',
        reasoning: `Lower-confidence candidate with higher-ranked alternatives available`,
        confidence: 0.7,
      })
      continue
    }

    // Check for promotion opportunity
    if (shouldPromote(candidate, input.shortlist, i)) {
      decisions.push({
        candidateId: candidate.id,
        action: 'promote',
        reasoning: `Strong contextual fit despite initial ranking`,
        confidence: 0.75,
      })
    }

    // Check for demotion risk
    if (shouldDemote(candidate, input.shortlist)) {
      decisions.push({
        candidateId: candidate.id,
        action: 'demote',
        reasoning: `Outperformed by similar candidates in current context`,
        confidence: 0.6,
      })
    }
  }

  // Phase 2: Identify merges (similar candidates that can be consolidated)
  const mergeOpportunities = identifyMerges(input.shortlist)
  for (const merge of mergeOpportunities) {
    decisions.push({
      candidateId: merge.primaryId,
      action: 'merge',
      reasoning: `Consolidating similar candidates for cleaner presentation`,
      confidence: 0.65,
      alternativeCandidateId: merge.secondaryId,
    })
  }

  // Phase 3: Count decisions by type
  const decisionCounts = {
    promotions: decisions.filter((d) => d.action === 'promote').length,
    demotions: decisions.filter((d) => d.action === 'demote').length,
    merges: decisions.filter((d) => d.action === 'merge').length,
    replacements: decisions.filter((d) => d.action === 'replace').length,
    suppressions: decisions.filter((d) => d.action === 'suppress').length,
    escalations: decisions.filter((d) => d.action === 'escalate').length,
  }

  // Phase 4: Compute final shortlist
  const suppressedIds = new Set(
    decisions.filter((d) => d.action === 'suppress').map((d) => d.candidateId)
  )
  const mergedIds = new Set(
    decisions.filter((d) => d.action === 'merge').map((d) => d.alternativeCandidateId).filter(Boolean) as string[]
  )
  const finalShortlist = input.shortlist
    .filter((c) => !suppressedIds.has(c.id) && !mergedIds.has(c.id))
    .map((c) => c.id)

  // Update review cycle with final decisions
  await prisma.operatorReviewCycle.update({
    where: { id: reviewCycle.id },
    data: {
      reviewDecisions: JSON.parse(JSON.stringify(decisions)),
      finalShortlist,
      promotions: decisionCounts.promotions,
      demotions: decisionCounts.demotions,
      merges: decisionCounts.merges,
      replacements: decisionCounts.replacements,
      suppressions: decisionCounts.suppressions,
      escalations: decisionCounts.escalations,
    },
  })

  return {
    reviewCycleId: reviewCycle.id,
    projectId: input.projectId,
    originalCount: input.shortlist.length,
    finalCount: finalShortlist.length,
    decisionsCount: decisionCounts,
    decisions,
    finalShortlist,
  }
}

function shouldSuppress(
  candidate: CandidateContext,
  shortlist: CandidateContext[],
  index: number
): boolean {
  // Suppress if there are higher-ranked candidates with similar characteristics
  if (index > 2 && candidate.score < 0.4) return true
  if (candidate.source === 'fallback' && shortlist.length > 3) return true
  return false
}

function shouldPromote(
  candidate: CandidateContext,
  shortlist: CandidateContext[],
  index: number
): boolean {
  // Promote if strong qualitative signal despite lower rank
  if (candidate.contentQuality && candidate.contentQuality > 0.8 && index > 0) return true
  if (candidate.score > 0.75 && index > 2) return true
  return false
}

function shouldDemote(candidate: CandidateContext, shortlist: CandidateContext[]): boolean {
  // Demote if similar candidates rank higher with stronger evidence
  const similarHigher = shortlist.some((other) => other.score > candidate.score + 0.2)
  return similarHigher && candidate.score < 0.6
}

function identifyMerges(
  shortlist: CandidateContext[]
): Array<{ primaryId: string; secondaryId: string }> {
  const merges: Array<{ primaryId: string; secondaryId: string }> = []

  for (let i = 0; i < shortlist.length; i++) {
    for (let j = i + 1; j < shortlist.length; j++) {
      const a = shortlist[i]
      const b = shortlist[j]

      // Check if candidates are similar (simplified: same source, close scores)
      if (a.source === b.source && Math.abs(a.score - b.score) < 0.15) {
        merges.push({
          primaryId: a.id,
          secondaryId: b.id,
        })
      }
    }
  }

  return merges
}
