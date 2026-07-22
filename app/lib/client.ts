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
export type Role = 'owner' | 'admin' | 'member'
export interface MemberDTO {
  userId: string
  email: string
  name: string
  role: Role
  createdAt: string
}
export interface InvitationDTO {
  id: string
  email: string
  role: Role
  createdAt: string
  expiresAt: string
}
export interface PilotDTO {
  status: 'active' | 'expired' | 'disabled'
  expiresAt: string | null
  notes?: string
}
export interface AdminOrgDTO {
  id: string
  name: string
  pilot: PilotDTO | null
  ownerEmail: string | null
  memberCount: number
  projectCount: number
  createdAt: string
}
export interface AdminFeedbackDTO {
  id: string
  orgId: string
  orgName: string
  userEmail: string
  projectId: string | null
  kind: 'feedback' | 'issue'
  message: string
  createdAt: string
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
export type ScheduleKind = 'scheduled_scan' | 'monitor' | 'competitor_refresh' | 'rank_tracking' | 'ai_citation_check' | 'backlink_refresh'
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
export interface DeploymentOutcomeDTO {
  capturedAt: string
  skipped: boolean
  reason?: string
  before?: { from: string; to: string; clicks: number; impressions: number; ctr: number; position: number }
  after?: { from: string; to: string; clicks: number; impressions: number; ctr: number; position: number }
  delta?: { clicks: number; impressions: number; ctr: number; position: number }
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
  // Outcome-measurement flywheel (SCHEDULER_DESIGN.md §11): populated ~14
  // days after a verified deployment. Absent until then.
  outcome?: DeploymentOutcomeDTO
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

