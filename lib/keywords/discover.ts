// Automatic on-page keyword discovery — no third-party keyword-research API.
//
// Infers candidate keywords purely from what a page actually says: title, H1,
// H2, body copy, URL slug, and schema.org types. This is deterministic and
// evidence-based (every candidate records which signals produced it and why),
// not a black box. It does NOT estimate real search volume — see
// `estimatedDemand`, which is a relative, content-frequency-based signal and
// must never be presented as a measured metric.

export type KeywordIntent =
  | 'transactional'
  | 'commercial'
  | 'informational'
  | 'local'
  | 'comparison'
  | 'navigational'
  | 'branded'

export type KeywordType = 'primary' | 'secondary' | 'long_tail' | 'question'
export type KeywordSource = 'title' | 'h1' | 'h2' | 'body' | 'url' | 'schema' | 'faq'

export interface DiscoveredKeyword {
  keyword: string
  normalizedKeyword: string
  type: KeywordType
  intent: KeywordIntent
  confidence: number // 0..1
  evidence: string[]
  sources: KeywordSource[]
  /** Relative, content-frequency-based estimate (0..1) — NOT a measured search volume. */
  estimatedDemand: number
}

export interface DiscoverInput {
  title: string
  metaDescription: string
  h1: string[]
  h2: string[]
  bodyText: string
  url: string
  schemaTypes: string[]
  hasFaq: boolean
  /** Known brand/company terms for this project, used to classify branded/navigational intent. */
  brandTerms?: string[]
}

const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','of','to','in','on','at','for','with','by','from','up','about','into',
  'over','after','under','again','further','is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','shall','should','can','could','may','might','must','this','that','these','those','it','its',
  'as','than','so','not','no','yes','you','your','our','we','they','their','i','he','she','him','her','his','my',
  'me','us','them','out','off','all','any','each','few','more','most','other','some','such','only','own','same',
  'too','very','just','also','here','there','when','where','why','how','what','who','which',
])

const GENERIC_SINGLE_WORDS = new Set([
  'home','page','click','here','more','learn','info','information','welcome','site','website','contact','about',
])

const TRANSACTIONAL_PATTERNS = /\b(buy|price|pricing|cost|order|purchase|quote|hire|book|booking|schedule|sign\s?up|get\s?started|discount|coupon|deal|cart|checkout)\b/i
const COMMERCIAL_PATTERNS = /\b(best|top|review|reviews|rated)\b/i
const COMPARISON_PATTERNS = /\b(vs\.?|versus|compare|comparison|alternative|alternatives)\b/i
const LOCAL_PATTERNS = /\bnear\s?me\b/i
const INFORMATIONAL_PATTERNS = /\b(how|what|why|guide|tips|learn|tutorial|examples?)\b/i
const QUESTION_START = /^(who|what|when|where|why|how|is|are|can|does|do|will|should|which)\b/i

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || [])
}

function normalize(phrase: string): string {
  return tokenize(phrase).join(' ')
}

function isMeaningfulPhrase(tokens: string[]): boolean {
  if (tokens.length === 0) return false
  if (LOCAL_PATTERNS.test(tokens.join(' '))) return true // e.g. "near me" — keep despite trailing pronoun
  if (tokens.length === 1) return !STOPWORDS.has(tokens[0]) && !GENERIC_SINGLE_WORDS.has(tokens[0]) && tokens[0].length > 2
  if (tokens.every((t) => STOPWORDS.has(t))) return false
  if (STOPWORDS.has(tokens[0]) || STOPWORDS.has(tokens[tokens.length - 1])) return false
  return true
}

/** Generates 2..maxLen word n-grams from a token stream, skipping ones that start/end on a stopword. */
function ngrams(tokens: string[], maxLen = 5): string[] {
  const out: string[] = []
  for (let len = 2; len <= maxLen; len++) {
    for (let i = 0; i + len <= tokens.length; i++) {
      const slice = tokens.slice(i, i + len)
      if (isMeaningfulPhrase(slice)) out.push(slice.join(' '))
    }
  }
  return out
}

function classifyIntent(phrase: string, brandTerms: string[]): KeywordIntent {
  const lower = phrase.toLowerCase()
  if (brandTerms.some((b) => b && lower.includes(b.toLowerCase()))) return 'branded'
  if (LOCAL_PATTERNS.test(lower)) return 'local'
  if (TRANSACTIONAL_PATTERNS.test(lower)) return 'transactional'
  if (COMPARISON_PATTERNS.test(lower)) return 'comparison'
  if (COMMERCIAL_PATTERNS.test(lower)) return 'commercial'
  if (INFORMATIONAL_PATTERNS.test(lower) || QUESTION_START.test(lower)) return 'informational'
  return 'informational'
}

