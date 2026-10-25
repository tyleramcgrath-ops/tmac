// Scenario simulation: "if I ship these recommendations, what changes?"
//
// The honest answer has three parts, and one loud absence.
//
//   exposure      — deterministic counting. Which pages these fixes touch,
//                   and which tracked keywords currently rank on those pages.
//   deterministic — numbers that move by arithmetic, because this codebase
//                   owns the formula. Resolving 6 criticals means 6 fewer
//                   criticals. That is not a forecast.
//   baseRates     — what ACTUALLY happened, measured, the last time this rule
//                   was deployed on this project. Sourced from
//                   WpDeployment.outcome, which the outcome_capture job fills
//                   from Search Console ~14 days after a verified deploy.
//                   Reported with its sample size, always.
//
// The absence: there is no predicted visibility score. Nothing here outputs
// "ship these and you go from 42 to 58." No model in this repo can derive
// that number, so producing one would mean inventing it — and a plausible
// invented number is more dangerous than a blank, because it gets planned
// around. `unknowns` names what the simulation cannot tell you, so the gap is
// stated rather than left for the reader to notice.

import type { Recommendation, RecommendationStatus, RankSnapshot, TrackedKeyword, WpDeployment } from '../types'
import { toPageSignals } from '../reco/signals'

export interface Exposure {
  pagesTouched: number
  pagesCrawled: number
  // Capped for payload size; `pagesTouched` is the true count.
  sampleUrls: string[]
  keywordsTracked: number
  // Tracked keywords whose most recent snapshot ranks a URL these fixes touch.
  // These are the keywords with any mechanical path to being affected — not a
  // claim that they will move.
  keywordsOnTouchedPages: { keyword: string; position: number | null; url: string }[]
}

export interface DeterministicDelta {
  metric: string
  before: number
  after: number
  // The arithmetic, spelled out. If this cannot be written honestly, the
  // metric does not belong in this list.
  basis: string
}

export interface BaseRate {
  ruleId: string
  // Deployments of this rule on this project that reached outcome capture.
  observations: number
  // Of those, how many produced real Search Console readings (the rest were
  // skipped — no GSC connection, or the read failed).
  measured: number
  medianClicksDelta: number | null
  medianPositionDelta: number | null
  // Small-N honesty. Rendered verbatim next to the numbers.
  caveat: string
}

export interface Simulation {
  selected: { count: number; ruleIds: string[]; unknownIds: string[] }
  exposure: Exposure
  deterministic: DeterministicDelta[]
  baseRates: BaseRate[]
  unknowns: string[]
}

export interface SimulationInput {
  selectedIds: string[]
  recommendations: Recommendation[]
  pages: Record<string, unknown>[]
  keywords: TrackedKeyword[]
  rankSnapshots: RankSnapshot[]
  deployments: WpDeployment[]
}

// Still needing action. 'regressed' counts because the issue is live on the
// site again; 'rejected'/'dismissed' were closed deliberately and
// 'deployed'/'verified' are done. Typed against RecommendationStatus so a
// renamed status fails the build instead of silently emptying the count.
const OPEN_STATUSES = new Set<RecommendationStatus>(['open', 'accepted', 'modified', 'regressed'])

function median(xs: number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  const m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
  return Math.round(m * 100) / 100
}

// URLs compare loosely: the crawl, Search Console, and rank snapshots disagree
// about trailing slashes and protocol often enough that exact matching silently
// drops real overlaps — which would understate exposure and read as "this fix
// affects nothing".
function normalizeUrl(u: string): string {
  return u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/^www\./, '')
}

function latestSnapshotPerKeyword(snapshots: RankSnapshot[]): Map<string, RankSnapshot> {
  const latest = new Map<string, RankSnapshot>()
  for (const s of snapshots) {
    const prev = latest.get(s.keyword)
    if (!prev || Date.parse(s.checkedAt) > Date.parse(prev.checkedAt)) latest.set(s.keyword, s)
  }
  return latest
}

function computeExposure(
  selected: Recommendation[],
  pages: Record<string, unknown>[],
  keywords: TrackedKeyword[],
  rankSnapshots: RankSnapshot[]
): Exposure {
  const touched = new Set<string>()
  for (const rec of selected) for (const u of rec.evidence?.affectedUrls ?? []) touched.add(normalizeUrl(u))

  const latest = latestSnapshotPerKeyword(rankSnapshots)
  const onTouched: Exposure['keywordsOnTouchedPages'] = []
  for (const kw of keywords) {
    const snap = latest.get(kw.keyword)
    // A keyword with no URL has no ranking page to attribute — it cannot be
    // shown as affected, and is not counted as unaffected either.
    if (!snap?.url) continue
    if (touched.has(normalizeUrl(snap.url))) {
      onTouched.push({ keyword: kw.keyword, position: snap.position, url: snap.url })
    }
  }

  return {
    pagesTouched: touched.size,
    pagesCrawled: pages.length,
    sampleUrls: [...touched].slice(0, 25),
    keywordsTracked: keywords.length,
    keywordsOnTouchedPages: onTouched.sort((a, b) => (a.position ?? 999) - (b.position ?? 999)),
  }
}

