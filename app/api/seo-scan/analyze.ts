// Reusable on-page SEO analysis used by /api/seo-scan.
//
// Pure functions over fetched HTML so the same extractor powers both the user's
// page and (when a SERP key is configured) competitor pages. Scoring follows the
// seo-intel pipeline's methodology — same category weights and penalty model.

export type Severity = 'critical' | 'warning' | 'info'

export interface FixItem {
  severity: Severity
  category: string
  title: string
}

export interface CategoryScore {
  key: string
  label: string
  score: number
  detail?: string
}

export interface Signals {
  status: number
  finalUrl: string
  title: string
  titleLength: number
  metaDescription: string
  metaDescriptionLength: number
  canonical: string
  noindex: boolean
  hasViewport: boolean
  lang: string
  h1: string[]
  h2: string[]
  h1Count: number
  h2Count: number
  wordCount: number
  first100Words: string
  bodyText: string
  images: number
  imagesMissingAlt: number
  internalLinks: number
  externalLinks: number
  schemaTypes: string[]
  https: boolean
  mixedContent: boolean
  hasOpenGraph: boolean
  hasFaq: boolean
  indexable: boolean
}

export interface KeywordUsage {
  keyword: string
  inTitle: boolean
  inH1: boolean
  inH2s: boolean
  inMetaDescription: boolean
  inFirst100Words: boolean
  inUrl: boolean
  density: number
}

export const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))

// ─── Extraction ───────────────────────────────────────────────────────────────

