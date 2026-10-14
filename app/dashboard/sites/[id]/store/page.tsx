import { notFound } from 'next/navigation'
import { DayBars } from '@/components/DayBars'
import { Flash, StoreNav } from '@/components/StoreNav'
import { checkoutOpen, formatPrice, fulfillmentLabel, funnel, isLive, lowStock, needsAction, orderName, setupSteps, shopStats, variantLabel } from '@/lib/commerce'
import { walk } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { dayString, daysBefore } from '@/lib/visits'

export default async function StoreHome({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string; e?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const shop = site.store
  const base = `/dashboard/sites/${site.id}/store`
  const today = dayString(new Date())
  const since = daysBefore(today, 29)
  const days = Array.from({ length: 30 }, (_, i) => daysBefore(today, 29 - i))
  const [orders, visits, pages, stock, error] = await Promise.all([
    store.ordersForSite(site.id),
    store.visitsSince(site.id, since),
    store.pagesForSite(site.id),
    store.stock(site.id),
    store.cacheGet(`shop-error:${site.id}`, 3 * 86_400_000) as Promise<{ at: string; message: string } | null>,
  ])
  const shopShown = pages.some((p) => p.status === 'published' && [...walk(p.body)].some((el) => el.type === 'products'))
  const steps = setupSteps(shop, base, shopShown)
  const left = steps.filter((s) => !s.done)
  const cur = shop?.currency ?? 'USD'
  const stats = shopStats(orders, since, days)
  const f = funnel(visits, stats.orders)
  const low = shop ? lowStock(shop, stock) : []
  const toSend = orders.filter(needsAction)
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '–')
  const m = (c: number) => formatPrice(c, cur)
  const state = !shop?.checkout?.ready ? { label: 'Checkout not connected', tone: 'warn' } : shop.open === false ? { label: 'Checkout paused', tone: 'warn' } : { label: 'Taking orders', tone: 'ok' }

  return (
    <section className="stack store">
      <div className="sec-head">
        <div>
          <h2>Store <span className={`pill ${state.tone}`}>{state.label}</span></h2>
          <p className="muted">Your shop, your orders, your money. Customers pay you through your own Stripe account and SaySites takes 0% of your sales.</p>
        </div>
        {shopShown && <a className="btn btn-ghost btn-sm" href={`${previewPath(site)}/shop`} target="_blank" rel="noopener">See your shop ↗</a>}
      </div>
      <StoreNav siteId={site.id} on="home" toSend={toSend.length} />
      <Flash m={sp.m} e={sp.e} />
      {error && checkoutOpen(shop) && <p className="notice bad">The last checkout didn’t start ({new Date(error.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}). Stripe said: {error.message.replace(/^Stripe: /, '')}</p>}

      {left.length > 0 && (
        <div className="card store-setup">
          <div className="card-head"><h3>Get ready to sell</h3><span className="muted small">{steps.length - left.length} of {steps.length} done</span></div>
          <ol className="setup-list">
            {steps.map((s) => (
              <li key={s.key} className={s.done ? 'done' : undefined}>
                <span className="setup-dot" aria-hidden="true">{s.done ? '✓' : ''}</span>
                {s.done ? <span>{s.label}</span> : <a href={s.href}>{s.label}</a>}
              </li>
            ))}
          </ol>
          <p className="muted small" style={{ margin: 0 }}>Or tell Sofie: “Add a product called Lavender candle for $24 with 12 in stock.”</p>
        </div>
      )}

      {(toSend.length > 0 || low.length > 0) && (
        <div className="store-todo">
          {toSend.length > 0 && (
            <a className="card todo" href={`${base}/orders?show=send`}>
              <strong>{toSend.length} order{toSend.length === 1 ? '' : 's'} to send</strong>
              <span className="muted small">Oldest: {orderName(toSend[toSend.length - 1])}, {fulfillmentLabel(toSend[toSend.length - 1]).toLowerCase()}</span>
            </a>
          )}
          {low.length > 0 && (
            <a className="card todo" href={`${base}/products`}>
              <strong>{low.length} running low</strong>
              <span className="muted small">{low.slice(0, 3).map((x) => `${x.product.name}${x.variant ? ` (${variantLabel(x.variant)})` : ''}: ${x.qty}`).join(' · ')}</span>
            </a>
          )}
        </div>
      )}

      <div className="stats lead-stats">
        <div className="stat"><span className="stat-label">Sales, 30 days</span><strong>{m(stats.sales)}</strong><span className="muted">{stats.refunded ? `${m(stats.refunded)} refunded` : 'before Stripe’s fee'}</span></div>
        <div className="stat"><span className="stat-label">Orders</span><strong>{stats.orders}</strong><span className="muted">{stats.returningRate === null ? 'none yet' : `${stats.returningRate}% from returning customers`}</span></div>
        <div className="stat"><span className="stat-label">Average order</span><strong>{stats.aov === null ? '–' : m(stats.aov)}</strong><span className="muted">per order</span></div>
        <div className="stat"><span className="stat-label">Profit</span><strong>{stats.profit === null ? '–' : m(stats.profit)}</strong><span className="muted">{stats.profit !== null ? 'after your costs, before Stripe’s fee' : stats.orders ? 'add your costs to products to see it' : 'shows after your first orders'}</span></div>
      </div>

      <div className="lead-grid">
        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Sales by day</h3><span className="muted small">last 30 days</span></div>
            <DayBars days={days} values={stats.byDay.map((d) => d.sales / 100)} label="Sales" format={(n) => formatPrice(Math.round(n * 100), cur)} />
          </div>
          <div className="card">
            <div className="card-head"><h3>Recent orders</h3><a className="small" href={`${base}/orders`}>All orders</a></div>
            {orders.filter((o) => o.status === 'paid').length === 0 ? (
              <p className="muted">No orders yet. When someone buys, you’ll get an email and it shows up here.</p>
            ) : (
              <div className="launch-table">
                <table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th></tr></thead>
                  <tbody>
                    {orders.filter((o) => o.status === 'paid').slice(0, 6).map((o) => (
                      <tr key={o.id}>
                        <td><a href={`${base}/orders/${o.id}`}>{orderName(o)}</a></td>
                        <td>{o.customer?.name ?? o.customer?.email ?? '–'}</td>
                        <td><span className={`pill ${needsAction(o) ? 'warn' : 'ok'}`}>{fulfillmentLabel(o)}</span></td>
                        <td className="num">{m(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>From visit to order</h3></div>
            <ol className="funnel">
              <li><span>Product page views</span><strong>{f.views}</strong></li>
              <li><span>Added to cart</span><strong>{f.adds}</strong><em>{pct(f.adds, f.views)}</em></li>
              <li><span>Went to checkout</span><strong>{f.checkouts}</strong><em>{pct(f.checkouts, f.adds)}</em></li>
              <li><span>Ordered</span><strong>{f.paid}</strong><em>{pct(f.paid, f.checkouts)}</em></li>
            </ol>
            <p className="muted small" style={{ margin: 0 }}>Counted without cookies or tracking scripts, so it never slows your site down.</p>
          </div>
          <div className="card">
            <div className="card-head"><h3>Best sellers</h3></div>
            {stats.top.length === 0 ? (
              <p className="muted small">Your best sellers show here after your first orders.</p>
            ) : (
              <ol className="top-list">
                {stats.top.map((t) => (
                  <li key={t.name}><span>{t.name}</span><span className="muted small">{t.qty} sold · {m(t.sales)}</span></li>
                ))}
              </ol>
            )}
            <p className="muted small" style={{ margin: 0 }}>{(shop?.products ?? []).filter(isLive).length} products on your site.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
