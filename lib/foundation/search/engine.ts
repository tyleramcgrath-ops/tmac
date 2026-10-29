// Global Search — the domain engine (Engine -> API -> UI). No React, no UI
// concerns. Federates data every other Headquarters surface already fetches
// (the Mission Queue, the Agent Roster, real deployments, real content
// briefs) with a plain case-insensitive substring match. No search index, no
// ranking model, no external service — per the Phase 2 roadmap decision,
// this stays scoped to what's already being fetched, not a new search
// service. Every result traces back to a real entity; nothing is invented.

import type { WpDeployment, ContentBrief } from '../types'
import type { MissionQueueSnapshot } from '../missions/engine'
import type { AgentRosterSnapshot } from '../agents/runtime'

export type SearchResultType = 'mission' | 'agent' | 'deployment' | 'content-brief'

export interface SearchResult {
  type: SearchResultType
  id: string
  missionId: string | null
  title: string
  subtitle: string
}

const MAX_RESULTS = 20

function norm(s: string): string {
  return s.toLowerCase()
}

export function searchProject(
  rawQuery: string,
  data: {
    missionQueue: MissionQueueSnapshot
    roster: AgentRosterSnapshot
    deployments: WpDeployment[]
    contentBriefs: ContentBrief[]
  }
): SearchResult[] {
  const q = norm(rawQuery.trim())
  if (!q) return []
  const results: SearchResult[] = []

  for (const m of data.missionQueue.missions) {
    if (norm(m.title).includes(q) || norm(m.category).includes(q)) {
      results.push({ type: 'mission', id: m.id, missionId: m.id, title: m.title, subtitle: `${m.stage} · ${m.category}` })
    }
  }

  for (const a of data.roster.agents) {
    if (norm(a.name).includes(q) || norm(a.role).includes(q) || (a.currentActivity && norm(a.currentActivity).includes(q))) {
      results.push({ type: 'agent', id: a.agentId, missionId: null, title: a.name, subtitle: a.currentActivity ?? a.status })
    }
  }

  for (const d of data.deployments) {
    if (norm(d.postUrl).includes(q) || norm(d.status).includes(q) || norm(d.reason).includes(q)) {
      results.push({ type: 'deployment', id: d.id, missionId: d.recommendationId ?? null, title: d.postUrl, subtitle: `${d.status} · ${d.createdAt.slice(0, 10)}` })
    }
  }

  for (const b of data.contentBriefs) {
    if (norm(b.title).includes(q) || norm(b.keyword).includes(q)) {
      results.push({ type: 'content-brief', id: b.id, missionId: null, title: b.title || b.keyword, subtitle: `${b.status} · "${b.keyword}"` })
    }
  }

  return results.slice(0, MAX_RESULTS)
}