function urlSlugPhrase(url: string): string {
  try {
    const { pathname } = new URL(url)
    return pathname.replace(/\.[a-z0-9]+$/i, '').replace(/[-_/]+/g, ' ').trim()
  } catch {
    return ''
  }
}

function extractQuestions(h2: string[], bodyText: string, hasFaq: boolean): string[] {
  const candidates = new Set<string>()
  for (const h of h2) {
    const t = h.trim()
    if (t.endsWith('?') || QUESTION_START.test(t)) candidates.add(t.replace(/\s+/g, ' '))
  }
  if (hasFaq) {
    // Pull short question-like sentences out of body copy near FAQ content.
    const sentences = bodyText.split(/(?<=[.?!])\s+/).slice(0, 400)
    for (const s of sentences) {
      const t = s.trim()
      if (t.length > 8 && t.length < 140 && (t.endsWith('?') || QUESTION_START.test(t))) candidates.add(t)
      if (candidates.size >= 8) break
    }
  }
  return [...candidates].slice(0, 8)
}

export function discoverKeywords(input: DiscoverInput): DiscoveredKeyword[] {
  const brandTerms = input.brandTerms ?? []
  const titleTokens = tokenize(input.title)
  const h1Tokens = input.h1.flatMap(tokenize)
  const h2Tokens = input.h2.flatMap(tokenize)
  const bodyTokens = tokenize(input.bodyText).slice(0, 3000)
  const urlTokens = tokenize(urlSlugPhrase(input.url))

  type Scored = { phrase: string; score: number; sources: Set<KeywordSource>; evidence: Set<string> }
  const scored = new Map<string, Scored>()

  // Favor more complete, specific phrases over short generic fragments —
  // "book a plumber online" carries the actual intent; "plumber online" alone
  // does not, even though both are substrings of the same title.
  const lengthWeight = (wordCount: number) => 1 + Math.max(0, wordCount - 2) * 0.18

  const bump = (phrase: string, amount: number, source: KeywordSource, evidence: string) => {
    const norm = normalize(phrase)
    const tokens = norm.split(' ').filter(Boolean)
    if (!norm || !isMeaningfulPhrase(tokens)) return
    const cur = scored.get(norm) ?? { phrase: norm, score: 0, sources: new Set(), evidence: new Set() }
    cur.score += amount * lengthWeight(tokens.length)
    cur.sources.add(source)
    cur.evidence.add(evidence)
    scored.set(norm, cur)
  }

  for (const g of ngrams(titleTokens, 5)) bump(g, 0.4, 'title', 'appears in title')
  for (const h of input.h1) for (const g of ngrams(tokenize(h), 5)) bump(g, 0.3, 'h1', 'appears in H1')
  for (const h of input.h2) for (const g of ngrams(tokenize(h), 4)) bump(g, 0.15, 'h2', 'appears in H2')
  for (const g of ngrams(urlTokens, 4)) bump(g, 0.15, 'url', 'appears in URL')
  for (const s of input.schemaTypes) bump(s.replace(/([a-z])([A-Z])/g, '$1 $2'), 0.1, 'schema', `page declares ${s} schema`)

  // Body frequency, capped so long pages don't dominate purely on volume.
  const bodyPhraseCounts = new Map<string, number>()
  for (const g of ngrams(bodyTokens, 4)) bodyPhraseCounts.set(g, (bodyPhraseCounts.get(g) ?? 0) + 1)
  const maxBodyCount = Math.max(1, ...bodyPhraseCounts.values())
  for (const [phrase, count] of bodyPhraseCounts) {
    // Ignore one-off phrases from body text as too noisy — except intent-bearing
    // phrases like "near me" or "get a quote", which are meaningful even once.
    const isIntentSignal = LOCAL_PATTERNS.test(phrase) || TRANSACTIONAL_PATTERNS.test(phrase)
    if (count < 2 && !isIntentSignal) continue
    const frequencyScore = Math.min(0.25, (count / maxBodyCount) * 0.25)
    bump(phrase, isIntentSignal ? Math.max(frequencyScore, 0.2) : frequencyScore, 'body', `occurs ${count}x in page copy`)
  }

  const h1PhraseSet = new Set(h1Tokens.length ? [normalize(input.h1[0] ?? '')] : [])
  const titleNorm = normalize(input.title)

  const ranked = [...scored.values()]
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const tokenOverlap = (a: string, b: string): number => {
    const ta = new Set(a.split(' ')); const tb = new Set(b.split(' '))
    const inter = [...ta].filter((t) => tb.has(t)).length
    return inter / Math.min(ta.size, tb.size)
  }

  const results: DiscoveredKeyword[] = []
  const usedNorms = new Set<string>()

  // Primary: best title-or-h1-anchored candidate.
  const primaryCandidate =
    ranked.find((s) => s.sources.has('title') && s.phrase === titleNorm) ??
    ranked.find((s) => s.sources.has('title')) ??
    ranked.find((s) => s.sources.has('h1')) ??
    ranked[0]

  if (primaryCandidate) {
    results.push({
      keyword: primaryCandidate.phrase,
      normalizedKeyword: primaryCandidate.phrase,
      type: 'primary',
      intent: classifyIntent(primaryCandidate.phrase, brandTerms),
      confidence: Math.min(0.98, 0.55 + primaryCandidate.score),
      evidence: [...primaryCandidate.evidence],
      sources: [...primaryCandidate.sources],
      estimatedDemand: Math.min(1, primaryCandidate.score),
    })
    usedNorms.add(primaryCandidate.phrase)
  }

  // Secondary: next-best candidates that aren't near-duplicates of primary OR
  // of a candidate already selected — without this, n-gram scoring floods the
  // list with overlapping fragments of the same phrase ("plumbing repair",
  // "repair in austin", "repair in austin fast") and crowds out distinct
  // intent signals like "near me".
  let nonPrimaryCount = 0
  for (const s of ranked) {
    if (nonPrimaryCount >= 8) break
    if (usedNorms.has(s.phrase)) continue
    if (primaryCandidate && tokenOverlap(s.phrase, primaryCandidate.phrase) >= 0.6) continue
    if ([...usedNorms].some((u) => tokenOverlap(s.phrase, u) >= 0.6)) continue
    if (s.score < 0.12) continue
    results.push({
      keyword: s.phrase,
      normalizedKeyword: s.phrase,
      type: s.phrase.split(' ').length >= 4 ? 'long_tail' : 'secondary',
      intent: classifyIntent(s.phrase, brandTerms),
      confidence: Math.min(0.9, 0.35 + s.score),
      evidence: [...s.evidence],
      sources: [...s.sources],
      estimatedDemand: Math.min(1, s.score),
    })
    usedNorms.add(s.phrase)
    nonPrimaryCount++
  }

  // Questions, from H2s and FAQ-flagged body content.
  for (const q of extractQuestions(input.h2, input.bodyText, input.hasFaq)) {
    const norm = normalize(q)
    if (!norm || usedNorms.has(norm)) continue
    results.push({
      keyword: q,
      normalizedKeyword: norm,
      type: 'question',
      intent: 'informational',
      confidence: 0.6,
      evidence: [input.hasFaq ? 'from FAQ content' : 'from H2 heading'],
      sources: [input.hasFaq ? 'faq' : 'h2'],
      estimatedDemand: 0.3,
    })
    usedNorms.add(norm)
    if (results.filter((r) => r.type === 'question').length >= 5) break
  }

  return results.slice(0, 20)
}

export interface CannibalizationWarning {
  normalizedKeyword: string
  urls: string[]
}

/**
 * Flags cases where more than one page in the same project claims the same
 * primary keyword — the "multiple pages targeting identical intent without
 * justification" case the spec asks to prevent.
 */
export function detectCannibalization(
  pages: { url: string; primaryKeyword: string | null }[]
): CannibalizationWarning[] {
  const byKeyword = new Map<string, Set<string>>()
  for (const p of pages) {
    if (!p.primaryKeyword) continue
    const norm = normalize(p.primaryKeyword)
    if (!norm) continue
    const set = byKeyword.get(norm) ?? new Set<string>()
    set.add(p.url)
    byKeyword.set(norm, set)
  }
  return [...byKeyword.entries()]
    .filter(([, urls]) => urls.size > 1)
    .map(([normalizedKeyword, urls]) => ({ normalizedKeyword, urls: [...urls] }))
}
