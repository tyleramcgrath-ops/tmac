import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/ProductForm'
import { formatPrice } from '@/lib/render'
import { PHOTOS } from '@/lib/photos'
import { walk } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { addShopPage, deleteProduct, saveProduct, setCurrency } from '../manage-actions'

const CURRENCIES = ['USD', 'CAD', 'GBP', 'EUR', 'AUD'] as const

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const pages = await store.pagesForSite(site.id)
  const products = site.store?.products ?? []
  const currency = site.store?.currency ?? 'USD'
  const shown = pages.some((p) => [...walk(p.body)].some((el) => el.type === 'products'))
  const own = (await store.mediaForSite(site.id)).filter((m) => m.mime !== 'image/svg+xml').map((m) => ({ src: `/u/${m.id}`, alt: m.alt }))
  const photos = [...own, ...PHOTOS.store.cards, ...PHOTOS.bakery.cards, ...PHOTOS.restaurant.cards].map((p) => ({ src: p.src, alt: p.alt }))

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Products</h2>
          <p className="muted">Sell online and keep every cent. Customers pay you through your own Stripe account; SaySites takes 0%.</p>
        </div>
        <form action={setCurrency.bind(null, site.id)} className="currency">
          <label className="small muted" htmlFor="currency">Currency</label>
          <select id="currency" name="currency" className="input" defaultValue={currency}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" type="submit">Set</button>
        </form>
      </div>

      {products.length > 0 && !shown && (
        <div className="notice">
          <strong>Your products aren’t on your website yet.</strong> Add a Shop page and they’ll appear there, with Google-ready prices.
          <form action={addShopPage.bind(null, site.id)} style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" type="submit">Add a Shop page</button>
          </form>
        </div>
      )}
      {shown && (
        <p className="notice good">Your products are live on your website. <a href={`${previewPath(site)}/shop`} target="_blank" rel="noopener">See your shop ↗</a></p>
      )}

      <div className="card">
        <h3>Add a product</h3>
        <ProductForm action={saveProduct.bind(null, site.id, 'new')} values={{ name: '', price: '', description: '', imageSrc: '', imageAlt: '', buyUrl: '', soldOut: false }} photos={photos} isNew />
      </div>

      {products.map((p) => (
        <details key={p.id} className="card product-row">
          <summary>
            {p.image ? <img src={p.image.src.replace(/w=\d+/, 'w=160')} alt="" /> : <span className="pr-dot">{p.name.charAt(0)}</span>}
            <strong>{p.name}</strong>
            <span>{formatPrice(p.price, currency)}</span>
            {p.soldOut ? <span className="pill warn">Sold out</span> : p.buyUrl ? <span className="pill ok">Checkout on</span> : <span className="pill warn">No payment link</span>}
            <span className="muted small edit">Edit</span>
          </summary>
          <ProductForm
            action={saveProduct.bind(null, site.id, p.id)}
            values={{ name: p.name, price: (p.price / 100).toFixed(2).replace(/\.00$/, ''), description: p.description ?? '', imageSrc: p.image?.src ?? '', imageAlt: p.image?.alt ?? '', buyUrl: p.buyUrl ?? '', soldOut: !!p.soldOut }}
            photos={photos}
            isNew={false}
          />
          <form action={deleteProduct.bind(null, site.id, p.id)} className="del-row">
            <button className="btn btn-ghost btn-sm danger" type="submit">Delete product</button>
          </form>
        </details>
      ))}

      <div className="card">
        <h3>How to get a Stripe payment link</h3>
        <ol className="steps-sm">
          <li>Sign in to Stripe (free to set up) and open <strong>Payment Links</strong>.</li>
          <li>Create a link for the product with the same price.</li>
          <li>Copy the link (it starts with <code>https://buy.stripe.com/</code>) and paste it into the product here.</li>
        </ol>
        <p className="muted small">Stripe charges its normal card fee. SaySites adds nothing on top.</p>
      </div>
    </section>
  )
}