export function extractSignals(
  html: string,
  finalUrl: string,
  status: number
): Signals {
  const head = sliceTag(html, 'head') ?? html

  const title = decode(matchTag(head, 'title'))
  const metaDescription = metaContent(head, 'name', 'description')
  const canonical = linkHref(head, 'canonical')
  const robots = metaContent(head, 'name', 'robots').toLowerCase()
  const noindex = /noindex/.test(robots)
  const hasViewport = !!metaContent(head, 'name', 'viewport')
  const lang = attrOf(html, 'html', 'lang')

  const h1 = collectTagTexts(html, 'h1')
  const h2 = collectTagTexts(html, 'h2')

  const hasOpenGraph = /property=["']og:/i.test(head)
  const schemaTypes = extractSchemaTypes(html)
  const { internal, external } = countLinks(html, finalUrl)

  const imgTags = html.match(/<img\b[^>]*>/gi) || []
  const images = imgTags.length
  const imagesMissingAlt = imgTags.filter(
    (t) => !/\balt\s*=\s*["'][^"']*\S[^"']*["']/i.test(t)
  ).length

  const bodyText = textOf(sliceTag(html, 'body') ?? html)
  const words = bodyText ? bodyText.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length
  const first100Words = words.slice(0, 100).join(' ')

  const hasFaq =
    schemaTypes.includes('FAQPage') ||
    /frequently asked questions/i.test(bodyText)

  const https = finalUrl.startsWith('https://')
  const mixedContent = https && /(?:src|href)=["']http:\/\//i.test(html)
  const indexable = status === 200 && !noindex

  return {
    status,
    finalUrl,
    title,
    titleLength: title.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    canonical,
    noindex,
    hasViewport,
    lang,
    h1,
    h2,
    h1Count: h1.length,
    h2Count: h2.length,
    wordCount,
    first100Words,
    bodyText,
    images,
    imagesMissingAlt,
    internalLinks: internal,
    externalLinks: external,
    schemaTypes,
    https,
    mixedContent,
    hasOpenGraph,
    hasFaq,
    indexable,
  }
}

// ─── Keyword intent (keyless, from the page) ───────────────────────────────────

export function keywordUsage(s: Signals, keyword: string): KeywordUsage {
  const kw = keyword.trim().toLowerCase()
  const has = (t: string) => !!kw && t.toLowerCase().includes(kw)
  let path = ''
  try {
    path = new URL(s.finalUrl).pathname.replace(/[-_/]+/g, ' ').toLowerCase()
  } catch {
    /* noop */
  }
  // density: occurrences of the phrase relative to total words
  let occurrences = 0
  if (kw) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    occurrences = (s.bodyText.toLowerCase().match(new RegExp(escaped, 'g')) || [])
      .length
  }
  const density = s.wordCount ? (occurrences * kw.split(/\s+/).length * 100) / s.wordCount : 0

  return {
    keyword,
    inTitle: has(s.title),
    inH1: s.h1.some(has),
    inH2s: s.h2.some(has),
    inMetaDescription: has(s.metaDescription),
    inFirst100Words: has(s.first100Words),
    inUrl: !!kw && path.includes(kw),
    density: Math.round(density * 100) / 100,
  }
}

// ─── Fix list ───────────────────────────────────────────────────────────────

export function buildFixes(s: Signals, usage: KeywordUsage | null): FixItem[] {
  const fixes: FixItem[] = []
  const add = (severity: Severity, category: string, title: string) =>
    fixes.push({ severity, category, title })

  if (!s.https) add('critical', 'Critical technical fixes', 'Serve the site over HTTPS')
  if (s.mixedContent)
    add('critical', 'Critical technical fixes', 'Fix mixed (http://) content on an HTTPS page')
  if (s.noindex)
    add('critical', 'Critical technical fixes', 'Page is set to noindex — remove it to allow ranking')
  if (!s.hasViewport)
    add('warning', 'Critical technical fixes', 'Add a responsive viewport meta tag for mobile')
  if (!s.canonical)
    add('warning', 'Critical technical fixes', 'Add a canonical URL to prevent duplicates')
  if (!s.lang) add('info', 'Critical technical fixes', 'Add a lang attribute to the <html> tag')

  if (!s.title) add('critical', 'Content gaps', 'Add a <title> tag')
  else if (s.titleLength < 30 || s.titleLength > 60)
    add('warning', 'Content gaps', `Title is ${s.titleLength} chars — aim for 30–60`)
  if (!s.metaDescription) add('warning', 'Content gaps', 'Add a meta description')
  else if (s.metaDescriptionLength < 70 || s.metaDescriptionLength > 160)
    add('info', 'Content gaps', `Meta description is ${s.metaDescriptionLength} chars — aim for 70–160`)
  if (s.h1Count === 0) add('critical', 'Content gaps', 'Add an H1 heading')
  else if (s.h1Count > 1) add('warning', 'Content gaps', `Page has ${s.h1Count} H1s — use exactly one`)
  if (s.wordCount < 300)
    add('warning', 'Content gaps', `Thin content (${s.wordCount} words) — expand to 600+`)
  if (!s.hasOpenGraph) add('info', 'Content gaps', 'Add Open Graph tags for social sharing')

  if (s.schemaTypes.length === 0)
    add('warning', 'Schema opportunities', 'Add structured data (JSON-LD) — none found')
  if (!s.schemaTypes.includes('BreadcrumbList'))
    add('info', 'Schema opportunities', 'Add BreadcrumbList schema')
  if (!s.hasFaq)
    add('info', 'Schema opportunities', 'Add an FAQ section + FAQPage schema for AI visibility')

  if (s.internalLinks < 5)
    add('warning', 'Internal link targets', `Only ${s.internalLinks} internal links — add contextual links`)
  if (s.imagesMissingAlt > 0)
    add('info', 'Internal link targets', `${s.imagesMissingAlt} image(s) missing alt text`)

  // Keyword-intent driven fixes
  if (usage && usage.keyword) {
    if (!usage.inTitle) add('warning', 'Keyword targeting', `Add "${usage.keyword}" to the title tag`)
    if (!usage.inH1) add('warning', 'Keyword targeting', `Add "${usage.keyword}" to the H1`)
    if (!usage.inFirst100Words)
      add('info', 'Keyword targeting', `Mention "${usage.keyword}" in the opening 100 words`)
    if (!usage.inMetaDescription)
      add('info', 'Keyword targeting', `Add "${usage.keyword}" to the meta description`)
  }

  const rank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }
  fixes.sort((a, b) => rank[a.severity] - rank[b.severity])
  return fixes
}

// ─── Scoring (seo-intel methodology) ──────────────────────────────────────────

export function scoreTechnical(fixes: FixItem[]): number {
  const tech = fixes.filter((f) => f.category === 'Critical technical fixes')
  const critical = tech.filter((f) => f.severity === 'critical').length
  const warning = tech.filter((f) => f.severity === 'warning').length
  const info = tech.filter((f) => f.severity === 'info').length
  return clamp(100 - critical * 25 - warning * 8 - info * 3)
}

export function scoreContent(s: Signals): number {
  let score = 100
  if (!s.title) score -= 25
  else if (s.titleLength < 30 || s.titleLength > 60) score -= 8
  if (!s.metaDescription) score -= 12
  if (s.h1Count === 0) score -= 20
  else if (s.h1Count > 1) score -= 8
  if (s.wordCount < 300) score -= 25
  else if (s.wordCount < 600) score -= 10
  return clamp(score)
}

export function scoreSchema(s: Signals): number {
  let score = s.schemaTypes.length === 0 ? 20 : 70 + Math.min(s.schemaTypes.length * 5, 20)
  if (!s.schemaTypes.includes('BreadcrumbList')) score -= 8
  if (!s.hasFaq) score -= 8
  return clamp(score)
}

export function scoreAiReadiness(s: Signals): number {
  let score = 0
  if (s.hasFaq) score += 20
  if (s.schemaTypes.length > 0) score += 20
  if (s.hasOpenGraph) score += 10
  if (s.externalLinks > 0) score += 10
  if (s.wordCount >= 600) score += 20
  if (s.h2Count >= 2) score += 10
  if (s.indexable) score += 10
  return clamp(score)
}

export function scoreIntent(usage: KeywordUsage): number {
  let score = 0
  if (usage.inTitle) score += 25
  if (usage.inH1) score += 20
  if (usage.inFirst100Words) score += 15
  if (usage.inMetaDescription) score += 10
  if (usage.inH2s) score += 10
  if (usage.inUrl) score += 10
  if (usage.density >= 0.3 && usage.density <= 3) score += 10
  return clamp(score)
}

// ─── Tiny HTML helpers (regex-based) ──────────────────────────────────────────

function sliceTag(html: string, tag: string): string | null {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(html)
  return m ? m[1] : null
}
function matchTag(html: string, tag: string): string {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(html)
  return m ? m[1].trim() : ''
}
function collectTagTexts(html: string, tag: string): string[] {
  const out: string[] = []
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const t = decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
    if (t) out.push(t)
  }
  return out
}
function metaContent(html: string, attr: string, value: string): string {
  const re = new RegExp(`<meta\\b[^>]*\\b${attr}\\s*=\\s*["']${value}["'][^>]*>`, 'i')
  const tag = re.exec(html)?.[0]
  if (!tag) return ''
  const c = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)
  return decode((c?.[1] ?? '').trim())
}
function linkHref(html: string, rel: string): string {
  const re = new RegExp(`<link\\b[^>]*\\brel\\s*=\\s*["']${rel}["'][^>]*>`, 'i')
  const tag = re.exec(html)?.[0]
  if (!tag) return ''
  const h = /\bhref\s*=\s*["']([^"']*)["']/i.exec(tag)
  return (h?.[1] ?? '').trim()
}
function attrOf(html: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']*)["']`, 'i')
  return (re.exec(html)?.[1] ?? '').trim()
}
function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>()
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    try {
      collectTypes(JSON.parse(m[1].trim()), types)
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return [...types]
}
function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) return node.forEach((n) => collectTypes(n, out))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const t = obj['@type']
    if (typeof t === 'string') out.add(t)
    else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.add(x))
    if (Array.isArray(obj['@graph'])) collectTypes(obj['@graph'], out)
  }
}
// Distinct, same-host internal page URLs (for the multi-page crawler). Skips
// assets, anchors, and non-http(s) links; strips hashes; caps the result.
export function extractInternalLinks(html: string, baseUrl: string, cap = 80): string[] {
  let host = ''
  try {
    host = new URL(baseUrl).hostname.replace(/^www\./, '')
  } catch {
    return []
  }
  const seen = new Set<string>()
  const out: string[] = []
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) && out.length < cap) {
    const href = m[1]
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue
    try {
      const abs = new URL(href, baseUrl)
      if (abs.protocol !== 'http:' && abs.protocol !== 'https:') continue
      if (abs.hostname.replace(/^www\./, '') !== host) continue
      if (/\.(jpg|jpeg|png|gif|svg|webp|avif|css|js|pdf|zip|mp4|mp3|xml|json|ico|woff2?|ttf)(\?|$)/i.test(abs.pathname)) continue
      abs.hash = ''
      const key = abs.toString()
      if (!seen.has(key)) {
        seen.add(key)
        out.push(key)
      }
    } catch {
      /* unparsable */
    }
  }
  return out
}

function countLinks(html: string, baseUrl: string): { internal: number; external: number } {
  let host = ''
  try {
    host = new URL(baseUrl).hostname.replace(/^www\./, '')
  } catch {
    /* noop */
  }
  let internal = 0
  let external = 0
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const href = m[1]
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    )
      continue
    try {
      const abs = new URL(href, baseUrl)
      if (abs.protocol !== 'http:' && abs.protocol !== 'https:') continue
      if (abs.hostname.replace(/^www\./, '') === host) internal++
      else external++
    } catch {
      /* unparsable */
    }
  }
  return { internal, external }
}
function textOf(html: string): string {
  return decode(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()
}
export function decode(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
}

// ─── Shared fetch helper ──────────────────────────────────────────────────────

export function normalizeUrl(raw: string): string | null {
  let s = raw.trim()
  if (!s) return null
  s = s.replace(/\s+/g, '')
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (!u.hostname.includes('.')) return null
    return u.toString()
  } catch {
    return null
  }
}

// A current desktop Chrome UA. Many sites / CDNs (Cloudflare, Akamai) return 403
// to unknown bot user-agents, so we present as a real browser. If that is still
// blocked we retry once as Googlebot, which a lot of sites allow-list.
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

function browserHeaders(ua: string): Record<string, string> {
  return {
    'User-Agent': ua,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  }
}

const BLOCK_STATUSES = new Set([401, 403, 405, 406, 429, 503])

export type FetchVia = 'browser' | 'googlebot' | 'proxy' | 'failed'

export interface FetchResult {
  html: string
  finalUrl: string
  status: number
  via: FetchVia
  proxyConfigured: boolean
}

import { checkOutboundUrl } from '@/lib/ssrf'

export async function fetchHtml(
  url: string,
  timeoutMs = 12_000,
  maxBytes = 3_000_000
): Promise<FetchResult> {
  const template = process.env.SCRAPE_API_TEMPLATE
  const proxyConfigured = !!template
  let via: FetchVia = 'browser'

  // SSRF guard — reject internal targets before any network call.
  const blocked = await checkOutboundUrl(url)
  if (blocked) {
    return { html: '', finalUrl: url, status: 0, via: 'failed', proxyConfigured }
  }

  let result = await fetchOnce(url, BROWSER_UA, timeoutMs, maxBytes)

  // Retry as Googlebot if the site blocked the browser request.
  if (BLOCK_STATUSES.has(result.status) || (!result.html && result.status === 0)) {
    try {
      const retry = await fetchOnce(url, GOOGLEBOT_UA, timeoutMs, maxBytes)
      if (!BLOCK_STATUSES.has(retry.status) && retry.html) {
        result = retry
        via = 'googlebot'
      }
    } catch {
      /* keep the first result */
    }
  }

  // Final fallback: route through a scraping/render proxy (residential IPs +
  // JS rendering) for sites behind Cloudflare/WAF bot protection that a direct
  // datacenter fetch can't pass. Configure SCRAPE_API_TEMPLATE with a {{url}}
  // placeholder, e.g. a ScraperAPI/ScrapingBee/Zyte endpoint including your key.
  if (template && (BLOCK_STATUSES.has(result.status) || !result.html)) {
    try {
      const proxied = template.replace('{{url}}', encodeURIComponent(url))
      const viaProxy = await fetchOnce(proxied, BROWSER_UA, Math.max(timeoutMs, 25_000), maxBytes)
      if (viaProxy.html && !BLOCK_STATUSES.has(viaProxy.status)) {
        // Keep the original target as finalUrl so link analysis stays correct.
        return { html: viaProxy.html, finalUrl: url, status: 200, via: 'proxy', proxyConfigured }
      }
    } catch {
      /* keep the direct result */
    }
  }

  if (!result.html || result.status >= 400) via = 'failed'
  return { ...result, via, proxyConfigured }
}

async function fetchOnce(
  url: string,
  ua: string,
  timeoutMs: number,
  maxBytes: number
): Promise<{ html: string; finalUrl: string; status: number }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const res = await fetch(url, {
    redirect: 'follow',
    signal: controller.signal,
    headers: browserHeaders(ua),
  }).finally(() => clearTimeout(timer))

  const finalUrl = res.url || url
  const status = res.status
  // Re-check after redirects — a public URL may 302 into a private address.
  if (finalUrl !== url) {
    const blocked = await checkOutboundUrl(finalUrl)
    if (blocked) return { html: '', finalUrl, status: 0 }
  }
  if (!res.body) return { html: await res.text(), finalUrl, status }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let html = ''
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    html += decoder.decode(value, { stream: true })
    if (received >= maxBytes) {
      await reader.cancel()
      break
    }
  }
  return { html, finalUrl, status }
}
