// AI search landscape — who answer engines actually cite for your topics, how
// you compare, and what to try next.
//
// The citation check has always asked one question: "were we cited?" A yes/no.
// But the engine returns its entire source list, so the far more useful
// question was always answerable and never asked: WHO WON INSTEAD, and how
// often does each of them win?
//
// Everything here is arithmetic over sources an answer engine really returned.
// Three lines nothing in this file crosses:
//
//   1. No predicted citation. There is no model that says "add an FAQ and
//      you'll be cited" — anyone selling that number invented it.
//   2. Content guidance is stated as OBSERVATIONS about what got cited, plus a
//      checklist of things your page does or does not have. Both are facts.
//      The causal link between them is explicitly not claimed.
//   3. Suggested prompts come from queries real people actually typed into
//      Google (Search Console), not from a list of plausible-sounding
//      questions. A suggestion with no demand behind it is a guess.

export interface CitationSnapshotLike {
  query: string
  available: boolean
  cited: boolean
  position: number | null
  checkedAt: string
  sources?: { url: string; host: string; position: number }[]
  answer?: string
}

export interface CitedDomain {
  host: string
  isUs: boolean
  isCompetitor: boolean
  /** Distinct tracked queries where this host appeared in the answer's sources. */
  timesCited: number
  queries: string[]
  bestPosition: number
  avgPosition: number
  /** timesCited ÷ queries that returned any sources at all. */
  shareOfVoice: number
}

export interface QueryComparison {
  query: string
  checkedAt: string
  weAreCited: boolean
  ourPosition: number | null
  /** Every source behind the answer, in order. */
  citedInstead: { host: string; url: string; position: number; isCompetitor: boolean }[]
  answer: string
  sourceCount: number
}

export interface CitationLandscape {
  queriesTracked: number
  /** Queries whose most recent check actually returned sources. A check that
   *  failed is not evidence of anything, and is excluded rather than counted
   *  as "we weren't cited". */
  queriesAnalysed: number
  queriesWhereWeAppear: number
  domains: CitedDomain[]
  comparisons: QueryComparison[]
}

function normHost(h: string): string {
  return h.trim().toLowerCase().replace(/^www\./, '')
}

