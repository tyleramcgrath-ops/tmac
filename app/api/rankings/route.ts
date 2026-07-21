// Keyword rank tracking for the /app tool.
//
// For each keyword, queries Google via SERP API and finds the target domain's
// position. Requires SERPAPI_KEY; without it, returns a graceful "connect a key"
// response so the UI can prompt for setup.

import { fetchKeywordPosition, hostOf, serpApiKey } from '@/lib/foundation/serp'

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

  let host = ''
  try {
    host = hostOf(String(body.domain ?? ''))
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

  const key = serpApiKey()
  if (!key) {
    return Response.json({
      available: false,
      note: 'Connect a SERP API (set SERPAPI_KEY in your environment) to track live Google positions.',
      keywords,
    })
  }

  const rows = []
  for (const keyword of keywords) {
    rows.push(await fetchKeywordPosition(keyword, host, key))
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
