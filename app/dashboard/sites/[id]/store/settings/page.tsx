import { notFound } from 'next/navigation'
import { Flash, StoreNav } from '@/components/StoreNav'
import { needsAction, priceText } from '@/lib/commerce'
import { connectReady } from '@/lib/checkout'
import { mailReady } from '@/lib/mail'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { MARKET_LABEL } from '@/lib/amazon'
import { AMAZON_MARKETS } from '@/lib/schema'
import { disconnectAmazon, saveAmazon, saveCurrency, saveDelivery, saveShopRules, setShopOpen } from '../actions'

const CURRENCIES = ['USD', 'CAD', 'GBP', 'EUR', 'AUD'] as const

export default async function StoreSettings({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string; e?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const paid = await store.ordersForSite(site.id, { status: ['paid'], limit: 500 })
  const s = site.store
  const ship = s?.shipping?.ship
  const pickup = s?.shipping?.pickup
  const delivery = s?.shipping?.delivery
  const connected = s?.checkout
  const p = (c?: number) => (c === undefined ? '' : priceText(c))
  const amazon = s?.amazon
  const amazonKeys = await store.amazonKeys(site.id)
  const amazonErr = (await store.cacheGet(`amazon-error:${site.id}`, 3 * 86_400_000)) as { at: string; message: string } | null

  return (
    <section className="stack store">
      <div className="sec-head">
        <div>
          <h2>Store settings</h2>
          <p className="muted">How customers pay, how they get their order, and your return policy.</p>
        </div>
      </div>
      <StoreNav siteId={site.id} on="settings" toSend={paid.filter(needsAction).length} />
      <Flash m={sp.m} e={sp.e} />

      <div className="card stack" id="payments">
        <div className="card-head"><h3>Payments</h3>{connected?.ready ? <span className="pill ok">Connected</span> : <span className="pill warn">Not connected</span>}</div>
        {connected?.ready ? (
          <>
            <p style={{ margin: 0 }}>Customers pay on Stripe’s secure checkout and the money goes straight to your Stripe account. Stripe charges its normal card fee; <strong>SaySites takes 0%</strong>.</p>
            <p className="muted small" style={{ margin: 0 }}>Payouts, receipts and disputes live in your own Stripe dashboard. <a href="https://dashboard.stripe.com" target="_blank" rel="noopener">Open Stripe ↗</a></p>
            <div className="btn-row">
              {s?.open === false ? (
                <form action={setShopOpen.bind(null, site.id, true)}><button className="btn btn-primary btn-sm" type="submit">Start taking orders again</button></form>
              ) : (
                <form action={setShopOpen.bind(null, site.id, false)}><button className="btn btn-ghost btn-sm" type="submit">Pause checkout (vacation mode)</button></form>
              )}
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>Connect Stripe and customers can pay you right on your site, by card and, where Stripe offers them, Apple Pay and Google Pay. It takes about 10 minutes on Stripe’s own form (your business details and the bank account for payouts).</p>
            <ol className="steps-sm">
              <li>Click <strong>Connect Stripe</strong> below.</li>
              <li>Sign in to Stripe, or make a free account, and fill in Stripe’s form.</li>
              <li>You come back here, and checkout switches on by itself.</li>
            </ol>
            {connectReady() ? (
              <a className="btn btn-primary" href={`/dashboard/sites/${site.id}/store/connect`}>{connected ? 'Finish connecting Stripe' : 'Connect Stripe'}</a>
            ) : (
              <p className="notice">Checkout is being switched on for SaySites. Until then, products show with a “Buy now” link if you add a Stripe payment link, or “Ask about this”.</p>
            )}
            <p className="muted small" style={{ margin: 0 }}>Stripe charges its normal card fee. SaySites adds nothing on top, on any sale.</p>
          </>
        )}
        <form action={saveCurrency.bind(null, site.id)} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <label className="field" style={{ margin: 0, width: 200 }}><span>Currency</span><select className="input" name="currency" defaultValue={s?.currency ?? 'USD'}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <button className="btn btn-ghost btn-sm" type="submit">Set</button>
        </form>
      </div>


      <form action={saveAmazon.bind(null, site.id)} className="card stack" id="amazon">
        <div className="card-head"><h3>Amazon picks</h3>{amazon && amazonKeys ? <span className="pill ok">Connected</span> : <span className="pill">Not connected</span>}</div>
        <p style={{ margin: 0 }}>Show products from Amazon on your site with a <strong>Buy on Amazon</strong> button. Shoppers buy on Amazon and you earn the Amazon Associates commission. Then paste any Amazon product link on the Products page (or ask Sofie) and its name, photos, features and price fill in by themselves, and stay up to date every day.</p>
        {amazonErr && <p className="notice bad">The last daily update didn’t work ({new Date(amazonErr.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}): {amazonErr.message}</p>}
        {!amazonKeys && (
          <ol className="steps-sm">
            <li>Join Amazon Associates (free) at <a href="https://affiliate-program.amazon.com" target="_blank" rel="noopener">affiliate-program.amazon.com ↗</a>, for the country you sell in.</li>
            <li>Copy your <strong>tracking ID</strong> (it looks like mystore-20) from the top of Associates Central.</li>
            <li>In Associates Central, open <strong>Tools</strong>, then <strong>Creators API</strong>, and create credentials. Copy the <strong>Credential ID</strong> and <strong>Credential Secret</strong>.</li>
            <li>Paste all three below and press <strong>Connect Amazon</strong>.</li>
          </ol>
        )}
        <div className="field-row">
          <label className="field"><span>Associates tracking ID</span><input className="input" name="tag" defaultValue={amazon?.tag} placeholder="mystore-20" maxLength={40} required /></label>
          <label className="field"><span>Amazon store</span><select className="input" name="market" defaultValue={amazon?.market ?? 'www.amazon.com'}>{AMAZON_MARKETS.map((m) => <option key={m} value={m}>{MARKET_LABEL[m]}</option>)}</select></label>
        </div>
        <div className="field-row">
          <label className="field"><span>Credential ID</span><input className="input" name="credentialId" autoComplete="off" placeholder={amazonKeys ? `Saved (${amazonKeys.credentialId.slice(0, 4)}…)` : ''} maxLength={200} /></label>
          <label className="field"><span>Credential Secret</span><input className="input" name="credentialSecret" type="password" autoComplete="off" placeholder={amazonKeys ? 'Saved. Leave blank to keep it.' : ''} maxLength={400} /></label>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Your credentials stay private: they’re only used to look up products, never shown on your site or to Sofie. Prices show only while they’re under a day old, as Amazon requires, and your site says “As an Amazon Associate, we earn from qualifying purchases” wherever Amazon picks appear.</p>
        <div className="btn-row">
          <button className="btn btn-primary" type="submit">{amazonKeys ? 'Save' : 'Connect Amazon'}</button>
          {amazonKeys && <button className="btn btn-ghost btn-sm" type="submit" formAction={disconnectAmazon.bind(null, site.id)} formNoValidate>Disconnect</button>}
        </div>
      </form>

      <form action={saveDelivery.bind(null, site.id)} className="card stack" id="delivery">
        <div className="card-head"><h3>Getting orders to customers</h3></div>
        <p className="muted small" style={{ margin: 0 }}>Turn on any you offer. Customers choose at checkout.</p>

        <fieldset className="opt-block">
          <label className="check"><input type="checkbox" name="ship_on" defaultChecked={!!ship} /> <strong>Shipping</strong></label>
          <div className="field-row">
            <label className="field"><span>Price</span><input className="input" name="ship_rate" inputMode="decimal" defaultValue={p(ship?.rate)} placeholder="6" /></label>
            <label className="field"><span>Free over <em className="muted">(optional)</em></span><input className="input" name="ship_free" inputMode="decimal" defaultValue={p(ship?.freeOver)} placeholder="50" /></label>
            <label className="field"><span>Usually arrives in</span><input className="input" name="ship_days" defaultValue={ship?.days} maxLength={60} placeholder="3 to 5 business days" /></label>
          </div>
          <label className="field"><span>Countries (two-letter codes)</span><input className="input" name="ship_countries" defaultValue={(ship?.countries ?? ['US']).join(', ')} maxLength={200} /></label>
          <div className="field-row">
            <label className="field"><span>Express price <em className="muted">(optional)</em></span><input className="input" name="express_rate" inputMode="decimal" defaultValue={p(ship?.express?.rate)} placeholder="15" /></label>
            <label className="field"><span>Express arrives in</span><input className="input" name="express_days" defaultValue={ship?.express?.days} maxLength={60} placeholder="1 to 2 business days" /></label>
          </div>
        </fieldset>

        <fieldset className="opt-block">
          <label className="check"><input type="checkbox" name="pickup_on" defaultChecked={!!pickup} /> <strong>Pickup</strong> (free)</label>
          <label className="field"><span>Where and when</span><input className="input" name="pickup_note" defaultValue={pickup?.note} maxLength={300} placeholder="Our shop at 123 Main St, Monday to Saturday, 10am to 6pm" /></label>
        </fieldset>

        <fieldset className="opt-block">
          <label className="check"><input type="checkbox" name="delivery_on" defaultChecked={!!delivery} /> <strong>Local delivery</strong></label>
          <div className="field-row">
            <label className="field"><span>Price</span><input className="input" name="delivery_fee" inputMode="decimal" defaultValue={p(delivery?.fee)} placeholder="5" /></label>
            <label className="field"><span>Minimum order <em className="muted">(optional)</em></span><input className="input" name="delivery_min" inputMode="decimal" defaultValue={p(delivery?.minOrder)} placeholder="25" /></label>
          </div>
          <label className="field"><span>ZIP or postal codes you deliver to</span><textarea className="input" name="delivery_zips" rows={2} defaultValue={delivery?.zips.join(', ')} placeholder="43201, 43202, 43215 (M5V* covers every code starting M5V)" /></label>
          <label className="field"><span>Note for customers <em className="muted">(optional)</em></span><input className="input" name="delivery_note" defaultValue={delivery?.note} maxLength={300} placeholder="Delivered Tuesdays and Fridays" /></label>
        </fieldset>
        <button className="btn btn-primary" type="submit">Save delivery</button>
      </form>

      <form action={saveShopRules.bind(null, site.id)} className="card stack" id="returns">
        <div className="card-head"><h3>Returns, tax and alerts</h3></div>
        <fieldset className="opt-block">
          <label className="check"><input type="checkbox" name="returns_on" defaultChecked={!!s?.returns} /> <strong>Show a return policy</strong> (at /returns, on every product, and to Google)</label>
          <div className="field-row">
            <label className="field"><span>Days to return (0 for no returns)</span><input className="input" name="return_days" type="number" min={0} max={365} defaultValue={s?.returns?.days ?? 30} /></label>
            <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" name="return_free" defaultChecked={s?.returns?.free} /> Returns are free</label>
          </div>
          <label className="field"><span>Anything else customers should know <em className="muted">(optional)</em></span><textarea className="input" name="return_note" rows={3} defaultValue={s?.returns?.note} maxLength={1000} placeholder="Items must be unused and in their original packaging. Email us to start a return." /></label>
        </fieldset>
        <fieldset className="opt-block">
          <label className="check"><input type="checkbox" name="tax_auto" defaultChecked={s?.tax?.auto} /> <strong>Let Stripe add sales tax at checkout</strong></label>
          <p className="muted small" style={{ margin: 0 }}>Uses Stripe Tax: turn it on and add where you’re registered in your Stripe dashboard first (Stripe charges for it). Leave it off if your prices already include tax or you don’t collect any.</p>
        </fieldset>
        <div className="field-row">
          <label className="field"><span>Send new-order emails to</span><input className="input" name="notify" type="email" defaultValue={s?.notifyEmail} placeholder={user.email} maxLength={200} /></label>
          <label className="field"><span>Warn me when stock is at or under</span><input className="input" name="low" type="number" min={0} defaultValue={s?.lowStock ?? 3} /></label>
        </div>
        {!mailReady() && <p className="notice">Order emails start once email is switched on for SaySites.</p>}
        <button className="btn btn-primary" type="submit">Save</button>
      </form>
    </section>
  )
}
