import { notFound } from 'next/navigation'
import { SeoForm } from '@/components/SeoForm'
import { checkPage, checkSpeed, pagePath, renderPage, siteOrigin } from '@/lib'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { ActionForm } from '@/components/ActionForm'
import { vibeCheck } from '@/lib/vibe'
import { savePageSeo, saveVerification } from '../manage-actions'

export default async function PagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const pages = (await store.pagesForSite(site.id)).filter((p) => p.status === 'published')
  const nav = site.nav.map((n) => n.href)
  const order = (p: { slug: string }) => (p.slug === '' ? -1 : nav.indexOf(`/${p.slug}`) === -1 ? 99 : nav.indexOf(`/${p.slug}`))
  const rows = [...pages].sort((a, b) => order(a) - order(b)).map((p) => {
    const issues = checkPage(p, pages)
    const r = renderPage(site, p, pages)
    return { page: p, issues, speed: checkSpeed(r), kb: Math.round(Buffer.byteLength(r.html) / 100) / 10, vibe: vibeCheck(site, p, pages) }
  })

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Pages & SEO</h2>
          <p className="muted">How each page shows up on Google, and the checks every page must pass before it goes live.</p>
        </div>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-ghost btn-sm" href={`/dashboard/sites/${site.id}/move`}>Import from my old site</a>
          <a className="btn btn-ghost btn-sm" href={`/dashboard/sites/${site.id}/sofie`}>Add a page with Sofie</a>
        </span>
      </div>
      <details className="card verify">
        <summary><strong>Connect Google Search Console and Bing</strong><span className="muted small">{site.verification?.google || site.verification?.bing ? 'Connected' : 'See how your site does in search'}</span></summary>
        <ol className="steps-sm">
          <li>In <a href="https://search.google.com/search-console" target="_blank" rel="noopener">Google Search Console</a>, add a <strong>URL prefix</strong> property for your web address.</li>
          <li>Choose <strong>HTML tag</strong> and copy the tag it shows you.</li>
          <li>Paste it below, save, then press Verify in Search Console. Your sitemap is at <code>/sitemap.xml</code>.</li>
        </ol>
        <ActionForm action={saveVerification.bind(null, site.id)} submit="Save">
          <div className="row">
            <label className="field"><span>Google verification</span><input className="input" name="google" defaultValue={site.verification?.google ?? ''} placeholder='<meta name="google-site-verification" …>' /></label>
            <label className="field"><span>Bing verification</span><input className="input" name="bing" defaultValue={site.verification?.bing ?? ''} placeholder='<meta name="msvalidate.01" …>' /></label>
          </div>
        </ActionForm>
      </details>
      {rows.map(({ page, issues, speed, kb, vibe }) => {
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
                {page.seo.noindex ? <span className="pill warn">Hidden from Google</span> : vibe.indexable ? <span className="pill ok">Original · on Google</span> : <span className="pill warn">Held back from Google</span>}
              </div>
            </header>
            {(errors.length > 0 || tips.length > 0) && <ul className="issues">{[...errors, ...tips].map((i, n) => <li key={n}>{i.message}</li>)}</ul>}
            {!page.seo.noindex && !vibe.indexable && (
              <div className="vibe">
                <p><strong>Originality {vibe.originality}%.</strong> {vibe.held} Google only sees pages that pass, which keeps cookie-cutter pages off every SaySites site.</p>
                {vibe.blockers.map((b) => <p key={b} className="vibe-block">{b}</p>)}
                {vibe.templated.length > 0 && (
                  <details>
                    <summary className="small">{vibe.templated.length} sentence{vibe.templated.length === 1 ? '' : 's'} of starter wording to put in your own words</summary>
                    <ul className="small muted">{vibe.templated.slice(0, 12).map((t) => <li key={t}>{t}</li>)}</ul>
                  </details>
                )}
                {vibe.filler.length > 0 && <p className="small muted">Stock phrases: {vibe.filler.slice(0, 3).map((f) => `“${f}”`).join(' ')}</p>}
                <a className="btn btn-primary btn-sm" href={`/dashboard/sites/${site.id}/sofie?fill=${encodeURIComponent(`Rewrite the ${page.slug ? `${page.name} page` : 'home page'} completely in our own words, so none of the starter wording is left. What makes us different: `)}`}>Rewrite it with Sofie</a>
              </div>
            )}
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
