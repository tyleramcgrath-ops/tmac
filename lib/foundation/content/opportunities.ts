// Content opportunities — "what should I actually write next?"
//
// Content Studio can draft a post about any keyword, but it starts with a blank
// box: you have to already know the keyword. That's the hard part. This module
// answers it from data the project already has, and never from a guess.
//
// Four things it can prove, each a different job:
//
//   consolidate — Google is showing several of your pages for one query. The
//                 ranking signal is split. Merge them into one definitive page.
//   expand      — you rank 4-20 for a query and the page that ranks is thin.
//                 Google already thinks the page is relevant; it's just
//                 underbuilt. Cheapest possible win.
//   answer      — a question query where the page ranking for it isn't about
//                 that question. You need a real answer on the page, not a
//                 passing mention.
//   create      — real impressions, but you rank past page 2 and no page of
//                 yours is topically about it. There is demand you have no
//                 page for.
//
// WHAT THIS DOES NOT DO: it does not estimate traffic gain. Projecting "+340
// visits/mo" requires assuming a CTR curve nobody can verify per site, and a
// number like that would be the most-quoted and least-true thing on the screen.
// Opportunities are ORDERED by a transparent score, and every row shows the
// real inputs — impressions, position, word count — so the ranking can be
// argued with.

import type { KeywordRollup } from '../reco/keyword-intelligence'
import type { CannibalizedQuery } from '../reco/keyword-cannibalization'
import type { ContentGap } from './brief'

export type ContentAction = 'consolidate' | 'expand' | 'answer' | 'create' | 'competitor-gap'

export interface ContentOpportunity {
  /** Stable across refreshes so the UI can track what's been actioned. */
  id: string
  action: ContentAction
  /** What to write about — used verbatim as the Content Studio keyword. */
  topic: string
  /** One sentence citing the real numbers behind this. */
  reason: string
  impressions: number
  clicks: number
  position: number | null
  /** The existing page to expand or consolidate onto; null when creating new. */
  targetPage: string | null
  targetWordCount: number | null
  /** For consolidate: every page currently competing for the query. */
  pagesInvolved: string[]
  /** Ordering only — NOT a traffic projection. See the note above. */
  score: number
}

export interface OpportunityPage {
  url: string
  title?: string
  wordCount?: number
}

// A page under this word count, ranking on page 1-2 for a real query, is
// underbuilt rather than irrelevant — Google already surfaced it. Heuristic,
// deliberately conservative; the row shows the real count so it can be judged.
const THIN_WORD_COUNT = 600

// Below this, the page ranking for a query has essentially nothing to do with
// it — the query matched incidentally, so there is no real page for the topic.
const TOPICAL_OVERLAP_FLOOR = 0.34

// Enough impressions that the query represents real demand and not noise.
const MIN_IMPRESSIONS = 20

const QUESTION_PREFIXES = /^(how|what|why|when|where|which|who|can|do|does|is|are|should)\b/i

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'you', 'are', 'this', 'that', 'from',
  'how', 'what', 'why', 'best', 'top', 'guide', 'our', 'about', 'can', 'does',
  'when', 'where', 'which', 'who', 'should', 'near',
])

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  )
}

/**
 * How much of the query's meaningful vocabulary the page actually covers, using
 * its title AND its URL path — a page at /crm-for-agencies is about that topic
 * even if the title is styled "Agency Solutions | Acme".
 */
export function topicalOverlap(query: string, page: OpportunityPage): number {
  const q = tokens(query)
  if (q.size === 0) return 1 // nothing to miss
  let pathText = ''
  try {
    pathText = new URL(page.url).pathname.replace(/[-_/]+/g, ' ')
  } catch {
    pathText = page.url.replace(/[-_/]+/g, ' ')
  }
  const p = tokens(`${page.title ?? ''} ${pathText}`)
  let hit = 0
  for (const t of q) if (p.has(t)) hit++
  return hit / q.size
}

// Ordering weights. An expand is worth more per impression than a create
// because the page already ranks — the work is smaller and the evidence that
// Google finds it relevant is already in hand.
const ACTION_WEIGHT: Record<ContentAction, number> = {
  consolidate: 1.4,
  expand: 1.3,
  answer: 1.0,
  create: 0.8,
  'competitor-gap': 0.3,
}

