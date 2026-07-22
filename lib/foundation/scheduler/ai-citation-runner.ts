// Automated AI-citation checking — the 'ai_citation_check' JobKind. On the
// project's chosen cadence, every tracked query gets one more real,
// timestamped check against Perplexity for whether this project's domain
// was cited in the answer.

import type { FoundationStore } from '../store'
import type { Job } from '../types'
import { checkCitation, perplexityApiKey } from '../ai-citations'
import { hostOf } from '../serp'

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
  return { checked: results.length, results }
}
