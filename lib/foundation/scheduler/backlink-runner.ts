// Automated backlink-profile refresh — the 'backlink_refresh' JobKind. On
// the project's chosen cadence, records one more real, timestamped aggregate
// backlink snapshot (total backlinks, referring domains, trust/citation
// flow) from Majestic for the project's domain.

import type { FoundationStore } from '../store'
import type { Job } from '../types'
import { checkBacklinks, majesticApiKey } from '../backlinks'
import { hostOf } from '../serp'

export async function runBacklinkRefreshJob(store: FoundationStore, job: Job): Promise<Record<string, unknown>> {
  const project = await store.getProject(job.projectId)
  if (!project) return { checked: false, note: 'project not found' }

  const key = majesticApiKey()
  if (!key) return { checked: false, note: 'MAJESTIC_API_KEY not configured — no snapshot taken' }

  let host: string
  try {
    host = hostOf(project.domain)
  } catch {
    return { checked: false, note: 'project domain is not a valid URL/host' }
  }

  const c = await checkBacklinks(host, key)
  await store.recordBacklinkSnapshot({
    id: crypto.randomUUID(),
    projectId: job.projectId,
    available: c.available,
    totalBacklinks: c.totalBacklinks,
    referringDomains: c.referringDomains,
    trustFlow: c.trustFlow,
    citationFlow: c.citationFlow,
    message: c.message,
    checkedAt: new Date().toISOString(),
  })
  return { checked: true, available: c.available }
}
