// Keyword cannibalization: the same query getting real impressions from more
// than one distinct page on the site — a genuine SEO problem, since it splits
// the ranking signal Google would otherwise concentrate on one page and often
// caps every competing page below where a single, consolidated page could
// rank. Built entirely from real Search Console query/page rows; nothing
// here is estimated or invented — a query only appears when at least two
// DIFFERENT real pages both actually received impressions for it.

export interface GscCannibalizationRow {
  query: string
  page: string
  clicks: number
  impressions: number
  position: number
}

export interface CannibalizedPage {
  page: string
  impressions: number
  clicks: number
  position: number
}

export interface CannibalizedQuery {
  query: string
  totalImpressions: number
  pages: CannibalizedPage[]
}

const MIN_IMPRESSIONS_PER_PAGE = 5

export function findKeywordCannibalization(rows: GscCannibalizationRow[], limit = 10): CannibalizedQuery[] {
  const byQuery = new Map<string, GscCannibalizationRow[]>()
  for (const r of rows) {
    if (r.impressions < MIN_IMPRESSIONS_PER_PAGE) continue
    const list = byQuery.get(r.query) ?? []
    list.push(r)
    byQuery.set(r.query, list)
  }

  const result: CannibalizedQuery[] = []
  for (const [query, list] of byQuery) {
    const distinctPages = new Set(list.map((r) => r.page))
    if (distinctPages.size < 2) continue
    const pages = list
      .slice()
      .sort((a, b) => b.impressions - a.impressions)
      .map((r) => ({ page: r.page, impressions: r.impressions, clicks: r.clicks, position: r.position }))
    result.push({ query, totalImpressions: pages.reduce((n, p) => n + p.impressions, 0), pages })
  }

  return result.sort((a, b) => b.totalImpressions - a.totalImpressions).slice(0, limit)
}
