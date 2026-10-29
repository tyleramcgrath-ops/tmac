import { notFound } from 'next/navigation'
import { StoreNav } from '@/components/StoreNav'
import { customersFrom, formatPrice, needsAction } from '@/lib/commerce'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export default async function CustomersPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const orders = await store.ordersForSite(site.id, { status: ['paid'] })
  const cur = site.store?.currency ?? 'USD'
  const all = customersFrom(orders)
  const q = (sp.q ?? '').trim().toLowerCase()
  const list = all.filter((c) => !q || `${c.name} ${c.email}`.toLowerCase().includes(q))
  const repeat = all.filter((c) => c.orders > 1).length
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <section className="stack store">
      <div className="sec-head">
        <div>
          <h2>Customers</h2>
          <p className="muted">Everyone who has bought from you, best customers first. Made from your orders, so there’s nothing to keep up to date.</p>
        </div>
      </div>
      <StoreNav siteId={site.id} on="customers" toSend={orders.filter(needsAction).length} />
      {all.length > 0 && (
        <div className="stats">
          <div className="stat"><span className="stat-label">Customers</span><strong>{all.length}</strong></div>
          <div className="stat"><span className="stat-label">Came back</span><strong>{repeat}</strong><span className="muted">{all.length ? `${Math.round((repeat / all.length) * 100)}% ordered again` : ''}</span></div>
          <div className="stat"><span className="stat-label">Average spend</span><strong>{formatPrice(Math.round(all.reduce((n, c) => n + c.spent, 0) / all.length), cur)}</strong><span className="muted">per customer</span></div>
        </div>
      )}
      {all.length === 0 ? (
        <p className="card muted">Your customers show up here after their first order.</p>
      ) : (
        <>
          <form method="get"><input className="input" name="q" defaultValue={sp.q} placeholder="Search by name or email" aria-label="Search customers" /></form>
          <div className="card launch-table">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th className="num">Spent</th><th>Last order</th></tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.email}>
                    <td><strong>{c.name}</strong></td>
                    <td><a href={`mailto:${c.email}`}>{c.email}</a></td>
                    <td>{c.orders}</td>
                    <td className="num">{formatPrice(c.spent, cur)}</td>
                    <td>{day(c.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Write to customers about their orders whenever you need to. Send marketing only to people who asked for it.</p>
        </>
      )}
    </section>
  )
}
