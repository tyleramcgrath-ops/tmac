import { notFound } from 'next/navigation'
import { amazonUrl, priceFresh } from '@/lib/amazon'
import { Flash } from '@/components/StoreNav'
import { canSell, loadAccess } from '@/lib/billing'
import { formatPrice, hasVariants, priceText, productPath, productSlugs, stockKey, unitPrice, variantLabel } from '@/lib/commerce'
import type { Product } from '@/lib/schema'
import { productPhotos } from '@/lib/shop-admin'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { liveUrl, previewPath } from '@/lib/urls'
import { deleteProduct, duplicateProduct, saveProduct } from '../../actions'

export default async function ProductEditor({ params, searchParams }: { params: Promise<{ id: string; productId: string }>; searchParams: Promise<{ m?: string; e?: string }> }) {
  const [{ id, productId }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const products = site.store?.products ?? []
  const p: Product | undefined = products.find((x) => x.id === productId)
  const az = p?.amazon
  if (productId !== 'new' && !p) notFound()
  const base = `/dashboard/sites/${site.id}/store`
  const cur = site.store?.currency ?? 'USD'
  const [photos, stock, access] = await Promise.all([productPhotos(store, site.id), store.stock(site.id), loadAccess(store, user)])
  const slug = p ? productSlugs(products).get(p.id)! : ''
  const current = p ? [p.image, ...(p.images ?? [])].filter(Boolean).map((i) => i!) : []
  const chosen = new Set(current.map((i) => i.src))
  // Chosen photos first, in their order, then the rest to pick from.
  const grid = [...current, ...photos.filter((x) => !chosen.has(x.src))]
  const cats = [...new Set(products.map((x) => x.category).filter(Boolean))] as string[]
  const margin = p?.cost !== undefined && p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : null
  const opts = p?.options ?? []

  return (
    <section className="stack store product-editor">
      <p className="crumbs small"><a href={`${base}/products`}>Products</a> / {p?.name ?? 'New product'}</p>
      <Flash m={sp.m} e={sp.e} />
      {!canSell(access) && <p className="notice">Selling online is on the Store plan. <a href="/dashboard/account#plan">See plans</a></p>}
      <div className="sec-head">
        <h2>{p?.name ?? 'Add a product'}</h2>
        {p && (p.status ?? 'active') !== 'draft' && (
          <a className="btn btn-ghost btn-sm" href={`${previewPath(site)}${productPath(slug)}`} target="_blank" rel="noopener">See it on your site ↗</a>
        )}
      </div>

      <form action={saveProduct.bind(null, site.id, productId)} className="lead-grid">
        <div className="stack">
          <div className="card stack">
            <label className="field"><span>Name</span><input className="input" name="name" defaultValue={p?.name} maxLength={120} required placeholder="Lavender soy candle" /></label>
            <label className="field"><span>Short description <em className="muted">(on product cards)</em></span><input className="input" name="description" defaultValue={p?.description} maxLength={600} placeholder="Hand-poured in small batches. Burns for about 40 hours." /></label>
            <label className="field"><span>Full description <em className="muted">(on the product’s page; a blank line starts a new paragraph)</em></span><textarea className="input" name="details" rows={6} defaultValue={p?.details} maxLength={5000} placeholder="What it is, what it’s made of, sizes, care, anything a customer would ask." /></label>
          </div>

          {az ? (
            <div className="card stack">
              <div className="card-head"><h3>From Amazon</h3><span className="pill">Amazon pick</span></div>
              {p!.image && <img src={p!.image.src} alt={p!.image.alt} style={{ maxWidth: 220, height: 'auto', borderRadius: 8 }} />}
              <p style={{ margin: 0 }}>Shoppers buy this on Amazon through your Associates link, so it isn’t in your cart or checkout. Its photos and price come from Amazon and update every day{priceFresh(p!) ? `: ${formatPrice(p!.price, cur)} now` : ''}.</p>
              <p className="muted small" style={{ margin: 0 }}>ASIN {az.asin} on {az.market.replace('www.', '')}{az.checkedAt ? `, last updated ${new Date(az.checkedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}. <a href={amazonUrl(az, site.store?.amazon?.tag)} target="_blank" rel="noopener">See it on Amazon ↗</a></p>
            </div>
          ) : (
            <>
          <div className="card">
              <div className="card-head"><h3>Photos</h3><span className="muted small">Tick up to 9. The first one ticked is the main photo.</span></div>
              <div className="photo-pick">
                {grid.slice(0, 48).map((ph) => (
                  <label key={ph.src} className="photo-opt">
                    <input type="checkbox" name="photo" value={ph.src} defaultChecked={chosen.has(ph.src)} />
                    <img src={ph.src.replace(/w=\d+/, 'w=240')} alt={ph.alt} loading="lazy" />
                  </label>
                ))}
              </div>
              <label className="field" style={{ marginTop: 12 }}><span>Or a photo link</span><input className="input" name="photoUrl" placeholder="https://…" maxLength={500} /></label>
              <p className="muted small" style={{ margin: '8px 0 0' }}>Your own photos sell best. Upload them on the <a href={`/dashboard/sites/${site.id}/photos`}>Photos</a> tab and they show here first.</p>
            </div>
  
            <div className="card">
              <div className="card-head"><h3>Price</h3></div>
              <div className="field-row">
                <label className="field"><span>Price</span><input className="input" name="price" inputMode="decimal" defaultValue={p ? priceText(p.price) : ''} required placeholder="24" /></label>
                <label className="field"><span>Was <em className="muted">(optional)</em></span><input className="input" name="compareAt" inputMode="decimal" defaultValue={p?.compareAt ? priceText(p.compareAt) : ''} placeholder="30" /></label>
                <label className="field"><span>Your cost <em className="muted">(private)</em></span><input className="input" name="cost" inputMode="decimal" defaultValue={p?.cost !== undefined ? priceText(p.cost) : ''} placeholder="8" /></label>
              </div>
              <p className="muted small" style={{ margin: '8px 0 0' }}>
                {margin !== null ? `You make ${formatPrice(p!.price - p!.cost!, cur)} on each one (${margin}% margin), before Stripe’s card fee.` : 'Add your cost to see your profit on each sale. Shoppers never see it.'} A “was” price shows struck through, as a sale.
              </p>
            </div>
  
            <div className="card">
              <div className="card-head"><h3>Options</h3><span className="muted small">Like Size or Color. Up to 3, 100 combinations.</span></div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="field-row opt-row">
                  <label className="field"><span>Option {i + 1}</span><input className="input" name={`opt${i + 1}_name`} defaultValue={opts[i]?.name} maxLength={30} placeholder={['Size', 'Color', 'Scent'][i]} /></label>
                  <label className="field grow"><span>Choices, separated by commas</span><input className="input" name={`opt${i + 1}_values`} defaultValue={opts[i]?.values.join(', ')} maxLength={600} placeholder={['Small, Medium, Large', 'Black, Natural', 'Lavender, Cedar'][i]} /></label>
                </div>
              ))}
              {p && hasVariants(p) ? (
                <div className="launch-table" style={{ marginTop: 12 }}>
                  <table>
                    <thead><tr><th>Combination</th><th>Price</th><th>Was</th><th>Code (SKU)</th>{p.track && <th>Stock</th>}<th>Sold out</th></tr></thead>
                    <tbody>
                      {p.variants!.map((v) => (
                        <tr key={v.id}>
                          <td>{variantLabel(v)}</td>
                          <td><input className="input sm" name={`v_${v.id}_price`} defaultValue={priceText(unitPrice(p, v))} inputMode="decimal" aria-label={`Price for ${variantLabel(v)}`} /></td>
                          <td><input className="input sm" name={`v_${v.id}_compare`} defaultValue={v.compareAt ? priceText(v.compareAt) : ''} inputMode="decimal" aria-label={`Was price for ${variantLabel(v)}`} /></td>
                          <td><input className="input sm" name={`v_${v.id}_sku`} defaultValue={v.sku} maxLength={60} aria-label={`SKU for ${variantLabel(v)}`} /></td>
                          {p.track && <td><input className="input sm" name={`v_${v.id}_stock`} type="number" min={0} defaultValue={stock[stockKey(p.id, v.id)] ?? 0} aria-label={`Stock for ${variantLabel(v)}`} /></td>}
                          <td><input type="checkbox" name={`v_${v.id}_soldout`} defaultChecked={v.soldOut} aria-label={`${variantLabel(v)} sold out`} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted small" style={{ margin: '8px 0 0' }}>Save once you’ve added options, and each combination gets its own price, code and stock here.</p>
              )}
            </div>
            </>
          )}
        </div>

        <div className="stack">
          <div className="card stack">
            <div className="card-head"><h3>Status</h3></div>
            <select className="input" name="status" defaultValue={p?.status ?? 'active'} aria-label="Status">
              <option value="active">Active: on your site and in your shop</option>
              <option value="unlisted">Unlisted: only people with the link</option>
              <option value="draft">Draft: hidden</option>
            </select>
            <button className="btn btn-primary" type="submit">{p ? 'Save' : 'Add product'}</button>
          </div>

          {!az && <div className="card stack">
            <div className="card-head"><h3>Stock</h3></div>
            <label className="check"><input type="checkbox" name="track" defaultChecked={p?.track} /> Count stock</label>
            {!(p && hasVariants(p)) && <label className="field"><span>How many you have</span><input className="input" name="stock" type="number" min={0} defaultValue={p ? (stock[p.id] ?? 0) : ''} /></label>}
            <label className="check"><input type="checkbox" name="oversell" defaultChecked={p?.oversell} /> Keep selling at zero (made to order)</label>
            <label className="check"><input type="checkbox" name="soldOut" defaultChecked={p?.soldOut} /> Sold out for now</label>
            <label className="field"><span>Code (SKU) <em className="muted">(optional)</em></span><input className="input" name="sku" defaultValue={p?.sku} maxLength={60} /></label>
          </div>}

          <div className="card stack">
            <div className="card-head"><h3>Organize</h3></div>
            <label className="field"><span>Section of your shop</span><input className="input" name="category" list="cats" defaultValue={p?.category} maxLength={40} placeholder="Candles" /></label>
            <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            {!az && <label className="check"><input type="checkbox" name="noShipping" defaultChecked={p?.noShipping} /> No delivery needed (gift card, class, download)</label>}
            <label className="field"><span>Page address</span><input className="input" name="slug" defaultValue={slug} maxLength={80} placeholder="lavender-candle" /></label>
            <p className="muted small" style={{ margin: 0 }}>{liveUrl(site).replace('https://', '')}/shop/{slug || '…'}</p>
          </div>
        </div>
      </form>

      {p && (
        <div className="btn-row">
          <form action={duplicateProduct.bind(null, site.id, p.id)}><button className="btn btn-ghost btn-sm" type="submit">Duplicate</button></form>
          <form action={deleteProduct.bind(null, site.id, p.id)}><button className="btn btn-ghost btn-sm danger" type="submit">Delete product</button></form>
        </div>
      )}
    </section>
  )
}
