// Content Studio (Content Brief generation) — research a keyword against real
// live Google results, cross-reference tracked competitors, and compose the
// prompt an AI drafts a blog post from. Everything here is pure and
// network-free except `fetchSerpForKeyword`, so the research/prompt logic is
// directly unit-testable without an AI or SERP API call.
//
// Honesty by construction: when no SERP API is connected, research is
// reported as unavailable (never faked), and the draft prompt says so
// explicitly rather than presenting an ungrounded guess as researched.

import * as cheerio from 'cheerio'

export interface RawSerpResult {
  url: string
  title: string
  snippet: string
  position: number
}

export interface SerpResearch {
  available: boolean
  results: RawSerpResult[]
  note?: string
}

export interface MarkedSerpResult extends RawSerpResult {
  competitorDomain: string | null
}

// Live Google results for a keyword via SERP API. Degrades honestly to
// available:false (with a reason) rather than fabricating results — same
// pattern as /api/rankings.
export async function fetchSerpForKeyword(keyword: string): Promise<SerpResearch> {
  const key = process.env.SERPAPI_KEY
  if (!key) {
    return { available: false, results: [], note: 'Connect a SERP API (set SERPAPI_KEY) to research live Google results for this keyword.' }
  }
  try {
    const endpoint = new URL('https://serpapi.com/search.json')
    endpoint.searchParams.set('engine', 'google')
    endpoint.searchParams.set('q', keyword)
    endpoint.searchParams.set('num', '10')
    endpoint.searchParams.set('api_key', key)
    const res = await fetch(endpoint)
    if (!res.ok) return { available: false, results: [], note: `SERP lookup failed (HTTP ${res.status}).` }
    const data = (await res.json()) as { organic_results?: { link?: string; title?: string; snippet?: string; position?: number }[] }
    const organic = Array.isArray(data.organic_results) ? data.organic_results : []
    const results: RawSerpResult[] = organic
      .slice(0, 10)
      .map((r, i) => ({ url: r.link ?? '', title: r.title ?? '', snippet: r.snippet ?? '', position: r.position ?? i + 1 }))
      .filter((r) => !!r.url)
    return { available: true, results }
  } catch (err) {
    return { available: false, results: [], note: `SERP lookup failed: ${err instanceof Error ? err.message : 'network error'}` }
  }
}

// Tag each SERP result with the tracked competitor domain it matches, if any —
// never invents a competitor relationship, only reports real hostname matches.
export function markCompetitors(results: RawSerpResult[], competitorDomains: string[]): MarkedSerpResult[] {
  return results.map((r) => {
    let host = ''
    try {
      host = new URL(r.url).hostname.replace(/^www\./, '')
    } catch {
      /* leave host empty */
    }
    return { ...r, competitorDomain: competitorDomains.find((d) => d === host) ?? null }
  })
}

// Build the prompt an AI drafts the blog post from. Pure and deterministic
// (given its inputs) so it's directly testable — the only non-deterministic
// part of Content Studio is the model call itself.
export function buildContentPrompt(input: {
  keyword: string
  domain: string
  serpAvailable: boolean
  serpResults: MarkedSerpResult[]
  competitorsConsidered: string[]
}): string {
  const lines = [`Target keyword: ${input.keyword}`, `Our site: ${input.domain}`]
  if (input.serpAvailable && input.serpResults.length > 0) {
    lines.push('', 'Current Google results for this keyword (research context — do not copy any of this):')
    for (const [i, r] of input.serpResults.slice(0, 8).entries()) {
      lines.push(`${i + 1}. ${r.title || '(untitled)'} — ${r.url}${r.competitorDomain ? ` [tracked competitor: ${r.competitorDomain}]` : ''}`)
      if (r.snippet) lines.push(`   "${r.snippet}"`)
    }
  } else {
    lines.push('', 'Live SERP research is unavailable for this request (no SERP API connected) — write from keyword intent and general SEO best practice only, and do not claim to have researched live results.')
  }
  if (input.competitorsConsidered.length > 0) {
    lines.push(
      '',
      `Tracked competitors currently ranking for this keyword: ${input.competitorsConsidered.join(', ')}. Write something more complete and useful than what they offer — do not imitate their structure or copy their wording.`
    )
  }
  lines.push(
    '',
    'Write an original blog post draft that would genuinely satisfy this search intent, targeting the keyword naturally (not stuffed). Aim for 600-900 words. Return the body as clean semantic HTML (h2/h3/p/ul/li elements) with no <html>/<head>/<body> wrapper.'
  )
  return lines.join('\n')
}

