// extractSignals coverage (Phase D.6 P9). extractSignals is the trust
// foundation — every downstream score and recommendation derives from it — yet
// it had no root unit tests. These cover the happy path plus the failure/edge
// paths the D.5 review named: malformed HTML, partial HTML, missing schema,
// unexpected schema shapes, redirects, and malformed metadata. The extractor
// must NEVER throw and must degrade to honest zeros/empties, not fabricate.

import { describe, expect, it } from 'vitest'
import { extractSignals } from '../app/api/seo-scan/analyze'

const FULL = `<!doctype html>
<html lang="en-US">
<head>
  <title>  Best Roof Repair · Acme  </title>
  <meta name="description" content="We fix roofs fast and safely.">
  <meta name="viewport" content="width=device-width">
  <meta property="og:title" content="Acme Roofing">
  <link rel="canonical" href="https://acme.com/roof-repair">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","name":"Roof Repair"}</script>
</head>
<body>
  <h1>Roof Repair</h1>
  <h2>Fast</h2><h2>Safe</h2>
  <p>${'word '.repeat(120)}</p>
  <img src="/a.png" alt="a roof">
  <img src="/b.png">
  <a href="https://acme.com/about">About</a>
  <a href="/contact">Contact</a>
  <a href="https://google.com">External</a>
</body></html>`

describe('extractSignals — happy path', () => {
  it('extracts every core signal from well-formed HTML', () => {
    const s = extractSignals(FULL, 'https://acme.com/roof-repair', 200)
    expect(s.title).toBe('Best Roof Repair · Acme') // trimmed
    expect(s.titleLength).toBe('Best Roof Repair · Acme'.length)
    expect(s.metaDescription).toBe('We fix roofs fast and safely.')
    expect(s.metaDescriptionLength).toBeGreaterThan(0)
    expect(s.canonical).toBe('https://acme.com/roof-repair')
    expect(s.lang).toBe('en-US')
    expect(s.hasViewport).toBe(true)
    expect(s.hasOpenGraph).toBe(true)
    expect(s.h1Count).toBe(1)
    expect(s.h2Count).toBe(2)
    expect(s.schemaTypes).toEqual(['Service'])
    expect(s.images).toBe(2)
    expect(s.imagesMissingAlt).toBe(1) // b.png has no alt
    expect(s.internalLinks).toBe(2) // about + contact
    expect(s.externalLinks).toBe(1) // google
    expect(s.https).toBe(true)
    expect(s.indexable).toBe(true)
    expect(s.wordCount).toBeGreaterThanOrEqual(120)
    expect(s.noindex).toBe(false)
  })
})

describe('extractSignals — failure & empty paths (never throws)', () => {
  it('returns honest zeros/empties for an empty document', () => {
    const s = extractSignals('', 'https://x.com/', 200)
    expect(s.title).toBe('')
    expect(s.titleLength).toBe(0)
    expect(s.metaDescription).toBe('')
    expect(s.h1Count).toBe(0)
    expect(s.schemaTypes).toEqual([])
    expect(s.images).toBe(0)
    expect(s.wordCount).toBe(0)
    expect(s.indexable).toBe(true) // 200 + no noindex
  })

  it('non-200 status is not indexable', () => {
    expect(extractSignals('<title>x</title>', 'https://x.com/', 404).indexable).toBe(false)
    expect(extractSignals('<title>x</title>', 'https://x.com/', 500).indexable).toBe(false)
  })

  it('a plain text / non-HTML body degrades without throwing', () => {
    const s = extractSignals('this is not html at all { broken', 'https://x.com/', 200)
    expect(s.title).toBe('')
    expect(s.wordCount).toBeGreaterThan(0) // counts the text as body words
  })
})

describe('extractSignals — malformed & partial HTML', () => {
  it('handles a truncated document (head cut off mid-tag)', () => {
    const partial = '<html><head><title>Half a p'
    const s = extractSignals(partial, 'https://x.com/', 200)
    // No closing </title> → not matched → empty, but must not throw.
    expect(s.title).toBe('')
    expect(s.h1Count).toBe(0)
  })

  it('handles unclosed / overlapping tags', () => {
    const messy = '<html><head><title>T</title><body><h1>One<h1>Two</h1><p>hello world'
    const s = extractSignals(messy, 'https://x.com/', 200)
    expect(s.title).toBe('T')
    expect(s.h1Count).toBeGreaterThanOrEqual(1)
    expect(s.wordCount).toBeGreaterThan(0)
  })

  it('falls back to the whole document when there is no <head>', () => {
    const s = extractSignals('<title>No Head</title><h1>Hi</h1>', 'https://x.com/', 200)
    expect(s.title).toBe('No Head')
    expect(s.h1Count).toBe(1)
  })
})

