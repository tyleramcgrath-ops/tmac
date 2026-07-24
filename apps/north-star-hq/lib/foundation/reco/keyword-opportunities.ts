// Keyword opportunities ("quick wins"): queries where the site already ranks
// on page 1-2 (positions 4-20) with real, non-trivial impressions — the
// closest, cheapest wins available, since Google already considers the page
// relevant enough to show it. Built entirely from real Search Console rows
// (query/page/clicks/impressions/ctr/position); nothing here is estimated or
// invented. Ranked by impressions, not a fabricated "potential clicks"
// number, since that would require assuming a CTR curve we can't verify per
// site.

export interface GscOpportunityRow {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface KeywordOpportunity {
  query: string
  page: string
  position: number
  impressions: number
  clicks: number
  ctr: number
}

const MIN_POSITION = 4
const MAX_POSITION = 20
const MIN_IMPRESSIONS = 10

export function findKeywordOpportunities(rows: GscOpportunityRow[], limit = 10): KeywordOpportunity[] {
  return rows
    .filter((r) => r.position >= MIN_POSITION && r.position <= MAX_POSITION && r.impressions >= MIN_IMPRESSIONS)
    .slice()
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((r) => ({ query: r.query, page: r.page, position: r.position, impressions: r.impressions, clicks: r.clicks, ctr: r.ctr }))
}
