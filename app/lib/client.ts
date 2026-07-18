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
  emailVerified?: boolean
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
// Multi-agent coordination (Phase F).
export interface AgentStanceDTO {
  agentId: string
  position: 'support' | 'concern' | 'neutral'
  confidence: number
  evidence: string[]
  assumptions: string[]
  note: string
}
export interface ProvenanceDTO {
  discoveredBy: string
  analyzedBy: string
  challengedBy: string
  prioritizedBy: string
  approvedBy: string | null
  deployedBy: string | null
  verifiedBy: string | null
}
export interface CoordinationDTO {
  primaryOwner: string
  stances: AgentStanceDTO[]
  consensus: 'agree' | 'disagree' | 'needs-review' | 'human-required'
  consensusReason: string
  provenance: ProvenanceDTO
  disagreements: string[]
}
export interface AgentReportDTO {
  agentId: string
  name: string
  active: boolean
  ownedFindings: number
  observations: { agentId: string; kind: string; title: string; detail: string; evidenceUrls: string[]; confidence: number | 'unknown' }[]
  summary: string
}
export interface AgentMemoryDTO {
  agentId: string
  totalOwned: number
  accepted: number
  rejected: number
  overridden: number
  verified: number
  rolledBack: number
  reliability: number
  suggestedConfidenceNudge: number
  lessons: string[]
}
export interface ConsensusMetricsDTO {
  totalRecommendations: number
  consensus: { agree: number; disagree: number; 'needs-review': number; 'human-required': number }
  agentAgreementRate: number
  disagreementRate: number
  humanRequiredRate: number
  consensusQuality: number
  humanAgreementRate: number | 'unknown'
  userOverrideRate: number
  verificationSuccessRate: number | 'unknown'
  falsePositiveProxy: number
  precisionProxy: number
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
  // Priority (Phase H): engine rank + optional human override for reordering.
  priorityRank?: number
  userPriority?: number
  createdAt: string
  history: { at: string; by: string; from: string; to: string }[]
  coordination?: CoordinationDTO
}

// External integration status (Phase H) — never carries a credential.
export interface IntegrationDTO {
  kind: 'search-console' | 'analytics'
  vendor: string
  status: 'connected' | 'disconnected' | 'error'
  detail: string
  accountEmail: string | null
  resourceId: string | null
  scope: string
  connectedAt: string | null
  updatedAt: string | null
}
export interface ScheduleDTO {
  id: string
  kind: string
  cron: string
  enabled: boolean
  nextRunAt: string
  lastRunAt: string | null
}
export interface JobDTO {
  id: string
  kind: string
  status: string
  runAt: string
  attempts: number
  lastError: string | null
  createdAt: string
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
  // Email verification (RC2 P4) + pilot feedback (RC2 P6).
  resendVerification: () => req<{ ok: boolean; emailDelivery?: string; verifyUrl?: string | null }>('/api/auth/resend', { method: 'POST' }),
  submitFeedback: (kind: 'feedback' | 'issue', message: string, projectId?: string) =>
    req<{ ok: boolean; id: string }>('/api/feedback', { method: 'POST', body: JSON.stringify({ kind, message, projectId }) }),

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

  // recommendations (coordinated by the multi-agent layer — Phase F)
  listRecommendations: (projectId: string) =>
    req<{ recommendations: RecommendationDTO[]; agents: AgentReportDTO[]; memory: AgentMemoryDTO[]; metrics: ConsensusMetricsDTO }>(
      `/api/projects/${projectId}/recommendations`
    ),
  setRecommendationStatus: (projectId: string, id: string, status: string) =>
    req<{ recommendation: RecommendationDTO }>(`/api/projects/${projectId}/recommendations`, {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    }),
  // Human priority override (Phase H). Pass null to clear and fall back to the
  // engine's rank.
  setRecommendationPriority: (projectId: string, id: string, userPriority: number | null) =>
    req<{ recommendation: RecommendationDTO }>(`/api/projects/${projectId}/recommendations`, {
      method: 'PATCH',
      body: JSON.stringify({ id, userPriority }),
    }),