describe('extractSignals — schema (missing / present / unexpected)', () => {
  it('returns [] when no JSON-LD is present', () => {
    expect(extractSignals('<h1>x</h1>', 'https://x.com/', 200).schemaTypes).toEqual([])
  })

  it('reads @type from a @graph array', () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"WebSite"}]}</script>`
    expect(extractSignals(html, 'https://x.com/', 200).schemaTypes.sort()).toEqual(['Organization', 'WebSite'])
  })

  it('reads @type expressed as an array of strings', () => {
    const html = `<script type="application/ld+json">{"@type":["Product","Offer"]}</script>`
    expect(extractSignals(html, 'https://x.com/', 200).schemaTypes.sort()).toEqual(['Offer', 'Product'])
  })

  it('reads a top-level array of nodes', () => {
    const html = `<script type="application/ld+json">[{"@type":"Article"},{"@type":"BreadcrumbList"}]</script>`
    expect(extractSignals(html, 'https://x.com/', 200).schemaTypes.sort()).toEqual(['Article', 'BreadcrumbList'])
  })

  it('ignores malformed JSON-LD without throwing', () => {
    const html = `<script type="application/ld+json">{ this is not json }</script><script type="application/ld+json">{"@type":"FAQPage"}</script>`
    // The broken block is skipped; the valid one is still read.
    expect(extractSignals(html, 'https://x.com/', 200).schemaTypes).toEqual(['FAQPage'])
  })

  it('tolerates unexpected schema shapes (numeric @type, no @type)', () => {
    const html = `<script type="application/ld+json">{"@type":123,"name":"x"}</script><script type="application/ld+json">{"name":"no type"}</script>`
    expect(extractSignals(html, 'https://x.com/', 200).schemaTypes).toEqual([])
  })

  it('detects FAQ from body text even without FAQPage schema', () => {
    const html = `<body><h2>Frequently Asked Questions</h2><p>Q and A</p></body>`
    expect(extractSignals(html, 'https://x.com/', 200).hasFaq).toBe(true)
  })
})

describe('extractSignals — malformed metadata', () => {
  it('meta description tag with no content attribute yields empty string', () => {
    const s = extractSignals('<head><meta name="description"></head>', 'https://x.com/', 200)
    expect(s.metaDescription).toBe('')
    expect(s.metaDescriptionLength).toBe(0)
  })

  it('decodes HTML entities in title and meta', () => {
    const s = extractSignals(
      `<head><title>Tom &amp; Jerry &#8212; Cartoons</title><meta name="description" content="A &lt;great&gt; show"></head>`,
      'https://x.com/',
      200
    )
    expect(s.title).toContain('Tom & Jerry')
    expect(s.metaDescription).toBe('A <great> show')
  })

  it('reads robots noindex (case-insensitive) → not indexable', () => {
    const s = extractSignals('<head><meta name="ROBOTS" content="NOINDEX, follow"></head>', 'https://x.com/', 200)
    expect(s.noindex).toBe(true)
    expect(s.indexable).toBe(false)
  })

  it('single-quoted attributes are parsed', () => {
    const s = extractSignals(`<head><link rel='canonical' href='https://x.com/c'></head>`, 'https://x.com/', 200)
    expect(s.canonical).toBe('https://x.com/c')
  })
})

describe('extractSignals — redirects & mixed content', () => {
  it('uses finalUrl (post-redirect) for https + link classification', () => {
    // Redirected from http to https; finalUrl decides https + internal host.
    const html = `<a href="https://final.com/x">In</a><a href="https://other.com">Out</a>`
    const s = extractSignals(html, 'https://final.com/page', 200)
    expect(s.https).toBe(true)
    expect(s.internalLinks).toBe(1)
    expect(s.externalLinks).toBe(1)
  })

  it('flags an insecure sub-resource on an https page as mixed content', () => {
    const html = `<img src="http://cdn.com/a.png">`
    expect(extractSignals(html, 'https://x.com/', 200).mixedContent).toBe(true)
  })

  it('does NOT flag a navigational http link as mixed content (Phase B FP-1)', () => {
    const html = `<a href="http://old-partner.com">Partner</a>`
    expect(extractSignals(html, 'https://x.com/', 200).mixedContent).toBe(false)
  })

  it('an http page is never mixed content', () => {
    const html = `<img src="http://cdn.com/a.png">`
    expect(extractSignals(html, 'http://x.com/', 200).mixedContent).toBe(false)
  })
})

describe('extractSignals — LocalBusiness NAP completeness', () => {
  it('is undefined when no LocalBusiness node exists', () => {
    const html = `<script type="application/ld+json">{"@type":"Article","name":"x"}</script>`
    expect(extractSignals(html, 'https://x.com/', 200).localBusinessMissingFields).toBeUndefined()
  })

  it('returns an empty array when name/address/telephone are all present', () => {
    const html = `<script type="application/ld+json">{
      "@type": "LocalBusiness",
      "name": "Acme Dental",
      "telephone": "+1-555-0100",
      "address": {"@type": "PostalAddress", "streetAddress": "1 Main St"}
    }</script>`
    const s = extractSignals(html, 'https://acme-dental.com/', 200)
    expect(s.localBusinessMissingFields).toEqual([])
  })

  it('lists exactly the missing NAP fields', () => {
    const html = `<script type="application/ld+json">{"@type":"LocalBusiness","name":"Acme Dental"}</script>`
    const s = extractSignals(html, 'https://acme-dental.com/', 200)
    expect(s.localBusinessMissingFields).toEqual(['address', 'telephone'])
  })

  it('accepts a plain string address', () => {
    const html = `<script type="application/ld+json">{
      "@type": "LocalBusiness", "name": "Acme", "telephone": "555-0100", "address": "1 Main St, Anytown"
    }</script>`
    const s = extractSignals(html, 'https://x.com/', 200)
    expect(s.localBusinessMissingFields).toEqual([])
  })

  it('finds a LocalBusiness node nested in @graph', () => {
    const html = `<script type="application/ld+json">{
      "@graph": [{"@type":"WebSite","name":"Site"}, {"@type":"LocalBusiness","name":"Acme"}]
    }</script>`
    const s = extractSignals(html, 'https://x.com/', 200)
    expect(s.localBusinessMissingFields).toEqual(['address', 'telephone'])
  })

  it('ignores non-LocalBusiness types even when NAP-like fields are absent', () => {
    const html = `<script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>`
    expect(extractSignals(html, 'https://x.com/', 200).localBusinessMissingFields).toBeUndefined()
  })

  it('does not crash on malformed JSON-LD and reports undefined', () => {
    const html = `<script type="application/ld+json">{not valid json</script>`
    expect(extractSignals(html, 'https://x.com/', 200).localBusinessMissingFields).toBeUndefined()
  })
})
