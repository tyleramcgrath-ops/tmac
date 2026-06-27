// Keyword rank tracking for the /app tool.
//
// For each keyword, queries Google via SERP API and finds the target domain's
// position. Requires SERPAPI_KEY; without it, returns a graceful "connect a key"
// response so the UI can prompt for setup.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface RankRow {
  keyword: string
  position: number | null
  url: string | null
  topResult: string | null
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  let host = ''
  try {
    const u = String(body.domain ?? '')
    host = new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, '')
  } catch {
    return Response.json({ error: 'Enter a valid domain.' }, { status: 400 })
  }

  const keywords = (Array.isArray(body.keywords) ? body.keywords : [])
    .map((k) => String(k).trim())
    .filter(Boolean)
    .slice(0, 10)
  if (keywords.length === 0) {
    return Response.json({ error: 'Add at least one keyword.' }, { status: 400 })
  }

  const key = process.env.SERPAPI_KEY
  if (!key) {
    return Response.json({
      available: false,
      note: 'Connect a SERP API (set SERPAPI_KEY in your environment) to track live Google positions.',
      keywords,
    })
  }

  const rows: RankRow[] = []
  for (const keyword of keywords) {
    try {
      const endpoint = new URL('https://serpapi.com/search.json')
      endpoint.searchParams.set('engine', 'google')
      endpoint.searchParams.set('q', keyword)
      endpoint.searchParams.set('num', '100')
      endpoint.searchParams.set('api_key', key)
      const res = await fetch(endpoint)
      if (!res.ok) {
        rows.push({ keyword, position: null, url: null, topResult: null })
        continue
      }
      const data = await res.json()
      const organic: { link?: string; position?: number }[] = Array.isArray(data?.organic_results)
        ? data.organic_results
        : []
      const match = organic.find((r) => {
        try {
          return r.link && new URL(r.link).hostname.replace(/^www\./, '') === host
        } catch {
          return false
        }
      })
      rows.push({
        keyword,
        position: match?.position ?? null,
        url: match?.link ?? null,
        topResult: organic[0]?.link ?? null,
      })
    } catch {
      rows.push({ keyword, position: null, url: null, topResult: null })
    }
  }

  const tracked = rows.filter((r) => r.position !== null)
  return Response.json({
    available: true,
    domain: host,
    rows,
    summary: {
      tracked: tracked.length,
      top3: tracked.filter((r) => (r.position ?? 99) <= 3).length,
      top10: tracked.filter((r) => (r.position ?? 99) <= 10).length,
      avg:
        tracked.length > 0
          ? Math.round((tracked.reduce((a, r) => a + (r.position ?? 0), 0) / tracked.length) * 10) / 10
          : null,
    },
  })
}
