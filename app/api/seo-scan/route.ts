// Live on-page SEO scan for the RankForge AI marketing site.
//
// This is a self-contained, dependency-free, key-free scan: it fetches the
// requested URL server-side, extracts on-page SEO signals from the HTML, and
// scores them using the same methodology as the seo-intel pipeline in this
// repo (same category weights and penalty model). It deliberately omits the
// parts of seo-intel that require external API keys or a target keyword
// (SERP rank, competitor comparison, backlinks, Lighthouse) so it runs on any
// deployment with no configuration.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const FETCH_TIMEOUT_MS = 12_000
const MAX_BYTES = 3_000_000 // 3MB of HTML is plenty for on-page analysis

type Severity = 'critical' | 'warning' | 'info'

interface FixItem {
  severity: Severity
  category: string
  title: string
}

interface CategoryScore {
  key: string
  label: string
  score: number
}

interface ScanResult {
  url: string
  finalUrl: string
  fetchedAt: string
  overall: number
  categories: CategoryScore[]
  metrics: {
    titleLength: number
    metaDescriptionLength: number
    h1Count: number
    h2Count: number
    wordCount: number
    images: number
    imagesMissingAlt: number
    internalLinks: number
    externalLinks: number
    schemaTypes: string[]
    https: boolean
    indexable: boolean
    hasViewport: boolean
    hasFaq: boolean
    hasOpenGraph: boolean
  }
  fixes: FixItem[]
}

const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const normalized = normalizeUrl(String(body.url ?? ''))
  if (!normalized) {
    return Response.json(
      { error: 'Enter a valid domain, e.g. example.com' },
      { status: 400 }
    )
  }

  let html = ''
  let finalUrl = normalized
  let status = 0
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(normalized, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; RankForgeBot/1.0; +https://rankforge.ai/bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
    }).finally(() => clearTimeout(timer))
    status = res.status
    finalUrl = res.url || normalized
    html = await readCapped(res)
  } catch {
    return Response.json(
      {
        error:
          'We could not reach that site. Check the domain and try again — make sure it is publicly accessible.',
      },
      { status: 502 }
    )
  }

  if (!html || status >= 400) {
    return Response.json(
      {
        error: `The site responded with status ${status || 'no content'}. Try a different page.`,
      },
      { status: 502 }
    )
  }

  const result = analyze(normalized, finalUrl, status, html)
  return Response.json(result)
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string | null {
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

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return await res.text()
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let out = ''
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    out += decoder.decode(value, { stream: true })
    if (received >= MAX_BYTES) {
      await reader.cancel()
      break
    }
  }
  return out
}

// ─── Extraction (dependency-free) ─────────────────────────────────────────────

