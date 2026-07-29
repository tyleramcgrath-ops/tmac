// buildScores produces the headline number the whole report hangs off. Its
// stated rule is at the top of the module: when the underlying data is
// unavailable the score is a neutral 50 and the explanation says so — "no fake
// precision". These tests hold every sub-score to that rule, and pin the
// arithmetic so a weight change cannot silently move every customer's score.

import { describe, expect, it } from 'vitest'
import { buildScores } from '../lib/engine/scoring'
import type {
  BacklinkData, BacklinkProfile, ContentGap, PageAnalysis, PageExtraction, PageSpeedMetrics, TechnicalIssue,
} from '../lib/engine/types'

function extraction(over: Partial<PageExtraction> = {}): PageExtraction {
  return {
    url: 'https://acme.com/p', finalUrl: 'https://acme.com/p', status: 200, redirectChain: [], crawlError: null,
    title: 'Roof Repair', titleLength: 11, metaDescription: 'Repair', metaDescriptionLength: 6,
    canonical: null, metaRobots: null, indexable: true, https: true, mixedContent: false, lang: 'en',
    h1: ['Roof Repair'], headings: [], h2Count: 0, h3Count: 0,
    wordCount: 800, contentText: 'roof repair', firstWords: 'roof repair',
    images: { count: 0, withAlt: 0, missingAlt: 0, altSample: [] },
    links: { internal: 5, external: 2, internalSample: [], externalSample: [], brokenSample: [] },
    schema: [], schemaTypes: [], openGraph: {}, twitterCard: {},
    hasFaqSection: false, faqQuestions: [], hasTableOfContents: false,
    author: null, publishedDate: null, modifiedDate: null,
    hasContactForm: false, ctaCount: 0, ctaSample: [],
    ...over,
  }
}

function analysis(over: Partial<PageAnalysis> = {}, pageOver: Partial<PageExtraction> = {}): PageAnalysis {
  return {
    isUser: true, position: 5, serp: null,
    page: extraction(pageOver),
    keywords: {
      usage: {
        inTitle: true, inMetaDescription: true, inH1: true, inFirst100Words: true,
        inH2s: true, inUrl: true, inImageAlt: false, occurrences: 8, density: 1,
      },
      topTerms: [], topPhrases: [],
    },
    pageSpeed: null,
    ...over,
  }
}

function gap(over: Partial<ContentGap> = {}): ContentGap {
  return {
    missingTerms: [], missingPhrases: [], missingQuestions: [], missingHeadingTopics: [],
    recommendedWordCountMin: 800, recommendedWordCountMax: 1200,
    competitorMedianWordCount: 900, contentGapScore: 30,
    ...over,
  }
}

function profile(target: string, referringDomains: number): BacklinkProfile {
  return {
    target, backlinks: referringDomains * 3, referringDomains, domainRank: 40,
    urlRank: 20, spamScore: 1, topAnchors: [], error: null,
  }
}

function psi(over: Partial<PageSpeedMetrics> = {}): PageSpeedMetrics {
  return {
    url: 'https://acme.com/p', strategy: 'mobile', performance: 80, accessibility: null,
    bestPractices: null, seo: null, lcpMs: 2000, cls: null, inpMs: null, fcpMs: null,
    ...over,
  } as PageSpeedMetrics
}

function score(over: Partial<Parameters<typeof buildScores>[0]> = {}) {
  return buildScores({
    user: analysis(), competitors: [], contentGap: gap(), schemaGap: null,
    technicalIssues: [], backlinks: null, serp: null, keyword: 'roof repair',
    ...over,
  })
}

describe('every score stays inside 0-100', () => {
  it('clamps a pile of critical technical issues at zero rather than going negative', () => {
    const issues: TechnicalIssue[] = Array.from({ length: 12 }, (_, i) => (
      { id: `t${i}`, severity: 'critical' } as TechnicalIssue
    ))
    expect(score({ technicalIssues: issues }).technical.score).toBe(0)
  })

  it('clamps a perfect page at 100', () => {
    const all = score({
      user: analysis({ pageSpeed: psi({ performance: 100 }) }, {
        schemaTypes: ['Article', 'FAQPage', 'Organization', 'BreadcrumbList'],
        hasFaqSection: true, author: 'Jane', publishedDate: '2026-01-01',
        headings: [{ level: 2, text: 'What does it cost?' }] as PageExtraction['headings'],
        hasTableOfContents: true, wordCount: 2000,
      }),
      contentGap: gap({ contentGapScore: 0 }),
    })
    for (const key of ['content', 'technical', 'schema', 'speed', 'intent', 'aiReadiness'] as const) {
      expect(all[key].score).toBeLessThanOrEqual(100)
      expect(all[key].score).toBeGreaterThanOrEqual(0)
    }
    expect(all.aiReadiness.score).toBe(100)
  })
})

