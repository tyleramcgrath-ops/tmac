// AI-citation tracking — is the brand cited when people ask AI answer engines?
// The GEO/AEO wedge: traditional SEO tracks blue-link rank; this tracks whether
// ChatGPT / Perplexity / Gemini / Google AI Overviews cite you.

export type AiEngine = 'perplexity' | 'chatgpt' | 'gemini' | 'google-aio'

export const AI_ENGINE_LABELS: Record<AiEngine, string> = {
  perplexity: 'Perplexity',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  'google-aio': 'Google AI Overviews',
}

/** The result of asking one engine one question. */
export interface CitationResult {
  engine: AiEngine
  query: string
  available: boolean // false = provider not configured (honest, never faked)
  cited: boolean // was the brand domain among the answer's sources?
  position: number | null // 1-based index within the answer's citation list
  citedUrl: string | null // the specific brand URL cited, if any
  sourceCount: number // how many sources the answer used
  checkedAt: string
  message?: string // set when unavailable / errored
}

/** One dated measurement across all engines/queries for a site. */
export interface CitationSnapshot {
  id: string
  siteId: string
  brandDomain: string
  takenAt: string
  results: CitationResult[]
  // aggregates over the *available* results only:
  queriesChecked: number
  queriesCited: number
  citationShare: number // 0..1 = cited / available
  byEngine: { engine: AiEngine; checked: number; cited: number; share: number }[]
}

export interface CitationDelta {
  metric: 'citationShare' | 'engineShare'
  engine?: AiEngine
  label: string
  before: number
  after: number
  change: number
  good: boolean
  takenAt: string
}
