import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { CrawlResult, HeadingNode, PageExtraction, SchemaItem } from './types'

// Extracts every on-page SEO signal from crawled HTML. Pure function over the
// crawl result so it is fully unit-testable.

const CONTENT_TEXT_LIMIT = 60_000 // chars of body text kept for analysis
const CTA_PATTERNS =
  /\b(get started|sign up|signup|subscribe|buy now|add to cart|free trial|start free|contact us|request (a )?demo|book (a )?(call|demo)|download|learn more|get a quote|try (it|now|free))\b/i

export function extractPage(crawl: CrawlResult): PageExtraction {
  const base: PageExtraction = emptyExtraction(crawl)
  if (!crawl.html) return base

  const $ = cheerio.load(crawl.html)
  $('script:not([type="application/ld+json"]), style, noscript, svg, iframe').remove()

  const finalUrl = safeUrl(crawl.finalUrl)

  // ── Head tags ──
  const title = cleanText($('head title').first().text()) || null
  const metaDescription = attrContent($, 'meta[name="description"]')
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || null
  const metaRobots = attrContent($, 'meta[name="robots"]')
  const lang = $('html').attr('lang')?.trim() || null
  const noindex = /noindex/i.test(metaRobots ?? '')

  const openGraph: Record<string, string> = {}
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property')
    const content = $(el).attr('content')
    if (prop && content) openGraph[prop] = content
  })
  const twitterCard: Record<string, string> = {}
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name')
    const content = $(el).attr('content')
    if (name && content) twitterCard[name] = content
  })

  // ── Headings ──
  const headings: HeadingNode[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = cleanText($(el).text())
    if (!text) return
    headings.push({ level: Number(el.tagName[1]) as HeadingNode['level'], text })
  })
  const h1 = headings.filter((h) => h.level === 1).map((h) => h.text)

  // ── Main content text ──
  const contentRoot = pickContentRoot($)
  const contentText = cleanText(contentRoot.text()).slice(0, CONTENT_TEXT_LIMIT)
  const words = contentText.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const firstWords = words.slice(0, 100).join(' ')

  // ── Images ──
  const imgs = $('img').toArray()
  const altTexts: string[] = []
  let withAlt = 0
  for (const img of imgs) {
    const alt = $(img).attr('alt')?.trim()
    if (alt) {
      withAlt++
      if (altTexts.length < 30) altTexts.push(alt)
    }
  }

  // ── Links ──
  const pageHost = finalUrl?.hostname.replace(/^www\./, '') ?? ''
  let internal = 0
  let external = 0
  const internalSample: string[] = []
  const externalSample: string[] = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return
    try {
      const abs = new URL(href, crawl.finalUrl)
      if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return
      const host = abs.hostname.replace(/^www\./, '')
      if (host === pageHost) {
        internal++
        if (internalSample.length < 25) internalSample.push(abs.toString())
      } else {
        external++
        if (externalSample.length < 25) externalSample.push(abs.toString())
      }
    } catch {
      // unparsable href — ignore
    }
  })

  // ── Schema ──
  const schema = extractSchema($)
  const schemaTypes = [...new Set(schema.map((s) => s.type))]

  // ── FAQ / TOC / author / dates / conversion elements ──
  const bodyText = contentText.toLowerCase()
  const faqQuestions = extractFaqQuestions($, schema)
  const hasFaqSection =
    faqQuestions.length > 0 || schemaTypes.includes('FAQPage') || /frequently asked questions/i.test(bodyText)

  const hasTableOfContents =
    $('[class*="table-of-contents"], [class*="toc"], [id*="table-of-contents"], #toc, nav[aria-label*="contents" i]').length > 0 ||
    /\btable of contents\b/i.test(bodyText)

  const author =
    attrContent($, 'meta[name="author"]') ||
    cleanText($('[rel="author"], [class*="author-name"], [itemprop="author"]').first().text()) ||
    schemaAuthor(schema) ||
    null

  const publishedDate =
    attrContent($, 'meta[property="article:published_time"]') ||
    $('time[datetime]').first().attr('datetime') ||
    schemaDate(schema, 'datePublished') ||
    null
  const modifiedDate =
    attrContent($, 'meta[property="article:modified_time"]') || schemaDate(schema, 'dateModified') || null

  const hasContactForm = $('form').toArray().some((f) => {
    const formHtml = $(f).text() + ' ' + ($(f).attr('class') ?? '') + ' ' + ($(f).attr('id') ?? '')
    return /contact|email|enquir|inquir|message|subscribe|newsletter|quote|demo/i.test(formHtml) || $(f).find('input[type="email"]').length > 0
  })

  const ctaSample: string[] = []
  $('a, button, input[type="submit"]').each((_, el) => {
    const text = cleanText($(el).text() || $(el).attr('value') || '')
    if (text && text.length < 60 && CTA_PATTERNS.test(text) && ctaSample.length < 15 && !ctaSample.includes(text)) {
      ctaSample.push(text)
    }
  })

  const https = crawl.finalUrl.startsWith('https://')
  const mixedContent =
    https &&
    ($('img[src^="http://"], script[src^="http://"], link[href^="http://"][rel="stylesheet"]').length > 0)

  return {
    ...base,
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical,
    metaRobots,
    indexable: crawl.status === 200 && !noindex,
    https,
    mixedContent,
    lang,
    h1,
    headings,
    h2Count: headings.filter((h) => h.level === 2).length,
    h3Count: headings.filter((h) => h.level === 3).length,
    wordCount,
    contentText,
    firstWords,
    images: { count: imgs.length, withAlt, missingAlt: imgs.length - withAlt, altSample: altTexts },
    links: { internal, external, internalSample, externalSample, brokenSample: [] },
    schema,
    schemaTypes,
    openGraph,
    twitterCard,
    hasFaqSection,
    faqQuestions,
    hasTableOfContents,
    author,
    publishedDate,
    modifiedDate,
    hasContactForm,
    ctaCount: ctaSample.length,
    ctaSample,
  }
}

