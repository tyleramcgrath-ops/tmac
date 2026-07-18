// Citation providers — one per AI answer engine. Perplexity is live (its API
// returns the exact sources behind an answer). The others require access we
// don't fabricate: they return an honest `available:false` until wired.

import { getApiKey } from '../config'
import type { AiEngine, CitationResult } from './types'

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function domainMatches(brand: string, url: string): boolean {
  const b = brand.replace(/^www\./, '').toLowerCase()
  const h = hostOf(url).toLowerCase()
  return h === b || h.endsWith('.' + b)
}

/** Live probe against Perplexity. Real citations, or honest unavailable. */
async function probePerplexity(query: string, brandDomain: string, apiKey: string | null): Promise<CitationResult> {
  const base: CitationResult = {
    engine: 'perplexity',
    query,
    available: false,
    cited: false,
    position: null,
    citedUrl: null,
    sourceCount: 0,
    checkedAt: new Date().toISOString(),
  }
  if (!apiKey) {
    return { ...base, message: 'Perplexity not connected. Add a PERPLEXITY_API_KEY to track AI-answer citations.' }
  }
  let res: Response
  try {
    res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: query }] }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    return { ...base, message: `Could not reach Perplexity: ${err instanceof Error ? err.message : 'network error'}` }
  }
  if (!res.ok) {
    return { ...base, message: `Perplexity returned HTTP ${res.status}.` }
  }
  const data = (await res.json()) as {
    citations?: string[]
    search_results?: { url?: string }[]
  }
  const sources = (data.citations ?? data.search_results?.map((s) => s.url ?? '') ?? []).filter(Boolean) as string[]
  let position: number | null = null
  let citedUrl: string | null = null
  sources.forEach((url, i) => {
    if (position === null && domainMatches(brandDomain, url)) {
      position = i + 1
      citedUrl = url
    }
  })
  return {
    ...base,
    available: true,
    cited: position !== null,
    position,
    citedUrl,
    sourceCount: sources.length,
  }
}

/** Engines we don't have grounded citation access to yet — honest, not faked. */
function unavailable(engine: AiEngine, query: string): CitationResult {
  return {
    engine,
    query,
    available: false,
    cited: false,
    position: null,
    citedUrl: null,
    sourceCount: 0,
    checkedAt: new Date().toISOString(),
    message: `${engine} citation tracking is not connected yet.`,
  }
}

export async function probe(engine: AiEngine, query: string, brandDomain: string): Promise<CitationResult> {
  if (engine === 'perplexity') {
    const key = await getApiKey('PERPLEXITY_API_KEY')
    return probePerplexity(query, brandDomain, key)
  }
  return unavailable(engine, query)
}
