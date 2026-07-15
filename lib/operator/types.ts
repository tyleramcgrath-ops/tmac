export type FocusWindow = '15m' | '30m' | '1h' | 'half-day' | 'full-day'

export const FOCUS_MINUTES: Record<FocusWindow, number> = {
  '15m': 15,
  '30m': 30,
  '1h': 60,
  'half-day': 240,
  'full-day': 480,
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
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'ignored'
  | 'deferred'
  | 'completed'
  | 'expired'
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
}

export interface FocusPlan {
  window: FocusWindow
  windowMinutes: number
  scheduledMinutes: number
  items: OperatorRecommendation[]
  refusedItems: Array<{ item: OperatorRecommendation; reason: string }>
  narrative: string
}
