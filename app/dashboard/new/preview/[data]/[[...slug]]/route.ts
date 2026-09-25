// The live preview on the new-site form: the owner's own site, built from
// what they've typed so far, before anything is saved. Plain code, no AI,
// so it costs nothing. The details ride in the address (base64url JSON) so
// links inside the preview keep working.

import { serveSitePath } from '@/lib/serve'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { BUSINESS_TYPES, PALETTES, buildStarterSite, type BusinessTypeKey, type Design } from '@/lib/starter'

type Ctx = { params: Promise<{ data: string; slug?: string[] }> }

const DESIGNS: Design[] = ['bold', 'editorial', 'warm']

export async function GET(_req: Request, ctx: Ctx) {
  if (!(await currentUser())) return new Response('Please log in.', { status: 401 })
  const { data, slug = [] } = await ctx.params
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  } catch {
    return new Response('Bad preview.', { status: 400 })
  }
  const s = (k: string, max: number) => (typeof raw[k] === 'string' ? (raw[k] as string).slice(0, max) : '')
  const type = s('type', 20)
  if (!(type in BUSINESS_TYPES)) return new Response('Pick a kind of business.', { status: 400 })
  const palette = s('palette', 20)
  const design = s('design', 20) as Design
  const { site, pages } = buildStarterSite(
    {
      name: s('name', 120).trim() || 'Your business',
      type: type as BusinessTypeKey,
      city: s('city', 60).trim() || 'Your town',
      region: s('region', 40),
      phone: s('phone', 30),
      services: s('services', 1200).split(/\n|,/).map((x) => x.trim().slice(0, 80)).filter(Boolean),
      palette: palette in PALETTES ? palette : 'ocean',
      ...(DESIGNS.includes(design) ? { design } : {}),
    },
    'preview',
    'preview',
    { siteId: 'site_preview', now: '2026-01-01T00:00:00.000Z', taken: await getStore().photosTaken() }
  )
  const res = serveSitePath({ site, pages, redirects: [] }, slug, { preview: true, basePath: `/dashboard/new/preview/${data}` })
  const headers = new Headers(res.headers)
  headers.set('cache-control', 'private, max-age=60')
  return new Response(res.body, { status: res.status, headers })
}
