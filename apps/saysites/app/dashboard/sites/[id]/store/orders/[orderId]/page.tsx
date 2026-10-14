import { notFound } from 'next/navigation'
import { Flash } from '@/components/StoreNav'
import { CARRIERS, METHOD_LABEL, PAYMENT_LABEL, formatPrice, fulfillmentLabel, nextSteps, orderName, priceText } from '@/lib/commerce'
import { mailReady } from '@/lib/mail'
import { customerLink } from '@/lib/orders'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { fulfillOrder, noteOrder, refundOrderAction } from '../../actions'

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string; orderId: string }>; searchParams: Promise<{ m?: string; e?: string }> }) {
  const [{ id, orderId }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const o = await store.order(site.id, orderId)
  if (!o) notFound()
  const base = `/dashboard/sites/${site.id}/store`
  const m = (c: number) => formatPrice(c, o.currency)
  const a = o.customer?.address
  const steps = nextSteps(o)
  const shipping = o.method === 'ship' || o.method === 'express'
  const costed = o.lines.every((l) => l.cost !== undefined)
  const profit = costed ? o.total - o.tax - o.shipping - o.refunded - o.lines.reduce((n, l) => n + (l.cost ?? 0) * l.qty, 0) : null
  const left = o.total - o.refunded
  const paid = o.status === 'paid'
  const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <section className="stack lead-detail store">
      <p className="crumbs small"><a href={`${base}/orders`}>Orders</a> / {paid ? orderName(o) : 'Unfinished checkout'}</p>
      <Flash m={sp.m} e={sp.e} />
      <div className="lead-top">
        <div>
          <h2>
            {paid ? orderName(o) : 'Unfinished checkout'}{' '}
            {paid && <span className={`pill ${o.fulfillment === 'done' ? 'ok' : 'warn'}`}>{fulfillmentLabel(o)}</span>}{' '}
            <span className={`pill ${o.payment === 'paid' ? 'ok' : o.payment === 'pending' ? '' : 'bad'}`}>{paid ? PAYMENT_LABEL[o.payment] : o.status === 'abandoned' ? 'Not paid' : 'At checkout'}</span>
          </h2>
          <p className="muted small" style={{ margin: 0 }}>{when(o.paidAt ?? o.createdAt)} · {METHOD_LABEL[o.method]}</p>
        </div>
      </div>

      <div className="lead-grid">
        <div className="stack">
          {paid && steps.length > 0 && o.payment !== 'refunded' && (
            <div className="card">
              <div className="card-head"><h3>{shipping ? 'Send it' : o.method === 'pickup' ? 'Get it ready' : o.method === 'delivery' ? 'Deliver it' : 'Complete it'}</h3></div>
              {shipping && o.fulfillment === 'unfulfilled' ? (
                <form action={fulfillOrder.bind(null, site.id, o.id, 'shipped')} className="ship-form">
                  <label className="field"><span>Carrier</span><select className="input" name="carrier" defaultValue="USPS">{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select></label>
                  <label className="field"><span>Tracking number <em className="muted">(optional)</em></span><input className="input" name="tracking" maxLength={60} autoComplete="off" /></label>
                  <button className="btn btn-primary" type="submit">Mark shipped{o.customer?.email && mailReady() ? ' and email the customer' : ''}</button>
                </form>
              ) : (
                <div className="btn-row">
                  {steps.map((s, i) => (
                    <form key={s.to} action={fulfillOrder.bind(null, site.id, o.id, s.to)}>
                      <button className={`btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}`} type="submit">{s.label}</button>
                    </form>
                  ))}
                </div>
              )}
              {o.method === 'pickup' && site.store?.shipping?.pickup && <p className="muted small" style={{ margin: '10px 0 0' }}>Customers were told: “{site.store.shipping.pickup.note}”. Marking it ready emails them.</p>}
            </div>
          )}

          <div className="card">
            <div className="card-head"><h3>Items</h3></div>
            <ul className="order-lines">
              {o.lines.map((l, i) => (
                <li key={i}>
                  {l.image ? <img src={l.image.replace(/w=\d+/, 'w=160')} alt="" width={56} height={56} /> : <span className="pr-dot">{l.name.charAt(0)}</span>}
                  <div><strong>{l.name}</strong>{l.variant && <span className="muted small"> · {l.variant}</span>}{l.sku && <span className="muted small"> · {l.sku}</span>}<br /><span className="muted small">{l.qty} × {m(l.unit)}</span></div>
                  <strong>{m(l.total)}</strong>
                </li>
              ))}
            </ul>
            <dl className="order-sums">
              <div><dt>Subtotal</dt><dd>{m(o.subtotal)}</dd></div>
              {o.discount > 0 && <div><dt>Discount{o.discountCode ? ` (${o.discountCode})` : ''}</dt><dd>-{m(o.discount)}</dd></div>}
              {o.method !== 'none' && <div><dt>{METHOD_LABEL[o.method]}</dt><dd>{o.shipping ? m(o.shipping) : 'Free'}</dd></div>}
              {o.tax > 0 && <div><dt>Tax</dt><dd>{m(o.tax)}</dd></div>}
              <div className="tot"><dt>Total</dt><dd>{m(o.total)}</dd></div>
              {o.refunded > 0 && <div><dt>Refunded</dt><dd>-{m(o.refunded)}</dd></div>}
              {profit !== null && paid && <div><dt>Your profit</dt><dd>{m(profit)}</dd></div>}
            </dl>
            <p className="muted small" style={{ margin: 0 }}>Paid into your Stripe account. Stripe’s card fee comes out there; SaySites takes nothing.</p>
          </div>

          <div className="card">
            <div className="card-head"><h3>Timeline</h3></div>
            <form action={noteOrder.bind(null, site.id, o.id)} className="lead-note">
              <label className="sr-only" htmlFor="order-note">Add a note</label>
              <textarea className="input" id="order-note" name="note" rows={2} placeholder="Add a note: gift wrapped, called about the address…" maxLength={2000} required />
              <button className="btn btn-ghost btn-sm" type="submit">Add note</button>
            </form>
            <ol className="timeline">
              {[...o.timeline].reverse().map((e, i) => (
                <li key={i}>
                  <span className="tl-kind">{e.by ?? ''}</span>
                  <span className="tl-text">{e.text}</span>
                  <time className="muted small" dateTime={e.at}>{when(e.at)}</time>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Customer</h3></div>
            {o.customer?.name && <p style={{ margin: '0 0 4px' }}><strong>{o.customer.name}</strong></p>}
            {o.customer?.email && <p style={{ margin: '0 0 4px' }}><a href={`mailto:${o.customer.email}?subject=${encodeURIComponent(`Your order ${orderName(o)} from ${site.business.name}`)}`}>{o.customer.email}</a></p>}
            {o.customer?.phone && <p style={{ margin: '0 0 4px' }}><a href={`tel:${o.customer.phone.replace(/[^\d+]/g, '')}`}>{o.customer.phone}</a></p>}
            {!o.customer?.email && !o.customer?.name && <p className="muted small">Shows once they pay.</p>}
            {a && (
              <>
                <h4 className="small" style={{ margin: '14px 0 4px' }}>{o.method === 'delivery' ? 'Deliver to' : 'Ship to'}</h4>
                <address className="small" style={{ fontStyle: 'normal' }}>{a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{[a.city, a.state, a.postal].filter(Boolean).join(' ')}<br />{a.country}</address>
              </>
            )}
            {o.tracking?.number && <p className="small" style={{ margin: '14px 0 0' }}>Tracking: {o.tracking.url ? <a href={o.tracking.url} target="_blank" rel="noopener">{[o.tracking.carrier, o.tracking.number].filter(Boolean).join(' ')}</a> : [o.tracking.carrier, o.tracking.number].filter(Boolean).join(' ')}</p>}
            {paid && <p className="small" style={{ margin: '14px 0 0' }}><a href={customerLink(site, o)} target="_blank" rel="noopener">Their order page ↗</a></p>}
          </div>

          {paid && left > 0 && o.stripe.paymentIntent && (
            <details className="card">
              <summary><strong>Refund</strong></summary>
              <form action={refundOrderAction.bind(null, site.id, o.id)} className="stack" style={{ marginTop: 12 }}>
                <label className="field"><span>Amount</span><input className="input" name="amount" defaultValue={priceText(left)} inputMode="decimal" required /></label>
                {o.stockTaken && <label className="check"><input type="checkbox" name="restock" defaultChecked /> Put the items back in stock</label>}
                <button className="btn btn-ghost danger" type="submit">Refund through Stripe</button>
                <p className="muted small" style={{ margin: 0 }}>The money goes back to the customer’s card from your Stripe balance. Stripe keeps its original card fee.</p>
              </form>
            </details>
          )}
        </div>
      </div>
    </section>
  )
}
