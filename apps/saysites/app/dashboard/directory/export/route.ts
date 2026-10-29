// The team's directory as a CSV (admins only), with the same range and
// filters as the page and every column.

import { isAdmin } from '@/lib/admin'
import { directoryCsv, directoryRows, filterRows, readDirectoryParams } from '@/lib/directory'
import { siteOrigin } from '@/lib/schema'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { dayString, daysBefore } from '@/lib/visits'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user || !isAdmin(user.email)) return new Response('Not found', { status: 404 })
  const { range, filter } = readDirectoryParams(Object.fromEntries(new URL(req.url).searchParams))
  const today = dayString(new Date())
  const raw = await getStore().directory(daysBefore(today, range.days))
  const web = new Map(raw.sites.map((s) => [s.id, siteOrigin(s.site)]))
  const rows = filterRows(directoryRows(raw).sites, filter).map((r) => ({ ...r, web: web.get(r.siteId) ?? '' }))
  return new Response(directoryCsv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="saysites-sites-${today}.csv"`, 'cache-control': 'no-store' } })
}
