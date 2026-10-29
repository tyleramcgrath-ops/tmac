// Keyword intelligence: turn the raw Search Console query/page corpus into the
// ONE view you'd actually use to decide what to work on next.
//
// GSC returns one row per (query, page) pair, which is the wrong grain for a
// human — the same keyword shows up three times because three pages ranked for
// it. This rolls those rows up to one row per KEYWORD, and buckets each keyword
// by how close it is to the traffic that matters.
//
// Everything here is arithmetic over real observed rows. Nothing is estimated,
// modelled, or filled in from an assumed CTR curve — if a number can't be
// computed from the rows (no impressions at all), it comes back null and the UI
// says so rather than printing a confident zero.

export interface GscKeywordRow {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number // 0-1, as GSC reports it
  position: number
}

// How close this keyword is to being worth money, in the only terms that
// matter operationally:
//   top3     — already winning; protect it
//   page1    — positions 4-10; real clicks available from a CTR fix
//   striking — positions 11-20; page 2. The cheapest wins on the site,
//              because Google already considers the page relevant
//   deep     — past position 20; needs new work, not a tweak
export type PositionBand = 'top3' | 'page1' | 'striking' | 'deep'

export function bandOf(position: number): PositionBand {
  if (position <= 3) return 'top3'
  if (position <= 10) return 'page1'
  if (position <= 20) return 'striking'
  return 'deep'
}

export interface KeywordRollup {
  query: string
  clicks: number
  impressions: number
  /** Recomputed from the rolled-up clicks/impressions — NOT an average of the
   *  per-row CTRs, which would silently weight a 2-impression row the same as
   *  a 20,000-impression one. */
  ctr: number
  /** Impression-weighted mean position across every page that ranked for this
   *  query. Weighted, because an unweighted mean lets a page that appeared
   *  twice at position 90 drag down a page that appeared 5,000 times at 4. */
  position: number
  /** The page Google shows most often for this query — the one to edit. */
  bestPage: string
  /** How many distinct pages ranked for this query. >1 is the cannibalization
   *  signal; see findKeywordCannibalization for the graded version. */
  pageCount: number
  band: PositionBand
  /** Whether this keyword is already in the project's rank-tracking list, so
   *  the UI can offer "track this" without the user cross-referencing by eye. */
  tracked: boolean
}

export interface KeywordSummary {
  keywords: number
  pages: number
  clicks: number
  impressions: number
  /** Site-wide clicks/impressions. Null when there were no impressions at all
   *  — a CTR of "0%" and "no data" are different claims. */
  ctr: number | null
  /** Impression-weighted mean position across the whole corpus, or null when
   *  there's nothing to weight. */
  avgPosition: number | null
  bands: Record<PositionBand, number>
  /** Clicks concentrated in the top 10 keywords, as a share of all clicks.
   *  High concentration = the site is one algorithm update away from trouble.
   *  Null when there are no clicks to divide. */
  clickConcentration: number | null
}

function weightedPosition(rows: { impressions: number; position: number }[]): number {
  const totalImpressions = rows.reduce((n, r) => n + r.impressions, 0)
  if (totalImpressions > 0) {
    return rows.reduce((n, r) => n + r.position * r.impressions, 0) / totalImpressions
  }
  // No impressions anywhere (possible for a freshly-indexed query): fall back
  // to a plain mean rather than dividing by zero.
  return rows.length ? rows.reduce((n, r) => n + r.position, 0) / rows.length : 0
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Roll the (query, page) corpus up to one row per keyword, sorted by
 * impressions — the honest measure of how much search demand the site is
 * actually exposed to, before any CTR assumption.
 */
export function rollUpKeywords(rows: GscKeywordRow[], trackedKeywords: Iterable<string> = []): KeywordRollup[] {
  const tracked = new Set([...trackedKeywords].map((k) => k.trim().toLowerCase()))

  const byQuery = new Map<string, GscKeywordRow[]>()
  for (const r of rows) {
    const key = r.query
    const list = byQuery.get(key) ?? []
    list.push(r)
    byQuery.set(key, list)
  }

  const rollups: KeywordRollup[] = []
  for (const [query, list] of byQuery) {
    const clicks = list.reduce((n, r) => n + r.clicks, 0)
    const impressions = list.reduce((n, r) => n + r.impressions, 0)
    const position = weightedPosition(list)
    // The page Google surfaces most often for this query. Ties break on clicks,
    // so the page that actually earns traffic wins a dead heat on impressions.
    const best = list.slice().sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)[0]
    rollups.push({
      query,
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      position: round1(position),
      bestPage: best?.page ?? '',
      pageCount: new Set(list.map((r) => r.page)).size,
      band: bandOf(position),
      tracked: tracked.has(query.trim().toLowerCase()),
    })
  }

  return rollups.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
}

