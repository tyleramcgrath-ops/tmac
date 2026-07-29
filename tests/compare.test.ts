// Content gap, schema gap and the technical audit. buildContentGap decides
// which terms, phrases and questions a page is "missing" — those become the
// recommendations a customer acts on, and contentGapScore is the single input
// to the content sub-score, the heaviest weight in the headline number.

import { describe, expect, it } from 'vitest'
import { buildContentGap, buildSchemaGap, buildTechnicalIssues } from '../lib/engine/compare'
import type { PageAnalysis, PageExtraction, SchemaItem, SerpData } from '../lib/engine/types'

function schemaItem(type: string, errors: string[] = []): SchemaItem {
  return { type, raw: { '@type': type }, source: 'json-ld', errors }
}

function extraction(over: Partial<PageExtraction> = {}): PageExtraction {
  return {
    url: 'https://acme.com/p', finalUrl: 'https://acme.com/p', status: 200, redirectChain: [], crawlError: null,
    title: 'Roof Repair in Denver, Colorado — Acme', titleLength: 42,
    metaDescription: 'Fast roof repair in Denver.', metaDescriptionLength: 27,
    canonical: 'https://acme.com/p', metaRobots: null, indexable: true, https: true, mixedContent: false, lang: 'en',
    h1: ['Roof Repair'], headings: [], h2Count: 0, h3Count: 0,
    wordCount: 900, contentText: 'roof repair in denver', firstWords: 'roof repair in denver',
    images: { count: 2, withAlt: 2, missingAlt: 0, altSample: [] },
    links: { internal: 4, external: 1, internalSample: [], externalSample: [], brokenSample: [] },
    schema: [schemaItem('Article')],
    schemaTypes: ['Article'], openGraph: {}, twitterCard: {},
    hasFaqSection: false, faqQuestions: [], hasTableOfContents: false,
    author: null, publishedDate: null, modifiedDate: null,
    hasContactForm: false, ctaCount: 0, ctaSample: [],
    ...over,
  }
}

function analysis(pageOver: Partial<PageExtraction> = {}, over: Partial<PageAnalysis> = {}): PageAnalysis {
  return {
    isUser: false, position: 1, serp: null,
    page: extraction(pageOver),
    keywords: { usage: {} as never, topTerms: [], topPhrases: [] },
    pageSpeed: null,
    ...over,
  }
}

// A competitor whose crawled text and extracted terms/phrases are controlled.
function competitor(text: string, terms: string[] = [], phrases: string[] = [], over: Partial<PageExtraction> = {}): PageAnalysis {
  const a = analysis({ contentText: text, wordCount: 1000, ...over })
  a.keywords = {
    usage: {} as never,
    topTerms: terms.map((term) => ({ term, count: 5 })),
    topPhrases: phrases.map((term) => ({ term, count: 5 })),
  }
  return a
}

