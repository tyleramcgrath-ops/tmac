// Automated AI-citation checking — the 'ai_citation_check' JobKind. On the
// project's chosen cadence, every tracked query gets one more real,
// timestamped check against Perplexity for whether this project's domain
// was cited in the answer.

import type { FoundationStore } from '../store'
import type { Job } from '../types'
import { checkCitation, perplexityApiKey } from '../ai-citations'
import { hostOf } from '../serp'
import { detectCitationLosses, notifyCitationLosses } from './ai-citation-alert'

export async function runAiCitationCheckJob(store: FoundationStore, job: Job): Promise<Record<string, unknown>> {
  const project = await store.getProject(job.projectId)
  if (!project) return { checked: 0, note: 'project not found' }

  const queries = await store.listTrackedAiQueries(job.projectId)
  if (queries.length === 0) return { checked: 0, note: 'no tracked queries' }

  const key = perplexityApiKey()
  if (!key) return { checked: 0, note: 'PERPLEXITY_API_KEY not configured — no snapshots taken' }

  let host: string
  try {
    host = hostOf(project.domain)
  } catch {
    return { checked: 0, note: 'project domain is not a valid URL/host' }
  }

  // The most recent REAL snapshot per query, taken BEFORE this run's new
  // ones are recorded — the only honest baseline to compare a loss against.
  const previousSnapshots = await Promise.all(
    queries.map(async (tq) => {
      const history = await store.listAiCitationSnapshots(job.projectId, tq.query)
      return history.at(-1) ?? null
    })
  )
  const previous = previousSnapshots.filter((s): s is NonNullable<typeof s> => s !== null)

  const checkedAt = new Date().toISOString()
  const results: { query: string; cited: boolean; available: boolean }[] = []
  for (const tq of queries) {
    const c = await checkCitation(tq.query, host, key)
    await store.recordAiCitationSnapshot({
      id: crypto.randomUUID(),
      projectId: job.projectId,
      query: tq.query,
      engine: 'perplexity',
      available: c.available,
      cited: c.cited,
      position: c.position,
      citedUrl: c.citedUrl,
      sourceCount: c.sourceCount,
      message: c.message,
      checkedAt,
    })
    results.push({ query: tq.query, cited: c.cited, available: c.available })
  }

  const losses = detectCitationLosses(previous, results)
  const alerted = await notifyCitationLosses(store, project, losses)

  return { checked: results.length, results, lost: losses.length, alerted: alerted.length }
}
