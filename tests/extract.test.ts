// extractPage turns crawled HTML into the PageExtraction every downstream
// module reads — scoring, the technical audit, the content gap, the fix
// generators. It had no tests. A signal it gets wrong here is wrong everywhere.

import { describe, expect, it } from 'vitest'
import * as cheerio from 'cheerio'
import { extractPage, extractSchema, validateSchemaNode } from '../lib/engine/extract'
import type { CrawlResult } from '../lib/engine/types'

function crawl(html: string, over: Partial<CrawlResult> = {}): CrawlResult {
  return {
    url: 'https://acme.com/p', finalUrl: 'https://acme.com/p', status: 200,
    redirectChain: [], html, error: null, timingMs: 12,
    ...over,
  } as CrawlResult
}

function page(bodyHtml: string, headHtml = '', over: Partial<CrawlResult> = {}) {
  return extractPage(crawl(`<!doctype html><html lang="en"><head>${headHtml}</head><body>${bodyHtml}</body></html>`, over))
}

describe('head signals', () => {
  it('reads title, meta description, canonical, robots and lang', () => {
    const p = page('<p>hi</p>', `
      <title>  Roof Repair  in Denver </title>
      <meta name="description" content="Fast roof repair.">
      <link rel="canonical" href="https://acme.com/canonical">
      <meta name="robots" content="index, follow">
    `)
    expect(p.title).toBe('Roof Repair in Denver')
    expect(p.titleLength).toBe(21)
    expect(p.metaDescription).toBe('Fast roof repair.')
    expect(p.canonical).toBe('https://acme.com/canonical')
    expect(p.metaRobots).toBe('index, follow')
    expect(p.lang).toBe('en')
  })

  it('reports absent head tags as null with zero length, not empty strings', () => {
    const p = page('<p>hi</p>')
    expect(p.title).toBeNull()
    expect(p.titleLength).toBe(0)
    expect(p.metaDescription).toBeNull()
    expect(p.metaDescriptionLength).toBe(0)
    expect(p.canonical).toBeNull()
  })

  it('marks a noindex page as not indexable', () => {
    expect(page('<p>hi</p>', '<meta name="robots" content="noindex, follow">').indexable).toBe(false)
    expect(page('<p>hi</p>', '<meta name="robots" content="index, nofollow">').indexable).toBe(true)
  })

  it('marks a non-200 response as not indexable', () => {
    expect(extractPage(crawl('<html><body>x</body></html>', { status: 404 })).indexable).toBe(false)
  })

  it('collects Open Graph and Twitter tags', () => {
    const p = page('<p>hi</p>', '<meta property="og:title" content="OG"><meta name="twitter:card" content="summary">')
    expect(p.openGraph['og:title']).toBe('OG')
    expect(p.twitterCard['twitter:card']).toBe('summary')
  })
})

describe('mixed content', () => {
  it('flags an insecure image on an https page', () => {
    expect(page('<img src="http://cdn.example.com/a.png">').mixedContent).toBe(true)
  })

  it('flags an insecure script on an https page', () => {
    // Scripts are stripped from the DOM before analysis, so a check that runs
    // after the strip can never see one — and an insecure script is ACTIVE
    // mixed content, the kind browsers block outright.
    expect(page('<script src="http://cdn.example.com/a.js"></script><p>hi</p>').mixedContent).toBe(true)
  })

  it('flags an insecure stylesheet on an https page', () => {
    expect(page('<p>hi</p>', '<link rel="stylesheet" href="http://cdn.example.com/a.css">').mixedContent).toBe(true)
  })

  it('does not flag anything on an http page, where there is no mix', () => {
    const p = extractPage(crawl('<html><body><img src="http://x/a.png"></body></html>', {
      url: 'http://acme.com/p', finalUrl: 'http://acme.com/p',
    }))
    expect(p.https).toBe(false)
    expect(p.mixedContent).toBe(false)
  })

  it('does not flag a clean https page', () => {
    expect(page('<img src="https://cdn.example.com/a.png"><script src="/a.js"></script>').mixedContent).toBe(false)
  })
})

