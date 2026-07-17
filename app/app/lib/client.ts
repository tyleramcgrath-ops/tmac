// Typed client for the foundation APIs. All calls are same-origin and rely on
// the HttpOnly session cookie — no tokens in JS. Every helper throws ApiError
// with the server's message on non-2xx so the UI can show real error states.

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : {}
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status}).`)
  return body as T
}

export interface SessionUser {
  id: string
  email: string
  name: string
}
export interface Org {
  id: string
  name: string
}
export interface ProjectDTO {
  id: string
  orgId: string
  domain: string
  name: string
  industry: string
  businessProfile: string
  goals: string[]
  notes: string
  createdAt: string
  updatedAt: string
}
export interface ScanSummary {
  id: string
  status: string
  createdAt: string
  completedAt?: string | null
  error?: string | null
  summary: {
    pagesCrawled: number
    urlsDiscovered: number
    blockedCount: number
    siteScore: number
    critical: number
    warning: number
    info: number
  }
}
export interface RecommendationDTO {
  id: string
  title: string
  category: string
  severity: string
  status: string
  reasoning: string
  evidence: { affectedUrls: string[]; facts: string[] }
  confidence: number
  confidenceBasis: string
  expectedImpact: { category: string; size: string; note: string }
  risk: { level: string; note: string }
  createdAt: string
  history: { at: string; by: string; from: string; to: string }[]
}
export interface DeploymentDTO {
  id: string
  postId: number
  postType: string
  postUrl: string
  before: { title: string; metaDescription: string }
  after: { title?: string; metaDescription?: string }
  approvedBy: string
  approvedAt: string
  reason: string
  status: string
  verification: { checkedAt: string; titleMatches: boolean | null; metaMatches: boolean | null; note: string } | null
  result: string
  rolledBackAt?: string
  createdAt: string
}

export const api = {
  // auth
  me: () => req<{ user: SessionUser | null; orgs?: Org[] }>('/api/auth/me'),
  signup: (email: string, password: string, name?: string) =>
    req<{ user: SessionUser; org: Org }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    req<{ user: SessionUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => req<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  // projects
  listProjects: () => req<{ projects: ProjectDTO[] }>('/api/projects'),
  createProject: (input: Partial<ProjectDTO> & { domain: string }) =>
    req<{ project: ProjectDTO }>('/api/projects', { method: 'POST', body: JSON.stringify(input) }),
  getProject: (id: string) =>
    req<{ project: ProjectDTO; scans: ScanSummary[] }>(`/api/projects/${id}`),
  updateProject: (id: string, patch: Partial<ProjectDTO>) =>
    req<{ project: ProjectDTO }>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteProject: (id: string) => req<{ ok: true }>(`/api/projects/${id}`, { method: 'DELETE' }),

  // scans
  startScan: (projectId: string) =>
    req<{ scan: { id: string; status: string } }>(`/api/projects/${projectId}/scans`, {
      method: 'POST',
      body: JSON.stringify({ action: 'start' }),
    }),
  completeScan: (projectId: string, scanId: string, pages: unknown[], blocked: unknown[], discovered: number) =>
    req<{ scan: ScanSummary; recommendationCount: number }>(`/api/projects/${projectId}/scans`, {
      method: 'POST',
      body: JSON.stringify({ action: 'complete', scanId, pages, blocked, discovered }),
    }),
  failScan: (projectId: string, scanId: string, error: string) =>
    req<unknown>(`/api/projects/${projectId}/scans`, {
      method: 'POST',
      body: JSON.stringify({ action: 'fail', scanId, error }),
    }),
  listScans: (projectId: string) =>
    req<{ scans: ScanSummary[] }>(`/api/projects/${projectId}/scans`),
  getScan: (projectId: string, id: string) =>
    req<{ scan: ScanSummary & { pages: unknown[]; blocked: unknown[] } }>(
      `/api/projects/${projectId}/scans?id=${id}`
    ),

  // recommendations
  listRecommendations: (projectId: string) =>
    req<{ recommendations: RecommendationDTO[] }>(`/api/projects/${projectId}/recommendations`),
  setRecommendationStatus: (projectId: string, id: string, status: string) =>
    req<{ recommendation: RecommendationDTO }>(`/api/projects/${projectId}/recommendations`, {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    }),

  // wordpress
  getWordpress: (projectId: string) =>
    req<{ connection: { siteUrl: string; username: string; aioseo: boolean } | null; deployments: DeploymentDTO[] }>(
      `/api/projects/${projectId}/wordpress`
    ),
  connectWordpress: (projectId: string, siteUrl: string, username: string, appPassword: string) =>
    req<{ connection: { siteUrl: string; username: string; aioseo: boolean } }>(
      `/api/projects/${projectId}/wordpress`,
      { method: 'PUT', body: JSON.stringify({ siteUrl, username, appPassword }) }
    ),
  deployWordpress: (
    projectId: string,
    input: { postId: number; postType: string; title?: string; metaDescription?: string; reason: string; recommendationId?: string }
  ) =>
    req<{ deployment: DeploymentDTO }>(`/api/projects/${projectId}/wordpress`, {
      method: 'POST',
      body: JSON.stringify({ action: 'deploy', ...input }),
    }),
  rollbackWordpress: (projectId: string, deploymentId: string) =>
    req<{ deployment: DeploymentDTO }>(`/api/projects/${projectId}/wordpress`, {
      method: 'POST',
      body: JSON.stringify({ action: 'rollback', deploymentId }),
    }),
}
