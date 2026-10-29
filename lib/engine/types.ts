// ─── Report lifecycle ────────────────────────────────────────────────────────

export type ReportStatus = 'queued' | 'running' | 'complete' | 'failed'

export const PIPELINE_STEPS = [
  { id: 'serp', label: 'Fetching Google results' },
  { id: 'crawl', label: 'Crawling competitor pages' },
  { id: 'extract', label: 'Extracting SEO data' },
  { id: 'pagespeed', label: 'Running page speed checks' },
  { id: 'schema', label: 'Checking schema markup' },
  { id: 'backlinks', label: 'Comparing backlinks' },
  { id: 'ai', label: 'Generating recommendations' },
  { id: 'report', label: 'Building final report' },
] as const

export type PipelineStepId = (typeof PIPELINE_STEPS)[number]['id']
export type StepState = 'pending' | 'running' | 'done' | 'error' | 'skipped'

export interface StepProgress {
  id: PipelineStepId
  state: StepState
  detail?: string
}

// ─── Report inputs ───────────────────────────────────────────────────────────

export interface ReportInput {
  url: string
  keyword: string
  country: string // gl code, e.g. "us"
  device: 'desktop' | 'mobile'
  language?: string // hl code, e.g. "en"
}

// ─── SERP data ───────────────────────────────────────────────────────────────

export interface SerpResult {
  position: number
  url: string
  domain: string
  title: string
  snippet: string
  displayedUrl: string
  richSnippet?: Record<string, unknown>
  isFeaturedSnippet?: boolean
}

export interface SerpData {
  provider: string
  query: string
  country: string
  device: string
  language?: string
  fetchedAt: string
  results: SerpResult[]
  featuredSnippet?: { title?: string; snippet?: string; url?: string }
  peopleAlsoAsk: string[]
  relatedSearches: string[]
}

// ─── Crawl / extraction ──────────────────────────────────────────────────────

export interface RedirectHop {
  url: string
  status: number
}

export interface CrawlResult {
  url: string
  finalUrl: string
  status: number
  redirectChain: RedirectHop[]
  html: string | null
  contentType: string | null
  fetchMs: number
  error: string | null
}

export interface HeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
}

export interface SchemaItem {
  type: string
  raw: Record<string, unknown>
  source: 'json-ld' | 'microdata'
  errors: string[]
}

export interface LinkInfo {
  internal: number
  external: number
  internalSample: string[]
  externalSample: string[]
  brokenSample: string[]
}

export interface ImageInfo {
  count: number
  withAlt: number
  missingAlt: number
  altSample: string[]
}

export interface PageExtraction {
  url: string
  finalUrl: string
  status: number
  redirectChain: RedirectHop[]
  crawlError: string | null

  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  canonical: string | null
  metaRobots: string | null
  indexable: boolean
  https: boolean
  mixedContent: boolean
  lang: string | null

  h1: string[]
  headings: HeadingNode[]
  h2Count: number
  h3Count: number

  wordCount: number
  contentText: string // truncated main text used for analysis
  firstWords: string // first ~100 words

  images: ImageInfo
  links: LinkInfo

  schema: SchemaItem[]
  schemaTypes: string[]

  openGraph: Record<string, string>
  twitterCard: Record<string, string>

  hasFaqSection: boolean
  faqQuestions: string[]
  hasTableOfContents: boolean
  author: string | null
  publishedDate: string | null
  modifiedDate: string | null
  hasContactForm: boolean
  ctaCount: number
  ctaSample: string[]
}

// ─── Keyword analysis ────────────────────────────────────────────────────────

export interface KeywordUsage {
  inTitle: boolean
  inMetaDescription: boolean
  inH1: boolean
  inFirst100Words: boolean
  inH2s: boolean
  inUrl: boolean
  inImageAlt: boolean
  occurrences: number
  density: number // percentage of words
}

export interface TermFrequency {
  term: string
  count: number
}

export interface KeywordAnalysis {
  usage: KeywordUsage
  topTerms: TermFrequency[]
  topPhrases: TermFrequency[]
}

// ─── PageSpeed ───────────────────────────────────────────────────────────────

