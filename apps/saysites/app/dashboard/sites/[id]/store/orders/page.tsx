import { notFound } from 'next/navigation'
import { Flash, StoreNav } from '@/components/StoreNav'
import { METHOD_LABEL, PAYMENT_LABEL, formatPrice, fulfillmentLabel, needsAction, orderName, type Order } from '@/lib/commerce'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

const VIEWS: { key: string; label: string; test: (o: Order) => boolean }[] = [
  { key: 'send', label: 'To send', test: needsAction },
  { key: 'all', label: 'All', test: (o) => o.status === 'paid' },
  { key: 'done', label: 'Done', test: (o) => o.status === 'paid' && o.fulfillment === 'done' },
  { key: 'refunded', label: 'Refunded', test: (o) => o.status === 'paid' && o.refunded > 0 },
  { key: 'abandoned', label: 'Didn’t finish checkout', test: (o) => o.status === 'abandoned' || (o.status === 'open' && Date.now() - Date.parse(o.createdAt) > 3_600_000) },
]

export default async function OrdersPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ show?: string; q?: string; m?: string; e?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const base = `/dashboard/sites/${site.id}/store`
  const orders = await store.ordersForSite(site.id)
  const toSend = orders.filter(needsAction)
  const view = VIEWS.find((v) => v.key === sp.show) ?? (toSend.length ? VIEWS[0] : VIEWS[1])
  const q = (sp.q ?? '').trim().toLowerCase()
  const shown = orders.filter((o) => view.test(o) && (!q || `${orderName(o)} ${o.customer?.name ?? ''} ${o.customer?.email ?? ''} ${o.lines.map((l) => l.name).join(' ')}`.toLowerCase().includes(q)))
  const when = (o: Order) => new Date(o.paidAt ?? o.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <section className="stack store">
      <div className="sec-head">
        <div>
          <h2>Orders</h2>
          <p className="muted">Everything people bought, and what still needs sending.</p>
        </div>
        {orders.some((o) => o.status === 'paid') && <a className="btn btn-ghost btn-sm" href={`${base}/orders/export`}>Download as a spreadsheet</a>}
      </div>
      <StoreNav siteId={site.id} on="orders" toSend={toSend.length} />
      <Flash m={sp.m} e={sp.e} />
      <div className="order-filters">
        <nav className="chips" aria-label="Show">
          {VIEWS.map((v) => {
            const n = orders.filter(v.test).length
            return (
              <a key={v.key} href={`${base}/orders?show=${v.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={v.key === view.key ? 'page' : undefined}>
                {v.label} <span className="muted">{n}</span>
              </a>
            )
          })}
        </nav>
        <form method="get" className="order-search">
          <input type="hidden" name="show" value={view.key} />
          <input className="input" name="q" defaultValue={sp.q} placeholder="Search name, email, order or product" aria-label="Search orders" />
        </form>
      </div>
      {shown.length === 0 ? (
        <p className="card muted">{view.key === 'send' ? 'Nothing to send. Nice.' : orders.length ? 'No orders match.' : 'No orders yet. When someone buys, you’ll get an email and it shows up here.'}</p>
      ) : (
        <div className="card launch-table">
          <table>
            <thead>
              <tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Delivery</th><th>Status</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <td><a href={`${base}/orders/${o.id}`}><strong>{o.status === 'paid' ? orderName(o) : 'Unfinished'}</strong></a></td>
                  <td>{when(o)}</td>
                  <td>{o.customer?.name ?? o.customer?.email ?? '–'}</td>
                  <td>{o.lines.reduce((n, l) => n + l.qty, 0)} item{o.lines.reduce((n, l) => n + l.qty, 0) === 1 ? '' : 's'}</td>
                  <td>{METHOD_LABEL[o.method]}</td>
                  <td>
                    {o.status === 'paid' ? (
                      <>
                        <span className={`pill ${needsAction(o) ? 'warn' : 'ok'}`}>{fulfillmentLabel(o)}</span>
                        {o.payment !== 'paid' && <> <span className="pill bad">{PAYMENT_LABEL[o.payment]}</span></>}
                      </>
                    ) : (
                      <span className="pill">{o.status === 'abandoned' ? 'Left at checkout' : 'At checkout'}</span>
                    )}
                  </td>
                  <td className="num">{formatPrice(o.total, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view.key === 'abandoned' && <p className="muted small">People who started checkout but didn’t pay. SaySites doesn’t email them on its own: they never agreed to marketing emails.</p>}
    </section>
  )
}
