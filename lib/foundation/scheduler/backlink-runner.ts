// Automated backlink-profile refresh — the 'backlink_refresh' JobKind. On
// the project's chosen cadence, records one more real, timestamped aggregate
// backlink snapshot (total backlinks, referring domains, trust/citation
// flow) from Majestic for the project's domain.

import type { FoundationStore } from '../store'
import type { Job } from '../types'
import { checkBacklinks, majesticApiKey } from '../backlinks'
import { hostOf } from '../serp'
import { detectBacklinkDrop, notifyBacklinkDrop } from './backlink-alert'

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

  // The most recent REAL snapshot, taken BEFORE this run's new one is
  // recorded — the only honest baseline to compare a drop against.
  const [previous] = await store.listBacklinkSnapshots(job.projectId, 1)

  const c = await checkBacklinks(host, key)
  const snapshot = {
    id: crypto.randomUUID(),
    projectId: job.projectId,
    available: c.available,
    totalBacklinks: c.totalBacklinks,
    referringDomains: c.referringDomains,
    trustFlow: c.trustFlow,
    citationFlow: c.citationFlow,
    message: c.message,
    checkedAt: new Date().toISOString(),
  }
  await store.recordBacklinkSnapshot(snapshot)

  const drop = detectBacklinkDrop(previous ?? null, snapshot)
  const alerted = await notifyBacklinkDrop(store, project, drop)

  return { checked: true, available: c.available, dropped: drop ? drop.lost : 0, alerted: alerted.length }
}
