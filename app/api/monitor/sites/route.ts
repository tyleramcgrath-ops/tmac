import { deleteSite, getSite, listSites, saveSite } from '@/lib/engine/monitoring/store'
import type { MonitoredSite, TrackedPage } from '@/lib/engine/monitoring/types'
import { validateCountry, validateKeyword, validateUrl } from '@/lib/engine/validate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function id(): string {
  return `site_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// GET /api/monitor/sites — list monitored sites (the Business Twin roster).
export async function GET() {
  const sites = await listSites()
  return Response.json({ sites })
}

// POST /api/monitor/sites — register a site + its tracked pages.
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const rawPages = Array.isArray(body.pages) ? body.pages : []
  if (rawPages.length === 0) return Response.json({ error: 'At least one page is required.' }, { status: 400 })

  const pages: TrackedPage[] = []
  for (const p of rawPages) {
    const page = p as Record<string, unknown>
    const url = validateUrl(String(page.url ?? ''))
    if (!url.ok) return Response.json({ error: `Page URL: ${url.error}` }, { status: 400 })
    const keyword = validateKeyword(String(page.keyword ?? ''))
    if (!keyword.ok) return Response.json({ error: `Keyword: ${keyword.error}` }, { status: 400 })
    const country = validateCountry(String(page.country ?? 'us'))
    if (!country.ok) return Response.json({ error: `Country: ${country.error}` }, { status: 400 })
    pages.push({
      url: url.value!,
      keyword: keyword.value!,
      country: country.value!,
      device: page.device === 'mobile' ? 'mobile' : 'desktop',
      language: page.language ? String(page.language) : undefined,
    })
  }

  let domain = String(body.domain ?? '').trim()
  if (!domain) {
    try {
      domain = new URL(pages[0].url).hostname
    } catch {
      domain = pages[0].url
    }
  }

  const now = new Date().toISOString()
  const site: MonitoredSite = {
    id: id(),
    domain,
    label: String(body.label ?? domain),
    pages,
    createdAt: now,
    updatedAt: now,
  }
  await saveSite(site)
  return Response.json({ site }, { status: 201 })
}

// DELETE /api/monitor/sites?id=... — stop watching a site.
export async function DELETE(request: Request) {
  const siteId = new URL(request.url).searchParams.get('id')
  if (!siteId) return Response.json({ error: 'Missing site id.' }, { status: 400 })
  if (!(await getSite(siteId))) return Response.json({ error: 'Site not found.' }, { status: 404 })
  await deleteSite(siteId)
  return Response.json({ ok: true })
}
