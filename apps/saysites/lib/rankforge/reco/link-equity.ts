// Link equity — "your best pages are the ones nobody links to."
//
// Internal linking in this app has only ever been driven by structure: find an
// orphan, link something to it. That treats every page as equally worth
// reaching, which is not how a site works. The pages that earn impressions are
// the ones worth pointing authority at, and they are routinely the least-linked
// — a blog post that quietly ranks for 40 queries typically has one link from
// an archive page, while the About page is in the header of every page on the
// site.
//
// This finds that mismatch by joining two things the app already had but never
// compared: the crawl's internal link graph, and Search Console's per-page
// performance.
//
// It states facts and proposes an action. It does NOT promise a rank gain —
// internal links are one input among many, and a tool claiming "+3 positions"
// from a link is guessing.

import { rankLinkCandidates } from './link-ranking'

export interface LinkGraphPage {
  url: string
  title?: string
  internalTargets?: string[]
}

export interface PagePerformance {
  page: string
  clicks: number
  impressions: number
  position: number
  queries: number
  topQuery: string
}

export interface LinkSuggestion {
  /** The page that should carry the new link. */
  from: string
  fromTitle: string
  /** Descriptive anchor text — the target page's own title, per Google's
   *  guidance. Never the bare URL, never "click here". */
  anchor: string
}

export interface LinkEquityRow {
  url: string
  title: string | null
  clicks: number
  impressions: number
  position: number
  queries: number
  topQuery: string
  /** Distinct OTHER pages that link here. Distinct, because ten links from one
   *  template is one relationship, not ten. */
  inboundLinks: number
  /** 1 = this site's biggest earner by impressions. */
  demandRank: number
  /** 1 = this site's most internally-linked page. */
  linkRank: number
  /** How far the page's link rank trails its demand rank, as a share of the
   *  site. 0.5 means it sits 50% of the site's pages lower on links than on
   *  demand. Ordering only — not a score of anything physical. */
  gap: number
  suggestions: LinkSuggestion[]
}

// A page must be genuinely earning before "under-linked" means anything. Below
// this, low inbound links is unremarkable rather than a finding.
const MIN_IMPRESSIONS = 50

// The page has to trail its demand by a real margin. A page ranked 4th on
// demand and 6th on links is noise.
const MIN_GAP = 0.15

const MAX_SUGGESTIONS = 5

// A page title is usually "Real Subject | Brand". The brand suffix is noise in
// an anchor, so drop it — same shape link-ranking uses when it builds anchors.
function anchorFrom(title: string, fallback: string): string {
  const a = title.replace(/<[^>]+>/g, '').split(/[·|—–|]/)[0].trim()
  return a || fallback
}

// Sites link to themselves in several spellings — http/https, www/bare, with
// and without a trailing slash. Treating those as different pages both invents
// orphans and hides real links, so every comparison goes through one identity.
// Query strings are kept: ?id=2 is a real page.
export function pageKey(u: string): string {
  const bare = u.split('#')[0]
  try {
    const parsed = new URL(bare)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    return `${host}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`
  } catch {
    return bare.replace(/\/$/, '')
  }
}

/** Distinct inbound internal links per page, keyed by pageKey. Self-links don't
 *  count — breadcrumbs and paginators emit them on every page. */
export function inboundLinkCounts(pages: LinkGraphPage[]): Map<string, number> {
  const sources = new Map<string, Set<string>>()
  for (const p of pages) sources.set(pageKey(p.url), new Set())
  for (const p of pages) {
    const self = pageKey(p.url)
    for (const t of p.internalTargets ?? []) {
      const k = pageKey(t)
      if (k === self) continue
      sources.get(k)?.add(self)
    }
  }
  return new Map([...sources].map(([k, set]) => [k, set.size]))
}

// Rank by a descending value; ties share the lower (better) rank so two pages
// with identical impressions are not arbitrarily ordered against each other.
function rankBy<T>(items: T[], value: (t: T) => number): Map<T, number> {
  const sorted = items.slice().sort((a, b) => value(b) - value(a))
  const ranks = new Map<T, number>()
  let lastValue: number | null = null
  let lastRank = 0
  sorted.forEach((item, i) => {
    const v = value(item)
    const rank = lastValue !== null && v === lastValue ? lastRank : i + 1
    ranks.set(item, rank)
    lastValue = v
    lastRank = rank
  })
  return ranks
}

export function findLinkEquityGaps(input: {
  pages: LinkGraphPage[]
  performance: PagePerformance[]
  limit?: number
}): LinkEquityRow[] {
  const { pages, performance, limit = 15 } = input
  if (pages.length === 0 || performance.length === 0) return []

  const inbound = inboundLinkCounts(pages)
  const byKey = new Map(pages.map((p) => [pageKey(p.url), p]))

  // Only pages present in BOTH the crawl and Search Console can be judged:
  // without the crawl there is no link count, without GSC there is no demand.
  const judged = performance
    .filter((perf) => perf.impressions >= MIN_IMPRESSIONS && byKey.has(pageKey(perf.page)))
    .map((perf) => ({ perf, page: byKey.get(pageKey(perf.page))!, inbound: inbound.get(pageKey(perf.page)) ?? 0 }))

  if (judged.length < 3) return [] // ranks are meaningless on a handful of pages

  const demandRanks = rankBy(judged, (j) => j.perf.impressions)
  const linkRanks = rankBy(judged, (j) => j.inbound)

  const rows: LinkEquityRow[] = []
  for (const j of judged) {
    const demandRank = demandRanks.get(j)!
    const linkRank = linkRanks.get(j)!
    // Positive when the page sits lower on links than it does on demand.
    const gap = (linkRank - demandRank) / judged.length
    if (gap < MIN_GAP) continue

    // Which pages should carry the new link: topically related ones that don't
    // already link here. Same relevance ranking every other internal-linking
    // path in the app uses, so suggestions read as editorial, not as spam.
    const targetKey = pageKey(j.page.url)
    const alreadyLinking = new Set(
      pages.filter((p) => (p.internalTargets ?? []).some((t) => pageKey(t) === targetKey)).map((p) => pageKey(p.url))
    )
    const pool = pages.filter((p) => {
      const k = pageKey(p.url)
      return k !== targetKey && !alreadyLinking.has(k) && !!p.title
    })
    const suggestions = rankLinkCandidates(
      { url: j.page.url, title: j.page.title ?? '' },
      pool.map((p) => ({ url: p.url, title: p.title ?? '' })),
      MAX_SUGGESTIONS
    ).map((c) => ({
      // rankLinkCandidates returns the pages to link TO from a source. Here the
      // roles are reversed: the ranked page is the one that should carry the
      // link, and the anchor is the under-linked target's own title.
      from: c.url,
      fromTitle: pool.find((p) => p.url === c.url)?.title ?? '',
      anchor: anchorFrom(j.page.title ?? '', j.perf.topQuery || j.page.url),
    }))

    rows.push({
      url: j.page.url,
      title: j.page.title ?? null,
      clicks: j.perf.clicks,
      impressions: j.perf.impressions,
      position: j.perf.position,
      queries: j.perf.queries,
      topQuery: j.perf.topQuery,
      inboundLinks: j.inbound,
      demandRank,
      linkRank,
      gap,
      suggestions,
    })
  }

  return rows.sort((a, b) => b.impressions - a.impressions).slice(0, limit)
}
