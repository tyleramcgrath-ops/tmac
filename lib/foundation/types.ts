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
  // Email verification (RC2 P4). Absent/false until the user confirms their
  // address via the emailed link. Non-blocking during the guided pilot — the app
  // works, but an unverified banner is shown and verification is encouraged.
  emailVerified?: boolean
  verifyToken?: string | null
  verifyTokenExpiresAt?: string | null
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  // Pilot administration (RC2 P6). Present for pilot orgs; lets an operator set
  // an expiry and status. When status is 'expired'/'disabled' (or expiresAt has
  // passed) project access is blocked with a clear message.
  pilot?: {
    status: 'active' | 'expired' | 'disabled'
    expiresAt?: string | null
    notes?: string
  }
  createdAt: string
}

// Pilot feedback / issue reports (RC2 P6). Collected in-product so a guided
// pilot's confusion points and bugs are captured with attribution.
export interface PilotFeedback {
  id: string
  orgId: string
  userId: string
  projectId?: string | null
  kind: 'feedback' | 'issue'
  message: string
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
  // A later scan re-detected an issue that was previously confirmed fixed
  // (verified) — something changed the live site back (a theme update, a
  // manual edit, a plugin) without RankForge's involvement. Distinct from
  // 'open' (never dealt with) so the regression is never silently absorbed
  // back into the normal queue.
  | 'regressed'

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
  // User-set priority override (Phase H). When present it wins over the
  // engine's priorityRank for ordering, so a human can force an issue up or
  // down the list. Lower = higher priority. Cleared (undefined) → fall back to
  // the engine rank.
  userPriority?: number
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

// A tracked competitor (Phase G §1). Overlap metrics are computed from real
// crawls when available and graded; never invented. Stored per project.
export interface Competitor {
  id: string
  projectId: string
  domain: string
  label: string
  addedBy: string
  createdAt: string
  // Last computed overlap snapshot (graded Observations); JSONB, optional.
  overlap?: unknown
  // Last external-intelligence snapshot fetched for this competitor; optional.
  lastSnapshotAt?: string | null
  // A small, capped sample of real pages from the last crawl (url + title
  // only) — enough to power content-gap analysis without storing full page
  // bodies. Set alongside `overlap` by the same refresh; never invented.
  snapshotPages?: { url: string; title: string }[]
}

// Rolling baseline for Mission Atlas change detection (Phase G). One row per
// project — the last OBSERVED gsc/backlinks/aiVisibility values, so the next
// Atlas load can report real "what changed since last time" instead of always
// comparing against nothing. `data` is untyped JSONB (PriorSnapshotData);
// only ever written by assembleAtlas's own output, never user input.
export interface AtlasHistory {
  projectId: string
  data: unknown
  capturedAt: string
}

// A generated content brief / draft blog post (Content Studio). Researched from
// real live SERP results (never invented) and drafted by AI from that evidence
// + real tracked-competitor overlap; the draft is never auto-published — it
// only becomes a live WordPress post when a user explicitly deploys it, going
// through the same create-then-verify path as every other WordPress write.
export type ContentBriefStatus = 'draft' | 'published' | 'discarded'
export interface ContentBriefSerpResult {
  url: string
  title: string
  snippet: string
  position: number
  competitorDomain: string | null // set when this result matches a tracked competitor
}
export interface ContentBrief {
  id: string
  projectId: string
  keyword: string
  createdBy: string
  createdAt: string
  status: ContentBriefStatus
  // Research evidence — honestly empty/unavailable when no SERP key is configured.
  serpAvailable: boolean
  serpResults: ContentBriefSerpResult[]
  competitorsConsidered: string[] // tracked competitor domains found in the SERP results
  // The generated draft.
  title: string
  metaDescription: string
  outline: string[]
  contentHtml: string
  rationale: string
  // Set once deployed to WordPress as a real draft post.
  wpPostId?: number
  wpPostType?: 'posts' | 'pages'
  wpLink?: string
  publishedAt?: string
}

// A connected external provider (Phase H). Holds the ENCRYPTED OAuth token
// bundle for a project's Google (or future vendor) integration, keyed by
// (projectId, kind). The secret (access/refresh tokens) lives only inside
// `credentialEnc` (AES-256-GCM, same primitive as WordPress app-passwords) and
// is NEVER returned to clients — routes strip it and return only the safe
// metadata below. There is one row per provider kind so Search Console and
// Analytics connect independently.
export type ExternalProviderKind = 'search-console' | 'analytics'

export interface ProviderConnection {
  projectId: string
  kind: ExternalProviderKind
  // Vendor family — 'google' today; the shape is vendor-neutral for later.
  vendor: 'google'
  // AES-256-GCM encrypted JSON token bundle { accessToken, refreshToken,
  // expiresAt, scope }. Never serialized into an API response or a log.
  credentialEnc: string
  // Safe, non-secret metadata surfaced to the UI.
  accountEmail: string | null
  // GSC site URL ('sc-domain:example.com' or 'https://example.com/') or the
  // GA4 numeric property id, once known/selected. null until resolved.
  resourceId: string | null
  scope: string
  status: 'connected' | 'error'
  detail: string
  connectedBy: string
  createdAt: string
  updatedAt: string
}

// Which SEO plugin manages the site's title/meta storage. Detected at connect
// time from the site's REST namespaces. 'core' = no SEO plugin (meta lives in
// the native excerpt). Meta description is written to the matching plugin field.
export type SeoPlugin = 'aioseo' | 'rankmath' | 'yoast' | 'core'

// ── Scheduler / background jobs ──────────────────────────────────────────────
// A durable job queue (Postgres in prod, file store in dev) drained by a
// cron-triggered runner. See SCHEDULER_DESIGN.md.
export type JobKind = 'scheduled_scan' | 'outcome_capture' | 'monitor'
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

export interface Job {
  id: string
  orgId: string
  projectId: string
  kind: JobKind
  status: JobStatus
  runAt: string // ISO — earliest time this job may run
  payload: Record<string, unknown>
  attempts: number
  maxAttempts: number
  lockedAt: string | null
  lockedBy: string | null
  lastError: string | null
  result: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

// A per-project recurring schedule that materializes Jobs on its cron cadence.
export interface Schedule {
  id: string
  orgId: string
  projectId: string
  kind: JobKind
  cron: string // 5-field cron (min hour dom month dow), UTC
  enabled: boolean
  nextRunAt: string
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WpConnection {
  id: string
  projectId: string
  siteUrl: string
  username: string
  // AES-256-GCM encrypted application password. Never returned to clients.
  appPasswordEnc: string
  // Back-compat: retained for connections created before seoPlugin existed
  // (true ⇒ aioseo). New code should read `seoPlugin` via pluginOf().
  aioseo: boolean
  seoPlugin?: SeoPlugin
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
  after: { title?: string; metaDescription?: string; content?: string }
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
  // Outcome-measurement flywheel (SCHEDULER_DESIGN.md §11): did this fix
  // actually move Search Console metrics for the affected URL? Populated by
  // the `outcome_capture` job ~14 days after a verified deployment. Absent
  // until then; `skipped` (never fabricated) when Search Console isn't
  // connected or the reading failed permanently.
  outcome?: DeploymentOutcome
}

export interface DeploymentOutcomeWindow {
  from: string
  to: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type DeploymentOutcome =
  | {
      capturedAt: string
      skipped: false
      before: DeploymentOutcomeWindow
      after: DeploymentOutcomeWindow
      delta: { clicks: number; impressions: number; ctr: number; position: number }
    }
  | { capturedAt: string; skipped: true; reason: string }

export interface AuditLogEntry {
  id: string
  orgId: string
  actorId: string
  action: string
  target: string
  detail: string
  at: string
}