  // team / invitations
  listMembers: (orgId: string) =>
    req<{ org: Org; members: MemberDTO[]; invitations: InvitationDTO[] }>(`/api/org/${orgId}/members`),
  inviteMember: (orgId: string, email: string, role: 'admin' | 'member') =>
    req<{ invitation: InvitationDTO; emailDelivery: string }>(`/api/org/${orgId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  revokeInvitation: (orgId: string, invitationId: string) =>
    req<{ ok: true }>(`/api/org/${orgId}/invitations/${invitationId}`, { method: 'DELETE' }),
  updateMemberRole: (orgId: string, userId: string, role: 'owner' | 'admin' | 'member') =>
    req<{ ok: true }>(`/api/org/${orgId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  removeMember: (orgId: string, userId: string) =>
    req<{ ok: true }>(`/api/org/${orgId}/members/${userId}`, { method: 'DELETE' }),
  previewInvitation: (token: string) =>
    req<{ orgName: string; role: string; email: string }>(`/api/invitations/${token}`),
  acceptInvitation: (token: string) =>
    req<{ org: Org | null }>(`/api/invitations/${token}`, { method: 'POST' }),

  // pilot admin (staff-only; 404s for non-staff)
  adminListOrgs: () => req<{ orgs: AdminOrgDTO[] }>('/api/admin/orgs'),
  adminSetPilot: (orgId: string, pilot: PilotDTO) =>
    req<{ org: { id: string; name: string; pilot: PilotDTO } }>(`/api/admin/orgs/${orgId}/pilot`, {
      method: 'PATCH',
      body: JSON.stringify(pilot),
    }),
  adminListFeedback: () => req<{ feedback: AdminFeedbackDTO[] }>('/api/admin/feedback'),

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
  // Verified Search Console properties for the connected account — used to pick
  // the resourceId override without guessing (a Domain-property guess 403s an
  // account that only has access to the URL-prefix property).
  listGoogleSearchConsoleSites: (projectId: string) =>
    req<{ sites: { siteUrl: string; permissionLevel: string }[]; error?: string }>(
      `/api/projects/${projectId}/integrations/google/sites`
    ),
  // Day-by-day GSC + GA4 trend for the Atlas dashboard's charts.
  getGoogleTrends: (projectId: string) =>
    req<GoogleTrendsDTO>(`/api/projects/${projectId}/analytics/trend`),
  // Device/country (GSC) + traffic-channel (GA4) breakdowns.
  getGoogleBreakdowns: (projectId: string) =>
    req<GoogleBreakdownsDTO>(`/api/projects/${projectId}/analytics/breakdown`),

  // automation / scheduler
  getSchedule: (projectId: string) =>
    req<{ schedules: ScheduleDTO[]; jobs: JobDTO[] }>(`/api/projects/${projectId}/schedule`),
  setSchedule: (projectId: string, frequency: 'daily' | 'weekly', enabled: boolean, kind: ScheduleKind = 'scheduled_scan') =>
    req<{ schedule: ScheduleDTO }>(`/api/projects/${projectId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ frequency, enabled, kind }),
    }),
  clearSchedule: (projectId: string, kind: ScheduleKind = 'scheduled_scan') =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/schedule?kind=${kind}`, { method: 'DELETE' }),

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
    input: {
      postId: number
      postType: string
      title?: string
      metaDescription?: string
      jsonLd?: string
      internalLinks?: { url: string; anchor: string }[]
      reason: string
      recommendationId?: string
    }
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
  // Explicit, one-click install of an SEO plugin when none is detected. An
  // expected, honest failure (e.g. the host blocks direct plugin installs)
  // surfaces as ApiError with the real reason as its message — same pattern
  // as connectWordpress/deployWordpress.
  installWordpressPlugin: (projectId: string, plugin: 'yoast' | 'aioseo') =>
    req<{ ok: true; seoPlugin: 'aioseo' | 'rankmath' | 'yoast' | 'core' }>(
      `/api/projects/${projectId}/wordpress`,
      { method: 'POST', body: JSON.stringify({ action: 'install-plugin', plugin }) }
    ),

  // ── Operator (Phase D) ──
  operatorPreview: (projectId: string, recommendationIds?: string[]) =>
    req<{ previews: OperatorPreviewDTO[]; billing: { allowed: boolean; reason?: string } }>(`/api/projects/${projectId}/operator/preview`, {
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

  // ── Billing (Stripe) ──
  billingStatus: (orgId: string) => req<BillingStatusDTO>(`/api/billing/status?orgId=${encodeURIComponent(orgId)}`),
  billingCheckout: (orgId: string) =>
    req<{ url: string }>('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ orgId }) }),
  billingPortal: (orgId: string) =>
    req<{ url: string }>('/api/billing/portal', { method: 'POST', body: JSON.stringify({ orgId }) }),

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
  refreshCompetitor: (projectId: string, id: string) =>
    req<{ competitor: CompetitorDTO; crawled: boolean; pagesCrawled: number; error?: string }>(`/api/projects/${projectId}/competitors`, {
      method: 'POST',
      body: JSON.stringify({ action: 'refresh', id }),
    }),
  getAtlas: (projectId: string) => req<{ snapshot: AtlasSnapshotDTO }>(`/api/projects/${projectId}/atlas`),

  // ── Rank tracking history ──
  listTrackedKeywords: (projectId: string) =>
    req<{ keywords: TrackedKeywordDTO[] }>(`/api/projects/${projectId}/rankings/keywords`),
  addTrackedKeyword: (projectId: string, keyword: string) =>
    req<{ keyword: TrackedKeywordDTO }>(`/api/projects/${projectId}/rankings/keywords`, {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),
  removeTrackedKeyword: (projectId: string, id: string) =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/rankings/keywords?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  checkTrackedKeywordNow: (projectId: string, keyword: string) =>
    req<{ snapshot: RankSnapshotDTO }>(`/api/projects/${projectId}/rankings/keywords`, {
      method: 'POST',
      body: JSON.stringify({ action: 'check', keyword }),
    }),
  rankingHistory: (projectId: string, keyword?: string) =>
    req<{ snapshots: RankSnapshotDTO[] }>(
      `/api/projects/${projectId}/rankings/history${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`
    ),
  // Free competitor rank comparison — reuses the same SERPAPI_KEY-gated live
  // position checker against tracked competitor domains, for the keywords
  // already tracked for this project. No paid competitor-intel API.
  compareCompetitorRankings: (projectId: string) =>
    req<CompetitorRankComparisonDTO>(`/api/projects/${projectId}/rankings/competitors`),

  // ── AI citation tracking ──
  listTrackedAiQueries: (projectId: string) =>
    req<{ queries: TrackedAiQueryDTO[] }>(`/api/projects/${projectId}/citations/queries`),
  addTrackedAiQuery: (projectId: string, query: string) =>
    req<{ query: TrackedAiQueryDTO }>(`/api/projects/${projectId}/citations/queries`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  removeTrackedAiQuery: (projectId: string, id: string) =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/citations/queries?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  checkTrackedAiQueryNow: (projectId: string, query: string) =>
    req<{ snapshot: AiCitationSnapshotDTO }>(`/api/projects/${projectId}/citations/queries`, {
      method: 'POST',
      body: JSON.stringify({ action: 'check', query }),
    }),
  citationHistory: (projectId: string, query?: string) =>
    req<{ snapshots: AiCitationSnapshotDTO[] }>(
      `/api/projects/${projectId}/citations/history${query ? `?query=${encodeURIComponent(query)}` : ''}`
    ),

  // ── Backlink profile ──
  getBacklinks: (projectId: string) =>
    req<{ configured: boolean; snapshots: BacklinkSnapshotDTO[] }>(`/api/projects/${projectId}/backlinks`),
  checkBacklinksNow: (projectId: string) =>
    req<{ snapshot: BacklinkSnapshotDTO }>(`/api/projects/${projectId}/backlinks`, { method: 'POST' }),

  // ── Content Studio ──
  listContentBriefs: (projectId: string) =>
    req<{ briefs: ContentBriefDTO[] }>(`/api/projects/${projectId}/content`),
  getContentGaps: (projectId: string) =>
    req<{ gaps: ContentGapDTO[] }>(`/api/projects/${projectId}/content?gaps=1`),
  generateContentBrief: (projectId: string, keyword: string) =>
    req<{ brief: ContentBriefDTO }>(`/api/projects/${projectId}/content`, {
      method: 'POST',
      body: JSON.stringify({ action: 'generate', keyword }),
    }),
  publishContentBrief: (projectId: string, id: string, postType: 'posts' | 'pages') =>
    req<{ brief: ContentBriefDTO; verified: boolean; note: string }>(`/api/projects/${projectId}/content`, {
      method: 'POST',
      body: JSON.stringify({ action: 'publish', id, postType }),
    }),
  deleteContentBrief: (projectId: string, id: string) =>
    req<{ ok: boolean }>(`/api/projects/${projectId}/content?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

// ── Content Studio DTOs ──────────────────────────────────────────────────────
export interface ContentGapDTO {
  title: string
  url: string
  competitorDomain: string
}
export interface ContentBriefSerpResultDTO {
  url: string
  title: string
  snippet: string
  position: number
  competitorDomain: string | null
}
export interface ContentBriefDTO {
  id: string
  projectId: string
  keyword: string
  createdBy: string
  createdAt: string
  status: 'draft' | 'published' | 'discarded'
  serpAvailable: boolean
  serpResults: ContentBriefSerpResultDTO[]
  competitorsConsidered: string[]
  title: string
  metaDescription: string
  outline: string[]
  contentHtml: string
  rationale: string
  wpPostId?: number
  wpPostType?: 'posts' | 'pages'
  wpLink?: string
  publishedAt?: string
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
  lastSnapshotAt?: string | null
}
export interface TrackedKeywordDTO {
  id: string
  keyword: string
  createdAt: string
}
export interface RankSnapshotDTO {
  id: string
  keyword: string
  position: number | null
  url: string | null
  checkedAt: string
}
export interface CompetitorRankComparisonDTO {
  available: boolean
  note?: string
  domain?: string
  keywordsCompared?: number
  keywordsTotal?: number
  competitorsCompared?: number
  competitorsTotal?: number
  rows?: { keyword: string; us: number | null; competitors: { label: string; position: number | null }[] }[]
}
export interface TrackedAiQueryDTO {
  id: string
  query: string
  createdAt: string
}
export interface AiCitationSnapshotDTO {
  id: string
  query: string
  engine: 'perplexity'
  available: boolean
  cited: boolean
  position: number | null
  citedUrl: string | null
  sourceCount: number
  message?: string
  checkedAt: string
}
export interface BacklinkSnapshotDTO {
  id: string
  available: boolean
  totalBacklinks: number | null
  referringDomains: number | null
  trustFlow: number | null
  citationFlow: number | null
  message?: string
  checkedAt: string
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

// Day-by-day trend points for the Atlas dashboard's charts.
export interface GscTrendPointDTO { date: string; clicks: number; impressions: number; ctr: number; position: number }
export interface Ga4TrendPointDTO { date: string; sessions: number; engagedSessions: number; conversions: number; revenue: number | null }
export interface GoogleTrendsDTO {
  gsc: { ok: true; points: GscTrendPointDTO[] } | { ok: false; reason: string }
  analytics: { ok: true; points: Ga4TrendPointDTO[] } | { ok: false; reason: string }
}

// Device/country (GSC) + traffic-channel (GA4) breakdowns.
export interface GscBreakdownRowDTO { key: string; clicks: number; impressions: number; ctr: number; position: number }
export interface Ga4ChannelRowDTO { channel: string; sessions: number; engagedSessions: number; conversions: number }
export interface GoogleBreakdownsDTO {
  gscDevice: { ok: true; rows: GscBreakdownRowDTO[] } | { ok: false; reason: string }
  gscCountry: { ok: true; rows: GscBreakdownRowDTO[] } | { ok: false; reason: string }
  ga4Channel: { ok: true; rows: Ga4ChannelRowDTO[] } | { ok: false; reason: string }
}

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
export interface BillingStatusDTO {
  configured: boolean
  priceLabel?: string
  priceCents?: number
  status?: 'trialing' | 'active' | 'past_due' | 'canceled' | null
  trialEndsAt?: string | null
  trialDaysRemaining?: number | null
  hasStripeCustomer?: boolean
}
export interface OperatorMetricsDTO {
  recommendationsTotal: number
  regressedRecommendations: number
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
