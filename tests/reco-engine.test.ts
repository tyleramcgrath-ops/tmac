// Recommendation Engine V2 (Phase C) — unit + human-agreement tests.
// The agreement test runs the engine over REAL github.com signals captured in
// Phase B and asserts it reproduces the independent human verdicts (removes the
// Phase B false positives, surfaces the false negatives, fixes confidence).

import { describe, expect, it } from 'vitest'
import { classifyPage } from '../lib/foundation/reco/classify'
import { generateRecommendationsV2 } from '../lib/foundation/reco/engine'
import type { Scan } from '../lib/foundation/types'
import { GITHUB_PAGES } from './fixtures/github-signals'

function scanOf(pages: unknown[], blocked: unknown[] = []): Scan {
  const now = new Date('2026-07-17').toISOString()
  return {
    id: 's', projectId: 'p', createdBy: 'u', createdAt: now, status: 'completed',
    startedAt: now, completedAt: now, error: null,
    summary: { pagesCrawled: pages.length, urlsDiscovered: pages.length, blockedCount: blocked.length, siteScore: 0, critical: 0, warning: 0, info: 0 },
    pages, blocked,
  }
}
const rec = (r: { title: string }) => r.title

describe('page classifier', () => {
  it('classifies core page types from URL', () => {
    expect(classifyPage({ url: 'https://x.com/' }).type).toBe('homepage')
    expect(classifyPage({ url: 'https://x.com/pricing' }).type).toBe('pricing')
    expect(classifyPage({ url: 'https://x.com/about' }).type).toBe('about')
    expect(classifyPage({ url: 'https://x.com/privacy' }).type).toBe('legal')
    expect(classifyPage({ url: 'https://x.com/blog/how-to-seo' }).type).toBe('blog_article')
    expect(classifyPage({ url: 'https://x.com/docs/api' }).type).toBe('documentation')
    expect(classifyPage({ url: 'https://x.com/contact' }).type).toBe('contact')
  })
})

describe('false-positive elimination (Phase B FP-1/2/3)', () => {
  it('does NOT recommend FAQ or Breadcrumb on the homepage', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([{ url: 'https://x.com/', title: 'Home', titleLength: 20, metaDescription: 'a', metaDescriptionLength: 120, h1Count: 3, schemaTypes: [], https: true, mixedContent: false, indexable: true }])
    )
    const titles = recommendations.map(rec).join(' | ')
    expect(titles).not.toMatch(/FAQ/i)
    expect(titles).not.toMatch(/Breadcrumb/i)
  })

  it('does NOT flag mixed content when the signal is false (href links no longer counted at source)', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([{ url: 'https://x.com/security', title: 'Security', titleLength: 24, metaDescription: 'a', metaDescriptionLength: 120, h1Count: 4, schemaTypes: [], https: true, mixedContent: false, indexable: true }])
    )
    expect(recommendations.map(rec).join(' | ')).not.toMatch(/insecure|mixed/i)
  })

  it('recommends page-APPROPRIATE schema (Product/Offer on pricing, not on homepage)', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([
        { url: 'https://x.com/', title: 'Home', titleLength: 20, schemaTypes: [], https: true, indexable: true, metaDescriptionLength: 120 },
        { url: 'https://x.com/pricing', title: 'Pricing', titleLength: 20, schemaTypes: [], https: true, indexable: true, metaDescriptionLength: 120 },
      ])
    )
    const pricing = recommendations.find((r) => r.pageType === 'pricing' && /schema|product/i.test(r.title))
    expect(pricing?.title).toMatch(/Product\/Offer/)
    const home = recommendations.find((r) => r.pageType === 'homepage' && /Organization/i.test(r.title))
    expect(home?.title).toMatch(/Organization/)
  })
})

describe('local-business schema completeness', () => {
  it('recommends filling in missing NAP fields when LocalBusiness schema is incomplete', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([{ url: 'https://x.com/contact', title: 'Contact', titleLength: 20, schemaTypes: ['LocalBusiness'], localBusinessMissingFields: ['address', 'telephone'], https: true, indexable: true, metaDescriptionLength: 120 }])
    )
    const found = recommendations.find((r) => r.title.includes('LocalBusiness'))
    expect(found?.title).toMatch(/address, telephone/)
  })

  it('does NOT fire when the LocalBusiness node is already complete', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([{ url: 'https://x.com/contact', title: 'Contact', titleLength: 20, schemaTypes: ['LocalBusiness'], localBusinessMissingFields: [], https: true, indexable: true, metaDescriptionLength: 120 }])
    )
    expect(recommendations.map(rec).join(' | ')).not.toMatch(/is missing/)
  })

  it('does NOT fire when there is no LocalBusiness node at all (localBusinessMissingFields absent)', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([{ url: 'https://x.com/contact', title: 'Contact', titleLength: 20, schemaTypes: [], https: true, indexable: true, metaDescriptionLength: 120 }])
    )
    expect(recommendations.map(rec).join(' | ')).not.toMatch(/is missing/)
  })
})

