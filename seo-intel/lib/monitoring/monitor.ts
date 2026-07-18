// Monitor runner — the real engine behind "the Compass watched overnight".
//
// For each tracked page it runs the full seo-intel pipeline, stores the Report,
// records a dated Snapshot, and diffs it against the previous snapshot to
// produce concrete deltas. Aggregated into a MonitorRun.

import { getStore } from '../db'
import { newReport, runAnalysis } from '../pipeline'
import type { KeyOverrides } from '../config'
import type { Report } from '../types'
import { computeSnapshotDeltas } from './delta'
import { getSite, latestSnapshotForUrl, saveRun, saveSnapshot } from './store'
import type { Delta, MonitorRun, MonitoredSite, Snapshot } from './types'
import { trackedPageToInput } from './types'

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Build a dated Snapshot from a completed Report. */
export function snapshotFromReport(siteId: string, report: Report): Snapshot {
  const r = report.results
  const scores: Record<string, number> = {}
  if (r?.scores) {
    for (const [key, entry] of Object.entries(r.scores)) {
      if (entry && typeof entry.score === 'number') scores[key] = entry.score
    }
  }
  const criticalCount = (r?.recommendations ?? []).filter((rec) => rec.category === 'critical').length
  return {
    id: id('snap'),
    siteId,
    url: report.input.url,
    keyword: report.input.keyword,
    takenAt: report.completedAt ?? new Date().toISOString(),
    reportId: report.id,
    overallScore: report.overallScore,
    scores,
    serpPosition: r?.userAnalysis?.position ?? null,
    criticalCount,
    warnings: r?.warnings ?? [],
  }
}

function avg(nums: number[]): number | null {
  const vals = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n))
  if (vals.length === 0) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

/**
 * Run one monitor cycle across all tracked pages of a site. Returns the
 * persisted MonitorRun. Pages are analysed sequentially to stay within API
 * rate limits; a single page failing does not abort the run.
 */
export async function runMonitorCycle(siteId: string, keyOverrides?: KeyOverrides): Promise<MonitorRun> {
  const site: MonitoredSite | null = await getSite(siteId)
  if (!site) throw new Error(`Unknown monitored site: ${siteId}`)

  const store = await getStore()
  const snapshotIds: string[] = []
  const deltas: Delta[] = []
  const beforeScores: number[] = []
  const afterScores: number[] = []

  for (const page of site.pages) {
    try {
      const prev = await latestSnapshotForUrl(siteId, page.url)
      if (prev?.overallScore != null) beforeScores.push(prev.overallScore)

      const report = await runAnalysis(newReport(trackedPageToInput(page)), () => {}, keyOverrides)
      await store.saveReport(report)

      const snap = snapshotFromReport(siteId, report)
      await saveSnapshot(snap)
      snapshotIds.push(snap.id)
      if (snap.overallScore != null) afterScores.push(snap.overallScore)

      deltas.push(...computeSnapshotDeltas(prev, snap))
    } catch (err) {
      // Record nothing fake; skip the page and continue the cycle.
      console.error(`[monitor] page failed: ${page.url}`, err)
    }
  }

  deltas.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  const run: MonitorRun = {
    id: id('run'),
    siteId,
    ranAt: new Date().toISOString(),
    pageCount: site.pages.length,
    snapshotIds,
    deltas,
    siteScoreBefore: avg(beforeScores),
    siteScoreAfter: avg(afterScores),
  }
  await saveRun(run)
  return run
}
