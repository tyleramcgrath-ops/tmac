// Every paid order as a spreadsheet (CSV), for the owner's books.

import { ordersCsv } from '@/lib/commerce'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await currentUser()
  if (!user) return new Response('Not found', { status: 404 })
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) return new Response('Not found', { status: 404 })
  const csv = ordersCsv(await store.ordersForSite(site.id, { status: ['paid'] }))
  return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${site.subdomain}-orders-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store' } })
}
