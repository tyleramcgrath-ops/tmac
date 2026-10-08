// The campaign as a CSV for the team's own sending tool (admins only): each
// business's personal link, unsubscribe link and the email wording.

import { isAdmin } from '@/lib/admin'
import { outreachEmail } from '@/lib/outreach'
import { outreachCsv } from '@/lib/prospects'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await currentUser()
  if (!user || !isAdmin(user.email)) return new Response('Not found', { status: 404 })
  const { slug } = await params
  const store = getStore()
  const c = (await store.campaigns()).find((x) => x.slug === slug)
  if (!c) return new Response('Not found', { status: 404 })
  const origin = new URL(req.url).origin
  const csv = outreachCsv(await store.prospects(slug), origin, (p, followUp) => outreachEmail(p, c, origin, followUp))
  return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="saysites-${slug.replace(/[^a-z0-9-]/g, '')}.csv"`, 'cache-control': 'no-store' } })
}
