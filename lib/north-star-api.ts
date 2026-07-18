/**
 * North Star API client — the single typed surface the office UI uses to reach
 * the engine, now mounted same-origin under /api/*. Types are re-exported from
 * the merged engine so the room and the backend never drift.
 */
import type {
  ChangeProposal,
  MonitorRun,
  MonitoredSite,
  TrackedPage,
  WhileYouWereAwayBrief,
} from '@/lib/engine/monitoring/types'
import type { AiEngine, CitationDelta, CitationSnapshot } from '@/lib/engine/citations/types'

export type {
  ChangeProposal,
  MonitorRun,
  MonitoredSite,
  TrackedPage,
  WhileYouWereAwayBrief,
  AiEngine,
  CitationDelta,
  CitationSnapshot,
}

async function json<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status}).`)
  return data
}

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

// ─── Business Twin (sites) ───────────────────────────────────────────────────

export async function listSites(): Promise<MonitoredSite[]> {
  return (await json<{ sites: MonitoredSite[] }>(await fetch('/api/monitor/sites'))).sites
}

export async function createSite(input: { label?: string; domain?: string; pages: TrackedPage[] }): Promise<MonitoredSite> {
  return (await json<{ site: MonitoredSite }>(await post('/api/monitor/sites', input))).site
}

// ─── Monitoring + overnight brief ────────────────────────────────────────────

export async function runMonitor(siteId: string, deliver = false): Promise<{ run: MonitorRun; brief: WhileYouWereAwayBrief }> {
  return json(await post('/api/monitor/run', { siteId, deliver }))
}

export async function getBrief(siteId: string): Promise<{ brief: WhileYouWereAwayBrief | null; run?: MonitorRun; message?: string }> {
  return json(await fetch(`/api/monitor/brief?siteId=${encodeURIComponent(siteId)}`))
}

// ─── Automation (agentic fix loop) ───────────────────────────────────────────

export async function listProposals(siteId: string): Promise<ChangeProposal[]> {
  return (await json<{ proposals: ChangeProposal[] }>(await fetch(`/api/automation/proposals?siteId=${encodeURIComponent(siteId)}`))).proposals
}

export async function proposeFixes(siteId: string, reportId: string): Promise<{ proposal: ChangeProposal | null; message?: string }> {
  return json(await post('/api/automation/proposals', { siteId, reportId }))
}

export interface WpCredentials {
  site: string
  username: string
  appPassword: string
}

export async function applyProposal(proposalId: string, connection: WpCredentials, includeFaq = false): Promise<{ proposal: ChangeProposal }> {
  return json(await post('/api/automation/apply', { proposalId, connection, includeFaq }))
}

// ─── Intelligence (AI-citation tracking) ─────────────────────────────────────

export async function getCitations(siteId: string): Promise<{ latest: CitationSnapshot | null; history: CitationSnapshot[]; deltas: CitationDelta[] }> {
  return json(await fetch(`/api/citations?siteId=${encodeURIComponent(siteId)}`))
}

export async function runCitations(siteId: string, opts?: { queries?: string[]; engines?: AiEngine[]; brandDomain?: string }): Promise<{ snapshot: CitationSnapshot; deltas: CitationDelta[] }> {
  return json(await post('/api/citations', { siteId, ...opts }))
}

// ─── Connections + delivery ──────────────────────────────────────────────────

export interface ConnectionState {
  gsc: { connected: boolean; propertyUrl?: string }
  ga4: { connected: boolean; propertyId?: string }
  wordpress: { connected: boolean; baseUrl?: string }
  slack: { connected: boolean; channel?: string }
  email: { connected: boolean; address?: string }
}

export async function getConnections(siteId: string): Promise<ConnectionState> {
  return (await json<{ connections: ConnectionState }>(await fetch(`/api/connections?siteId=${encodeURIComponent(siteId)}`))).connections
}

export async function setConnections(siteId: string, patch: Partial<Record<'slack' | 'email' | 'gsc' | 'ga4' | 'wordpress', unknown>>): Promise<ConnectionState> {
  return (await json<{ connections: ConnectionState }>(await post('/api/connections', { siteId, ...patch }))).connections
}

export async function deliverBrief(siteId: string): Promise<{ delivered: { channel: string; delivered: boolean; message: string }[]; message?: string }> {
  return json(await post('/api/deliver', { siteId }))
}
