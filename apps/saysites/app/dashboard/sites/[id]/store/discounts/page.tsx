import { notFound } from 'next/navigation'
import { Flash, StoreNav } from '@/components/StoreNav'
import { discountLabel, formatPrice, needsAction } from '@/lib/commerce'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { deleteDiscount, saveDiscount, toggleDiscount } from '../actions'

export default async function DiscountsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string; e?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const [uses, paid] = await Promise.all([store.discountUses(site.id), store.ordersForSite(site.id, { status: ['paid'], limit: 500 })])
  const cur = site.store?.currency ?? 'USD'
  const list = site.store?.discounts ?? []
  const today = new Date().toISOString().slice(0, 10)

  return (
    <section className="stack store">
      <div className="sec-head">
        <div>
          <h2>Discounts</h2>
          <p className="muted">Codes customers type in the cart, or deals that apply on their own. One money-off discount and free shipping can combine.</p>
        </div>
      </div>
      <StoreNav siteId={site.id} on="discounts" toSend={paid.filter(needsAction).length} />
      <Flash m={sp.m} e={sp.e} />

      {list.length > 0 && (
        <div className="card launch-table">
          <table>
            <thead><tr><th>Discount</th><th>Gives</th><th>Rules</th><th>Used</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((d) => {
                const ended = (d.endsOn && d.endsOn < today) || (d.limit !== undefined && (uses[d.code] ?? 0) >= d.limit)
                return (
                  <tr key={d.code}>
                    <td><strong>{d.auto ? d.code.replace(/^AUTO-/, 'Automatic ') : d.code}</strong>{d.auto && <span className="muted small"> · automatic</span>}</td>
                    <td>{discountLabel(d, cur)}</td>
                    <td className="small">{[d.minSubtotal ? `Orders ${formatPrice(d.minSubtotal, cur)}+` : '', d.startsOn ? `From ${d.startsOn}` : '', d.endsOn ? `Until ${d.endsOn}` : '', d.limit ? `Up to ${d.limit} uses` : ''].filter(Boolean).join(' · ') || '–'}</td>
                    <td>{uses[d.code] ?? 0}</td>
                    <td><span className={`pill ${d.active && !ended ? 'ok' : ''}`}>{ended ? 'Ended' : d.active ? 'On' : 'Off'}</span></td>
                    <td className="btn-row">
                      <form action={toggleDiscount.bind(null, site.id, d.code)}><button className="btn btn-ghost btn-sm" type="submit">{d.active ? 'Turn off' : 'Turn on'}</button></form>
                      <form action={deleteDiscount.bind(null, site.id, d.code)}><button className="btn btn-ghost btn-sm danger" type="submit">Delete</button></form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <form action={saveDiscount.bind(null, site.id)} className="card stack">
        <h3>New discount</h3>
        <fieldset className="radio-row">
          <legend className="small muted">How it applies</legend>
          <label className="check"><input type="radio" name="how" value="code" defaultChecked /> A code customers type</label>
          <label className="check"><input type="radio" name="how" value="auto" /> Automatically, when the rules are met</label>
        </fieldset>
        <div className="field-row">
          <label className="field"><span>Code</span><input className="input" name="code" maxLength={30} placeholder="SPRING10" style={{ textTransform: 'uppercase' }} /></label>
          <label className="field"><span>Or a name, for automatic ones</span><input className="input" name="name" maxLength={30} placeholder="FREE-SHIP-50" style={{ textTransform: 'uppercase' }} /></label>
        </div>
        <fieldset className="radio-row">
          <legend className="small muted">What it gives</legend>
          <label className="check"><input type="radio" name="kind" value="percent" defaultChecked /> <input className="input sm" name="percent" inputMode="numeric" placeholder="10" aria-label="Percent off" /> % off</label>
          <label className="check"><input type="radio" name="kind" value="amount" /> <input className="input sm" name="amount" inputMode="decimal" placeholder="5" aria-label="Amount off" /> off the order</label>
          <label className="check"><input type="radio" name="kind" value="shipping" /> Free shipping</label>
        </fieldset>
        <div className="field-row">
          <label className="field"><span>Minimum order <em className="muted">(optional)</em></span><input className="input" name="min" inputMode="decimal" placeholder="50" /></label>
          <label className="field"><span>Total uses <em className="muted">(optional)</em></span><input className="input" name="limit" inputMode="numeric" placeholder="100" /></label>
          <label className="field"><span>Starts</span><input className="input" name="starts" type="date" /></label>
          <label className="field"><span>Ends</span><input className="input" name="ends" type="date" /></label>
        </div>
        <button className="btn btn-primary" type="submit">Add discount</button>
        <p className="muted small" style={{ margin: 0 }}>Free, like everything in your Store: no add-ons to buy.</p>
      </form>
    </section>
  )
}
