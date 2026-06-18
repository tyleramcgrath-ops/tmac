import { describe, expect, it } from 'vitest'
import { buildContentGap, buildSchemaGap, buildTechnicalIssues } from '@/lib/compare'
import { buildScores } from '@/lib/scoring'
import { buildRecommendations } from '@/lib/recommendations'
import { extractPage } from '@/lib/extract'
import { analyzeKeywords } from '@/lib/keywords'
import type { CrawlResult, PageAnalysis, SerpData } from '@/lib/types'

const KEYWORD = 'best crm software'

function makePage(html: string, url: string): CrawlResult {
  return { url, finalUrl: url, status: 200, redirectChain: [], html, contentType: 'text/html', fetchMs: 1, error: null }
}

function analysisFrom(html: string, url: string, isUser: boolean, position: number | null): PageAnalysis {
  const page = extractPage(makePage(html, url))
  return {
    isUser,
    position,
    serp: position
      ? { position, url, domain: new URL(url).hostname, title: 't', snippet: '', displayedUrl: url }
      : null,
    page,
    keywords: analyzeKeywords(page, KEYWORD),
    pageSpeed: null,
  }
}

const richCompetitorHtml = (n: number) => `<html><head>
  <title>Best CRM Software ${n}</title>
  <meta name="description" content="best crm software comparison">
  <script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is CRM pricing?"}]}</script>
  </head><body><main>
  <h1>Best CRM Software</h1>
  <h2>Pricing plans compared</h2>
  <h2>Integrations and automation</h2>
  <p>${'pricing integrations automation onboarding migration support workflow analytics reporting dashboards '.repeat(80)}</p>
  </main></body></html>`

const thinUserHtml = `<html><head><title>CRM page</title></head>
  <body><main><h1>Our CRM</h1><p>We sell a crm. It is nice. Contact us for info.</p></main></body></html>`

const user = analysisFrom(thinUserHtml, 'https://mysite.com/crm', true, null)
const competitors = [1, 2, 3].map((n) => analysisFrom(richCompetitorHtml(n), `https://comp${n}.com/best-crm`, false, n))

const serp: SerpData = {
  provider: 'serpapi', query: KEYWORD, country: 'us', device: 'desktop', fetchedAt: new Date().toISOString(),
  results: competitors.map((c) => c.serp!),
  peopleAlsoAsk: ['How much does a CRM cost?'],
  relatedSearches: [],
}

describe('buildContentGap', () => {
  const gap = buildContentGap(user, competitors, serp, KEYWORD)

  it('produces a 0-100 gap score that reflects a thin page', () => {
    expect(gap.contentGapScore).toBeGreaterThanOrEqual(40)
    expect(gap.contentGapScore).toBeLessThanOrEqual(100)
  })

  it('recommends a word count derived from competitor median', () => {
    expect(gap.competitorMedianWordCount).toBeGreaterThan(500)
    expect(gap.recommendedWordCountMin).toBeGreaterThanOrEqual(300)
    expect(gap.recommendedWordCountMax).toBeGreaterThan(gap.recommendedWordCountMin)
  })

  it('finds missing terms used by multiple competitors', () => {
    expect(gap.missingTerms.map((t) => t.term)).toContain('pricing')
  })

  it('surfaces unanswered questions from PAA', () => {
    expect(gap.missingQuestions).toContain('How much does a CRM cost?')
  })

  it('finds missing heading topics', () => {
    expect(gap.missingHeadingTopics.length).toBeGreaterThan(0)
  })
})

describe('buildSchemaGap', () => {
  const gap = buildSchemaGap(user, competitors, KEYWORD)

  it('reports schema types the competitors share that the user lacks', () => {
    expect(gap.userTypes).toEqual([])
    expect(gap.missingTypes).toContain('FAQPage')
  })

  it('suggests JSON-LD templates for missing types', () => {
    const faq = gap.suggestedJsonLd.find((s) => s['@type'] === 'FAQPage')
    expect(faq).toBeDefined()
  })
})

describe('buildTechnicalIssues', () => {
  const issues = buildTechnicalIssues(user, KEYWORD)

  it('flags thin content, missing meta description and keyword gaps', () => {
    const ids = issues.map((i) => i.id)
    expect(ids).toContain('thin-content')
    expect(ids).toContain('missing-meta')
    expect(ids).toContain('kw-title')
  })

  it('reports a single critical crawl issue when crawl failed', () => {
    const failed: PageAnalysis = {
      isUser: true, position: null, serp: null, keywords: null, pageSpeed: null,
      page: extractPage({ url: 'https://x.com', finalUrl: 'https://x.com', status: 403, redirectChain: [], html: null, contentType: null, fetchMs: 1, error: 'blocked' }),
    }
    const result = buildTechnicalIssues(failed, KEYWORD)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('crawl-failed')
    expect(result[0].severity).toBe('critical')
  })
})

describe('buildScores', () => {
  const contentGap = buildContentGap(user, competitors, serp, KEYWORD)
  const schemaGap = buildSchemaGap(user, competitors, KEYWORD)
  const technicalIssues = buildTechnicalIssues(user, KEYWORD)
  const scores = buildScores({
    user, competitors, contentGap, schemaGap, technicalIssues,
    backlinks: { available: false, provider: null, message: 'no key', profiles: [] },
    serp, keyword: KEYWORD,
  })

  it('produces all eight scores in 0-100', () => {
    for (const s of Object.values(scores)) {
      expect(s.score).toBeGreaterThanOrEqual(0)
      expect(s.score).toBeLessThanOrEqual(100)
      expect(s.explanation.length).toBeGreaterThan(10)
    }
  })

  it('gives a neutral authority score with an honest explanation when no backlink API', () => {
    expect(scores.authority.score).toBe(50)
    expect(scores.authority.explanation).toMatch(/unavailable|No backlink/i)
  })

  it('scores the thin user page low on content', () => {
    expect(scores.content.score).toBeLessThan(60)
  })
})

describe('buildRecommendations', () => {
  const contentGap = buildContentGap(user, competitors, serp, KEYWORD)
  const schemaGap = buildSchemaGap(user, competitors, KEYWORD)
  const technicalIssues = buildTechnicalIssues(user, KEYWORD)
  const recs = buildRecommendations({
    user, competitors, contentGap, schemaGap, technicalIssues,
    backlinks: { available: false, provider: null, message: 'no key', profiles: [] },
    keyword: KEYWORD,
  })

  it('produces prioritized recommendations with sequential priorities', () => {
    expect(recs.length).toBeGreaterThan(3)
    expect(recs.map((r) => r.priority)).toEqual(recs.map((_, i) => i + 1))
  })

  it('puts critical fixes before low-impact items', () => {
    const firstCritical = recs.findIndex((r) => r.category === 'critical')
    const firstBacklink = recs.findIndex((r) => r.category === 'backlinks')
    if (firstCritical !== -1 && firstBacklink !== -1) {
      expect(firstCritical).toBeLessThan(firstBacklink)
    }
  })

  it('every recommendation has issue/why/fix/impact/difficulty', () => {
    for (const r of recs) {
      expect(r.issue.length).toBeGreaterThan(5)
      expect(r.why.length).toBeGreaterThan(5)
      expect(r.fix.length).toBeGreaterThan(5)
      expect(['High', 'Medium', 'Low']).toContain(r.impact)
      expect(['Easy', 'Medium', 'Hard']).toContain(r.difficulty)
    }
  })
})
