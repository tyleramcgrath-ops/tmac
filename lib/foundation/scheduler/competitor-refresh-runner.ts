// Automated competitor overlap refresh — the 'competitor_refresh' JobKind.
// Previously refresh was 100% manual (a user clicking "Refresh" on the Atlas
// tab); overlap data silently went stale between visits. This runs the exact
// same crawl → real Jaccard overlap → persist path as the manual refresh
// action, just on a project's chosen cadence, for every tracked competitor.

import type { FoundationStore } from '../store'
import type { Competitor, Job } from '../types'
import { latestScanPages } from '../operator/context'
import { toPageSignals } from '../reco/signals'
import { computeOverlap } from '../external/competitors'
import { crawlCompetitorSample } from '../external/competitor-crawl'

export interface CompetitorRefreshResult {
  crawled: boolean
  pagesCrawled: number
  error?: string
}

// Refresh one competitor's overlap snapshot in place. Pure side effect on the
// store; the caller decides whether/how to report the outcome (route response
// vs. job result).
export async function refreshOneCompetitor(store: FoundationStore, competitor: Competitor): Promise<CompetitorRefreshResult> {
  const [rawPages, crawl] = await Promise.all([
    latestScanPages(store, competitor.projectId),
    crawlCompetitorSample(competitor.domain),
  ])
  const ourPages = rawPages.map(toPageSignals)
  const now = new Date().toISOString()
  const overlap = crawl.ok ? computeOverlap(ourPages, crawl.pages, now) : computeOverlap(ourPages, null, now)
  const snapshotPages = crawl.ok
    ? crawl.pages.filter((p) => p.title).slice(0, 20).map((p) => ({ url: p.url, title: p.title! }))
    : competitor.snapshotPages
  const updated: Competitor = { ...competitor, overlap, lastSnapshotAt: now, snapshotPages }
  await store.updateCompetitor(updated)
  return { crawled: crawl.ok, pagesCrawled: crawl.pagesCrawled, error: crawl.ok ? undefined : crawl.error }
}

// Job handler: refresh every competitor tracked on the job's project. Each
// competitor is independent — one failing crawl (unreachable site, blocked)
// never aborts the others.
export async function runCompetitorRefreshJob(store: FoundationStore, job: Job): Promise<Record<string, unknown>> {
  const competitors = await store.listCompetitors(job.projectId)
  const results: (CompetitorRefreshResult & { id: string; domain: string })[] = []
  for (const competitor of competitors) {
    try {
      const result = await refreshOneCompetitor(store, competitor)
      results.push({ id: competitor.id, domain: competitor.domain, ...result })
    } catch (err) {
      results.push({ id: competitor.id, domain: competitor.domain, crawled: false, pagesCrawled: 0, error: err instanceof Error ? err.message : 'refresh failed' })
    }
  }
  return { refreshed: results.length, results }
}
