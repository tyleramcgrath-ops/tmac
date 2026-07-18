// Crawls a real, bounded sample of a tracked competitor's site so overlap
// (lib/foundation/external/competitors.ts) can be OBSERVED instead of
// permanently unavailable. Reuses the exact same SSRF-guarded crawl engine
// every other crawl in this app goes through (lib/engine/crawl-batch.ts) —
// no separate, less-safe fetch path for "other people's sites."
//
// Deliberately a single bounded batch (a representative sample, not a full
// site crawl): overlap only needs enough pages to compare page-type mix,
// service slugs, schema usage, and title vocabulary — not exhaustive coverage.

import { isCrawlBatchError, runCrawlBatch } from '../../engine/crawl-batch'
import { toPageSignals } from '../reco/signals'
import type { PageSignals } from '../reco/signals'

export interface CompetitorCrawlResult {
  ok: boolean
  pages: PageSignals[]
  pagesCrawled: number
  error?: string
}

export async function crawlCompetitorSample(domain: string, maxPages = 10): Promise<CompetitorCrawlResult> {
  const url = /^https?:\/\//.test(domain) ? domain : `https://${domain}`
  const batch = await runCrawlBatch({ url, maxPages })
  if (isCrawlBatchError(batch)) {
    return { ok: false, pages: [], pagesCrawled: 0, error: batch.error }
  }
  if (batch.pages.length === 0) {
    return { ok: false, pages: [], pagesCrawled: 0, error: 'No pages could be crawled on this domain.' }
  }
  return {
    ok: true,
    pages: batch.pages.map((p) => toPageSignals(p as unknown as Record<string, unknown>)),
    pagesCrawled: batch.pages.length,
  }
}
