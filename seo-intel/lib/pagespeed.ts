import type { PageSpeedMetrics } from './types'

// Google PageSpeed Insights API v5. Works without an API key at low volume;
// a key raises rate limits substantially.

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function fetchPageSpeed(
  url: string,
  strategy: 'desktop' | 'mobile',
  apiKey: string | null
): Promise<PageSpeedMetrics> {
  const params = new URLSearchParams({ url, strategy })
  for (const category of ['performance', 'accessibility', 'best-practices', 'seo']) {
    params.append('category', category)
  }
  if (apiKey) params.set('key', apiKey)

  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params}`, { signal: AbortSignal.timeout(90_000) })
    if (res.status === 429) return psiError(url, strategy, 'PageSpeed API rate limit reached. Add a PAGESPEED_API_KEY to raise limits.')
    if (!res.ok) {
      let detail = `HTTP ${res.status}`
      try {
        const body = (await res.json()) as { error?: { message?: string } }
        if (body.error?.message) detail = body.error.message
      } catch { /* keep HTTP status */ }
      return psiError(url, strategy, `PageSpeed analysis failed: ${detail}`)
    }
    const data = (await res.json()) as Record<string, any>
    return parsePsiResponse(url, strategy, data)
  } catch (err) {
    const message = err instanceof Error && err.name === 'TimeoutError' ? 'PageSpeed analysis timed out.' : `PageSpeed request failed: ${err instanceof Error ? err.message : String(err)}`
    return psiError(url, strategy, message)
  }
}

export function parsePsiResponse(url: string, strategy: 'desktop' | 'mobile', data: Record<string, any>): PageSpeedMetrics {
  const lighthouse = data.lighthouseResult ?? {}
  const categories = lighthouse.categories ?? {}
  const audits = lighthouse.audits ?? {}

  const score = (cat: string): number | null => {
    const s = categories[cat]?.score
    return typeof s === 'number' ? Math.round(s * 100) : null
  }
  const numericValue = (audit: string): number | null => {
    const v = audits[audit]?.numericValue
    return typeof v === 'number' ? Math.round(v) : null
  }

  // INP from field data (CrUX) when present; lab fallback is total-blocking-time-adjacent.
  const fieldInp = data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile
  const cls = audits['cumulative-layout-shift']?.numericValue

  const opportunities: { title: string; savingsMs: number | null }[] = []
  for (const audit of Object.values(audits) as Record<string, any>[]) {
    if (audit?.details?.type === 'opportunity' && typeof audit.score === 'number' && audit.score < 0.9) {
      opportunities.push({
        title: String(audit.title ?? ''),
        savingsMs: typeof audit.details.overallSavingsMs === 'number' ? Math.round(audit.details.overallSavingsMs) : null,
      })
    }
  }
  opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0))

  return {
    url,
    strategy,
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
    lcpMs: numericValue('largest-contentful-paint'),
    cls: typeof cls === 'number' ? Number(cls.toFixed(3)) : null,
    inpMs: typeof fieldInp === 'number' ? fieldInp : null,
    fcpMs: numericValue('first-contentful-paint'),
    speedIndexMs: numericValue('speed-index'),
    opportunities: opportunities.slice(0, 8),
    error: null,
  }
}

function psiError(url: string, strategy: 'desktop' | 'mobile', error: string): PageSpeedMetrics {
  return {
    url, strategy,
    performance: null, accessibility: null, bestPractices: null, seo: null,
    lcpMs: null, cls: null, inpMs: null, fcpMs: null, speedIndexMs: null,
    opportunities: [], error,
  }
}
