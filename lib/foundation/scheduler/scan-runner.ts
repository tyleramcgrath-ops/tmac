// Scheduled job handlers (RankForge). v1 job: re-evaluate a project's latest
// scan — regenerate evidence-backed recommendations (preserving prior human
// triage via the stable-identity upsert) and re-run multi-agent coordination.
// This refreshes analysis + consensus from the most recent crawl WITHOUT
// re-crawling; the server-side re-crawl driver is the next increment (see
// SCHEDULER_DESIGN.md §6). Honest by construction: if there is no completed scan
// yet, the job is a no-op with a stated reason (never a fabricated result).

import type { FoundationStore } from '../store'
import { generateRecommendationsFromScan, persistScanRecommendations } from '../recommendations'
import { coordinateProject } from '../agents/service'

export async function runScheduledReeval(
  store: FoundationStore,
  projectId: string
): Promise<Record<string, unknown>> {
  const project = await store.getProject(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const scans = await store.listScans(projectId, 1)
  const latest = scans[0]
  if (!latest || (latest.status !== 'completed' && latest.status !== 'partial')) {
    return { skipped: true, reason: 'No completed scan to re-evaluate yet.' }
  }

  const { recommendations } = generateRecommendationsFromScan(latest, {
    industry: project.industry,
    businessProfile: project.businessProfile,
    goals: project.goals,
  })
  const { created, updated } = await persistScanRecommendations(store, projectId, recommendations)
  // Re-run the multi-agent coordination so the consensus reflects the refreshed set.
  await coordinateProject(store, project)

  return { scanId: latest.id, recommendations: recommendations.length, created, updated }
}
