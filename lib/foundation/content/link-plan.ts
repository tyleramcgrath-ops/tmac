// Assembles the internal-link equity view: which earning pages are starved of
// internal links, and which pages should carry the new link.
//
// Joins the crawl's link graph with Search Console's per-page performance. Both
// are required — without the crawl there is no link count, without Search
// Console there is no way to know which pages are worth linking to. Each
// missing side is named rather than silently producing an empty list.

import type { FoundationStore } from '../store'
import { assembleKeywordIntelligence } from '../external/service'
import { latestScanPages } from '../operator/context'
import { findLinkEquityGaps, type LinkEquityRow, type LinkGraphPage } from '../reco/link-equity'

export interface LinkEquityPlan {
  rows: LinkEquityRow[]
  /** Why the demand half is missing, when it is. */
  searchConsoleUnavailable: string | null
  hasCrawl: boolean
  pagesCrawled: number
  /** Pages Search Console reports for that the crawl never saw — usually a
   *  sitemap/crawl-depth gap, and interesting in its own right. */
  uncrawledEarners: { page: string; impressions: number }[]
  range: { from: string; to: string } | null
}

const MAX_UNCRAWLED = 10

export async function assembleLinkEquityPlan(
  store: FoundationStore,
  projectId: string,
  project: { domain: string },
  nowMs: number
): Promise<LinkEquityPlan> {
  const [intel, rawPages] = await Promise.all([
    assembleKeywordIntelligence(store, projectId, project, nowMs),
    latestScanPages(store, projectId),
  ])

  const pages: LinkGraphPage[] = rawPages.map((p) => ({
    url: typeof p.url === 'string' ? p.url : '',
    title: typeof p.title === 'string' ? p.title : undefined,
    internalTargets: Array.isArray(p.internalTargets) ? p.internalTargets.filter((t): t is string => typeof t === 'string') : undefined,
  }))

  const rows = findLinkEquityGaps({
    pages,
    performance: intel.pages.map((p) => ({
      page: p.page,
      clicks: p.clicks,
      impressions: p.impressions,
      position: p.position,
      queries: p.queries,
      topQuery: p.topQuery,
    })),
  })

  // Anything Google ranks that the crawler never reached. Not a link-equity
  // finding — a coverage one — but this is the only place both lists exist.
  const crawled = new Set(pages.map((p) => p.url.split('#')[0].replace(/\/$/, '')))
  const uncrawledEarners = intel.pages
    .filter((p) => p.impressions >= 50 && !crawled.has(p.page.split('#')[0].replace(/\/$/, '')))
    .slice(0, MAX_UNCRAWLED)
    .map((p) => ({ page: p.page, impressions: p.impressions }))

  return {
    rows,
    searchConsoleUnavailable: intel.unavailable,
    hasCrawl: pages.length > 0,
    pagesCrawled: pages.length,
    uncrawledEarners,
    range: intel.range,
  }
}