describe('headings and content', () => {
  it('records every heading with its level and counts H1/H2/H3', () => {
    const p = page('<h1>One</h1><h2>Two</h2><h2>Two again</h2><h3>Three</h3>')
    expect(p.h1).toEqual(['One'])
    expect(p.h2Count).toBe(2)
    expect(p.h3Count).toBe(1)
    expect(p.headings).toHaveLength(4)
  })

  it('skips empty headings rather than recording blanks', () => {
    expect(page('<h1>Real</h1><h2>   </h2>').headings).toHaveLength(1)
  })

  it('counts words from the main content and captures the opening copy', () => {
    const body = `<main>${'<p>word</p>'.repeat(120)}</main><footer>ignore me entirely</footer>`
    const p = page(body)
    expect(p.wordCount).toBe(120)
    expect(p.firstWords.split(' ')).toHaveLength(100)
    expect(p.contentText).not.toContain('ignore me entirely')
  })

  it('falls back to the whole body when no main region is substantial', () => {
    const p = page('<main>tiny</main><p>the actual copy lives out here in the body</p>')
    expect(p.contentText).toContain('the actual copy lives out here')
  })

  it('strips script, style and noscript text out of the content', () => {
    const p = page('<p>real copy</p><script>var secret = 1</script><style>.a{color:red}</style><noscript>fallback</noscript>')
    expect(p.contentText).toContain('real copy')
    expect(p.contentText).not.toContain('secret')
    expect(p.contentText).not.toContain('color')
    expect(p.contentText).not.toContain('fallback')
  })
})

describe('images and links', () => {
  it('counts images and those missing alt text', () => {
    const p = page('<img src="/a.png" alt="a"><img src="/b.png"><img src="/c.png" alt="  ">')
    expect(p.images.count).toBe(3)
    expect(p.images.withAlt).toBe(1)
    expect(p.images.missingAlt).toBe(2)
    expect(p.images.altSample).toEqual(['a'])
  })

  it('separates internal from external links and ignores non-navigational hrefs', () => {
    const p = page(`
      <a href="/about">about</a>
      <a href="https://www.acme.com/pricing">pricing</a>
      <a href="https://other.com/x">other</a>
      <a href="#top">top</a>
      <a href="mailto:a@b.com">mail</a>
      <a href="tel:+1">call</a>
      <a href="javascript:void(0)">js</a>
    `)
    expect(p.links.internal).toBe(2)
    expect(p.links.external).toBe(1)
  })

  it('still classifies links when the final URL could not be parsed', () => {
    // Every href is resolved against finalUrl. If that is unusable, an
    // unguarded resolve drops every link, and the page reports zero internal
    // links — which the technical audit raises as a real issue.
    const p = extractPage(crawl(
      '<html><body><a href="https://acme.com/about">a</a><a href="https://other.com/x">b</a></body></html>',
      { url: 'https://acme.com/p', finalUrl: 'not a url' },
    ))
    expect(p.links.internal + p.links.external).toBe(2)
  })
})

describe('FAQ, table of contents, author and dates', () => {
  it('picks up question-style headings as FAQ content', () => {
    const p = page('<h2>What does a roof repair cost?</h2><p>About $900.</p>')
    expect(p.faqQuestions).toContain('What does a roof repair cost?')
    expect(p.hasFaqSection).toBe(true)
  })

  it('picks up FAQ questions from FAQPage schema', () => {
    const p = page('<p>hi</p>', `<script type="application/ld+json">
      {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Is it covered?"}]}
    </script>`)
    expect(p.faqQuestions).toContain('Is it covered?')
    expect(p.hasFaqSection).toBe(true)
  })

  it('reports no FAQ on a page without one', () => {
    expect(page('<h2>Our Services</h2><p>copy</p>').hasFaqSection).toBe(false)
  })

  it('finds the author from a meta tag, markup or schema', () => {
    expect(page('<p>x</p>', '<meta name="author" content="Jane Roe">').author).toBe('Jane Roe')
    expect(page('<span class="author-name">Ann Lee</span><p>x</p>').author).toBe('Ann Lee')
    const fromSchema = page('<p>x</p>', `<script type="application/ld+json">
      {"@type":"Article","headline":"h","author":{"@type":"Person","name":"Sam Fox"},"datePublished":"2026-01-01"}
    </script>`)
    expect(fromSchema.author).toBe('Sam Fox')
  })

  it('reports no author rather than guessing one', () => {
    expect(page('<p>copy with no byline</p>').author).toBeNull()
  })

  it('finds published and modified dates', () => {
    const p = page('<p>x</p>', `
      <meta property="article:published_time" content="2026-01-02">
      <meta property="article:modified_time" content="2026-03-04">
    `)
    expect(p.publishedDate).toBe('2026-01-02')
    expect(p.modifiedDate).toBe('2026-03-04')
  })

  it('detects a contact form and conversion CTAs', () => {
    const p = page('<form class="contact"><input type="email"></form><a href="/x">Get started</a>')
    expect(p.hasContactForm).toBe(true)
    expect(p.ctaSample).toContain('Get started')
  })

  it('reports the real number of CTAs even though the sample is capped', () => {
    const links = Array.from({ length: 30 }, (_, i) => `<a href="/x${i}">Get started ${i}</a>`).join('')
    const p = page(links)
    expect(p.ctaSample.length).toBeLessThanOrEqual(15)
    expect(p.ctaCount).toBe(30)
  })
})