  // external integrations (Phase H — Connect Google: GSC + GA4)
  listIntegrations: (projectId: string) =>
    req<{ integrations: IntegrationDTO[]; configured: boolean }>(`/api/projects/${projectId}/integrations`),
  startGoogleConnect: (projectId: string, kind: 'search-console' | 'analytics' | 'all' = 'all') =>
    req<{ url: string }>(`/api/projects/${projectId}/integrations/google/start?kind=${kind}`),
  setIntegrationResource: (projectId: string, kind: 'search-console' | 'analytics', resourceId: string) =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/integrations`, {
      method: 'PATCH',
      body: JSON.stringify({ kind, resourceId }),
    }),
  disconnectIntegration: (projectId: string, kind: 'search-console' | 'analytics') =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/integrations?kind=${kind}`, { method: 'DELETE' }),

  // automation / scheduler
  getSchedule: (projectId: string) =>
    req<{ schedules: ScheduleDTO[]; jobs: JobDTO[] }>(`/api/projects/${projectId}/schedule`),
  setSchedule: (projectId: string, frequency: 'daily' | 'weekly', enabled: boolean) =>
    req<{ schedule: ScheduleDTO }>(`/api/projects/${projectId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ frequency, enabled }),
    }),
  clearSchedule: (projectId: string) =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/schedule`, { method: 'DELETE' }),

  // wordpress
  getWordpress: (projectId: string) =>
    req<{ connection: { siteUrl: string; username: string; aioseo: boolean; seoPlugin?: 'aioseo' | 'rankmath' | 'yoast' | 'core' } | null; deployments: DeploymentDTO[] }>(
      `/api/projects/${projectId}/wordpress`
    ),
  resolveWpTarget: (projectId: string, url: string) =>
    req<{ resolved: boolean; target: { postId: number; postType: string; title: string } | null }>(
      `/api/projects/${projectId}/wordpress`,
      { method: 'POST', body: JSON.stringify({ action: 'resolve', url }) }
    ),
  // Browse & one-click / bulk optimize (restored classic flow). 'all' returns
  // every page AND post so both can be listed and bulk-optimized together.
  listWordpressItems: (projectId: string, postType: 'posts' | 'pages' | 'all') =>
    req<{ items: { id: number; type: 'posts' | 'pages'; link: string; title: string; status: string }[] }>(
      `/api/projects/${projectId}/wordpress`,
      { method: 'POST', body: JSON.stringify({ action: 'list', postType }) }
    ),
  getWordpressItem: (projectId: string, postType: 'posts' | 'pages', postId: number) =>
    req<{ post: { postId: number; postType: 'posts' | 'pages'; title: string; metaDescription: string; content: string; link: string } }>(
      `/api/projects/${projectId}/wordpress`,
      { method: 'POST', body: JSON.stringify({ action: 'get', postType, postId }) }
    ),
  forgeRewrite: (input: { url: string; currentTitle: string; currentMeta: string; excerpt: string }) =>
    req<{ seoTitle?: string; metaDescription?: string; jsonLd?: string; schemaType?: string; rationale?: string }>(
      '/api/forge/rewrite',
      { method: 'POST', body: JSON.stringify(input) }
    ),
  connectWordpress: (projectId: string, siteUrl: string, username: string, appPassword: string) =>
    req<{ connection: { siteUrl: string; username: string; aioseo: boolean } }>(
      `/api/projects/${projectId}/wordpress`,
      { method: 'PUT', body: JSON.stringify({ siteUrl, username, appPassword }) }
    ),
  deployWordpress: (
    projectId: string,
    input: { postId: number; postType: string; title?: string; metaDescription?: string; jsonLd?: string; reason: string; recommendationId?: string }
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

  // ── Operator (Phase D) ──
  operatorPreview: (projectId: string, recommendationIds?: string[]) =>
    req<{ previews: OperatorPreviewDTO[] }>(`/api/projects/${projectId}/operator/preview`, {
      method: 'POST',
      body: JSON.stringify({ recommendationIds: recommendationIds ?? [] }),
    }),
  operatorDeploy: (
    projectId: string,
    items: { recommendationId: string; approve?: boolean; editedValue?: string }[],
    dryRun = false
  ) =>
    req<{ results: OperatorResultDTO[]; summary: { total: number; verified: number; failed: number }; dryRun: boolean }>(
      `/api/projects/${projectId}/operator/execute`,
      { method: 'POST', body: JSON.stringify({ action: 'deploy', items, dryRun }) }
    ),
  operatorRollback: (projectId: string, deploymentIds: string[]) =>
    req<{ results: OperatorResultDTO[] }>(`/api/projects/${projectId}/operator/execute`, {
      method: 'POST',
      body: JSON.stringify({ action: 'rollback', deploymentIds }),
    }),
  operatorMetrics: (projectId: string) =>
    req<{ metrics: OperatorMetricsDTO; learning: unknown[] }>(`/api/projects/${projectId}/operator/metrics`),
  getOperatorPolicy: (projectId: string) =>
    req<{ policy: OperatorPolicyDTO }>(`/api/projects/${projectId}/operator/policy`),
  setOperatorPolicy: (projectId: string, policy: OperatorPolicyDTO) =>
    req<{ policy: OperatorPolicyDTO }>(`/api/projects/${projectId}/operator/policy`, {
      method: 'PUT',
      body: JSON.stringify({ policy }),
    }),

  // external intelligence (Phase G — Mission Atlas)
  listCompetitors: (projectId: string) =>
    req<{ competitors: CompetitorDTO[] }>(`/api/projects/${projectId}/competitors`),
  addCompetitor: (projectId: string, domain: string, label?: string) =>
    req<{ competitor: CompetitorDTO }>(`/api/projects/${projectId}/competitors`, {
      method: 'POST',
      body: JSON.stringify({ domain, label }),
    }),
  deleteCompetitor: (projectId: string, id: string) =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/competitors?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getAtlas: (projectId: string) => req<{ snapshot: AtlasSnapshotDTO }>(`/api/projects/${projectId}/atlas`),
}