describe('buildContentGap: what the page is genuinely missing', () => {
  it('reports a term several competitors use that the page does not', () => {
    const user = analysis({ contentText: 'roof repair in denver' })
    const gap = buildContentGap(user, [
      competitor('shingles matter', ['shingles']),
      competitor('shingles again', ['shingles']),
    ], null, 'roof repair')
    expect(gap.missingTerms.map((t) => t.term)).toContain('shingles')
  })

  it('does not report a term the page already uses', () => {
    const user = analysis({ contentText: 'roof repair and shingles in denver' })
    const gap = buildContentGap(user, [
      competitor('shingles matter', ['shingles']),
      competitor('shingles again', ['shingles']),
    ], null, 'roof repair')
    expect(gap.missingTerms.map((t) => t.term)).not.toContain('shingles')
  })

  it('does not call a phrase missing when the page uses it with punctuation between the words', () => {
    // Competitor phrases arrive tokenized and single-spaced. Testing them as a
    // raw substring of the user's text means "roof, repair" or "roof.\nRepair"
    // reads as absent, and the customer is told to add copy already on the page.
    const user = analysis({ contentText: 'We do emergency roof, repair work. Roof   repair is our trade.' })
    const gap = buildContentGap(user, [
      competitor('a', [], ['roof repair']),
      competitor('b', [], ['roof repair']),
      competitor('c', [], ['roof repair']),
    ], null, 'roof repair')
    expect(gap.missingPhrases.map((p) => p.term)).not.toContain('roof repair')
  })

  it('still reports a phrase the page genuinely does not use', () => {
    const user = analysis({ contentText: 'we do gutters only' })
    const gap = buildContentGap(user, [
      competitor('a', [], ['roof repair']),
      competitor('b', [], ['roof repair']),
      competitor('c', [], ['roof repair']),
    ], null, 'roof repair')
    expect(gap.missingPhrases.map((p) => p.term)).toContain('roof repair')
  })

  it('does not treat a question as answered because its words appear inside longer words', () => {
    // "cost" inside "costume", "roof" inside "roofing" — substring matching
    // marks the question answered and the real gap is never surfaced.
    const serp = { peopleAlsoAsk: ['How long does a roof last?'] } as SerpData
    // Every meaningful word of the question appears only INSIDE a longer,
    // unrelated word. Substring matching scores that 4/4 and calls the
    // question answered, so the real content gap is never reported.
    const user = analysis({ contentText: "our longboard doesn't include roofing lasting straps" })
    const gap = buildContentGap(user, [], serp, 'roof repair')
    expect(gap.missingQuestions).toContain('How long does a roof last?')
  })

  it('treats a question as answered when the page really does answer it', () => {
    const serp = { peopleAlsoAsk: ['What does a roof cost to replace?'] } as SerpData
    const user = analysis({ contentText: 'what does a roof cost to replace? about $9,000.' })
    const gap = buildContentGap(user, [], serp, 'roof repair')
    expect(gap.missingQuestions).not.toContain('What does a roof cost to replace?')
  })

  it('treats a question as answered when it matches an FAQ entry regardless of wording order', () => {
    const serp = { peopleAlsoAsk: ['Does a roof repair need permits?'] } as SerpData
    const user = analysis({ contentText: 'unrelated copy', faqQuestions: ['Roof repair: does it need permits?'] })
    const gap = buildContentGap(user, [], serp, 'roof repair')
    expect(gap.missingQuestions).not.toContain('Does a roof repair need permits?')
  })

  it('reports a competitor median of 0 when nothing could be crawled', () => {
    const gap = buildContentGap(analysis(), [], null, 'roof repair')
    expect(gap.competitorMedianWordCount).toBe(0)
    expect(gap.missingTerms).toEqual([])
  })

  it('scores a page with no crawl as a total gap', () => {
    const gap = buildContentGap({ ...analysis(), page: null }, [], null, 'roof repair')
    expect(gap.contentGapScore).toBe(100)
  })

  it('keeps contentGapScore inside 0-100', () => {
    const comps = Array.from({ length: 5 }, (_, i) =>
      competitor(`c${i}`, ['a', 'b', 'c', 'd', 'e'], ['x y', 'y z'], { wordCount: 5000 }))
    const gap = buildContentGap(analysis({ wordCount: 10, contentText: 'tiny' }), comps, null, 'k')
    expect(gap.contentGapScore).toBeGreaterThanOrEqual(0)
    expect(gap.contentGapScore).toBeLessThanOrEqual(100)
  })
})