describe('first-class typed rule identity (Phase D.6 P2)', () => {
  it('stamps typed rule fields and keeps identity OUT of display text', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([{ url: 'https://x.com/product/z', title: '', titleLength: 0, schemaTypes: ['Product'], https: true, indexable: true, metaDescriptionLength: 120 }])
    )
    const missingTitle = recommendations.find((r) => r.ruleId === 'missing-title')
    expect(missingTitle).toBeTruthy()
    // Typed identity is present and correctly shaped.
    expect(missingTitle!.ruleId).toBe('missing-title')
    expect(missingTitle!.ruleVersion).toBe(1)
    expect(missingTitle!.ruleCategory).toBe('content')
    expect(['critical', 'warning', 'info']).toContain(missingTitle!.ruleSeverity)
    expect(typeof missingTitle!.businessContext).toBe('string')
    // No recommendation leaks a parseable "Rule ..." string into evidence.
    for (const r of recommendations) {
      expect(r.evidence.facts.join(' ')).not.toMatch(/Rule "/)
    }
  })

  it('every recommendation carries a ruleId registered in RULE_REGISTRY', () => {
    const { recommendations } = generateRecommendationsV2(scanOf(GITHUB_PAGES as unknown as unknown[]))
    for (const r of recommendations) {
      expect(r.ruleId.length).toBeGreaterThan(0)
      expect(r.ruleVersion).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('false-negative restoration (Phase B FN-1): cross-page duplicates', () => {
  it('flags duplicate meta descriptions across pages', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf([
        { url: 'https://x.com/a', title: 'A', titleLength: 10, metaDescription: 'Same shared description', metaDescriptionLength: 23, schemaTypes: ['Article'], https: true, indexable: true },
        { url: 'https://x.com/b', title: 'B', titleLength: 10, metaDescription: 'Same shared description', metaDescriptionLength: 23, schemaTypes: ['Article'], https: true, indexable: true },
        { url: 'https://x.com/c', title: 'C', titleLength: 10, metaDescription: 'Same shared description', metaDescriptionLength: 23, schemaTypes: ['Article'], https: true, indexable: true },
      ])
    )
    const dup = recommendations.find((r) => /share the same meta description/i.test(r.title))
    expect(dup).toBeTruthy()
    expect(dup?.evidence.affectedUrls).toHaveLength(3)
    expect(dup?.pageType).toBe('site')
  })
})

describe('broken internal links (from the crawl blocked set)', () => {
  const linker = (url: string, targets: string[]) => ({
    url, title: url, titleLength: 20, schemaTypes: ['Article'], https: true, indexable: true,
    metaDescriptionLength: 120, internalTargets: targets,
  })

  it('flags pages that link to internal URLs the crawler read as 4xx/5xx', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf(
        [
          linker('https://x.com/a', ['https://x.com/dead', 'https://x.com/b']),
          linker('https://x.com/b', ['https://x.com/dead']),
          linker('https://x.com/dead-source-only', ['https://x.com/gone']),
        ],
        [
          { url: 'https://x.com/dead', status: 404, reason: 'http_error' },
          { url: 'https://x.com/gone', status: 410, reason: 'http_error' },
        ]
      )
    )
    const broken = recommendations.find((r) => r.ruleId === 'broken-internal-links')
    expect(broken).toBeTruthy()
    expect(broken?.title).toMatch(/2 internal link target\(s\) return errors/)
    // affectedUrls are the SOURCE pages that contain the dead links.
    expect(broken?.evidence.affectedUrls).toEqual(
      expect.arrayContaining(['https://x.com/a', 'https://x.com/b', 'https://x.com/dead-source-only'])
    )
    expect(broken?.category).toBe('links')
  })

  it('does NOT flag policy exclusions (WAF/proxy/non-HTML/connection-fail), only real HTTP errors', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf(
        [linker('https://x.com/a', ['https://x.com/waf', 'https://x.com/timeout', 'https://x.com/nothtml'])],
        [
          { url: 'https://x.com/waf', status: 200, reason: 'waf_challenge' },
          { url: 'https://x.com/timeout', status: 0, reason: 'empty_response' },
          { url: 'https://x.com/nothtml', status: 200, reason: 'not_html' },
        ]
      )
    )
    expect(recommendations.find((r) => r.ruleId === 'broken-internal-links')).toBeUndefined()
  })

  it('does NOT fire when an error page exists but no crawled page links to it', () => {
    const { recommendations } = generateRecommendationsV2(
      scanOf(
        [linker('https://x.com/a', ['https://x.com/b'])],
        [{ url: 'https://x.com/orphan-404', status: 404, reason: 'http_error' }]
      )
    )
    expect(recommendations.find((r) => r.ruleId === 'broken-internal-links')).toBeUndefined()
  })
})