function analyze(
  requestedUrl: string,
  finalUrl: string,
  status: number,
  html: string
): ScanResult {
  const head = sliceTag(html, 'head') ?? html

  const title = decode(matchTag(head, 'title'))
  const titleLength = title.length

  const metaDescription = metaContent(head, 'name', 'description')
  const metaDescriptionLength = metaDescription.length

  const canonical = linkHref(head, 'canonical')
  const robots = metaContent(head, 'name', 'robots').toLowerCase()
  const noindex = /noindex/.test(robots)
  const hasViewport = !!metaContent(head, 'name', 'viewport')
  const lang = attrOf(html, 'html', 'lang')

  const h1Count = countTag(html, 'h1')
  const h2Count = countTag(html, 'h2')

  const ogCount = (head.match(/property=["']og:/gi) || []).length
  const hasOpenGraph = ogCount > 0

  const schemaTypes = extractSchemaTypes(html)

  const { internal, external } = countLinks(html, finalUrl)

  const imgTags = html.match(/<img\b[^>]*>/gi) || []
  const images = imgTags.length
  const imagesMissingAlt = imgTags.filter(
    (t) => !/\balt\s*=\s*["'][^"']*\S[^"']*["']/i.test(t)
  ).length

  const bodyText = textOf(sliceTag(html, 'body') ?? html)
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0

  const hasFaq =
    schemaTypes.includes('FAQPage') ||
    /frequently asked questions/i.test(bodyText)

  const https = finalUrl.startsWith('https://')
  const mixedContent =
    https && /(?:src|href)=["']http:\/\//i.test(html)

  const indexable = status === 200 && !noindex

  // ── Build the prioritized fix list ──
  const fixes: FixItem[] = []
  const tech = (sev: Severity, title: string) =>
    fixes.push({ severity: sev, category: 'Critical technical fixes', title })

  if (!https) tech('critical', 'Serve the site over HTTPS')
  if (mixedContent)
    tech('critical', 'Fix mixed (http://) content on an HTTPS page')
  if (noindex)
    tech('critical', 'Page is set to noindex — remove it to allow ranking')
  if (!hasViewport)
    tech('warning', 'Add a responsive viewport meta tag for mobile')
  if (!canonical) tech('warning', 'Add a canonical URL to prevent duplicates')
  if (!lang) tech('info', 'Add a lang attribute to the <html> tag')

  if (!title) fixes.push(f('critical', 'Content gaps', 'Add a <title> tag'))
  else if (titleLength < 30 || titleLength > 60)
    fixes.push(
      f(
        'warning',
        'Content gaps',
        `Title is ${titleLength} chars — aim for 30–60`
      )
    )
  if (!metaDescription)
    fixes.push(f('warning', 'Content gaps', 'Add a meta description'))
  else if (metaDescriptionLength < 70 || metaDescriptionLength > 160)
    fixes.push(
      f(
        'info',
        'Content gaps',
        `Meta description is ${metaDescriptionLength} chars — aim for 70–160`
      )
    )
  if (h1Count === 0)
    fixes.push(f('critical', 'Content gaps', 'Add an H1 heading'))
  else if (h1Count > 1)
    fixes.push(
      f('warning', 'Content gaps', `Page has ${h1Count} H1s — use exactly one`)
    )
  if (wordCount < 300)
    fixes.push(
      f(
        'warning',
        'Content gaps',
        `Thin content (${wordCount} words) — expand to 600+`
      )
    )

  if (schemaTypes.length === 0)
    fixes.push(
      f(
        'warning',
        'Schema opportunities',
        'Add structured data (JSON-LD) — none found'
      )
    )
  if (!schemaTypes.includes('BreadcrumbList'))
    fixes.push(
      f('info', 'Schema opportunities', 'Add BreadcrumbList schema')
    )
  if (!hasFaq)
    fixes.push(
      f(
        'info',
        'Schema opportunities',
        'Add an FAQ section + FAQPage schema for AI visibility'
      )
    )

  if (internal < 5)
    fixes.push(
      f(
        'warning',
        'Internal link targets',
        `Only ${internal} internal links — add contextual links`
      )
    )
  if (imagesMissingAlt > 0)
    fixes.push(
      f(
        'info',
        'Internal link targets',
        `${imagesMissingAlt} image(s) missing alt text`
      )
    )
  if (!hasOpenGraph)
    fixes.push(
      f('info', 'Content gaps', 'Add Open Graph tags for social sharing')
    )

  // ── Scores (seo-intel methodology) ──
  const critical = fixes.filter((x) => x.severity === 'critical').length
  const warning = fixes.filter((x) => x.severity === 'warning').length
  const info = fixes.filter((x) => x.severity === 'info').length
  const technical = clamp(100 - critical * 25 - warning * 8 - info * 3)

  let content = 100
  if (!title) content -= 25
  else if (titleLength < 30 || titleLength > 60) content -= 8
  if (!metaDescription) content -= 12
  if (h1Count === 0) content -= 20
  else if (h1Count > 1) content -= 8
  if (wordCount < 300) content -= 25
  else if (wordCount < 600) content -= 10
  content = clamp(content)

  let schema = schemaTypes.length === 0 ? 20 : 70 + Math.min(schemaTypes.length * 5, 20)
  if (!schemaTypes.includes('BreadcrumbList')) schema -= 8
  if (!hasFaq) schema -= 8
  schema = clamp(schema)

  let ai = 0
  if (hasFaq) ai += 20
  if (schemaTypes.length > 0) ai += 20
  if (hasOpenGraph) ai += 10
  if (external > 0) ai += 10
  if (wordCount >= 600) ai += 20
  if (h2Count >= 2) ai += 10
  if (indexable) ai += 10
  ai = clamp(ai)

  const categories: CategoryScore[] = [
    { key: 'technical', label: 'Technical SEO', score: technical },
    { key: 'content', label: 'Content', score: content },
    { key: 'schema', label: 'Schema', score: schema },
    { key: 'ai', label: 'AI Search Readiness', score: ai },
  ]

  // Weighted overall mirroring seo-intel's weighting for the available signals.
  const weights: [number, number][] = [
    [technical, 30],
    [content, 35],
    [schema, 15],
    [ai, 20],
  ]
  const totalWeight = weights.reduce((s, [, w]) => s + w, 0)
  const overall = clamp(
    weights.reduce((s, [v, w]) => s + v * w, 0) / totalWeight
  )

  const severityRank: Record<Severity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  }
  fixes.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])

  return {
    url: requestedUrl,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    overall,
    categories,
    metrics: {
      titleLength,
      metaDescriptionLength,
      h1Count,
      h2Count,
      wordCount,
      images,
      imagesMissingAlt,
      internalLinks: internal,
      externalLinks: external,
      schemaTypes,
      https,
      indexable,
      hasViewport,
      hasFaq,
      hasOpenGraph,
    },
    fixes,
  }
}

function f(severity: Severity, category: string, title: string): FixItem {
  return { severity, category, title }
}

// ─── Tiny HTML helpers (regex-based, good enough for head/meta signals) ───────

function sliceTag(html: string, tag: string): string | null {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(html)
  return m ? m[1] : null
}

function matchTag(html: string, tag: string): string {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(html)
  return m ? m[1].trim() : ''
}

function countTag(html: string, tag: string): number {
  return (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length
}

function metaContent(html: string, attr: string, value: string): string {
  const re = new RegExp(
    `<meta\\b[^>]*\\b${attr}\\s*=\\s*["']${value}["'][^>]*>`,
    'i'
  )
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
      // ignore malformed JSON-LD
    }
  }
  return [...types]
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out))
    return
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const t = obj['@type']
    if (typeof t === 'string') out.add(t)
    else if (Array.isArray(t))
      t.forEach((x) => typeof x === 'string' && out.add(x))
    if (Array.isArray(obj['@graph'])) collectTypes(obj['@graph'], out)
  }
}

function countLinks(
  html: string,
  baseUrl: string
): { internal: number; external: number } {
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

function decode(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
}