// ─── Schema extraction ───────────────────────────────────────────────────────

const KNOWN_SCHEMA_TYPES = new Set([
  'Organization', 'LocalBusiness', 'Article', 'BlogPosting', 'NewsArticle', 'FAQPage', 'Product',
  'Service', 'Review', 'AggregateRating', 'BreadcrumbList', 'WebPage', 'WebSite', 'HowTo',
  'VideoObject', 'Person', 'Event', 'Recipe', 'SoftwareApplication', 'ItemList', 'QAPage',
])

export function extractSchema($: CheerioAPI): SchemaItem[] {
  const items: SchemaItem[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text()
    if (!raw.trim()) return
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      items.push({ type: 'Unknown', raw: { _parseError: true }, source: 'json-ld', errors: ['Invalid JSON in JSON-LD script tag'] })
      return
    }
    for (const node of flattenJsonLd(parsed)) {
      const type = jsonLdType(node)
      if (!type) continue
      items.push({ type, raw: node, source: 'json-ld', errors: validateSchemaNode(type, node) })
    }
  })

  // Basic microdata detection
  $('[itemscope][itemtype]').each((_, el) => {
    const itemtype = $(el).attr('itemtype') ?? ''
    const type = itemtype.split('/').pop() ?? ''
    if (type) items.push({ type, raw: { itemtype }, source: 'microdata', errors: [] })
  })

  return items
}

function flattenJsonLd(parsed: unknown): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
    } else if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>
      if (obj['@type']) nodes.push(obj)
      if (Array.isArray(obj['@graph'])) obj['@graph'].forEach(visit)
    }
  }
  visit(parsed)
  return nodes
}

function jsonLdType(node: Record<string, unknown>): string | null {
  const t = node['@type']
  if (typeof t === 'string') return t
  if (Array.isArray(t) && typeof t[0] === 'string') return t[0]
  return null
}

