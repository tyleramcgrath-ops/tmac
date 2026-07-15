import { getPrismaClient } from '@/lib/db'
import { retrieveGraphContext } from '@/lib/pipeline/graph/queries'
import { collectCandidates } from './candidates'
import { consolidate, computeDedupeKey, canonicalizeActionType } from './consolidate'
import { persistConsolidated } from './persist'
import { applyJudgment } from './judgment'
import { bucketFor, suppressionFor } from './suppress'
import { calibratedMultiplierFor } from './learning'
import { loadPreferenceMap } from './preferences'
import { logEvent } from './events'
import {
  isBlockedByMemory,
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
  OperatorShortlist,
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

  const [rawCandidates, memoryMap, businessProfile, seasonalPriorities, graphContext, preferences] =
    await Promise.all([
      collectCandidates(input.projectId),
      loadMemoryMap(input.projectId),
      prisma.businessProfile.findFirst({ where: { projectId: input.projectId } }),
      prisma.seasonalPriority.findMany({ where: { projectId: input.projectId } }),
      retrieveGraphContext({ projectId: input.projectId }).catch(() => null),
      loadPreferenceMap({ projectId: input.projectId }),
    ])

  // Phase 8.1A: consolidate duplicates from multiple source systems.
  const consolidation = consolidate(input.projectId, rawCandidates)
  const consolidatedCandidates = consolidation.consolidated
  if (input.persistProposals !== false) {
    try {
      await persistConsolidated({ organizationId, projectId: input.projectId }, consolidation)
      if (consolidation.duplicates.length) {
        await logEvent({
          organizationId,
          projectId: input.projectId,
          kind: 'candidate_consolidated',
          summary: `Consolidated ${consolidation.duplicates.reduce((n, d) => n + d.ids.length, 0)} duplicate candidates into ${consolidation.duplicates.length} survivors`,
          payload: consolidation.duplicates,
        })
      }
      if (consolidation.conflicts.length) {
        await logEvent({
          organizationId,
          projectId: input.projectId,
          kind: 'conflict_detected',
          summary: `${consolidation.conflicts.length} conflicting recommendations detected`,
          payload: consolidation.conflicts,
        })
      }
    } catch (err) {
      console.warn('[operator] persist / event log failed', err)
    }
  }

  const activeObjective = businessProfile?.activeObjective ?? null
  const activeSeasonalKeywords = new Set(
    seasonalPriorities.flatMap((s) => splitAndLower((s as any).focusKeywords ?? '')),
  )
  const hasBusinessProfile = !!businessProfile
  const industry = businessProfile?.industry ?? null

  const scored = await Promise.all(
    consolidatedCandidates.map(async (c) => {
      const context = deriveContext(c, activeSeasonalKeywords)
      const { adjustedScore, boosts } = applyJudgment(c, context)
      const calibration = await calibratedMultiplierFor({
        projectId: input.projectId,
        recommendationType: c.recommendationType,
        industry,
      })
      const preference =
        preferences.get(canonicalizeActionType(c.recommendationType)) ??
        preferences.get('*')
      const preferenceDelta = preference?.netDelta ?? 0
      const finalScore = adjustedScore * calibration.value + preferenceDelta * 20
      return {
        candidate: c,
        adjustedScore,
        boosts,
        learningMultiplier: calibration.value,
        learningSource: calibration.source,
        preferenceDelta,
        finalScore,
        context,
        hasConflict: c.conflictsWith.length > 0,
      }
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

  // Phase 8.1A: build the structured shortlist.
  const shortlist = await buildShortlist({
    organizationId,
    projectId: input.projectId,
    scored: filtered,
    activeObjective,
    persistProposals: input.persistProposals ?? true,
  })
  if (shortlist.primaryMission && input.persistProposals !== false) {
    try {
      await logEvent({
        organizationId,
        projectId: input.projectId,
        kind: 'mission_selected',
        summary: `Primary mission: ${shortlist.primaryMission.headline}`,
        candidateId: shortlist.primaryMission.id,
      })
    } catch {
      // non-fatal
    }
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
    shortlist,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shortlist bucketing (Phase 8.1A)
// ─────────────────────────────────────────────────────────────────────────────

async function buildShortlist(input: {
  organizationId: string
  projectId: string
  scored: ScoredCandidate[]
  activeObjective: string | null
  persistProposals: boolean
}): Promise<OperatorShortlist> {
  const suppressed: OperatorShortlist['suppressed'] = []
  const primaryPool: ScoredCandidate[] = []
  const nextBest: ScoredCandidate[] = []
  const watch: ScoredCandidate[] = []
  const deferred: ScoredCandidate[] = []
  const critical: ScoredCandidate[] = []

  for (const s of input.scored) {
    const ctx = {
      isMoneyPage: s.context.isMoneyPage,
      isIndexable: true, // TODO: derive from PageSignals/Page.hasNoindex if available
      pageRanksInTop3: false,
      pageConvertsWell: false,
      clusterCoverageSufficient: false,
      metadataAcceptable: false,
      candidateHasConflict: s.hasConflict ?? false,
      dependencyStillOpen: false,
      evidenceAgeDays: null,
      dataSufficient: true,
      userCanApprove: true,
      userCanDeploy: true,
      deploymentAvailable: true,
    }
    const suppression = suppressionFor(s.candidate, ctx)
    const bucket = bucketFor(s.candidate, s.finalScore, suppression)
    if (bucket === 'suppressed') {
      const rec = await buildRecommendation({
        organizationId: input.organizationId,
        projectId: input.projectId,
        scored: s,
        activeObjective: input.activeObjective,
        alternates: [],
        persistProposal: false,
      })
      suppressed.push({ item: rec, reason: suppression?.reason ?? 'Suppressed' })
      continue
    }
    if (bucket === 'critical') critical.push(s)
    else if (bucket === 'primary') primaryPool.push(s)
    else if (bucket === 'next_best') nextBest.push(s)
    else if (bucket === 'watch') watch.push(s)
    else deferred.push(s)
  }

  const primaryPick = primaryPool[0] ?? critical[0] ?? nextBest[0] ?? null

  const materialize = async (list: ScoredCandidate[]): Promise<OperatorRecommendation[]> => {
    const out: OperatorRecommendation[] = []
    for (const s of list) {
      out.push(
        await buildRecommendation({
          organizationId: input.organizationId,
          projectId: input.projectId,
          scored: s,
          activeObjective: input.activeObjective,
          alternates: [],
          persistProposal: false,
        }),
      )
    }
    return out
  }

  const primaryMission = primaryPick
    ? await buildRecommendation({
        organizationId: input.organizationId,
        projectId: input.projectId,
        scored: primaryPick,
        activeObjective: input.activeObjective,
        alternates: [],
        persistProposal: input.persistProposals,
      })
    : null

  return {
    primaryMission,
    nextBestActions: (await materialize(nextBest)).slice(0, 3),
    watchList: (await materialize(watch)).slice(0, 3),
    deferredOpportunities: (await materialize(deferred)).slice(0, 3),
    criticalAlerts: (await materialize(critical)).slice(0, 3),
    suppressed: suppressed.slice(0, 10),
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

  // Prefer the structured shortlist when present; fall back to primary + alts.
  const sl = readout.shortlist
  const candidatesInOrder = sl
    ? [
        ...(sl.criticalAlerts ?? []),
        ...(sl.primaryMission ? [sl.primaryMission] : []),
        ...(sl.nextBestActions ?? []),
        ...(sl.watchList ?? []),
      ]
    : [readout.primaryRecommendation, ...readout.alternatives].filter(
        (x): x is OperatorRecommendation => !!x,
      )

  for (const item of candidatesInOrder) {
    const minRealistic = MIN_MINUTES_FOR_ACTION_REALISTIC(item)
    if (minRealistic > budget) {
      refused.push({
        item,
        reason: `Needs at least ${minRealistic}m — doesn't fit a ${input.window} session`,
      })
      continue
    }
    const cost = Math.max(item.estimatedMinutes, minRealistic)
    if (used + cost <= budget) {
      chosen.push(item)
      used += cost
    } else {
      refused.push({
        item,
        reason: `Doesn't fit — ${cost}m needed, ${budget - used}m left`,
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

function MIN_MINUTES_FOR_ACTION_REALISTIC(item: OperatorRecommendation): number {
  const type = canonicalizeActionType(item.recommendationType)
  const table: Record<string, number> = {
    full_content_rewrite: 120,
    page_migration: 90,
    redirect_and_merge: 60,
    money_page_reinforcement: 45,
    refresh_content: 45,
    repair_topic_cluster: 45,
    add_missing_entities: 30,
    add_faq_schema: 20,
    add_internal_links: 10,
    fix_homepage_typo: 5,
  }
  return table[type] ?? 15
}

// ─────────────────────────────────────────────────────────────────────────────
// Reasoning + narrative
// ─────────────────────────────────────────────────────────────────────────────

interface ScoredCandidate {
  candidate: Candidate
  adjustedScore: number
  boosts: ReturnType<typeof applyJudgment>['boosts']
  learningMultiplier: number
  learningSource?: 'project' | 'industry' | 'global' | 'default'
  preferenceDelta?: number
  finalScore: number
  context: ReturnType<typeof deriveContext>
  hasConflict?: boolean
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
