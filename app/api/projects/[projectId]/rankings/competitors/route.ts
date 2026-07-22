// Competitor keyword-rank comparison (free) — reuses the same SERP-based
// live position checker the "Check keyword rankings now" tool already uses
// (lib/foundation/serp.ts, gated on the user's own SERPAPI_KEY), applied to
// tracked competitor domains for the SAME keywords already tracked for this
// project. No paid competitor-intelligence API — every position is a live,
// honest lookup or an explicit "not ranking" / "no key configured".
//
// Capped (5 keywords x 3 competitors = up to 15 live SERP calls per request)
// so a single click can't fan out into an unbounded number of outbound
// requests or blow through a modest SERPAPI_KEY quota.

import { enforceRateLimit, handled, requireProjectRole, requireUser, HttpError } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { fetchKeywordPosition, hostOf, serpApiKey } from '@/lib/foundation/serp'

export const runtime = 'nodejs'

const MAX_KEYWORDS = 5
const MAX_COMPETITORS = 3

export const GET = handled(async (request, { params }) => {
  enforceRateLimit(request, 'rank-compare', 5)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  const key = serpApiKey()
  if (!key) return Response.json({ available: false, note: 'Connect a SERP API (set SERPAPI_KEY) to compare live positions against competitors.' })

  const [keywords, competitors] = await Promise.all([store.listTrackedKeywords(projectId), store.listCompetitors(projectId)])
  if (keywords.length === 0) throw new HttpError(400, 'Track at least one keyword first (Rankings tab) to compare it against competitors.')
  if (competitors.length === 0) throw new HttpError(400, 'Add at least one competitor first (Competitors tab) to compare rankings.')

  const trackedKeywords = keywords.slice(0, MAX_KEYWORDS)
  const trackedCompetitors = competitors.slice(0, MAX_COMPETITORS)

  let ourHost: string
  try {
    ourHost = hostOf(project.domain)
  } catch {
    throw new HttpError(400, 'Project domain is not a valid host.')
  }
  const competitorHosts = trackedCompetitors.map((c) => ({ label: c.label || c.domain, host: (() => { try { return hostOf(c.domain) } catch { return null } })() }))

  const rows = await Promise.all(
    trackedKeywords.map(async (k) => {
      const [ours, ...theirs] = await Promise.all([
        fetchKeywordPosition(k.keyword, ourHost, key),
        ...competitorHosts.map((c) => (c.host ? fetchKeywordPosition(k.keyword, c.host, key) : Promise.resolve({ keyword: k.keyword, position: null, url: null, topResult: null }))),
      ])
      return {
        keyword: k.keyword,
        us: ours.position,
        competitors: competitorHosts.map((c, i) => ({ label: c.label, position: theirs[i]?.position ?? null })),
      }
    })
  )

  return Response.json({
    available: true,
    domain: project.domain,
    keywordsCompared: trackedKeywords.length,
    keywordsTotal: keywords.length,
    competitorsCompared: trackedCompetitors.length,
    competitorsTotal: competitors.length,
    rows,
  })
})