describe('buildSchemaGap', () => {
  it('reports a type at least two competitors use that the page lacks', () => {
    const gap = buildSchemaGap(
      analysis({ schemaTypes: ['Article'] }),
      [analysis({ schemaTypes: ['FAQPage'] }), analysis({ schemaTypes: ['FAQPage'] })],
      'roof repair',
    )
    expect(gap.missingTypes).toContain('FAQPage')
    expect(gap.userTypes).toEqual(['Article'])
  })

  it('does not report a type only one competitor uses', () => {
    const gap = buildSchemaGap(analysis({ schemaTypes: [] }), [analysis({ schemaTypes: ['HowTo'] })], 'k')
    expect(gap.missingTypes).toEqual([])
  })

  it('does not report a type the page already has', () => {
    const gap = buildSchemaGap(
      analysis({ schemaTypes: ['FAQPage'] }),
      [analysis({ schemaTypes: ['FAQPage'] }), analysis({ schemaTypes: ['FAQPage'] })],
      'k',
    )
    expect(gap.missingTypes).toEqual([])
  })

  it('emits valid JSON-LD templates for the missing types', () => {
    const gap = buildSchemaGap(
      analysis({ schemaTypes: [] }),
      [analysis({ schemaTypes: ['BreadcrumbList'] }), analysis({ schemaTypes: ['BreadcrumbList'] })],
      'roof repair',
    )
    expect(gap.suggestedJsonLd).toHaveLength(1)
    expect(gap.suggestedJsonLd[0]['@type']).toBe('BreadcrumbList')
    expect(() => JSON.stringify(gap.suggestedJsonLd)).not.toThrow()
  })

  it('collects validation errors from the page and its competitors', () => {
    const bad = analysis({ schema: [schemaItem('Article', ['missing headline'])] })
    const gap = buildSchemaGap(bad, [], 'k')
    expect(gap.invalidSchemas).toHaveLength(1)
    expect(gap.invalidSchemas[0].errors).toEqual(['missing headline'])
  })

  it('handles a page that could not be crawled', () => {
    const gap = buildSchemaGap({ ...analysis(), page: null }, [], 'k')
    expect(gap.userTypes).toEqual([])
    expect(gap.invalidSchemas).toEqual([])
  })
})

describe('buildTechnicalIssues', () => {
  function ids(page: Partial<PageExtraction>, keyword = 'roof repair') {
    return buildTechnicalIssues(analysis(page), keyword).map((i) => i.id)
  }

  it('reports nothing on a healthy page', () => {
    expect(ids({})).toEqual([])
  })

  it('reports only the crawl failure when the page could not be read', () => {
    const out = buildTechnicalIssues({ ...analysis(), page: null }, 'k')
    expect(out.map((i) => i.id)).toEqual(['crawl-failed'])
    expect(out[0].severity).toBe('critical')
  })

  it('flags the critical blockers', () => {
    expect(ids({ status: 404 })).toContain('http-status')
    expect(ids({ https: false })).toContain('https')
    expect(ids({ indexable: false })).toContain('noindex')
    expect(ids({ wordCount: 120 })).toContain('thin-content')
  })

  it('flags a missing title but not also its length', () => {
    const out = ids({ title: null, titleLength: 0 })
    expect(out).toContain('missing-title')
    expect(out).not.toContain('short-title')
    expect(out).not.toContain('long-title')
  })

  it('flags an over-long and an over-short title separately', () => {
    expect(ids({ title: 'x'.repeat(80), titleLength: 80 })).toContain('long-title')
    expect(ids({ title: 'Roof Repair', titleLength: 11 })).toContain('short-title')
  })

  it('flags missing and duplicate H1s', () => {
    expect(ids({ h1: [] })).toContain('missing-h1')
    expect(ids({ h1: ['Roof Repair', 'Roof Repair Denver'] })).toContain('duplicate-h1')
  })

  it('flags a redirect chain only once it is two hops or more', () => {
    expect(ids({ redirectChain: [{ url: 'a', status: 301 }] })).not.toContain('redirect-chain')
    expect(ids({ redirectChain: [{ url: 'a', status: 301 }, { url: 'b', status: 301 }] })).toContain('redirect-chain')
  })

  it('flags the keyword missing from title, H1 and opening copy', () => {
    const out = ids({ title: 'Gutters', h1: ['Gutters'], firstWords: 'gutters only' })
    expect(out).toContain('kw-title')
    expect(out).toContain('kw-h1')
    expect(out).toContain('kw-intro')
  })

  it('does not flag the keyword when it is present', () => {
    const out = ids({})
    expect(out).not.toContain('kw-title')
    expect(out).not.toContain('kw-h1')
  })

  it('flags images missing alt text and absent structured data', () => {
    expect(ids({ images: { count: 5, withAlt: 2, missingAlt: 3, altSample: [] } })).toContain('missing-alt')
    expect(ids({ schema: [], schemaTypes: [] })).toContain('no-schema')
  })

  it('gives every issue a stable id, a severity and a human detail', () => {
    for (const issue of buildTechnicalIssues(analysis({ status: 500, https: false, h1: [] }), 'k')) {
      expect(issue.id).toBeTruthy()
      expect(['critical', 'warning', 'info']).toContain(issue.severity)
      expect(issue.detail.length).toBeGreaterThan(0)
    }
  })
})