export interface ContentGap {
  title: string
  url: string
  competitorDomain: string
}

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'your', 'you', 'are', 'this', 'that', 'from', 'how', 'what', 'why', 'best', 'top', 'guide', 'vs', 'our', 'about'])

function significantTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3 && !STOPWORDS.has(t))
  )
}

// Real pages a tracked competitor has that we have nothing comparable to,
// ranked by how distinct the topic is (fewer of our own pages share any
// significant word with it = a bigger gap). Pure token-overlap heuristic —
// no embeddings/AI call, so it's fast, deterministic, and free to run on
// every competitor refresh.
export function findContentGaps(
  ourPages: { title?: string }[],
  competitors: { domain: string; snapshotPages?: { url: string; title: string }[] }[],
  limit = 10
): ContentGap[] {
  const ourTokenSets = ourPages.map((p) => significantTokens(p.title ?? ''))
  const seen = new Set<string>() // dedupe near-identical competitor topics across competitors
  const gaps: { gap: ContentGap; overlapScore: number }[] = []

  for (const c of competitors) {
    for (const p of c.snapshotPages ?? []) {
      const theirTokens = significantTokens(p.title)
      if (theirTokens.size === 0) continue
      const key = [...theirTokens].sort().join(' ')
      if (seen.has(key)) continue

      let bestOverlap = 0
      for (const ours of ourTokenSets) {
        if (ours.size === 0) continue
        let inter = 0
        for (const t of theirTokens) if (ours.has(t)) inter++
        const overlap = inter / theirTokens.size
        if (overlap > bestOverlap) bestOverlap = overlap
      }
      // A real gap: we have nothing that shares even half the competitor
      // page's significant vocabulary.
      if (bestOverlap < 0.5) {
        seen.add(key)
        gaps.push({ gap: { title: p.title, url: p.url, competitorDomain: c.domain }, overlapScore: bestOverlap })
      }
    }
  }

  return gaps
    .sort((a, b) => a.overlapScore - b.overlapScore)
    .slice(0, limit)
    .map((g) => g.gap)
}

const ALLOWED_TAGS = new Set(['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'br', 'blockquote', 'span'])

// Defense-in-depth: the model's HTML output can be influenced by attacker-
// controlled text it read as research context (a competitor's SERP snippet is
// scraped from the open web, not something we control). Strip it to a small
// allowlisted tag set with no scripts/styles/handlers before it's ever
// rendered in the dashboard (dangerouslySetInnerHTML) or written to a real
// WordPress post.
export function sanitizeContentHtml(html: string): string {
  const $ = cheerio.load(`<div id="rf-root">${html}</div>`)
  const root = $('#rf-root')
  root.find('script,style,iframe,object,embed,link,meta,form,input,svg,math,noscript,button,select,textarea').remove()
  root.find('*').each((_, el) => {
    const tag = el.tagName?.toLowerCase()
    const $el = $(el)
    if (!tag || !ALLOWED_TAGS.has(tag)) {
      $el.replaceWith($el.contents())
      return
    }
    for (const name of Object.keys(el.attribs ?? {})) {
      if (tag === 'a' && name === 'href') continue
      $el.removeAttr(name)
    }
    if (tag === 'a') {
      const href = $el.attr('href') ?? ''
      if (/^https?:\/\//i.test(href)) $el.attr('rel', 'noopener noreferrer')
      else $el.removeAttr('href')
    }
  })
  return root.html() ?? ''
}
