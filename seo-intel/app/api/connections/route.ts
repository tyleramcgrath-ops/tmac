import { getSite, saveSite } from '@/lib/monitoring/store'
import type { MonitoredSite } from '@/lib/monitoring/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Connections = NonNullable<MonitoredSite['connections']>

// GET /api/connections?siteId=... — connection status for a site (never returns
// secrets, only connected flags + non-sensitive identifiers).
export async function GET(request: Request) {
  const siteId = new URL(request.url).searchParams.get('siteId')
  if (!siteId) return Response.json({ error: 'Missing siteId.' }, { status: 400 })
  const site = await getSite(siteId)
  if (!site) return Response.json({ error: 'Site not found.' }, { status: 404 })
  const c = site.connections ?? {}
  return Response.json({
    connections: {
      gsc: { connected: !!c.gsc?.connected, propertyUrl: c.gsc?.propertyUrl },
      ga4: { connected: !!c.ga4?.connected, propertyId: c.ga4?.propertyId },
      wordpress: { connected: !!c.wordpress?.connected, baseUrl: c.wordpress?.baseUrl },
      slack: { connected: !!c.slack?.connected, channel: c.slack?.channel },
      email: { connected: !!c.email?.connected, address: c.email?.address },
    },
  })
}

// POST /api/connections { siteId, slack?, email?, gsc?, ga4?, wordpress? }
// Sets delivery + data connections. Slack webhook / email address are stored on
// the site record so the Compass can reach out. GSC/GA4 accept a property id and
// are marked connected only when full OAuth lands — until then they stay honest.
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const siteId = String(body.siteId ?? '')
  if (!siteId) return Response.json({ error: 'Missing siteId.' }, { status: 400 })
  const site = await getSite(siteId)
  if (!site) return Response.json({ error: 'Site not found.' }, { status: 404 })

  const next: Connections = { ...(site.connections ?? {}) }

  const slack = body.slack as { webhookUrl?: string; channel?: string } | undefined
  if (slack) {
    const url = String(slack.webhookUrl ?? '').trim()
    if (url && !/^https:\/\/hooks\.slack\.com\//.test(url)) {
      return Response.json({ error: 'That does not look like a Slack incoming-webhook URL.' }, { status: 400 })
    }
    next.slack = url ? { connected: true, webhookUrl: url, channel: slack.channel } : { connected: false }
  }

  const email = body.email as { address?: string } | undefined
  if (email) {
    const addr = String(email.address ?? '').trim()
    if (addr && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      return Response.json({ error: 'That does not look like a valid email address.' }, { status: 400 })
    }
    next.email = addr ? { connected: true, address: addr } : { connected: false }
  }

  const gsc = body.gsc as { propertyUrl?: string } | undefined
  if (gsc) next.gsc = { connected: false, propertyUrl: String(gsc.propertyUrl ?? '').trim() || undefined }
  const ga4 = body.ga4 as { propertyId?: string } | undefined
  if (ga4) next.ga4 = { connected: false, propertyId: String(ga4.propertyId ?? '').trim() || undefined }
  const wp = body.wordpress as { baseUrl?: string } | undefined
  if (wp) {
    const base = String(wp.baseUrl ?? '').trim()
    next.wordpress = base ? { connected: true, baseUrl: base } : { connected: false }
  }

  site.connections = next
  site.updatedAt = new Date().toISOString()
  await saveSite(site)
  return Response.json({ ok: true, connections: next })
}
