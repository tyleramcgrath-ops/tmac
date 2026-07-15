export type FocusWindow = '15m' | '30m' | '1h' | '2h' | 'half-day' | 'full-day'

export const FOCUS_MINUTES: Record<FocusWindow, number> = {
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '2h': 120,
  'half-day': 240,
  'full-day': 480,
}

/// Minimum estimated minutes considered realistic for common action types.
/// Prevents assigning a full rewrite as a 15-minute mission.
export const MIN_MINUTES_FOR_ACTION: Record<string, number> = {
  full_content_rewrite: 120,
  page_migration: 90,
  redirect_and_merge: 60,
  money_page_reinforcement: 45,
  refresh_content: 45,
  repair_topic_cluster: 45,
  add_missing_entities: 30,
  add_faq_schema: 20,
  add_internal_links: 10,
  fix_homepage_typo: 5,
}

export type RecommendationSource =
  | 'money_page_intelligence'
  | 'decision_engine'
  | 'graph_orphan'
  | 'graph_missing_schema'
  | 'graph_missing_entity'
  | 'graph_broken_cluster'
  | 'graph_internal_link'
  | 'competitor_signal'
  | 'seasonal_playbook'

export type MemoryStatus =
  | 'new'
  | 'recommended'
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'ignored'
  | 'deferred'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'verified'
  | 'failed'
  | 'rolled_back'
  | 'expired'
  | 'superseded'
  | 'blocked'

export interface Candidate {
  id: string // stable per (pageUrl, recommendationType)
  pageUrl: string
  recommendationType: string
  source: RecommendationSource
  estimatedMinutes: number
  rawScore: number // 0-100 pre-judgment
  confidence: number // 0-1
  evidence: EvidenceItem[]
  metadata: Record<string, unknown>
}

export interface EvidenceItem {
  label: string
  detail?: unknown
  source: string
}

export interface JudgmentBoost {
  reason: string
  delta: number // added to rawScore; may be negative
}

export interface OperatorRecommendation {
  id: string
  pageUrl: string
  recommendationType: string
  source: RecommendationSource
  headline: string
  reasoning: {
    whyNow: string
    whyThisPage: string
    whyNotAnother: string
    whyThisBeforeOther: string
    graphEvidence: EvidenceItem[]
    businessObjective: string | null
    ignoreConsequence: string
    judgmentBoosts: JudgmentBoost[]
  }
  expectedBusinessReturn: string
  estimatedMinutes: number
  risk: 'low' | 'medium' | 'high'
  confidence: number
  status: MemoryStatus
  memoryId?: string
}

export interface OperatorReadout {
  generatedAt: string
  projectId: string
  primaryRecommendation: OperatorRecommendation | null
  alternatives: OperatorRecommendation[]
  narrative: string // The Operator's opening line
  dataAvailability: {
    hasGraph: boolean
    hasDecisionEngine: boolean
    hasBusinessProfile: boolean
    hasSeasonality: boolean
  }
  /// Phase 8.1A — the structured shortlist. The frontend renders these
  /// four sections; the flat `alternatives` array above is a compatibility
  /// shim for existing callers.
  shortlist?: OperatorShortlist
}

export interface OperatorShortlist {
  primaryMission: OperatorRecommendation | null
  nextBestActions: OperatorRecommendation[]     // ≤ 3
  watchList: OperatorRecommendation[]           // ≤ 3
  deferredOpportunities: OperatorRecommendation[] // ≤ 3
  criticalAlerts: OperatorRecommendation[]      // only when truly critical
  suppressed: Array<{ item: OperatorRecommendation; reason: string }>
}

/// Persisted, normalized candidate row shape (client-side mirror of the
/// OperatorCandidate Prisma model). Kept isomorphic so both the pipeline and
/// the UI can share a type.
export interface PersistedCandidate {
  id: string
  organizationId: string
  projectId: string
  sourceSystem: string
  sourceRecordId: string | null
  category: string
  actionType: string
  primaryPageUrl: string
  affectedPageUrls: string[]
  businessObjective: string | null
  moneyPageUrl: string | null
  evidence: unknown
  decisionScores: unknown
  estimatedMinutes: number
  timeToWin: string | null
  risk: 'low' | 'medium' | 'high'
  confidence: number
  dependencies: string[]
  deploymentCapability: string | null
  dedupeKey: string
  consolidatedFrom: string[]
  supersedesId: string | null
  supersededById: string | null
  status: string
  createdAt: string
  lastRecalculatedAt: string
  expiresAt: string | null
  headline: string | null
  reasoning: unknown
}

export interface OperatorPlanStep {
  order: number
  label: string
  estimatedMinutes: number
  owner: 'user' | 'operator' | 'system'
  dependencyStep?: number
  risk: 'low' | 'medium' | 'high'
  deploymentMethod: 'wordpress' | 'custom_html' | 'manual' | 'none'
  verificationMethod: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export interface FocusPlan {
  window: FocusWindow
  windowMinutes: number
  scheduledMinutes: number
  items: OperatorRecommendation[]
  refusedItems: Array<{ item: OperatorRecommendation; reason: string }>
  narrative: string
}