// ── The same corpus, rolled up the other way ─────────────────────────────────

export interface PageRollup {
  page: string
  clicks: number
  impressions: number
  ctr: number
  /** Impression-weighted mean position across every query this page ranks for. */
  position: number
  /** How many distinct queries bring Google to this page. */
  queries: number
  /** The query that puts this page in front of the most people. */
  topQuery: string
}

/**
 * Roll the corpus up by PAGE instead of by keyword — which query earned what is
 * the keyword view's question; "which of my pages actually earn anything" is a
 * different one, and the answer drives internal linking, pruning, and where to
 * spend effort.
 */
export function rollUpPages(rows: GscKeywordRow[]): PageRollup[] {
  const byPage = new Map<string, GscKeywordRow[]>()
  for (const r of rows) {
    if (!r.page) continue
    const list = byPage.get(r.page) ?? []
    list.push(r)
    byPage.set(r.page, list)
  }

  const out: PageRollup[] = []
  for (const [pageUrl, list] of byPage) {
    const clicks = list.reduce((n, r) => n + r.clicks, 0)
    const impressions = list.reduce((n, r) => n + r.impressions, 0)
    const top = list.slice().sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)[0]
    out.push({
      page: pageUrl,
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      position: round1(weightedPosition(list)),
      queries: new Set(list.map((r) => r.query)).size,
      topQuery: top?.query ?? '',
    })
  }
  return out.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
}

// ── Joining Analytics onto keywords ──────────────────────────────────────────
// GSC identifies a page by full URL (https://example.com/pricing/); GA4
// identifies the same page by path (/pricing). Joining them naively matches
// nothing and silently reports "no conversion data" for a site that has plenty
// — so both sides are normalized to a bare path first.

export function pathKey(pageOrPath: string): string {
  let path = pageOrPath.trim()
  try {
    path = new URL(path).pathname
  } catch {
    // Already a path (GA4's shape), or something unparseable — strip a query
    // string / fragment by hand and carry on.
    path = path.split('#')[0].split('?')[0]
  }
  if (!path.startsWith('/')) path = `/${path}`
  // Trailing slashes are not a meaningful distinction between the two APIs.
  return path.length > 1 ? path.replace(/\/+$/, '') : '/'
}

export interface LandingPageOutcome {
  sessions: number
  conversions: number
  /** Null when the GA4 property does not report revenue — very common, and
   *  different from "earned nothing". */
  revenue: number | null
}

/**
 * Attach the GA4 outcome for each keyword's landing page.
 *
 * This is deliberately PAGE-level, not keyword-level: GA4 cannot tell us which
 * session came from which query, and pretending otherwise would be the exact
 * kind of fabricated attribution this codebase refuses to ship. The UI labels
 * it as the landing page's number, not the keyword's.
 */
export function attachLandingOutcomes<T extends { bestPage: string }>(
  rollups: T[],
  ga4Pages: { page: string; sessions: number; conversions: number; revenue: number | null }[]
): (T & { landing: LandingPageOutcome | null })[] {
  const byPath = new Map<string, LandingPageOutcome>()
  for (const p of ga4Pages) {
    const key = pathKey(p.page)
    const prior = byPath.get(key)
    // GA4 can report the same normalized path more than once (e.g. /x and /x/).
    // Sum rather than letting the last one win.
    byPath.set(key, {
      sessions: (prior?.sessions ?? 0) + p.sessions,
      conversions: (prior?.conversions ?? 0) + p.conversions,
      revenue: p.revenue == null && prior?.revenue == null ? null : (prior?.revenue ?? 0) + (p.revenue ?? 0),
    })
  }
  return rollups.map((r) => ({ ...r, landing: (r.bestPage && byPath.get(pathKey(r.bestPage))) || null }))
}

const CONCENTRATION_TOP_N = 10

export function summarizeKeywords(rollups: KeywordRollup[]): KeywordSummary {
  const clicks = rollups.reduce((n, r) => n + r.clicks, 0)
  const impressions = rollups.reduce((n, r) => n + r.impressions, 0)
  const bands: Record<PositionBand, number> = { top3: 0, page1: 0, striking: 0, deep: 0 }
  for (const r of rollups) bands[r.band] += 1

  const topClicks = rollups
    .slice()
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, CONCENTRATION_TOP_N)
    .reduce((n, r) => n + r.clicks, 0)

  return {
    keywords: rollups.length,
    pages: new Set(rollups.map((r) => r.bestPage).filter(Boolean)).size,
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : null,
    avgPosition: rollups.length ? round1(weightedPosition(rollups)) : null,
    bands,
    clickConcentration: clicks > 0 ? topClicks / clicks : null,
  }
}