export interface PageSpeedMetrics {
  url: string
  strategy: 'desktop' | 'mobile'
  performance: number | null
  accessibility: number | null
  bestPractices: number | null
  seo: number | null
  lcpMs: number | null
  cls: number | null
  inpMs: number | null
  fcpMs: number | null
  speedIndexMs: number | null
  opportunities: { title: string; savingsMs: number | null }[]
  error: string | null
}

// ─── Backlinks ───────────────────────────────────────────────────────────────

export interface BacklinkProfile {
  target: string
  backlinks: number | null
  referringDomains: number | null
  domainRank: number | null
  urlRank: number | null
  spamScore: number | null
  topAnchors: { anchor: string; count: number }[]
  error: string | null
}

export interface BacklinkData {
  available: boolean
  provider: string | null
  message: string | null
  profiles: BacklinkProfile[] // index 0 = user page, then competitors
}

// ─── Per-page analysis bundle ───────────────────────────────────────────────

export interface PageAnalysis {
  isUser: boolean
  position: number | null // SERP position; null for user page when not ranking
  serp: SerpResult | null
  page: PageExtraction | null
  keywords: KeywordAnalysis | null
  pageSpeed: PageSpeedMetrics | null
}

// ─── Comparison / gaps ───────────────────────────────────────────────────────

export interface ContentGap {
  missingTerms: TermFrequency[] // common competitor terms absent from user page
  missingPhrases: TermFrequency[]
  missingQuestions: string[] // PAA + competitor FAQ questions not answered
  missingHeadingTopics: string[] // competitor H2/H3 topics user lacks
  recommendedWordCountMin: number
  recommendedWordCountMax: number
  competitorMedianWordCount: number
  contentGapScore: number // 0–100, higher = bigger gap
}

export interface SchemaGap {
  userTypes: string[]
  competitorTypeCounts: { type: string; count: number }[]
  missingTypes: string[]
  invalidSchemas: { url: string; type: string; errors: string[] }[]
  suggestedJsonLd: Record<string, unknown>[]
}

export interface TechnicalIssue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  issue: string
  detail: string
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export interface ScoreEntry {
  key: string
  label: string
  score: number // 0–100
  explanation: string
}

export interface Scores {
  overall: ScoreEntry
  content: ScoreEntry
  technical: ScoreEntry
  schema: ScoreEntry
  authority: ScoreEntry
  speed: ScoreEntry
  intent: ScoreEntry
  aiReadiness: ScoreEntry
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export type RecommendationCategory =
  | 'critical'
  | 'high-impact'
  | 'content'
  | 'technical'
  | 'schema'
  | 'backlinks'
  | 'speed'
  | 'ai-geo'

export interface Recommendation {
  category: RecommendationCategory
  issue: string
  why: string
  fix: string
  impact: 'High' | 'Medium' | 'Low'
  difficulty: 'Easy' | 'Medium' | 'Hard'
  priority: number // 1 = do first
}

export interface AiInsights {
  generatedBy: string | null // model name, or null when rule-based fallback
  executiveSummary: string
  suggestedTitles: string[]
  suggestedMetaDescriptions: string[]
  recommendedHeadingOutline: string[]
  suggestedContentSections: string[]
  faqSuggestions: string[]
  aiSearchRecommendations: string[]
  shortAnswerBlock: string | null
}

// ─── Full report ─────────────────────────────────────────────────────────────

export interface ReportResults {
  serp: SerpData | null
  userAnalysis: PageAnalysis | null
  competitors: PageAnalysis[]
  contentGap: ContentGap | null
  schemaGap: SchemaGap | null
  technicalIssues: TechnicalIssue[]
  backlinks: BacklinkData | null
  scores: Scores | null
  recommendations: Recommendation[]
  ai: AiInsights | null
  warnings: string[] // data-availability notes surfaced to the user
}

export interface Report {
  id: string
  input: ReportInput
  status: ReportStatus
  steps: StepProgress[]
  error: string | null
  createdAt: string
  completedAt: string | null
  overallScore: number | null
  results: ReportResults | null
}

export interface ReportSummary {
  id: string
  input: ReportInput
  status: ReportStatus
  createdAt: string
  overallScore: number | null
}