describe('a failed crawl scores zero and says why — it never scores well by default', () => {
  const dead = analysis({ page: { ...extraction(), crawlError: 'timeout' }, keywords: null })

  it('zeroes content, technical, intent and AI readiness', () => {
    const s = score({ user: dead })
    expect(s.content.score).toBe(0)
    expect(s.technical.score).toBe(0)
    expect(s.intent.score).toBe(0)
    expect(s.content.explanation).toMatch(/could not be crawled/i)
  })

  it('zeroes schema and AI readiness when there is no page at all', () => {
    const s = score({ user: analysis({ page: null, keywords: null }) })
    expect(s.schema.score).toBe(0)
    expect(s.aiReadiness.score).toBe(0)
  })
})

describe('unavailable data scores a neutral 50 and admits it', () => {
  it('does that for authority when no backlink API is connected', () => {
    const s = score({ backlinks: null })
    expect(s.authority.score).toBe(50)
    expect(s.authority.explanation).toMatch(/does not reflect real data/i)
  })

  it('does that for authority when there are not enough profiles to compare', () => {
    const backlinks: BacklinkData = {
      available: true, provider: 'x', message: null,
      profiles: [profile('acme.com', 100)],
    }
    expect(score({ backlinks }).authority.score).toBe(50)
  })

  it('does that for page speed when PageSpeed returned nothing', () => {
    const s = score({ user: analysis({ pageSpeed: null }) })
    expect(s.speed.score).toBe(50)
    expect(s.speed.explanation).toMatch(/does not reflect real data/i)
  })

  it('does NOT treat a real performance score of 0 as missing data', () => {
    expect(score({ user: analysis({ pageSpeed: psi({ performance: 0 }) }) }).speed.score).toBe(0)
  })

  it('does that for content when no competitor could be compared against', () => {
    // A scan where every competitor failed to crawl leaves the gap at its
    // empty defaults. Scoring those as "0 terms missing, median 0 words" turns
    // an absent comparison into a clean bill of health.
    const s = score({ contentGap: null })
    expect(s.content.score).toBe(50)
    expect(s.content.explanation).not.toMatch(/median of 0/)
    expect(s.content.explanation).toMatch(/unavailable|could not|no competitor/i)
  })

  it('does that when the gap exists but no competitor page was actually crawled', () => {
    const s = score({ contentGap: gap({ competitorMedianWordCount: 0, contentGapScore: 0 }) })
    expect(s.content.score).toBe(50)
    expect(s.content.explanation).not.toMatch(/median of 0/)
  })

  it('still scores content normally when there is a real comparison', () => {
    const s = score({ contentGap: gap({ competitorMedianWordCount: 900, contentGapScore: 30 }) })
    expect(s.content.score).toBe(70)
    expect(s.content.explanation).toMatch(/900/)
  })
})

describe('the overall score weights the parts, and de-weights unknown authority', () => {
  it('flags in the explanation that authority data is missing', () => {
    expect(score({ backlinks: null }).overall.explanation).toMatch(/Authority data unavailable/)
  })

  it('does not add that caveat when authority is real', () => {
    const backlinks: BacklinkData = {
      available: true, provider: 'x', message: null,
      profiles: [profile('acme.com', 100), profile('rival.com', 100)],
    }
    expect(score({ backlinks }).overall.explanation).not.toMatch(/Authority data unavailable/)
  })

  it('averages the parts by weight', () => {
    // content 70 ×25, technical 100 ×20, schema 20 ×10, authority 50 ×5,
    // speed 50 ×10, intent 100 ×15, aiReadiness 20 ×10 over a total of 95.
    const s = score()
    const parts: [number, number][] = [
      [s.content.score, 25], [s.technical.score, 20], [s.schema.score, 10],
      [s.authority.score, 5], [s.speed.score, 10], [s.intent.score, 15], [s.aiReadiness.score, 10],
    ]
    const expected = Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / 95)
    expect(s.overall.score).toBe(expected)
  })

  it('describes the tier it actually landed in', () => {
    expect(score({ technicalIssues: [] }).overall.explanation).toMatch(/competitive|gaps|substantial work/)
  })
})

describe('sub-scores read the real signals', () => {
  it('deducts per technical issue by severity', () => {
    const issues = [
      { id: 'a', severity: 'critical' }, { id: 'b', severity: 'warning' }, { id: 'c', severity: 'info' },
    ] as TechnicalIssue[]
    expect(score({ technicalIssues: issues }).technical.score).toBe(100 - 25 - 8 - 3)
    expect(score({ technicalIssues: [] }).technical.explanation).toMatch(/No technical issues/)
  })

  it('scores a page with no structured data far below one that has it', () => {
    const none = score().schema.score
    const some = score({ user: analysis({}, { schemaTypes: ['Article', 'FAQPage'] }) }).schema.score
    expect(none).toBe(20)
    expect(some).toBeGreaterThan(none)
  })

  it('names exactly which placements the keyword is missing from', () => {
    const user = analysis()
    user.keywords!.usage.inTitle = false
    user.keywords!.usage.inH1 = false
    const s = score({ user })
    expect(s.intent.explanation).toMatch(/missing from: title, H1/)
    expect(s.intent.score).toBe(100 - 25 - 20)
  })

  it('says the keyword is well-placed when nothing is missing', () => {
    expect(score().intent.explanation).toMatch(/well-placed/)
  })
})
