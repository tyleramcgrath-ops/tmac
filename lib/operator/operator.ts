import { getPrismaClient } from '@/lib/db'
import { retrieveGraphContext } from '@/lib/pipeline/graph/queries'
import { collectCandidates } from './candidates'
import { applyJudgment } from './judgment'
import {
  isBlockedByMemory,
  learningMultiplierFor,
  loadMemoryMap,
  memoryKey,
  proposeMemory,
} from './memory'
import type {
  Candidate,
  FocusPlan,
  FocusWindow,
  OperatorReadout,
  OperatorRecommendation,
} from './types'
import { FOCUS_MINUTES } from './types'

/**
 * OperatorMode — the AI SEO employee.
 *
 * Answers "if I owned this business, what would I do next?" by pulling
 * candidates from every intelligence surface (graph, decision engine, money
 * pages, gaps, decay), applying senior-strategist judgment, filtering against
 * work memory, and returning ONE primary recommendation plus a very short
 * shortlist of alternatives.
 */
export async function computeNextAction(input: {
  projectId: string
  organizationId?: string
  persistProposals?: boolean
}): Promise<OperatorReadout> {
  const prisma = getPrismaClient()
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { id: true, organizationId: true },
  })
  if (!project) {
    return emptyReadout(input.projectId, 'Project not found — nothing to operate on.')
  }
  const organizationId = input.organizationId ?? project.organizationId

  const [candidates, memoryMap, businessProfile, seasonalPriorities, graphContext] =
    await Promise.all([
      collectCandidates(input.projectId),
      loadMemoryMap(input.projectId),
      prisma.businessProfile.findFirst({ where: { projectId: input.projectId } }),
      prisma.seasonalPriority.findMany({ where: { projectId: input.projectId } }),
      retrieveGraphContext({ projectId: input.projectId }).catch(() => null),
    ])

  const activeObjective = businessProfile?.activeObjective ?? null
  const activeSeasonalKeywords = new Set(
    seasonalPriorities.flatMap((s) => splitAndLower((s as any).focusKeywords ?? '')),
  )
  const hasBusinessProfile = !!businessProfile

  const scored = await Promise.all(
    candidates.map(async (c) => {
      const context = deriveContext(c, activeSeasonalKeywords)
      const { adjustedScore, boosts } = applyJudgment(c, context)
      const learningMultiplier = await learningMultiplierFor(input.projectId, c.recommendationType)
      const finalScore = adjustedScore * learningMultiplier
      return { candidate: c, adjustedScore, boosts, learningMultiplier, finalScore, context }
    }),
  )

  const filtered = scored.filter((s) => {
    const memory = memoryMap.get(memoryKey(s.candidate.pageUrl, s.candidate.recommendationType))
    return !isBlockedByMemory(memory)
  })
  filtered.sort((a, b) => b.finalScore - a.finalScore)

  const primary = filtered[0]
  const alternatives = filtered.slice(1, 4)

  const primaryRec = primary
    ? await buildRecommendation({
        organizationId,
        projectId: input.projectId,
        scored: primary,
        activeObjective,
        alternates: alternatives.map((a) => a.candidate),
        persistProposal: input.persistProposals ?? true,
      })
    : null

  const alternativeRecs: OperatorRecommendation[] = []
  for (const alt of alternatives) {
    alternativeRecs.push(
      await buildRecommendation({
        organizationId,
        projectId: input.projectId,
        scored: alt,
        activeObjective,
        alternates: filtered
          .filter((f) => f.candidate.id !== alt.candidate.id)
          .slice(0, 2)
          .map((f) => f.candidate),
        persistProposal: false,
      }),
    )
  }

  return {
    generatedAt: new Date().toISOString(),
    projectId: input.projectId,
    primaryRecommendation: primaryRec,
    alternatives: alternativeRecs,
    narrative: narrativeFor(primaryRec, filtered.length, hasBusinessProfile),
    dataAvailability: {
      hasGraph: !!graphContext && (graphContext?.totals.nodes ?? 0) > 0,
      hasDecisionEngine: filtered.some((s) => s.candidate.source === 'decision_engine'),
      hasBusinessProfile,
      hasSeasonality: seasonalPriorities.length > 0,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus Mode
// ─────────────────────────────────────────────────────────────────────────────

export async function computeFocusPlan(input: {
  projectId: string
  window: FocusWindow
}): Promise<FocusPlan> {
  const readout = await computeNextAction({ projectId: input.projectId, persistProposals: false })
  const budget = FOCUS_MINUTES[input.window]
  const chosen: OperatorRecommendation[] = []
  const refused: FocusPlan['refusedItems'] = []
  let used = 0
  const candidatesInOrder = [readout.primaryRecommendation, ...readout.alternatives].filter(
    (x): x is OperatorRecommendation => !!x,
  )

  for (const item of candidatesInOrder) {
    if (used + item.estimatedMinutes <= budget) {
      chosen.push(item)
      used += item.estimatedMinutes
    } else {
      refused.push({
        item,
        reason: `Doesn't fit — ${item.estimatedMinutes}m needed, ${budget - used}m left`,
      })
    }
    if (used >= budget) break
  }

  return {
    window: input.window,
    windowMinutes: budget,
    scheduledMinutes: used,
    items: chosen,
    refusedItems: refused,
    narrative: focusNarrative(input.window, chosen),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reasoning + narrative
// ─────────────────────────────────────────────────────────────────────────────

interface ScoredCandidate {
  candidate: Candidate
  adjustedScore: number
  boosts: ReturnType<typeof applyJudgment>['boosts']
  learningMultiplier: number
  finalScore: number
  context: ReturnType<typeof deriveContext>
}

async function buildRecommendation(input: {
  organizationId: string
  projectId: string
  scored: ScoredCandidate
  activeObjective: string | null
  alternates: Candidate[]
  persistProposal: boolean
}): Promise<OperatorRecommendation> {
  const { scored } = input
  const c = scored.candidate

  const memory = input.persistProposal
    ? await proposeMemory({
        organizationId: input.organizationId,
        projectId: input.projectId,
        pageUrl: c.pageUrl,
        recommendationType: c.recommendationType,
        snapshot: {
          rawScore: c.rawScore,
          adjustedScore: scored.adjustedScore,
          finalScore: scored.finalScore,
          boosts: scored.boosts,
          learningMultiplier: scored.learningMultiplier,
          evidence: c.evidence,
          metadata: c.metadata,
        },
      })
    : null

  const risk: OperatorRecommendation['risk'] =
    c.recommendationType.includes('rewrite') || c.recommendationType.includes('remove')
      ? 'medium'
      : 'low'

  const alt = input.alternates[0]
  const whyNotAnother = alt
    ? `Would take on ${friendlyType(alt.recommendationType)} for ${short(alt.pageUrl)} next, but it scored lower (${alt.rawScore.toFixed(0)} vs ${scored.finalScore.toFixed(0)})`
    : 'No comparable alternative — this is the top-ranked candidate'

  return {
    id: c.id,
    pageUrl: c.pageUrl,
    recommendationType: c.recommendationType,
    source: c.source,
    headline: headlineFor(c, scored.context),
    reasoning: {
      whyNow: whyNow(scored),
      whyThisPage: whyThisPage(c, scored.context),
      whyNotAnother,
      whyThisBeforeOther: `Ranked #1 with score ${scored.finalScore.toFixed(0)} after judgment${scored.learningMultiplier !== 1 ? ` and learning multiplier ${scored.learningMultiplier.toFixed(2)}` : ''}`,
      graphEvidence: c.evidence,
      businessObjective: input.activeObjective,
      ignoreConsequence: ignoreConsequence(c, scored.context),
      judgmentBoosts: scored.boosts,
    },
    expectedBusinessReturn: expectedReturn(c, scored.context),
    estimatedMinutes: c.estimatedMinutes,
    risk,
    confidence: Math.min(c.confidence * scored.learningMultiplier, 0.99),
    status: (memory?.status ?? 'proposed') as OperatorRecommendation['status'],
    memoryId: memory?.id,
  }
}

function deriveContext(
  c: Candidate,
  seasonalKeywords: Set<string>,
): {
  isMoneyPage: boolean
  hasTrafficDrop: boolean
  hasCtrDrop: boolean
  hasZeroTraffic: boolean
  isConvertingPage: boolean
  supportingCount: number
  daysSinceLastEdit: number | null
  seasonalPriority: boolean
} {
  const meta = c.metadata as Record<string, unknown>
  const decayType = typeof meta.decayType === 'string' ? meta.decayType : ''
  const isMoneyPage = meta.isMoneyPage === true
  const url = c.pageUrl.toLowerCase()
  const seasonalPriority = Array.from(seasonalKeywords).some((k) => k && url.includes(k))
  return {
    isMoneyPage,
    hasTrafficDrop: decayType === 'traffic_loss' || decayType === 'impressions_decline',
    hasCtrDrop: decayType === 'ctr_decline',
    hasZeroTraffic: c.rawScore < 15 && !isMoneyPage,
    isConvertingPage: isMoneyPage,
    supportingCount: typeof meta.supportingCount === 'number' ? meta.supportingCount : 0,
    daysSinceLastEdit: null,
    seasonalPriority,
  }
}

function headlineFor(
  c: Candidate,
  ctx: ReturnType<typeof deriveContext>,
): string {
  if (c.recommendationType === 'money_page_reinforcement') {
    return ctx.supportingCount === 0
      ? `Give ${short(c.pageUrl)} some supporting content — it's carrying revenue alone`
      : `Reinforce ${short(c.pageUrl)}`
  }
  if (c.recommendationType === 'add_faq_schema') return `Add FAQ schema to ${short(c.pageUrl)}`
  if (c.recommendationType === 'add_missing_entities')
    return `Cover the missing entities on ${short(c.pageUrl)}`
  if (c.recommendationType === 'add_internal_links')
    return `${short(c.pageUrl)} is orphaned — hand-link it from adjacent content`
  if (c.recommendationType === 'repair_topic_cluster')
    return `Repair the topic cluster around ${short(c.pageUrl)}`
  if (c.recommendationType.startsWith('link_to::'))
    return `Add an internal link from ${short(c.pageUrl)} to ${short(
      c.recommendationType.replace('link_to::', ''),
    )}`
  if (c.recommendationType.startsWith('close_gap::'))
    return `Close content gap: ${friendlyType(c.recommendationType)}`
  if (c.recommendationType.startsWith('decay::'))
    return `${short(c.pageUrl)} is decaying — investigate now`
  return `Work on ${short(c.pageUrl)} (${friendlyType(c.recommendationType)})`
}

function whyNow(scored: ScoredCandidate): string {
  const boost = scored.boosts.find((b) => b.delta >= 15)
  if (boost) return boost.reason
  if (scored.candidate.source === 'money_page_intelligence') {
    return 'The graph shows money-page weakness that directly threatens revenue'
  }
  if (scored.candidate.recommendationType.startsWith('decay::'))
    return 'A live decay alert is compounding — the longer it sits, the more you lose'
  return 'Currently the highest-leverage opportunity in the graph'
}

function whyThisPage(c: Candidate, ctx: ReturnType<typeof deriveContext>): string {
  if (ctx.isMoneyPage)
    return `${short(c.pageUrl)} is a money page — improvements here move business metrics directly`
  if (c.source === 'graph_orphan') return `${short(c.pageUrl)} is disconnected from the site graph`
  if (c.source === 'graph_broken_cluster')
    return `${short(c.pageUrl)} sits in a topic cluster with no internal cohesion`
  return `${short(c.pageUrl)} scored highest on the aggregate signal blend`
}

function ignoreConsequence(c: Candidate, ctx: ReturnType<typeof deriveContext>): string {
  if (ctx.isMoneyPage && ctx.hasCtrDrop) return 'Continued CTR loss compounds into ranking loss'
  if (ctx.isMoneyPage && ctx.hasTrafficDrop) return 'Traffic loss will show up in pipeline metrics within weeks'
  if (c.source === 'graph_orphan') return 'The page remains uncrawlable and hidden from PageRank flow'
  if (c.source === 'graph_broken_cluster') return 'Topical authority stays capped for the whole cluster'
  return 'Opportunity remains unrealized; competitors close the gap'
}

function expectedReturn(c: Candidate, ctx: ReturnType<typeof deriveContext>): string {
  if (ctx.isMoneyPage) return 'High — money page directly linked to revenue'
  if (c.source === 'graph_internal_link') return 'Low-medium — improves link equity flow'
  if (c.source === 'decision_engine') return 'Medium — measured by decision engine model'
  return 'Medium'
}

function narrativeFor(
  primary: OperatorRecommendation | null,
  totalCandidates: number,
  hasBusinessProfile: boolean,
): string {
  if (!primary) {
    if (totalCandidates === 0) return "Nothing to work on yet — I need a completed audit and graph build before I can recommend anything."
    return 'Every candidate I found is already in your work memory. Clear one out or wait for new data.'
  }
  const context = hasBusinessProfile ? '' : ' (I would be sharper if the business profile were filled in.)'
  return `I have ${totalCandidates} candidate${totalCandidates === 1 ? '' : 's'} on the board. My pick: ${primary.headline}.${context}`
}

function focusNarrative(window: FocusWindow, items: OperatorRecommendation[]): string {
  if (items.length === 0) return `You've got ${FOCUS_MINUTES[window]} minutes and nothing worth doing. Take the win.`
  if (items.length === 1) return `In ${FOCUS_MINUTES[window]}m I'd only tackle one thing: ${items[0].headline}.`
  return `${items.length} items in ${FOCUS_MINUTES[window]}m — starting with: ${items[0].headline}.`
}

function short(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? u.hostname : u.pathname
  } catch {
    return url
  }
}

function friendlyType(t: string): string {
  return t.replace(/::/g, ' → ').replace(/_/g, ' ')
}

function splitAndLower(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
}

function emptyReadout(projectId: string, narrative: string): OperatorReadout {
  return {
    generatedAt: new Date().toISOString(),
    projectId,
    primaryRecommendation: null,
    alternatives: [],
    narrative,
    dataAvailability: {
      hasGraph: false,
      hasDecisionEngine: false,
      hasBusinessProfile: false,
      hasSeasonality: false,
    },
  }
}