const pct = (n: number) => `${Math.round(n * 100)}%`
const round1 = (n: number) => Math.round(n * 10) / 10

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export function findContentOpportunities(input: {
  keywords: KeywordRollup[]
  cannibalization: CannibalizedQuery[]
  pages: OpportunityPage[]
  competitorGaps?: ContentGap[]
  limit?: number
}): ContentOpportunity[] {
  const { keywords, cannibalization, pages, competitorGaps = [], limit = 20 } = input
  const byUrl = new Map(pages.map((p) => [p.url, p]))
  const out: ContentOpportunity[] = []
  // One opportunity per topic. Precedence is the order the passes run in below:
  // a cannibalized query is a consolidation job, not also an expand job.
  const claimed = new Set<string>()
  const claim = (topic: string) => {
    const k = topic.trim().toLowerCase()
    if (claimed.has(k)) return false
    claimed.add(k)
    return true
  }

  const push = (o: Omit<ContentOpportunity, 'score' | 'id'>) => {
    out.push({
      ...o,
      id: `${o.action}:${slug(o.topic)}`,
      score: o.impressions * ACTION_WEIGHT[o.action],
    })
  }

  // ── 1. Consolidate ───────────────────────────────────────────────────────
  for (const c of cannibalization) {
    if (c.totalImpressions < MIN_IMPRESSIONS) continue
    if (!claim(c.query)) continue
    const best = c.pages[0]
    push({
      action: 'consolidate',
      topic: c.query,
      reason: `${c.pages.length} of your pages compete for this query (${c.totalImpressions.toLocaleString()} impressions split between them). Merging them into one page concentrates the ranking signal Google is currently dividing.`,
      impressions: c.totalImpressions,
      clicks: c.pages.reduce((n, p) => n + p.clicks, 0),
      position: best ? round1(best.position) : null,
      targetPage: best?.page ?? null,
      targetWordCount: best ? byUrl.get(best.page)?.wordCount ?? null : null,
      pagesInvolved: c.pages.map((p) => p.page),
    })
  }

  // ── 2. Expand a thin page that already ranks ─────────────────────────────
  for (const k of keywords) {
    if (k.impressions < MIN_IMPRESSIONS) continue
    if (k.position < 4 || k.position > 20) continue
    const page = byUrl.get(k.bestPage)
    const words = page?.wordCount
    if (words == null || words >= THIN_WORD_COUNT) continue
    if (!claim(k.query)) continue
    push({
      action: 'expand',
      topic: k.query,
      reason: `You already rank #${round1(k.position)} for this on a ${words.toLocaleString()}-word page — Google finds it relevant, it is just thin. ${k.impressions.toLocaleString()} impressions are on the table.`,
      impressions: k.impressions,
      clicks: k.clicks,
      position: k.position,
      targetPage: k.bestPage,
      targetWordCount: words,
      pagesInvolved: [k.bestPage],
    })
  }

  // ── 3. Answer a question you only match incidentally ─────────────────────
  for (const k of keywords) {
    if (k.impressions < MIN_IMPRESSIONS) continue
    if (!QUESTION_PREFIXES.test(k.query)) continue
    if (k.position <= 10) continue // already answering it well enough
    const page = byUrl.get(k.bestPage)
    const overlap = page ? topicalOverlap(k.query, page) : 0
    if (overlap >= TOPICAL_OVERLAP_FLOOR) continue
    if (!claim(k.query)) continue
    push({
      action: 'answer',
      topic: k.query,
      reason: `People ask this ${k.impressions.toLocaleString()} times and Google shows them ${page?.title ? `“${page.title}”` : 'a page'}, which only covers ${pct(overlap)} of the question. A direct answer would rank far better than #${round1(k.position)}.`,
      impressions: k.impressions,
      clicks: k.clicks,
      position: k.position,
      targetPage: k.bestPage || null,
      targetWordCount: page?.wordCount ?? null,
      pagesInvolved: k.bestPage ? [k.bestPage] : [],
    })
  }

  // ── 4. Create — demand with no page behind it ────────────────────────────
  for (const k of keywords) {
    if (k.impressions < MIN_IMPRESSIONS) continue
    if (k.position <= 20) continue
    const page = byUrl.get(k.bestPage)
    // No crawled page at all, or one that has nothing to do with the query.
    const overlap = page ? topicalOverlap(k.query, page) : 0
    if (overlap >= TOPICAL_OVERLAP_FLOOR) continue
    if (!claim(k.query)) continue
    push({
      action: 'create',
      topic: k.query,
      reason: `${k.impressions.toLocaleString()} impressions and you rank #${round1(k.position)} — Google is showing you for this without a page written for it. This is demand you have nothing to serve.`,
      impressions: k.impressions,
      clicks: k.clicks,
      position: k.position,
      targetPage: null,
      targetWordCount: null,
      pagesInvolved: [],
    })
  }

  // ── 5. Competitor gaps ───────────────────────────────────────────────────
  // Last, and weighted lowest: a competitor covering a topic is evidence
  // somebody believes in it, not evidence that anyone searches for it. Your own
  // impression data beats their content strategy every time.
  for (const g of competitorGaps) {
    if (!claim(g.title)) continue
    push({
      action: 'competitor-gap',
      topic: g.title,
      reason: `${g.competitorDomain} covers this and you have nothing comparable. No Search Console demand data — this is their bet, not measured demand.`,
      impressions: 0,
      clicks: 0,
      position: null,
      targetPage: null,
      targetWordCount: null,
      pagesInvolved: [],
    })
  }

  return out.sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic)).slice(0, limit)
}

export interface OpportunitySummary {
  total: number
  byAction: Record<ContentAction, number>
  /** Impressions across every opportunity — the demand currently unserved.
   *  Null when nothing measurable is behind them (competitor gaps only). */
  addressableImpressions: number | null
}

export function summarizeOpportunities(opps: ContentOpportunity[]): OpportunitySummary {
  const byAction: Record<ContentAction, number> = {
    consolidate: 0, expand: 0, answer: 0, create: 0, 'competitor-gap': 0,
  }
  for (const o of opps) byAction[o.action] += 1
  const impressions = opps.reduce((n, o) => n + o.impressions, 0)
  return {
    total: opps.length,
    byAction,
    addressableImpressions: impressions > 0 ? impressions : null,
  }
}
