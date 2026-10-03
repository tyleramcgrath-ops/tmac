import { csvFor, loadCrm } from '@/lib/leads'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'

// Every lead as a spreadsheet (CSV), for the owner's own records.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await currentUser()
  if (!user) return new Response('Not found', { status: 404 })
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) return new Response('Not found', { status: 404 })
  const [messages, state] = await Promise.all([store.messagesForSite(site.id), loadCrm(store, site.id)])
  const name = `${site.subdomain}-leads-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(csvFor(messages, state), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' },
  })
}