/** Minimal required-property validation for common schema types. */
export function validateSchemaNode(type: string, node: Record<string, unknown>): string[] {
  const errors: string[] = []
  const has = (key: string) => node[key] !== undefined && node[key] !== null && node[key] !== ''

  switch (type) {
    case 'Article':
    case 'BlogPosting':
    case 'NewsArticle':
      if (!has('headline')) errors.push('Missing "headline"')
      if (!has('author')) errors.push('Missing "author"')
      if (!has('datePublished')) errors.push('Missing "datePublished"')
      break
    case 'FAQPage': {
      const main = node.mainEntity
      if (!main || (Array.isArray(main) && main.length === 0)) errors.push('Missing "mainEntity" questions')
      break
    }
    case 'Product':
      if (!has('name')) errors.push('Missing "name"')
      if (!has('offers') && !has('aggregateRating') && !has('review')) {
        errors.push('Missing "offers", "review" or "aggregateRating" (required for rich results)')
      }
      break
    case 'HowTo':
      if (!has('name')) errors.push('Missing "name"')
      if (!has('step')) errors.push('Missing "step"')
      break
    case 'BreadcrumbList':
      if (!has('itemListElement')) errors.push('Missing "itemListElement"')
      break
    case 'Organization':
    case 'LocalBusiness':
      if (!has('name')) errors.push('Missing "name"')
      break
    case 'VideoObject':
      if (!has('name')) errors.push('Missing "name"')
      if (!has('thumbnailUrl')) errors.push('Missing "thumbnailUrl"')
      if (!has('uploadDate')) errors.push('Missing "uploadDate"')
      break
    case 'Review':
      if (!has('itemReviewed')) errors.push('Missing "itemReviewed"')
      if (!has('reviewRating')) errors.push('Missing "reviewRating"')
      break
  }
  if (!KNOWN_SCHEMA_TYPES.has(type) && type !== 'Unknown') {
    // Not an error — just unrecognized by our comparison set.
  }
  return errors
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractFaqQuestions($: CheerioAPI, schema: SchemaItem[]): string[] {
  const questions = new Set<string>()
  for (const item of schema) {
    if (item.type !== 'FAQPage') continue
    const main = item.raw.mainEntity
    const list = Array.isArray(main) ? main : main ? [main] : []
    for (const q of list as Record<string, unknown>[]) {
      if (typeof q?.name === 'string') questions.add(cleanText(q.name))
    }
  }
  // Question-style headings count as FAQ-ish content too
  $('h2, h3, h4, summary, [class*="faq"] h2, [class*="faq"] h3').each((_, el) => {
    const text = cleanText($(el).text())
    if (text.endsWith('?') && text.length > 8 && text.length < 200) questions.add(text)
  })
  return [...questions].slice(0, 40)
}

function schemaAuthor(schema: SchemaItem[]): string | null {
  for (const item of schema) {
    const author = item.raw.author as Record<string, unknown> | string | undefined
    if (typeof author === 'string') return author
    if (author && typeof author === 'object' && typeof author.name === 'string') return author.name
  }
  return null
}

function schemaDate(schema: SchemaItem[], key: string): string | null {
  for (const item of schema) {
    const value = item.raw[key]
    if (typeof value === 'string') return value
  }
  return null
}

function pickContentRoot($: CheerioAPI) {
  for (const selector of ['main', 'article', '[role="main"]', '#content', '.content']) {
    const el = $(selector).first()
    if (el.length && cleanText(el.text()).length > 200) return el
  }
  return $('body')
}

function attrContent($: CheerioAPI, selector: string): string | null {
  const content = $(selector).first().attr('content')
  return content?.trim() || null
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function safeUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function emptyExtraction(crawl: CrawlResult): PageExtraction {
  return {
    url: crawl.url,
    finalUrl: crawl.finalUrl,
    status: crawl.status,
    redirectChain: crawl.redirectChain,
    crawlError: crawl.error,
    title: null,
    titleLength: 0,
    metaDescription: null,
    metaDescriptionLength: 0,
    canonical: null,
    metaRobots: null,
    indexable: false,
    https: crawl.finalUrl.startsWith('https://'),
    mixedContent: false,
    lang: null,
    h1: [],
    headings: [],
    h2Count: 0,
    h3Count: 0,
    wordCount: 0,
    contentText: '',
    firstWords: '',
    images: { count: 0, withAlt: 0, missingAlt: 0, altSample: [] },
    links: { internal: 0, external: 0, internalSample: [], externalSample: [], brokenSample: [] },
    schema: [],
    schemaTypes: [],
    openGraph: {},
    twitterCard: {},
    hasFaqSection: false,
    faqQuestions: [],
    hasTableOfContents: false,
    author: null,
    publishedDate: null,
    modifiedDate: null,
    hasContactForm: false,
    ctaCount: 0,
    ctaSample: [],
  }
}