function computeDeterministic(
  selected: Recommendation[],
  all: Recommendation[],
  pages: Record<string, unknown>[]
): DeterministicDelta[] {
  const deltas: DeterministicDelta[] = []
  const open = all.filter((r) => OPEN_STATUSES.has(r.status))
  const selectedOpen = new Set(selected.filter((r) => OPEN_STATUSES.has(r.status)).map((r) => r.id))

  for (const sev of ['critical', 'warning', 'info'] as const) {
    const before = open.filter((r) => r.severity === sev).length
    const after = open.filter((r) => r.severity === sev && !selectedOpen.has(r.id)).length
    if (before !== after) {
      deltas.push({
        metric: `Open ${sev} recommendations`,
        before,
        after,
        basis: `${before - after} of ${before} open ${sev} items are in this scenario. Resolving them removes them from the count.`,
      })
    }
  }

  // Structured-data coverage. Deterministic because the GEO grounding score is
  // literally "pages with any schema / pages crawled" — flipping a page from
  // none to some moves it by construction. Only counted for pages the crawl
  // observed as having NO schema; a page whose signal is absent stays absent
  // rather than being assumed empty.
  const signals = pages.map(toPageSignals).filter((s) => Array.isArray(s.schemaTypes))
  if (signals.length > 0) {
    const withSchema = signals.filter((s) => (s.schemaTypes ?? []).length > 0).length
    const emptyByUrl = new Map(
      signals.filter((s) => (s.schemaTypes ?? []).length === 0).map((s) => [normalizeUrl(s.url), true])
    )
    const gained = new Set<string>()
    for (const rec of selected) {
      if (rec.ruleCategory !== 'schema' && rec.category !== 'schema') continue
      for (const u of rec.evidence?.affectedUrls ?? []) {
        const key = normalizeUrl(u)
        if (emptyByUrl.has(key)) gained.add(key)
      }
    }
    if (gained.size > 0) {
      const pct = (n: number) => Math.round((n / signals.length) * 100)
      deltas.push({
        metric: 'GEO grounding score (pages with structured data)',
        before: pct(withSchema),
        after: pct(withSchema + gained.size),
        basis:
          `${withSchema}/${signals.length} crawled pages carry structured data today. ` +
          `${gained.size} page(s) in this scenario have a schema fix and currently have none. ` +
          'Same formula, one input changed — not a forecast.',
      })
    }
  }

  return deltas
}

function computeBaseRates(selected: Recommendation[], all: Recommendation[], deployments: WpDeployment[]): BaseRate[] {
  const ruleOf = new Map(all.map((r) => [r.id, r.ruleId]))
  const byRule = new Map<string, WpDeployment[]>()
  for (const dep of deployments) {
    if (!dep.recommendationId || !dep.outcome) continue
    const ruleId = ruleOf.get(dep.recommendationId)
    if (!ruleId) continue
    const list = byRule.get(ruleId) ?? []
    list.push(dep)
    byRule.set(ruleId, list)
  }

  const wanted = new Set(selected.map((r) => r.ruleId))
  const rates: BaseRate[] = []
  for (const ruleId of wanted) {
    const deps = byRule.get(ruleId) ?? []
    if (deps.length === 0) continue
    const measured = deps.filter((d) => d.outcome && d.outcome.skipped === false)
    const clicks = measured.map((d) => (d.outcome as { skipped: false; delta: { clicks: number } }).delta.clicks)
    const position = measured.map((d) => (d.outcome as { skipped: false; delta: { position: number } }).delta.position)
    rates.push({
      ruleId,
      observations: deps.length,
      measured: measured.length,
      medianClicksDelta: median(clicks),
      medianPositionDelta: median(position),
      caveat:
        measured.length === 0
          ? 'No measured outcomes — every capture was skipped (Search Console not connected, or the reading failed).'
          : measured.length < 5
            ? `${measured.length} measured outcome(s). This is an anecdote, not an estimate — do not plan against it.`
            : `${measured.length} measured outcomes on this project. Still observational: other changes ran in the same window.`,
    })
  }
  return rates.sort((a, b) => b.measured - a.measured || a.ruleId.localeCompare(b.ruleId))
}

export function simulate({
  selectedIds,
  recommendations,
  pages,
  keywords,
  rankSnapshots,
  deployments,
}: SimulationInput): Simulation {
  const byId = new Map(recommendations.map((r) => [r.id, r]))
  const selected = selectedIds.map((id) => byId.get(id)).filter((r): r is Recommendation => r !== undefined)
  const unknownIds = selectedIds.filter((id) => !byId.has(id))

  const exposure = computeExposure(selected, pages, keywords, rankSnapshots)
  const deterministic = computeDeterministic(selected, recommendations, pages)
  const baseRates = computeBaseRates(selected, recommendations, deployments)

  const unknowns: string[] = [
    'Whether these fixes change rank or AI citations. Nothing here predicts that, and no model in North Star can.',
  ]
  if (exposure.keywordsTracked === 0) {
    unknowns.push('No tracked keywords, so page-level exposure cannot be tied to any ranking position.')
  } else if (exposure.keywordsOnTouchedPages.length === 0) {
    unknowns.push(
      'None of your tracked keywords currently rank on the pages these fixes touch, so there is no measured position to watch.'
    )
  }
  if (baseRates.length === 0) {
    unknowns.push(
      'No prior deployments of these rule types on this project, so there is no measured history to compare against.'
    )
  }
  if (pages.length === 0) {
    unknowns.push('No completed crawl, so page-level exposure could not be computed at all.')
  }

  return {
    selected: { count: selected.length, ruleIds: [...new Set(selected.map((r) => r.ruleId))].sort(), unknownIds },
    exposure,
    deterministic,
    baseRates,
    unknowns,
  }
}
