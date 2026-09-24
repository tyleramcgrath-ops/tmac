import { notFound } from 'next/navigation'
import { SeoForm } from '@/components/SeoForm'
import { checkPage, checkSpeed, pagePath, renderPage, siteOrigin } from '@/lib'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { savePageSeo } from '../manage-actions'

export default async function PagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const pages = await store.pagesForSite(site.id)
  const nav = site.nav.map((n) => n.href)
  const order = (p: { slug: string }) => (p.slug === '' ? -1 : nav.indexOf(`/${p.slug}`) === -1 ? 99 : nav.indexOf(`/${p.slug}`))
  const rows = [...pages].sort((a, b) => order(a) - order(b)).map((p) => {
    const issues = checkPage(p, pages)
    const r = renderPage(site, p, pages)
    return { page: p, issues, speed: checkSpeed(r), kb: Math.round(Buffer.byteLength(r.html) / 100) / 10 }
  })

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Pages & SEO</h2>
          <p className="muted">How each page shows up on Google, and the checks every page must pass before it goes live.</p>
        </div>
        <a className="btn btn-ghost btn-sm" href={`/dashboard/sites/${site.id}/sofie`}>Add a page with Sofie</a>
      </div>
      {rows.map(({ page, issues, speed, kb }) => {
        const errors = issues.filter((i) => i.severity === 'error')
        const tips = issues.filter((i) => i.severity === 'warning')
        return (
          <article key={page.id} className="card page-card">
            <header className="page-card-head">
              <div>
                <h3>{page.name}</h3>
                <a className="url muted" href={previewPath(site) + (pagePath(page) === '/' ? '' : pagePath(page))} target="_blank" rel="noopener">{pagePath(page)} ↗</a>
              </div>
              <div className="page-pills">
                {errors.length ? <span className="pill bad">Needs fixing</span> : tips.length ? <span className="pill warn">{tips.length} SEO tip{tips.length > 1 ? 's' : ''}</span> : <span className="pill ok">SEO all good</span>}
                {speed.pass ? <span className="pill ok">Fast · {kb} KB</span> : <span className="pill bad">Too heavy</span>}
                {page.seo.noindex && <span className="pill warn">Hidden from Google</span>}
              </div>
            </header>
            {(errors.length > 0 || tips.length > 0) && <ul className="issues">{[...errors, ...tips].map((i, n) => <li key={n}>{i.message}</li>)}</ul>}
            <SeoForm
              action={savePageSeo.bind(null, site.id, page.id)}
              url={siteOrigin(site) + pagePath(page)}
              title={page.seo.title}
              description={page.seo.description}
              noindex={!!page.seo.noindex}
            />
          </article>
        )
      })}
    </section>
  )
}
