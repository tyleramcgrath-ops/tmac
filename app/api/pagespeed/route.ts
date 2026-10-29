// Core Web Vitals via Google PageSpeed Insights. Works without a key (rate
// limited); set PAGESPEED_API_KEY for higher quota.

import { normalizeUrl } from '../seo-scan/analyze'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const url = normalizeUrl(String(body.url ?? ''))
  if (!url) return Response.json({ error: 'Enter a valid URL.' }, { status: 400 })
  const strategy = body.strategy === 'desktop' ? 'desktop' : 'mobile'

  try {
    const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
    endpoint.searchParams.set('url', url)
    endpoint.searchParams.set('strategy', strategy)
    endpoint.searchParams.append('category', 'performance')
    if (process.env.PAGESPEED_API_KEY) endpoint.searchParams.set('key', process.env.PAGESPEED_API_KEY)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45_000)
    const res = await fetch(endpoint, { signal: controller.signal }).finally(() => clearTimeout(timer))
    if (!res.ok) {
      return Response.json({ available: false, error: `PageSpeed returned ${res.status}.` })
    }
    const data = await res.json()
    const lh = data?.lighthouseResult
    const a = lh?.audits ?? {}
    const perf = lh?.categories?.performance?.score
    const num = (k: string) => (typeof a[k]?.numericValue === 'number' ? a[k].numericValue : null)
    return Response.json({
      available: typeof perf === 'number',
      strategy,
      performance: typeof perf === 'number' ? Math.round(perf * 100) : null,
      lcpMs: num('largest-contentful-paint'),
      cls: num('cumulative-layout-shift') != null ? Math.round(num('cumulative-layout-shift')! * 1000) / 1000 : null,
      inpMs: num('interaction-to-next-paint') ?? num('total-blocking-time'),
      fcpMs: num('first-contentful-paint'),
      speedIndexMs: num('speed-index'),
    })
  } catch {
    return Response.json({ available: false, error: 'PageSpeed data unavailable.' })
  }
}
