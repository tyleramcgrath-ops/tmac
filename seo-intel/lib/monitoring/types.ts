// ─── Monitoring & Business Twin knowledge graph ──────────────────────────────
//
// The persistent layer the North Star "overnight brief" and "Business Twin"
// promise. A MonitoredSite tracks a set of pages; each monitor run re-analyses
// them with the real seo-intel pipeline and records a Snapshot per page. Deltas
// are computed by diffing consecutive snapshots — so "3 things moved while you
// were away" is always backed by real, dated measurements (never fabricated).

import type { ReportInput } from '../types'

/** A single page the site wants watched. */
export interface TrackedPage {
  url: string
  keyword: string
  country: string // gl code, e.g. "us"
  device: 'desktop' | 'mobile'
  language?: string
}

/** The unit of the Business Twin: a company/site and the pages it watches. */
export interface MonitoredSite {
  id: string
  domain: string // canonical host, e.g. "acme.com"
  label: string // human name
  pages: TrackedPage[]
  createdAt: string
  updatedAt: string
  /** Optional connected surfaces (honest: absent = not connected). */
  connections?: {
    gsc?: { connected: boolean; propertyUrl?: string }
    ga4?: { connected: boolean; propertyId?: string }
    wordpress?: { connected: boolean; baseUrl?: string }
    slack?: { connected: boolean; webhookUrl?: string; channel?: string }
    email?: { connected: boolean; address?: string }
  }
}

/** A dated measurement of one page. Scores mirror the engine's 8 dimensions. */
export interface Snapshot {
  id: string
  siteId: string
  url: string
  keyword: string
  takenAt: string
  reportId: string // the underlying Report this came from
  overallScore: number | null
  scores: Record<string, number> // key -> 0..100 (content, technical, schema, …)
  serpPosition: number | null // user page rank in the tracked keyword's top results
  criticalCount: number // number of critical recommendations outstanding
  warnings: string[]
}

export type DeltaDirection = 'up' | 'down' | 'flat'
export type DeltaKind = 'score' | 'position' | 'critical' | 'status'

/** One thing that moved between two snapshots. */
export interface Delta {
  kind: DeltaKind
  metric: string // e.g. "schema", "serpPosition", "critical"
  label: string // human label, e.g. "Schema score"
  url: string
  before: number | null
  after: number | null
  change: number // after - before (position: negative = improved rank)
  direction: DeltaDirection
  good: boolean // whether the move is favorable
  takenAt: string
}

/** One monitor cycle across all tracked pages of a site. */
export interface MonitorRun {
  id: string
  siteId: string
  ranAt: string
  pageCount: number
  snapshotIds: string[]
  deltas: Delta[]
  siteScoreBefore: number | null
  siteScoreAfter: number | null
  error?: string
}

// ─── "While you were away" brief ─────────────────────────────────────────────

export interface BriefItem {
  headline: string // "Schema score rose 12 pts on /pricing"
  detail: string
  url: string
  direction: DeltaDirection
  good: boolean
  metric: string
}

export interface WhileYouWereAwayBrief {
  siteId: string
  generatedAt: string
  since: string | null // ranAt of the previous run compared against
  movedCount: number
  nothingChanged: boolean
  headline: string
  siteScore: number | null
  siteScoreChange: number | null
  items: BriefItem[] // the top movements, most significant first
}

export function trackedPageToInput(p: TrackedPage): ReportInput {
  return { url: p.url, keyword: p.keyword, country: p.country, device: p.device, language: p.language }
}

// ─── Agentic fix loop — proposals the Compass can apply on approval ───────────

export type ProposalStatus = 'proposed' | 'approved' | 'applied' | 'partial' | 'rejected' | 'failed'

/** One concrete edit the Compass proposes. `auto` = can be published via API. */
export interface ProposedChange {
  field: 'title' | 'metaDescription' | 'shortAnswer' | 'faq' | 'schema'
  label: string
  before: string | null
  after: string
  rationale: string
  auto: boolean // false = manual paste (e.g. AIOSEO meta, JSON-LD)
  applied?: boolean
  resultMessage?: string
}

export interface ChangeProposal {
  id: string
  siteId: string
  url: string
  reportId: string
  createdAt: string
  status: ProposalStatus
  changes: ProposedChange[]
  appliedAt?: string
}