describe('schema extraction', () => {
  const load = (html: string) => extractSchema(cheerio.load(html))

  it('reads a JSON-LD block and its type', () => {
    const items = load(`<script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>`)
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('Organization')
    expect(items[0].source).toBe('json-ld')
    expect(items[0].errors).toEqual([])
  })

  it('reads every node of an @graph', () => {
    const items = load(`<script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"a"},{"@type":"Organization","name":"b"}]}
    </script>`)
    expect(items.map((i) => i.type).sort()).toEqual(['Organization', 'WebSite'])
  })

  it('reads an array of nodes', () => {
    const items = load(`<script type="application/ld+json">[{"@type":"WebPage"},{"@type":"Article","headline":"h","author":"a","datePublished":"d"}]</script>`)
    expect(items).toHaveLength(2)
  })

  it('takes the first entry when @type is an array', () => {
    expect(load(`<script type="application/ld+json">{"@type":["LocalBusiness","Organization"],"name":"n"}</script>`)[0].type)
      .toBe('LocalBusiness')
  })

  it('reports malformed JSON-LD as an error instead of throwing', () => {
    const items = load(`<script type="application/ld+json">{ not json }</script>`)
    expect(items).toHaveLength(1)
    expect(items[0].errors[0]).toMatch(/Invalid JSON/)
  })

  it('ignores an empty JSON-LD block', () => {
    expect(load(`<script type="application/ld+json">   </script>`)).toEqual([])
  })

  it('detects microdata by itemtype', () => {
    const items = load(`<div itemscope itemtype="https://schema.org/Product"><span>x</span></div>`)
    expect(items[0]).toMatchObject({ type: 'Product', source: 'microdata' })
  })
})

describe('validateSchemaNode: required properties for rich results', () => {
  it('requires headline, author and datePublished on an Article', () => {
    expect(validateSchemaNode('Article', {})).toHaveLength(3)
    expect(validateSchemaNode('Article', { headline: 'h', author: 'a', datePublished: 'd' })).toEqual([])
  })

  it('treats an empty string as missing, not present', () => {
    expect(validateSchemaNode('Organization', { name: '' })).toHaveLength(1)
    expect(validateSchemaNode('Organization', { name: 'Acme' })).toEqual([])
  })

  it('requires questions on a FAQPage, including when mainEntity is an empty array', () => {
    expect(validateSchemaNode('FAQPage', {})).toHaveLength(1)
    expect(validateSchemaNode('FAQPage', { mainEntity: [] })).toHaveLength(1)
    expect(validateSchemaNode('FAQPage', { mainEntity: [{ name: 'q' }] })).toEqual([])
  })

  it('accepts a Product with any one of offers, review or aggregateRating', () => {
    expect(validateSchemaNode('Product', { name: 'p' })).toHaveLength(1)
    expect(validateSchemaNode('Product', { name: 'p', offers: {} })).toEqual([])
    expect(validateSchemaNode('Product', { name: 'p', review: {} })).toEqual([])
  })

  it('says nothing about a type it does not model', () => {
    expect(validateSchemaNode('Thing', {})).toEqual([])
  })
})

describe('a crawl that produced nothing', () => {
  it('returns the empty extraction, carrying the error through', () => {
    const p = extractPage(crawl('', { html: '', error: 'timeout', status: 0 }))
    expect(p.crawlError).toBe('timeout')
    expect(p.title).toBeNull()
    expect(p.wordCount).toBe(0)
    expect(p.indexable).toBe(false)
    expect(p.schema).toEqual([])
  })

  it('does not throw on HTML that is barely HTML', () => {
    expect(() => extractPage(crawl('<<<>>> not really markup'))).not.toThrow()
  })
})
