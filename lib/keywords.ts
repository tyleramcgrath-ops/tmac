import type { KeywordAnalysis, KeywordUsage, PageExtraction, TermFrequency } from './types'

// Keyword usage + term-frequency analysis. Everything here is deterministic
// and computed from the actual crawled text — no AI involvement.

const STOPWORDS = new Set(
  `a about above after again against all am an and any are as at be because been before being below
   between both but by can cannot could did do does doing down during each few for from further had has
   have having he her here hers herself him himself his how i if in into is it its itself just me more
   most my myself no nor not now of off on once only or other our ours ourselves out over own same she
   should so some such than that the their theirs them themselves then there these they this those through
   to too under until up very was we were what when where which while who whom why will with you your
   yours yourself yourselves get also one two like may make use using used new way ll re ve don s t d m`
    .split(/\s+/)
    .filter(Boolean)
)

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? []).map((w) => w.replace(/^'+|'+$/g, ''))
}

function contentWords(text: string): string[] {
  return tokenize(text).filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
}

export function countOccurrences(text: string, keyword: string): number {
  const haystack = ` ${tokenize(text).join(' ')} `
  const needle = ` ${tokenize(keyword).join(' ')} `
  if (needle.trim() === '') return 0
  let count = 0
  let idx = haystack.indexOf(needle)
  while (idx !== -1) {
    count++
    idx = haystack.indexOf(needle, idx + 1)
  }
  return count
}

export function includesKeyword(text: string | null | undefined, keyword: string): boolean {
  if (!text) return false
  return countOccurrences(text, keyword) > 0
}

/** Top single-word terms by frequency, stopwords removed. */
export function topTerms(text: string, limit = 30): TermFrequency[] {
  const counts = new Map<string, number>()
  for (const word of contentWords(text)) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }))
}

/** Top 2–3 word phrases by frequency (phrases of meaningful words). */
export function topPhrases(text: string, limit = 20): TermFrequency[] {
  const words = tokenize(text)
  const counts = new Map<string, number>()
  for (const n of [2, 3]) {
    for (let i = 0; i + n <= words.length; i++) {
      const gram = words.slice(i, i + n)
      // skip n-grams that start/end with stopwords or contain only stopwords
      if (STOPWORDS.has(gram[0]) || STOPWORDS.has(gram[n - 1])) continue
      if (gram.every((w) => w.length <= 2)) continue
      const phrase = gram.join(' ')
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }))
}

export function analyzeKeywords(page: PageExtraction, keyword: string): KeywordAnalysis {
  const occurrences = countOccurrences(page.contentText, keyword)
  const totalWords = Math.max(page.wordCount, 1)
  const keywordWordLen = tokenize(keyword).length || 1

  const usage: KeywordUsage = {
    inTitle: includesKeyword(page.title, keyword),
    inMetaDescription: includesKeyword(page.metaDescription, keyword),
    inH1: page.h1.some((h) => includesKeyword(h, keyword)),
    inFirst100Words: includesKeyword(page.firstWords, keyword),
    inH2s: page.headings.some((h) => h.level === 2 && includesKeyword(h.text, keyword)),
    inUrl: includesKeyword(decodeURIComponent(page.finalUrl).replace(/[-_/.]/g, ' '), keyword),
    inImageAlt: page.images.altSample.some((alt) => includesKeyword(alt, keyword)),
    occurrences,
    density: Number((((occurrences * keywordWordLen) / totalWords) * 100).toFixed(2)),
  }

  return {
    usage,
    topTerms: topTerms(page.contentText),
    topPhrases: topPhrases(page.contentText),
  }
}