/** Same-domain test that accepts subdomains: docs.acme.com belongs to acme.com. */
export function hostBelongsTo(host: string, domain: string): boolean {
  const h = normHost(host)
  const d = normHost(domain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
  if (!h || !d) return false
  return h === d || h.endsWith('.' + d)
}

/** The most recent snapshot per query — the current state of play. Older checks
 *  are history, not the landscape. */
export function latestPerQuery<T extends { query: string; checkedAt: string }>(snapshots: T[]): T[] {
  const byQuery = new Map<string, T>()
  for (const s of snapshots) {
    const prior = byQuery.get(s.query)
    if (!prior || s.checkedAt >= prior.checkedAt) byQuery.set(s.query, s)
  }
  return [...byQuery.values()]
}

export function buildCitationLandscape(input: {
  snapshots: CitationSnapshotLike[]
  ourDomain: string
  competitorDomains?: string[]
  maxDomains?: number
}): CitationLandscape {
  const { snapshots, ourDomain, competitorDomains = [], maxDomains = 25 } = input
  const latest = latestPerQuery(snapshots)

  // A failed check tells us nothing. Counting it as "not cited" would report a
  // loss that never happened — the same mistake the citations module already
  // guards against elsewhere.
  const usable = latest.filter((s) => s.available && (s.sources?.length ?? 0) > 0)

  const comparisons: QueryComparison[] = usable
    .map((s) => ({
      query: s.query,
      checkedAt: s.checkedAt,
      weAreCited: s.cited,
      ourPosition: s.position,
      citedInstead: (s.sources ?? []).map((src) => ({
        host: normHost(src.host),
        url: src.url,
        position: src.position,
        isCompetitor: competitorDomains.some((d) => hostBelongsTo(src.host, d)),
      })),
      answer: s.answer ?? '',
      sourceCount: s.sources?.length ?? 0,
    }))
    .sort((a, b) => Number(a.weAreCited) - Number(b.weAreCited) || a.query.localeCompare(b.query))

  // Share of voice per domain across the tracked query set.
  const agg = new Map<string, { queries: Set<string>; positions: number[] }>()
  for (const c of comparisons) {
    // One host can appear twice in one answer (two pages from the same site).
    // That is still ONE domain winning ONE query — count its best position.
    const bestPerHost = new Map<string, number>()
    for (const src of c.citedInstead) {
      if (!src.host) continue
      const prior = bestPerHost.get(src.host)
      if (prior == null || src.position < prior) bestPerHost.set(src.host, src.position)
    }
    for (const [host, position] of bestPerHost) {
      const entry = agg.get(host) ?? { queries: new Set<string>(), positions: [] }
      entry.queries.add(c.query)
      entry.positions.push(position)
      agg.set(host, entry)
    }
  }

  const domains: CitedDomain[] = [...agg.entries()]
    .map(([host, e]) => ({
      host,
      isUs: hostBelongsTo(host, ourDomain),
      isCompetitor: competitorDomains.some((d) => hostBelongsTo(host, d)),
      timesCited: e.queries.size,
      queries: [...e.queries].sort(),
      bestPosition: Math.min(...e.positions),
      avgPosition: Math.round((e.positions.reduce((a, b) => a + b, 0) / e.positions.length) * 10) / 10,
      shareOfVoice: e.queries.size / comparisons.length,
    }))
    .sort((a, b) => b.timesCited - a.timesCited || a.avgPosition - b.avgPosition || a.host.localeCompare(b.host))
    .slice(0, maxDomains)

  return {
    queriesTracked: latest.length,
    queriesAnalysed: comparisons.length,
    queriesWhereWeAppear: comparisons.filter((c) => c.weAreCited).length,
    domains,
    comparisons,
  }
}

// ── Prompt suggestions ───────────────────────────────────────────────────────

export interface PromptSuggestion {
  prompt: string
  /** The Search Console query it came from — the evidence, kept visible. */
  sourceQuery: string
  impressions: number
  position: number
  shape: 'question' | 'comparison' | 'recommendation'
  reason: string
}

const QUESTION_START = /^(how|what|why|when|where|which|who|can|do|does|is|are|should|will)\b/i
const COMPARISON = /\b(vs|versus|alternative|alternatives|compare|comparison|difference)\b/i
const RECOMMENDATION = /\b(best|top|recommended|cheapest|fastest|easiest|leading)\b/i

/**
 * Turn a real Search Console query into the prompt a person would actually type
 * into an assistant. People type keywords into Google and sentences into
 * ChatGPT, so the same demand needs rephrasing to be testable.
 */
export function promptFor(query: string, shape: PromptSuggestion['shape']): string {
  const q = query.trim().replace(/\s+/g, ' ')
  if (!q) return ''
  const cap = q.charAt(0).toUpperCase() + q.slice(1)
  if (shape === 'question') return q.endsWith('?') ? cap : `${cap}?`
  if (shape === 'comparison') return `${cap} — which should I choose, and why?`
  // "Recommend the ..." is the one phrasing that stays grammatical whether the
  // query is singular or plural ("best crm for agencies" / "top crm tools").
  // Guessing is/are from the words would get it wrong often enough to look
  // broken, and this is how people actually prompt an assistant anyway.
  return `Recommend the ${q.replace(/^(the)\s+/i, '')}.`
}

function shapeOf(query: string): PromptSuggestion['shape'] | null {
  if (QUESTION_START.test(query)) return 'question'
  if (COMPARISON.test(query)) return 'comparison'
  if (RECOMMENDATION.test(query)) return 'recommendation'
  return null
}

/**
 * Which prompts to start tracking, drawn from queries people really searched.
 * Only conversational shapes — a bare navigational term like "acme login" is
 * not something anyone asks an assistant, and suggesting it would waste a
 * check.
 */
export function recommendPrompts(input: {
  keywords: { query: string; impressions: number; position: number }[]
  trackedQueries: string[]
  limit?: number
}): PromptSuggestion[] {
  const { keywords, trackedQueries, limit = 12 } = input
  const tracked = new Set(trackedQueries.map((q) => q.trim().toLowerCase()))
  const seen = new Set<string>()
  const out: PromptSuggestion[] = []

  for (const k of keywords.slice().sort((a, b) => b.impressions - a.impressions)) {
    const shape = shapeOf(k.query)
    if (!shape) continue
    const prompt = promptFor(k.query, shape)
    const key = prompt.toLowerCase()
    if (!prompt || seen.has(key)) continue
    // Already being checked, either verbatim or as this exact prompt.
    if (tracked.has(k.query.trim().toLowerCase()) || tracked.has(key)) continue
    seen.add(key)
    out.push({
      prompt,
      sourceQuery: k.query,
      impressions: k.impressions,
      position: k.position,
      shape,
      reason:
        shape === 'comparison'
          ? `${k.impressions.toLocaleString()} people searched this comparison. Assistants answer comparisons by naming specific products — being one of them is the whole game.`
          : shape === 'question'
            ? `${k.impressions.toLocaleString()} people asked this on Google. The same question is exactly what gets typed into an assistant.`
            : `${k.impressions.toLocaleString()} impressions for this "best of" query. Assistants answer these with a shortlist; you are either on it or you are not.`,
    })
    if (out.length >= limit) break
  }
  return out
}

// ── Content guidance ─────────────────────────────────────────────────────────

export interface GuidanceObservation {
  label: string
  detail: string
}

export interface QueryGuidance {
  query: string
  weAreCited: boolean
  observations: GuidanceObservation[]
  /** Our own page for this topic, when the crawl found one. */
  ourPage: { url: string; title?: string; wordCount?: number; hasFaq?: boolean } | null
}

export interface GuidancePage {
  url: string
  title?: string
  wordCount?: number
  hasFaq?: boolean
}

// A source that is neither us nor a tracked competitor — a review site, a
// forum, a marketplace. When these dominate, the lever is placement, not prose.
function isThirdParty(host: string, ourDomain: string, competitors: string[]): boolean {
  return !hostBelongsTo(host, ourDomain) && !competitors.some((d) => hostBelongsTo(host, d))
}

/**
 * What the cited sources have in common, per query, plus what our own page for
 * that topic actually contains.
 *
 * Every line is an observation. None of it claims that changing X causes a
 * citation — that relationship is unmeasured, and pretending otherwise is the
 * single easiest lie for an SEO tool to tell.
 */
export function buildQueryGuidance(input: {
  comparison: QueryComparison
  ourDomain: string
  competitorDomains?: string[]
  pages?: GuidancePage[]
}): QueryGuidance {
  const { comparison, ourDomain, competitorDomains = [], pages = [] } = input
  const obs: GuidanceObservation[] = []
  const sources = comparison.citedInstead

  const thirdParty = sources.filter((s) => isThirdParty(s.host, ourDomain, competitorDomains))
  const competitorsCited = sources.filter((s) => s.isCompetitor)
  const distinctHosts = new Set(sources.map((s) => s.host))

  if (competitorsCited.length > 0) {
    const names = [...new Set(competitorsCited.map((s) => s.host))]
    obs.push({
      label: 'Competitors in the answer',
      detail: `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} cited here${comparison.weAreCited ? ' alongside you' : ' and you are not'}. Their page for this topic is what the engine chose to read.`,
    })
  }

  if (sources.length > 0 && thirdParty.length / sources.length >= 0.6) {
    obs.push({
      label: 'Mostly independent sources',
      detail: `${thirdParty.length} of ${sources.length} sources are neither you nor a tracked competitor (${[...new Set(thirdParty.map((s) => s.host))].slice(0, 4).join(', ')}). For queries answered from third-party sites, getting listed and reviewed on those sites tends to matter more than editing your own page.`,
    })
  }

  if (distinctHosts.size <= 2 && sources.length > 0) {
    obs.push({
      label: 'Concentrated answer',
      detail: `The whole answer rests on ${distinctHosts.size} source${distinctHosts.size === 1 ? '' : 's'}. Fewer sources means a higher bar to displace one of them, but also a bigger prize.`,
    })
  }

  if (comparison.weAreCited && comparison.ourPosition != null) {
    obs.push({
      label: 'You are cited',
      detail: `You appear as source ${comparison.ourPosition} of ${comparison.sourceCount}. Position within the source list is not a ranking, but earlier sources tend to be the ones paraphrased most heavily.`,
    })
  }

  // Our own page for the topic, matched by word overlap — the same shape the
  // content plan uses for "does a page exist for this".
  const ourPage = bestOwnPageFor(comparison.query, pages)
  if (!comparison.weAreCited) {
    if (!ourPage) {
      obs.push({
        label: 'No page of yours covers this',
        detail: 'The crawl found no page on your site about this question. An engine cannot cite a page that does not exist.',
      })
    } else {
      const bits: string[] = []
      if (ourPage.wordCount != null) bits.push(`${ourPage.wordCount.toLocaleString()} words`)
      if (ourPage.hasFaq === true) bits.push('has FAQ markup')
      if (ourPage.hasFaq === false) bits.push('no FAQ markup')
      obs.push({
        label: 'Your page for this topic',
        detail: `${ourPage.title || ourPage.url}${bits.length ? ` — ${bits.join(', ')}` : ''}. This is what an engine would have to choose over the sources above; whether any specific change makes it do so is not something this tool can measure.`,
      })
    }
  }

  return { query: comparison.query, weAreCited: comparison.weAreCited, observations: obs, ourPage }
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'you', 'are', 'this', 'that', 'from', 'how',
  'what', 'why', 'best', 'top', 'guide', 'our', 'about', 'can', 'does', 'when',
  'where', 'which', 'who', 'should', 'a', 'an', 'is', 'of', 'to', 'in', 'on',
])

function tokens(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t)))
}

/** The crawled page that best covers a query, or null when none really does. */
export function bestOwnPageFor(query: string, pages: GuidancePage[]): GuidancePage | null {
  const q = tokens(query)
  if (q.size === 0) return null
  let best: GuidancePage | null = null
  let bestScore = 0
  for (const p of pages) {
    let path = ''
    try { path = new URL(p.url).pathname.replace(/[-_/]+/g, ' ') } catch { path = p.url }
    const t = tokens(`${p.title ?? ''} ${path}`)
    let hit = 0
    for (const tok of q) if (t.has(tok)) hit++
    const score = hit / q.size
    if (score > bestScore) { bestScore = score; best = p }
  }
  // Below a third of the query's vocabulary the match is incidental, and
  // calling it "your page for this topic" would be misleading.
  return bestScore >= 0.34 ? best : null
}
