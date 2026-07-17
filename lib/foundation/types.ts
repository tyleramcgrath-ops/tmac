// Foundation entity types — the persistent core of RankForge.
// Phase A4/A6/A8: users, organizations, projects, scans, recommendations,
// WordPress connections and auditable deployments.

export type Role = 'owner' | 'admin' | 'member'

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
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
  createdAt: string
  updatedAt: string
}

// A persisted crawl/audit run. `pages` is the full crawl payload; `summary`
// carries the headline numbers so lists don't need the whole blob.
export interface Scan {
  id: string
  projectId: string
  createdBy: string
  createdAt: string
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

export type RecommendationStatus = 'open' | 'accepted' | 'dismissed' | 'deployed'

// Every recommendation must answer: Why? Evidence? Confidence? Impact? Risk?
export interface Recommendation {
  id: string
  projectId: string
  scanId: string
  title: string
  category: string
  severity: 'critical' | 'warning' | 'info'
  status: RecommendationStatus
  // Why this matters — plain-language reasoning, stored, not regenerated.
  reasoning: string
  // Verifiable facts this rests on: which URLs, which measured signals.
  evidence: { affectedUrls: string[]; facts: string[] }
  // 0-100. Deterministic: rule certainty × observed prevalence. The formula
  // is stored with the number so it is auditable, never a magic constant.
  confidence: number
  confidenceBasis: string
  // Which score category improves and qualitative size. No invented dollars.
  expectedImpact: { category: string; size: 'high' | 'medium' | 'low'; note: string }
  risk: { level: 'low' | 'medium' | 'high'; note: string }
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
