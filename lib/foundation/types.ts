// Foundation entity types — the persistent core of RankForge.
// Phase A4/A6/A8: users, organizations, projects, scans, recommendations,
// WordPress connections and auditable deployments.

export type Role = 'owner' | 'admin' | 'member'

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  // Session generation counter (Phase D.6 P6). Every issued session token
  // embeds the tokenVersion current at issue time; bumping it invalidates ALL
  // of the user's existing sessions at once (logout-everywhere / revoke on
  // password change / compromise). Absent = 0 for pre-migration users.
  tokenVersion?: number
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  createdAt: string
}

export interface OrgMember {
  orgId: string
  userId: string
  role: Role
  createdAt: string
}

export interface Project {
  id: string
  orgId: string
  domain: string
  name: string
  industry: string
  businessProfile: string
  goals: string[]
  notes: string
  // Operator automation policy (Phase D). Stored as JSONB; optional.
  operatorPolicy?: unknown
  createdAt: string
  updatedAt: string
}

// A persisted crawl/audit run. `pages` is the full crawl payload; `summary`
// carries the headline numbers so lists don't need the whole blob.
export type ScanStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled'

export interface Scan {
  id: string
  projectId: string
  createdBy: string
  createdAt: string
  status: ScanStatus
  startedAt: string | null
  completedAt: string | null
  error: string | null
  summary: {
    pagesCrawled: number
    urlsDiscovered: number
    blockedCount: number
    siteScore: number
    critical: number
    warning: number
    info: number
  }
  pages: unknown[]
  blocked: unknown[]
}

export type RecommendationStatus =
  | 'open'
  | 'accepted'
  | 'modified'
  | 'rejected'
  | 'deployed'
  | 'verified'
  | 'rolled_back'
  | 'dismissed'

// Full explainability (Phase C §9): every recommendation answers these.
export interface RecommendationExplanation {
  why: string
  whyNow: string
  whyThisPage: string
  whatIfIgnored: string
  whatCouldMakeWrong: string
}

// Every recommendation must answer: Why? Evidence? Confidence? Impact? Risk?
export interface Recommendation {
  id: string
  projectId: string
  scanId: string
  // Stable cross-scan identity (Phase D.6 P1). Deterministic from the rule +
  // logical target, so re-scans UPSERT onto the same issue instead of minting a
  // new UUID and orphaning the human's prior triage/history. `id` stays the
  // per-project row key; `issueId` is what survives across scans.
  issueId: string
  // ── First-class rule identity (Phase D.6 P2) ──────────────────────────────
  // Typed, never parsed from display text. The operator, learning loop,
  // recommendation engine, and verification engine all consume THESE fields;
  // `title`/`reasoning` are presentation-only. ruleVersion lets a rule evolve
  // (change its logic/thresholds) while keeping a stable, comparable identity.
  ruleId: string
  ruleVersion: number
  ruleCategory: string
  ruleSeverity: 'critical' | 'warning' | 'info'
  // The business weighting bucket this page fell into ('money-page' |
  // 'standard' | 'utility' | 'site'); typed, drives priority/impact framing.
  businessContext: string
  title: string
  category: string
  severity: 'critical' | 'warning' | 'info'
  status: RecommendationStatus
  // Page type this applies to (Phase C page intelligence); 'site' for
  // cross-page recommendations.
  pageType?: string
  // Deterministic priority rank (1 = do first) and its numeric score.
  priorityRank?: number
  priorityScore?: number
  // Google guidance reference where applicable.
  googleGuidance?: string
  // Structured explainability (Phase C §9).
  explanation?: RecommendationExplanation
  // Whether the engine thinks a human should review before acting.
  needsHumanReview?: boolean
  // Why this matters — plain-language reasoning, stored, not regenerated.
  reasoning: string
  // Verifiable facts this rests on: which URLs, which measured signals, and
  // the specific on-page elements supporting the finding.
  evidence: { affectedUrls: string[]; facts: string[]; supportingElements?: string[] }
  // 0-100. Deterministic: rule certainty × observed prevalence. The formula
  // is stored with the number so it is auditable, never a magic constant.
  confidence: number
  confidenceBasis: string
  // Which score category improves and qualitative size. No invented dollars.
  expectedImpact: { category: string; size: 'high' | 'medium' | 'low'; note: string }
  risk: { level: 'low' | 'medium' | 'high'; note: string }
  // Multi-agent coordination (Phase F): which agents analyzed/challenged this,
  // the consensus verdict, surfaced disagreements, and the provenance chain.
  // Optional + computed each scan; stored so the UI can show traceable
  // ownership without recomputing. Kept as `unknown` at the type boundary to
  // avoid a types.ts → agents/ import cycle (agents/ imports types).
  coordination?: unknown
  createdAt: string
  history: { at: string; by: string; from: RecommendationStatus; to: RecommendationStatus }[]
}

export interface WpConnection {
  id: string
  projectId: string
  siteUrl: string
  username: string
  // AES-256-GCM encrypted application password. Never returned to clients.
  appPasswordEnc: string
  aioseo: boolean
  createdBy: string
  createdAt: string
}

export type DeploymentStatus =
  | 'applied'
  | 'verified'
  | 'verify_failed'
  | 'failed'
  | 'rolled_back'

// Durable execution record (A6). Every WordPress change stores before,
// after, who approved, when, why, verification, and rollback data — server
// side, surviving browser close / session expiry / device change.
export interface WpDeployment {
  id: string
  projectId: string
  connectionId: string
  postId: number
  postType: 'posts' | 'pages'
  postUrl: string
  before: { title: string; metaDescription: string; contentHash: string; content: string }
  after: { title?: string; metaDescription?: string }
  approvedBy: string
  approvedAt: string
  reason: string
  recommendationId?: string
  status: DeploymentStatus
  verification: { checkedAt: string; titleMatches: boolean | null; metaMatches: boolean | null; note: string } | null
  result: string
  rolledBackAt?: string
  rolledBackBy?: string
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  orgId: string
  actorId: string
  action: string
  target: string
  detail: string
  at: string
}
