import { notFound } from 'next/navigation'
import { Flash, StoreNav } from '@/components/StoreNav'
import { PRICES, canSell, loadAccess } from '@/lib/billing'
import { formatPrice, hasVariants, needsAction, priceRange, productPath, productSlugs, stockKey, variantLabel } from '@/lib/commerce'
import { walk } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { liveUrl, previewPath } from '@/lib/urls'
import { addShopPage } from '../../manage-actions'
import { priceFresh } from '@/lib/amazon'
import { addFromAmazon, setStockCount } from '../actions'

const STATUS: Record<string, { label: string; tone: string }> = { active: { label: 'Active', tone: 'ok' }, draft: { label: 'Draft', tone: '' }, unlisted: { label: 'Unlisted', tone: '' } }

export default async function ProductsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; c?: string; m?: string; e?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const base = `/dashboard/sites/${site.id}/store`
  const [pages, stock, paid, access] = await Promise.all([store.pagesForSite(site.id), store.stock(site.id), store.ordersForSite(site.id, { status: ['paid'], limit: 500 }), loadAccess(store, user)])
  const products = site.store?.products ?? []
  const cur = site.store?.currency ?? 'USD'
  const slugs = productSlugs(products)
  const shown = pages.some((p) => p.status === 'published' && [...walk(p.body)].some((el) => el.type === 'products'))
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]
  const q = (sp.q ?? '').trim().toLowerCase()
  const list = products.filter((p) => (!q || `${p.name} ${p.sku ?? ''} ${p.category ?? ''}`.toLowerCase().includes(q)) && (!sp.c || p.category === sp.c))
  const sell = canSell(access)
  const amazonOn = !!site.store?.amazon && !!(await store.amazonKeys(site.id))

  return (
    <section className="stack store">
      <div className="sec-head">
        <div>
          <h2>Products</h2>
          <p className="muted">What you sell, its price and how many you have.</p>
        </div>
        {sell && <a className="btn btn-primary btn-sm" href={`${base}/products/new`}>Add a product</a>}
      </div>
      <StoreNav siteId={site.id} on="products" toSend={paid.filter(needsAction).length} />
      <Flash m={sp.m} e={sp.e} />

      {!sell && (
        <div className="card">
          <h3>Selling online is on the Store plan</h3>
          <p className="muted">Products, a shop with a cart and checkout through your own Stripe, with 0% taken from your sales, for ${PRICES.store.month} a month.</p>
          <a className="btn btn-primary btn-sm" href="/dashboard/account#plan">See plans</a>
        </div>
      )}
      {products.length > 0 && !shown && (
        <div className="notice">
          <strong>Your products aren’t on your website yet.</strong> Add a Shop page and they’ll appear there, each with its own page search engines can read.
          <form action={addShopPage.bind(null, site.id)} style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" type="submit">Add a Shop page</button>
          </form>
        </div>
      )}
      {shown && <p className="notice good">Your shop is live. <a href={`${previewPath(site)}/shop`} target="_blank" rel="noopener">See it ↗</a></p>}


      {sell && (
        <details className="card stack amazon-add" open={products.length === 0 || !!sp.e?.includes('Amazon')}>
          <summary><strong>Add from Amazon</strong> <span className="muted small">Paste Amazon links; shoppers buy on Amazon and you earn the commission</span></summary>
          {amazonOn ? (
            <form action={addFromAmazon.bind(null, site.id)} className="stack">
              <label className="field"><span>Amazon product links, one per line (up to 30)</span><textarea className="input" name="links" rows={3} required placeholder={'https://www.amazon.com/dp/B0EXAMPLE1\nhttps://amzn.to/xxxxxxx'} /></label>
              <p className="muted small" style={{ margin: 0 }}>The name, photos, features and price come from Amazon and update every day. You can change the name and description after. Or tell Sofie: “Add this from Amazon: [link]”.</p>
              <button className="btn btn-primary btn-sm" type="submit">Add to my shop</button>
            </form>
          ) : (
            <p style={{ margin: 0 }}>First connect your Amazon Associates account (about 5 minutes). <a href={`${base}/settings#amazon`}>Connect Amazon</a></p>
          )}
        </details>
      )}

      {products.length > 0 && (
        <form method="get" className="order-filters">
          <input className="input" name="q" defaultValue={sp.q} placeholder="Search products" aria-label="Search products" />
          {cats.length > 0 && (
            <select className="input" name="c" defaultValue={sp.c ?? ''} aria-label="Section">
              <option value="">All sections</option>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <button className="btn btn-ghost btn-sm" type="submit">Show</button>
        </form>
      )}

      {products.length === 0 ? (
        <div className="card empty-shop">
          <h3>Add your first product</h3>
          <p className="muted">A name, a price and a photo is enough to start. Or tell Sofie: “Add a product called Lavender candle for $24.”</p>
          {sell && <a className="btn btn-primary" href={`${base}/products/new`}>Add a product</a>}
        </div>
      ) : (
        <div className="card launch-table product-table">
          <table>
            <thead><tr><th>Product</th><th>Status</th><th>Price</th><th>Stock</th><th>Section</th></tr></thead>
            <tbody>
              {list.map((p) => {
                const { min, max } = priceRange(p)
                const st = STATUS[p.status ?? 'active']
                return (
                  <tr key={p.id}>
                    <td>
                      <a className="prod-cell" href={`${base}/products/${p.id}`}>
                        {p.image ? <img src={p.image.src.replace(/w=\d+/, 'w=160')} alt="" width={44} height={44} /> : <span className="pr-dot">{p.name.charAt(0)}</span>}
                        <span><strong>{p.name}</strong>{hasVariants(p) && <span className="muted small"> · {p.variants!.length} options</span>}</span>
                      </a>
                    </td>
                    <td><span className={`pill ${st.tone}`}>{p.soldOut ? 'Sold out' : st.label}</span>{p.amazon && <span className="pill"> Amazon</span>}</td>
                    <td>{p.amazon ? (priceFresh(p) ? formatPrice(p.price, cur) : <span className="muted small">Updating</span>) : min === max ? formatPrice(min, cur) : `${formatPrice(min, cur)} to ${formatPrice(max, cur)}`}</td>
                    <td>
                      {p.amazon ? (
                        <span className="muted small">Sold by Amazon</span>
                      ) : !p.track ? (
                        <span className="muted small">Not counted</span>
                      ) : hasVariants(p) ? (
                        <details className="stock-pop">
                          <summary>{p.variants!.reduce((n, v) => n + Math.max(0, stock[stockKey(p.id, v.id)] ?? 0), 0)} in stock</summary>
                          {p.variants!.map((v) => (
                            <form key={v.id} action={setStockCount.bind(null, site.id, stockKey(p.id, v.id))} className="stock-row">
                              <span className="small">{variantLabel(v)}</span>
                              <input className="input" name="qty" type="number" min={0} defaultValue={stock[stockKey(p.id, v.id)] ?? 0} aria-label={`Stock for ${variantLabel(v)}`} />
                              <button className="btn btn-ghost btn-sm" type="submit">Set</button>
                            </form>
                          ))}
                        </details>
                      ) : (
                        <form action={setStockCount.bind(null, site.id, p.id)} className="stock-row">
                          <input className={`input${(stock[p.id] ?? 0) <= (site.store?.lowStock ?? 3) ? ' low' : ''}`} name="qty" type="number" min={0} defaultValue={stock[p.id] ?? 0} aria-label={`Stock for ${p.name}`} />
                          <button className="btn btn-ghost btn-sm" type="submit">Set</button>
                        </form>
                      )}
                    </td>
                    <td>{p.category ?? <span className="muted small">–</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {products.length > 0 && <p className="muted small">Each product has its own page on your site, like {liveUrl(site).replace('https://', '')}{productPath(slugs.get(products[0].id)!)}, with the price, stock and delivery details Google reads.</p>}
    </section>
  )
}
