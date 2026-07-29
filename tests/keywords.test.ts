// Deterministic keyword usage and term-frequency analysis over the crawled
// text. Its output feeds scoreIntent directly, so an over- or under-count here
// moves a customer's SERP Intent Match score.

import { describe, expect, it } from 'vitest'
import {
  analyzeKeywords, countOccurrences, includesKeyword, tokenize, topPhrases, topTerms,
} from '../lib/engine/keywords'
import type { PageExtraction } from '../lib/engine/types'

function page(over: Partial<PageExtraction> = {}): PageExtraction {
  return {
    url: 'https://acme.com/roof-repair', finalUrl: 'https://acme.com/roof-repair',
    status: 200, redirectChain: [], crawlError: null,
    title: 'Roof Repair in Denver', titleLength: 21,
    metaDescription: 'Fast roof repair', metaDescriptionLength: 16,
    canonical: null, metaRobots: null, indexable: true, https: true, mixedContent: false, lang: 'en',
    h1: ['Roof Repair'], headings: [{ level: 2, text: 'Emergency roof repair' }],
    h2Count: 1, h3Count: 0,
    wordCount: 100, contentText: 'roof repair is what we do', firstWords: 'roof repair is what we do',
    images: { count: 1, withAlt: 1, missingAlt: 0, altSample: ['a roof repair crew'] },
    links: { internal: 0, external: 0, internalSample: [], externalSample: [], brokenSample: [] },
    schema: [], schemaTypes: [], openGraph: {}, twitterCard: {},
    hasFaqSection: false, faqQuestions: [], hasTableOfContents: false,
    author: null, publishedDate: null, modifiedDate: null,
    hasContactForm: false, ctaCount: 0, ctaSample: [],
    ...over,
  }
}

describe('tokenize', () => {
  it('lowercases and keeps only word-ish tokens', () => {
    expect(tokenize('Roof Repair, Denver!')).toEqual(['roof', 'repair', 'denver'])
  })

  it('keeps internal hyphens and apostrophes but strips wrapping quotes', () => {
    expect(tokenize("state-of-the-art 'roofing'")).toEqual(['state-of-the-art', 'roofing'])
  })

  it('returns nothing for text with no word characters', () => {
    expect(tokenize('!!! ??? ---')).toEqual([])
    expect(tokenize('')).toEqual([])
  })
})

describe('countOccurrences', () => {
  it('counts a single-word keyword every time it appears', () => {
    expect(countOccurrences('seo seo and more seo', 'seo')).toBe(3)
  })

  it('counts back-to-back phrase occurrences that share a word boundary', () => {
    expect(countOccurrences('roof repair roof repair', 'roof repair')).toBe(2)
  })

  it('matches on whole words only, never inside a longer one', () => {
    expect(countOccurrences('roofing roofer roofs', 'roof')).toBe(0)
  })

  it('ignores punctuation and casing between the words of a phrase', () => {
    expect(countOccurrences('Roof, Repair!', 'roof repair')).toBe(1)
  })

  it('returns zero for an empty keyword rather than matching everything', () => {
    expect(countOccurrences('anything at all', '')).toBe(0)
    expect(countOccurrences('anything at all', '   ')).toBe(0)
  })

  it('returns zero for empty text', () => {
    expect(countOccurrences('', 'roof')).toBe(0)
  })
})

describe('includesKeyword', () => {
  it('is false for null and undefined text rather than throwing', () => {
    expect(includesKeyword(null, 'roof')).toBe(false)
    expect(includesKeyword(undefined, 'roof')).toBe(false)
  })

  it('is true only on a whole-word match', () => {
    expect(includesKeyword('Roof Repair Denver', 'roof repair')).toBe(true)
    expect(includesKeyword('Roofing Denver', 'roof')).toBe(false)
  })
})

describe('topTerms and topPhrases', () => {
  it('drops stopwords and single-occurrence terms', () => {
    const text = 'roof roof repair repair the the and and gutter'
    const terms = topTerms(text).map((t) => t.term)
    expect(terms).toContain('roof')
    expect(terms).toContain('repair')
    expect(terms).not.toContain('the')
    expect(terms).not.toContain('gutter')
  })

  it('orders terms by frequency and honors the limit', () => {
    const text = 'alpha alpha alpha beta beta gamma gamma'
    expect(topTerms(text, 2).map((t) => t.term)).toEqual(['alpha', 'beta'])
  })

  it('requires a phrase to appear at least three times', () => {
    const twice = 'roof repair costs. roof repair costs.'
    expect(topPhrases(twice).map((p) => p.term)).not.toContain('roof repair')
    const thrice = `${twice} roof repair costs.`
    expect(topPhrases(thrice).map((p) => p.term)).toContain('roof repair')
  })

  it('never returns a phrase that starts or ends on a stopword', () => {
    const text = 'the roof and the roof and the roof and the roof and'
    for (const { term } of topPhrases(text)) {
      const words = term.split(' ')
      expect(['the', 'and']).not.toContain(words[0])
      expect(['the', 'and']).not.toContain(words[words.length - 1])
    }
  })
})

describe('analyzeKeywords', () => {
  it('reports where the keyword really appears', () => {
    const { usage } = analyzeKeywords(page(), 'roof repair')
    expect(usage.inTitle).toBe(true)
    expect(usage.inMetaDescription).toBe(true)
    expect(usage.inH1).toBe(true)
    expect(usage.inFirst100Words).toBe(true)
    expect(usage.inH2s).toBe(true)
    expect(usage.inUrl).toBe(true)
    expect(usage.inImageAlt).toBe(true)
  })

  it('reports absence honestly rather than defaulting to present', () => {
    const { usage } = analyzeKeywords(
      page({ title: 'Gutters', metaDescription: 'Gutters', h1: ['Gutters'], headings: [] }),
      'roof repair',
    )
    expect(usage.inTitle).toBe(false)
    expect(usage.inMetaDescription).toBe(false)
    expect(usage.inH1).toBe(false)
    expect(usage.inH2s).toBe(false)
  })

  it('only counts an H2 match, not an H3 one, for inH2s', () => {
    const { usage } = analyzeKeywords(
      page({ headings: [{ level: 3, text: 'Roof repair pricing' }] }),
      'roof repair',
    )
    expect(usage.inH2s).toBe(false)
  })

  it('computes density from the real word count and keyword length', () => {
    const { usage } = analyzeKeywords(
      page({ contentText: 'roof repair here, roof repair there', wordCount: 200 }),
      'roof repair',
    )
    expect(usage.occurrences).toBe(2)
    expect(usage.density).toBe(2) // 2 occurrences x 2 words / 200 words
  })

  it('does not divide by zero on an empty page', () => {
    const { usage } = analyzeKeywords(page({ wordCount: 0, contentText: '' }), 'roof repair')
    expect(usage.density).toBe(0)
    expect(Number.isFinite(usage.density)).toBe(true)
  })

  it('survives a URL containing a literal percent sign', () => {
    // "/save-50%-off" is not valid percent-encoding, and decoding it raw
    // throws URIError — which would abort the analysis of the whole page.
    const p = page({ finalUrl: 'https://acme.com/save-50%-off/roof-repair' })
    expect(() => analyzeKeywords(p, 'roof repair')).not.toThrow()
    expect(analyzeKeywords(p, 'roof repair').usage.inUrl).toBe(true)
  })

  it('still decodes a properly encoded URL so the keyword is found', () => {
    const p = page({ finalUrl: 'https://acme.com/roof%20repair' })
    expect(analyzeKeywords(p, 'roof repair').usage.inUrl).toBe(true)
  })
})
