// Pure logic for turning per-page discovered keywords into the set of
// project-level Keyword records to upsert. Kept separate from the Prisma call
// site so the merge/cannibalization logic is unit-testable without a database.

import { detectCannibalization, type DiscoveredKeyword } from './discover'

export interface KeywordUpsertRecord {
  normalizedKeyword: string
  keyword: string
  type: string
  intent: string
  confidence: number
  estimatedDemand: number | null
  evidence: string[]
  sources: string[]
  targetPageUrl: string | null
  cannibalized: boolean
}

const TYPE_PRIORITY: Record<string, number> = { primary: 3, secondary: 2, long_tail: 2, question: 1 }

/**
 * Merges discovered keywords across every crawled page in a project into one
 * record per normalized keyword, preferring the page where it scored highest
 * (primary beats secondary beats question), and flags any normalized keyword
 * claimed as the *primary* keyword on more than one page as cannibalized.
 */
export function buildKeywordUpserts(pages: { url: string; keywords: DiscoveredKeyword[] }[]): KeywordUpsertRecord[] {
  const best = new Map<string, { url: string; kw: DiscoveredKeyword }>()
  for (const page of pages) {
    for (const kw of page.keywords) {
      const cur = best.get(kw.normalizedKeyword)
      if (!cur) {
        best.set(kw.normalizedKeyword, { url: page.url, kw })
        continue
      }
      const curPriority = TYPE_PRIORITY[cur.kw.type] ?? 0
      const newPriority = TYPE_PRIORITY[kw.type] ?? 0
      if (newPriority > curPriority || (newPriority === curPriority && kw.confidence > cur.kw.confidence)) {
        best.set(kw.normalizedKeyword, { url: page.url, kw })
      }
    }
  }

  const cannibalPages = pages.map((p) => ({
    url: p.url,
    primaryKeyword: p.keywords.find((k) => k.type === 'primary')?.normalizedKeyword ?? null,
  }))
  const cannibalizedKeywords = new Set(detectCannibalization(cannibalPages).map((w) => w.normalizedKeyword))

  return [...best.entries()].map(([normalizedKeyword, { url, kw }]) => ({
    normalizedKeyword,
    keyword: kw.keyword,
    type: kw.type,
    intent: kw.intent,
    confidence: kw.confidence,
    estimatedDemand: kw.estimatedDemand,
    evidence: kw.evidence,
    sources: kw.sources,
    targetPageUrl: url,
    cannibalized: cannibalizedKeywords.has(normalizedKeyword),
  }))
}