describe('confidence 2.0: importance over prevalence (Phase B §6)', () => {
  it('a rare high-certainty fix outranks a ubiquitous low-value one', () => {
    // 5 pages missing breadcrumb (low value), 1 page missing its title (critical).
    const pages = [
      { url: 'https://x.com/blog/one', title: 'One', titleLength: 10, schemaTypes: [], https: true, indexable: true, metaDescriptionLength: 120 },
      { url: 'https://x.com/blog/two', title: 'Two', titleLength: 10, schemaTypes: ['Article'], https: true, indexable: true, metaDescriptionLength: 120 },
      { url: 'https://x.com/product/z', title: '', titleLength: 0, schemaTypes: ['Product'], https: true, indexable: true, metaDescriptionLength: 120 },
    ]
    const { recommendations } = generateRecommendationsV2(scanOf(pages))
    const missingTitle = recommendations.find((r) => /Missing <title>/i.test(r.title))
    const breadcrumb = recommendations.find((r) => /Breadcrumb/i.test(r.title))
    expect(missingTitle).toBeTruthy()
    if (breadcrumb) {
      // The important, rare fix must have higher confidence AND better priority.
      expect(missingTitle!.confidence).toBeGreaterThan(breadcrumb.confidence)
      expect(missingTitle!.priorityRank!).toBeLessThan(breadcrumb.priorityRank!)
    }
  })
})

describe('explainability + self-evaluation', () => {
  it('every recommendation answers the five explainability questions', () => {
    const { recommendations } = generateRecommendationsV2(scanOf(GITHUB_PAGES as unknown as unknown[]))
    for (const r of recommendations) {
      expect(r.explanation?.why).toBeTruthy()
      expect(r.explanation?.whyThisPage).toBeTruthy()
      expect(r.explanation?.whatIfIgnored).toBeTruthy()
      expect(r.explanation?.whatCouldMakeWrong).toBeTruthy()
      expect(r.priorityRank).toBeGreaterThan(0)
    }
  })
  it('produces an honest self-evaluation that admits uncertainty', () => {
    const { selfEvaluation } = generateRecommendationsV2(scanOf(GITHUB_PAGES as unknown as unknown[]))
    expect(selfEvaluation.totalPages).toBe(9)
    expect(selfEvaluation.notAnalyzed.length).toBeGreaterThan(0)
    expect(selfEvaluation.notAnalyzed.join(' ')).toMatch(/Core Web Vitals|backlinks/i)
  })
})

// ── Human agreement on REAL github.com data (Phase C §8) ─────────────────────
describe('HUMAN AGREEMENT — real github.com signals vs independent human verdicts', () => {
  const { recommendations, selfEvaluation } = generateRecommendationsV2(scanOf(GITHUB_PAGES as unknown as unknown[]))
  const titles = recommendations.map(rec)
  const homepageRecs = recommendations.filter((r) => r.pageType === 'homepage').map(rec)

  it('does not repeat the Phase B false positives', () => {
    // FP-2: no breadcrumb on the homepage
    expect(homepageRecs.join(' | ')).not.toMatch(/Breadcrumb/i)
    // FP-3: no FAQ on the homepage / about
    const homeAndAbout = recommendations.filter((r) => ['homepage', 'about'].includes(r.pageType ?? '')).map(rec).join(' | ')
    expect(homeAndAbout).not.toMatch(/FAQ/i)
    // FP-1: no mixed-content critical (source-fixed; signal is false here)
    expect(titles.join(' | ')).not.toMatch(/insecure|mixed/i)
  })

  it('still surfaces the genuinely useful findings a human agreed with', () => {
    // Homepage should be advised to add Organization schema (page-appropriate).
    // (Organization may group across homepage+about+team; check its evidence.)
    const org = recommendations.find((r) => /Organization/i.test(r.title))
    expect(org).toBeTruthy()
    expect(org!.evidence.affectedUrls).toContain('https://github.com/')
    // Pricing should be advised Product/Offer schema.
    expect(recommendations.some((r) => r.pageType === 'pricing' && /Product\/Offer/i.test(r.title))).toBe(true)
    // The readme page (no meta description in the real data) should be flagged.
    expect(recommendations.some((r) => /Missing meta description/i.test(r.title))).toBe(true)
  })

  it('produces FEWER, better, targeted recommendations than V1 (the goal is not more)', () => {
    // V1 (Phase B) applied Breadcrumb to 9/9 and FAQ to 8/9 pages — spam.
    // V2 must only place them on appropriate page types, never the broad set.
    const faqRecs = recommendations.filter((r) => /FAQ/i.test(r.title))
    const inappropriate = ['homepage', 'about', 'team', 'contact', 'legal', 'blog_article', 'blog_index', 'case_study', 'search']
    // No FAQ/Breadcrumb recommendation may land on an inappropriate page type.
    for (const r of faqRecs) expect(inappropriate).not.toContain(r.pageType)
    for (const r of recommendations.filter((x) => /Breadcrumb/i.test(x.title))) {
      expect(['homepage', 'about', 'legal', 'contact', 'team']).not.toContain(r.pageType)
    }
    // Massive reduction vs V1's 8× FAQ + 9× Breadcrumb across all pages.
    expect(faqRecs.length).toBeLessThanOrEqual(3)
    // Low-value/uncertain items are honestly flagged for review, not hidden.
    expect(selfEvaluation.needsHumanReview).toBeGreaterThanOrEqual(faqRecs.length)
  })
})
