import { describe, expect, it } from 'vitest'
import { analyzeKeywords, countOccurrences, includesKeyword, topPhrases, topTerms } from '@/lib/keywords'
import { extractPage } from '@/lib/extract'
import type { CrawlResult } from '@/lib/types'

describe('countOccurrences / includesKeyword', () => {
  it('matches multi-word keywords across token boundaries', () => {
    expect(countOccurrences('The best CRM software is the best CRM software.', 'best crm software')).toBe(2)
  })

  it('is case- and punctuation-insensitive', () => {
    expect(includesKeyword('Best CRM, Software!', 'best crm software')).toBe(true)
    expect(includesKeyword('crm best software', 'best crm software')).toBe(false)
  })

  it('handles null/empty text', () => {
    expect(includesKeyword(null, 'x')).toBe(false)
    expect(includesKeyword('', 'x')).toBe(false)
  })
})

describe('topTerms / topPhrases', () => {
  const text = 'pricing pricing pricing integration integration automation the and of ' +
    'sales pipeline sales pipeline sales pipeline tools'

  it('ranks frequent meaningful terms and drops stopwords', () => {
    const terms = topTerms(text)
    expect(terms[0].term).toBe('pricing')
    expect(terms.map((t) => t.term)).not.toContain('the')
  })

  it('finds repeated phrases', () => {
    const phrases = topPhrases(text)
    expect(phrases.some((p) => p.term === 'sales pipeline')).toBe(true)
  })
})

describe('analyzeKeywords', () => {
  const html = `<html><head>
    <title>Best CRM Software 2026</title>
    <meta name="description" content="The best CRM software guide.">
    </head><body><main>
    <h1>Best CRM Software</h1>
    <h2>Best CRM software pricing</h2>
    <p>Looking for the best CRM software? ${'This guide compares vendors and features. '.repeat(20)}</p>
    <img src="x.png" alt="best crm software chart">
    </main></body></html>`
  const crawl: CrawlResult = {
    url: 'https://example.com/best-crm-software',
    finalUrl: 'https://example.com/best-crm-software',
    status: 200,
    redirectChain: [],
    html,
    contentType: 'text/html',
    fetchMs: 1,
    error: null,
  }
  const analysis = analyzeKeywords(extractPage(crawl), 'best crm software')

  it('detects keyword placement across all elements', () => {
    expect(analysis.usage.inTitle).toBe(true)
    expect(analysis.usage.inMetaDescription).toBe(true)
    expect(analysis.usage.inH1).toBe(true)
    expect(analysis.usage.inH2s).toBe(true)
    expect(analysis.usage.inFirst100Words).toBe(true)
    expect(analysis.usage.inUrl).toBe(true)
    expect(analysis.usage.inImageAlt).toBe(true)
  })

  it('computes a sane density', () => {
    expect(analysis.usage.occurrences).toBeGreaterThanOrEqual(1)
    expect(analysis.usage.density).toBeGreaterThan(0)
    expect(analysis.usage.density).toBeLessThan(20)
  })
})
