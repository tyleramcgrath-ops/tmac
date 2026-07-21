// Automated keyword rank-position history — the 'rank_tracking' JobKind.
// Turns the previously point-in-time-only /api/rankings check into real
// history: on the project's chosen cadence, every tracked keyword gets one
// more real, timestamped snapshot, so the dashboard can chart a trend
// instead of only ever showing "right now."

import type { FoundationStore } from '../store'
import type { Job } from '../types'
import { fetchKeywordPosition, hostOf, serpApiKey } from '../serp'

export async function runRankTrackingJob(store: FoundationStore, job: Job): Promise<Record<string, unknown>> {
  const project = await store.getProject(job.projectId)
  if (!project) return { checked: 0, note: 'project not found' }

  const keywords = await store.listTrackedKeywords(job.projectId)
  if (keywords.length === 0) return { checked: 0, note: 'no tracked keywords' }

  const key = serpApiKey()
  if (!key) return { checked: 0, note: 'SERPAPI_KEY not configured — no snapshots taken' }

  let host: string
  try {
    host = hostOf(project.domain)
  } catch {
    return { checked: 0, note: 'project domain is not a valid URL/host' }
  }

  const checkedAt = new Date().toISOString()
  const results: { keyword: string; position: number | null }[] = []
  for (const tk of keywords) {
    const { position, url } = await fetchKeywordPosition(tk.keyword, host, key)
    await store.recordRankSnapshot({ id: crypto.randomUUID(), projectId: job.projectId, keyword: tk.keyword, position, url, checkedAt })
    results.push({ keyword: tk.keyword, position })
  }
  return { checked: results.length, results }
}
