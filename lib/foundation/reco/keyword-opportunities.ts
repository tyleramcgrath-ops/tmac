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

/**
 * The position window is a parameter because the same engine answers two
 * different questions, and conflating them put two meanings of "striking
 * distance" on one screen: the Rankings band card called it 11-20 while this
 * defaulted to 4-20, so the panel listed #6.9 results the bands filed under
 * "Page 1". Callers now say which window they mean.
 */
export function findKeywordOpportunities(
  rows: GscOpportunityRow[],
  limit = 10,
  window: { min?: number; max?: number } = {}
): KeywordOpportunity[] {
  const min = window.min ?? MIN_POSITION
  const max = window.max ?? MAX_POSITION
  return rows
    .filter((r) => r.position >= min && r.position <= max && r.impressions >= MIN_IMPRESSIONS)
    .slice()
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((r) => ({ query: r.query, page: r.page, position: r.position, impressions: r.impressions, clicks: r.clicks, ctr: r.ctr }))
}

/** How many rows qualify, before the limit — so the UI can say "25 of 736"
 *  instead of presenting a truncation as a total. */
export function countKeywordOpportunities(rows: GscOpportunityRow[], window: { min?: number; max?: number } = {}): number {
  const min = window.min ?? MIN_POSITION
  const max = window.max ?? MAX_POSITION
  return rows.filter((r) => r.position >= min && r.position <= max && r.impressions >= MIN_IMPRESSIONS).length
}
