import type { SerpData, SerpResult } from './types'
import { getDomain } from './validate'

// SERP collection via SerpAPI (https://serpapi.com). Compliant SERP access —
// no direct Google scraping. The parse step is separated from the fetch so it
// can be unit-tested against fixture payloads and so additional providers
// (DataForSEO, Zenserp, ...) can be added behind the same SerpData shape.

export class SerpError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message)
    this.name = 'SerpError'
  }
}

export interface SerpQuery {
  keyword: string
  country: string
  device: 'desktop' | 'mobile'
  language?: string
}

export async function fetchSerp(query: SerpQuery, apiKey: string): Promise<SerpData> {
  const params = new URLSearchParams({
    engine: 'google',
    q: query.keyword,
    gl: query.country,
    device: query.device,
    num: '20',
    api_key: apiKey,
  })
  if (query.language) params.set('hl', query.language)

  let res: Response
  try {
    res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    throw new SerpError(
      `SerpAPI request failed: ${err instanceof Error ? err.message : String(err)}`,
      'Could not reach the SERP provider. Check your network connection and try again.'
    )
  }

  if (res.status === 401 || res.status === 403) {
    throw new SerpError(`SerpAPI auth error (${res.status})`, 'The SERP API key was rejected. Check it on the Settings page.')
  }
  if (res.status === 429) {
    throw new SerpError('SerpAPI rate limited', 'SERP API rate limit reached. Wait a moment and try again.')
  }
  if (!res.ok) {
    throw new SerpError(`SerpAPI HTTP ${res.status}`, `The SERP provider returned an error (HTTP ${res.status}).`)
  }

  const payload = (await res.json()) as Record<string, unknown>
  if (typeof payload.error === 'string') {
    throw new SerpError(`SerpAPI error: ${payload.error}`, `SERP provider error: ${payload.error}`)
  }
  return parseSerpApiResponse(payload, query)
}

/** Parses a SerpAPI google-engine JSON payload into the normalized SerpData shape. */
export function parseSerpApiResponse(payload: Record<string, unknown>, query: SerpQuery): SerpData {
  const organic = Array.isArray(payload.organic_results) ? payload.organic_results : []

  const results: SerpResult[] = []
  for (const item of organic as Record<string, unknown>[]) {
    const link = typeof item.link === 'string' ? item.link : null
    if (!link) continue
    results.push({
      position: typeof item.position === 'number' ? item.position : results.length + 1,
      url: link,
      domain: getDomain(link),
      title: typeof item.title === 'string' ? item.title : '',
      snippet: typeof item.snippet === 'string' ? item.snippet : '',
      displayedUrl: typeof item.displayed_link === 'string' ? item.displayed_link : link,
      richSnippet:
        item.rich_snippet && typeof item.rich_snippet === 'object'
          ? (item.rich_snippet as Record<string, unknown>)
          : undefined,
    })
    if (results.length >= 10) break
  }

  if (results.length === 0) {
    throw new SerpError('No organic results in SERP payload', 'No organic results were returned for this keyword/location. Try a different keyword.')
  }

  const answerBox = payload.answer_box as Record<string, unknown> | undefined
  const featuredSnippet =
    answerBox && typeof answerBox === 'object'
      ? {
          title: typeof answerBox.title === 'string' ? answerBox.title : undefined,
          snippet: typeof answerBox.snippet === 'string' ? answerBox.snippet : undefined,
          url: typeof answerBox.link === 'string' ? answerBox.link : undefined,
        }
      : undefined

  if (featuredSnippet?.url) {
    const fsDomain = getDomain(featuredSnippet.url)
    for (const r of results) {
      if (r.domain === fsDomain && r.url === featuredSnippet.url) r.isFeaturedSnippet = true
    }
  }

  const paa = Array.isArray(payload.related_questions)
    ? (payload.related_questions as Record<string, unknown>[])
        .map((q) => (typeof q.question === 'string' ? q.question : null))
        .filter((q): q is string => q !== null)
    : []

  const related = Array.isArray(payload.related_searches)
    ? (payload.related_searches as Record<string, unknown>[])
        .map((s) => (typeof s.query === 'string' ? s.query : null))
        .filter((s): s is string => s !== null)
    : []

  return {
    provider: 'serpapi',
    query: query.keyword,
    country: query.country,
    device: query.device,
    language: query.language,
    fetchedAt: new Date().toISOString(),
    results,
    featuredSnippet,
    peopleAlsoAsk: paa,
    relatedSearches: related,
  }
}