// ── Mission Atlas DTOs (Phase G) ─────────────────────────────────────────────
export type EvidenceGradeDTO = 'observed' | 'imported' | 'estimated' | 'unavailable'
export interface EvidenceDTO {
  grade: EvidenceGradeDTO
  source: string
  fetchedAt: string | null
  partial?: boolean
  dateRange?: { from: string; to: string } | null
  freshness?: 'fresh' | 'stale' | 'unknown'
  note?: string
}
export interface ObservationDTO<T> { value: T | null; evidence: EvidenceDTO; confidence: number | 'unknown' }
export interface CompetitorDTO {
  id: string
  domain: string
  label: string
  createdAt: string
}
export interface OverlapDTO {
  businessOverlap: ObservationDTO<number>
  topicOverlap: ObservationDTO<number>
  serviceOverlap: ObservationDTO<number>
  entityOverlap: ObservationDTO<number>
  contentOverlap: ObservationDTO<number>
  authorityOverlap: ObservationDTO<number>
}
export interface ProviderStatusDTO { id: string; kind: string; state: string; detail: string; lastCheckedAt: string | null }
export interface BriefingItemDTO { title: string; detail: string; evidence: EvidenceDTO; confidence: number | 'unknown' }
export interface MorningBriefingDTO {
  date: string
  headline: string
  yesterday: BriefingItemDTO[]
  overnight: BriefingItemDTO[]
  newOpportunities: BriefingItemDTO[]
  newThreats: BriefingItemDTO[]
  recommendedMission: string
  evidenceSummary: Record<EvidenceGradeDTO, number>
  confidence: number | 'unknown'
}
// Typed GSC / GA4 payloads so the Atlas tab can render imported Google data
// (RC2 P2) rather than leaving it fetched-but-hidden.
export interface GscRowDTO { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number }
export interface GscReportDTO { range: { from: string; to: string }; rows: GscRowDTO[] }
export interface Ga4PageDTO { page: string; sessions: number; engagedSessions: number; conversions: number; revenue: number | null; keyEvents: number }
export interface Ga4ReportDTO { range: { from: string; to: string }; currency: string | null; pages: Ga4PageDTO[] }

export interface AtlasSnapshotDTO {
  generatedAt: string
  providers: ProviderStatusDTO[]
  competitors: { competitor: CompetitorDTO; overlap: OverlapDTO }[]
  aiVisibility: ObservationDTO<unknown[]>
  backlinks: ObservationDTO<unknown>
  gsc: ObservationDTO<GscReportDTO>
  analytics: ObservationDTO<Ga4ReportDTO>
  trends: ObservationDTO<unknown>
  changes: { category: string; subject: string; note: string; evidence: EvidenceDTO }[]
  briefing: MorningBriefingDTO
  grades: Record<EvidenceGradeDTO, number>
}

export interface DiffSeg {
  type: 'equal' | 'insert' | 'delete'
  text: string
}
export interface OperatorPreviewDTO {
  recommendationId: string
  title?: string
  pageType?: string
  actionable: boolean
  deployable?: boolean
  fixKind?: string
  currentValue?: string
  proposedValue?: string
  diff?: DiffSeg[]
  reason?: string
  confidence?: number
  safety?: { risk: string; blocked: boolean; warnings: string[]; rollbackPlan: string; affectedPages: number }
  decision?: { decision: string; reason: string }
  note?: string
}
export interface OperatorResultDTO {
  recommendationId?: string
  deploymentId?: string
  ok: boolean
  status?: string
  verified?: boolean
  reopened?: boolean
  requiresApproval?: boolean
  blocked?: boolean
  dryRun?: boolean
  error?: string
  stage?: string
  note?: string
}
export interface OperatorMetricsDTO {
  recommendationsTotal: number
  pendingApprovals: number
  fixedToday: number
  verifiedImprovements: number
  deploymentsTotal: number
  // null = no data yet (rendered "—"), never a fabricated 0/baseline.
  deploymentSuccessRate: number | null
  verificationFailureRate: number | null
  rollbackRate: number | null
  automationSuccessRate: number | null
  avgTimeToResolutionHours: number | null
  trustScore: number | null
  operatorAccuracy: number | null
}
export interface OperatorPolicyDTO {
  autoApprove: { title?: string; metaDescription?: string; schema?: string }
  maxAutoApprovePages: number
  alwaysRequireApproval?: string[]
}
