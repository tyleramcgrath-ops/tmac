import { describe, expect, it } from 'vitest'
import { extractPage } from '@/lib/extract'
import type { CrawlResult } from '@/lib/types'

function crawlOf(html: string, overrides: Partial<CrawlResult> = {}): CrawlResult {
  return {
    url: 'https://example.com/guide',
    finalUrl: 'https://example.com/guide',
    status: 200,
    redirectChain: [],
    html,
    contentType: 'text/html',
    fetchMs: 100,
    error: null,
    ...overrides,
  }
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Best CRM Software 2026 — Complete Guide</title>
  <meta name="description" content="Compare the best CRM software for small business in 2026.">
  <meta name="robots" content="index, follow">
  <meta name="author" content="Jane Doe">
  <meta property="og:title" content="Best CRM Software">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://example.com/guide">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Best CRM Software 2026",
    "author": {"@type": "Person", "name": "Jane Doe"},
    "datePublished": "2026-01-15"
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "What is a CRM?", "acceptedAnswer": {"@type": "Answer", "text": "A CRM is software."}}
    ]
  }
  </script>
</head>
<body>
  <main>
    <h1>Best CRM Software for 2026</h1>
    <p>${'crm software comparison guide for growing teams. '.repeat(30)}</p>
    <h2>Pricing comparison</h2>
    <p>Pricing details here.</p>
    <h2>How do you choose a CRM?</h2>
    <h3>Feature checklist</h3>
    <img src="/a.png" alt="CRM dashboard screenshot">
    <img src="/b.png">
    <a href="/pricing">Pricing</a>
    <a href="https://other-site.com/study">External study</a>
    <a href="#section">anchor</a>
    <a href="mailto:x@y.com">mail</a>
    <form><input type="email" name="email"><button>Subscribe</button></form>
    <a href="/signup">Get Started</a>
  </main>
</body>
</html>`

describe('extractPage', () => {
  const page = extractPage(crawlOf(HTML))

  it('extracts title and meta description with lengths', () => {
    expect(page.title).toBe('Best CRM Software 2026 — Complete Guide')
    expect(page.titleLength).toBe(page.title!.length)
    expect(page.metaDescription).toContain('Compare the best CRM')
  })

  it('extracts canonical, robots, lang, OG and twitter tags', () => {
    expect(page.canonical).toBe('https://example.com/guide')
    expect(page.metaRobots).toBe('index, follow')
    expect(page.indexable).toBe(true)
    expect(page.lang).toBe('en')
    expect(page.openGraph['og:title']).toBe('Best CRM Software')
    expect(page.twitterCard['twitter:card']).toBe('summary_large_image')
  })

  it('extracts heading structure', () => {
    expect(page.h1).toEqual(['Best CRM Software for 2026'])
    expect(page.h2Count).toBe(2)
    expect(page.h3Count).toBe(1)
    expect(page.headings[0]).toEqual({ level: 1, text: 'Best CRM Software for 2026' })
  })

  it('counts words from the main content', () => {
    expect(page.wordCount).toBeGreaterThan(200)
    expect(page.firstWords.split(' ').length).toBeLessThanOrEqual(100)
  })

  it('extracts images and alt coverage', () => {
    expect(page.images.count).toBe(2)
    expect(page.images.withAlt).toBe(1)
    expect(page.images.missingAlt).toBe(1)
  })

  it('classifies internal vs external links and ignores anchors/mailto', () => {
    expect(page.links.internal).toBe(2) // /pricing and /signup
    expect(page.links.external).toBe(1)
  })

  it('extracts schema types from JSON-LD', () => {
    expect(page.schemaTypes).toContain('Article')
    expect(page.schemaTypes).toContain('FAQPage')
    const article = page.schema.find((s) => s.type === 'Article')
    expect(article?.errors).toEqual([])
  })

  it('detects FAQ content, author and conversion elements', () => {
    expect(page.hasFaqSection).toBe(true)
    expect(page.faqQuestions).toContain('What is a CRM?')
    expect(page.faqQuestions).toContain('How do you choose a CRM?')
    expect(page.author).toBe('Jane Doe')
    expect(page.publishedDate).toBe('2026-01-15')
    expect(page.hasContactForm).toBe(true)
    expect(page.ctaSample).toContain('Get Started')
  })

  it('flags noindex pages as not indexable', () => {
    const noindex = extractPage(crawlOf(HTML.replace('index, follow', 'noindex, nofollow')))
    expect(noindex.indexable).toBe(false)
  })

  it('reports invalid schema with missing required properties', () => {
    const badSchema = `<html><head><title>t</title>
      <script type="application/ld+json">{"@type": "Product"}</script>
      </head><body><p>hello world content here</p></body></html>`
    const result = extractPage(crawlOf(badSchema))
    const product = result.schema.find((s) => s.type === 'Product')
    expect(product?.errors.length).toBeGreaterThan(0)
  })

  it('handles failed crawls gracefully', () => {
    const failed = extractPage(crawlOf('', { html: null, status: 403, error: 'blocked' }))
    expect(failed.crawlError).toBe('blocked')
    expect(failed.title).toBeNull()
    expect(failed.wordCount).toBe(0)
  })
})
