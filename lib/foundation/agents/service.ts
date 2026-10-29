// Coordination service (Phase F). Loads a project's recommendations +
// deployments, decides whether the Local SEO agent should activate (from the
// project's business profile), and runs the agent orchestrator. Coordination is
// computed at READ time so the provenance chain (approved/deployed/verified)
// always reflects current status, history, and deployments — never stale.

import type { FoundationStore } from '../store'
import type { Project } from '../types'
import { deriveBusinessContext } from '../reco/business'
import type { PageType } from '../reco/classify'
import { coordinate, type CoordinationResult } from './orchestrator'

export async function coordinateProject(store: FoundationStore, project: Project): Promise<CoordinationResult> {
  const recs = await store.listRecommendations(project.id)
  const deployments = await store.listWpDeployments(project.id)
  const pageTypes = recs.map((r) => (r.pageType ?? 'other') as PageType)
  const biz = deriveBusinessContext(
    { industry: project.industry, businessProfile: project.businessProfile, goals: project.goals },
    pageTypes
  )
  return coordinate(recs, deployments, { local: biz.local })
}
