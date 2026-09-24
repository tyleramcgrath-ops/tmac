import { notFound } from 'next/navigation'
import { checkPage, checkSpeed, pagePath, renderPage } from '@/lib'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { liveUrl, previewPath } from '@/lib/urls'

export default async function SitePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const pages = await store.pagesForSite(site.id)

  // The same checks that gate publishing, shown per page.
  const rows = pages.map((p) => {
    const issues = checkPage(p, pages)
    const speed = checkSpeed(renderPage(site, p, pages))
    return { page: p, errors: issues.filter((i) => i.severity === 'error'), warnings: issues.filter((i) => i.severity === 'warning'), speed }
  })
  const view = previewPath(site)

  return (
    <>
      {isNew && <p className="notice good"><strong>Your website is ready.</strong> Have a look, then come back here to make changes.</p>}
      <div className="dash-head">
        <div>
          <p className="muted" style={{ margin: 0 }}><a href="/dashboard">My sites</a> / {site.business.name}</p>
          <h1>{site.business.name}</h1>
        </div>
        <a className="btn btn-primary" href={view} target="_blank" rel="noopener">View my website</a>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Pages</h2>
          <table className="pages">
            <thead>
              <tr><th>Page</th><th>SEO</th><th>Speed</th></tr>
            </thead>
            <tbody>
              {rows.map(({ page, errors, warnings, speed }) => (
                <tr key={page.id}>
                  <td>
                    <a href={view + (pagePath(page) === '/' ? '' : pagePath(page))} target="_blank" rel="noopener"><strong>{page.name}</strong></a>
                    <div className="muted" style={{ fontSize: 14 }}>{page.seo.title}</div>
                    {(errors.length > 0 || warnings.length > 0) && (
                      <ul className="issues">{[...errors, ...warnings].map((i, n) => <li key={n}>{i.message}</li>)}</ul>
                    )}
                  </td>
                  <td>
                    {errors.length ? <span className="pill bad">Needs fixing</span> : warnings.length ? <span className="pill warn">{warnings.length} tip{warnings.length > 1 ? 's' : ''}</span> : <span className="pill ok">All good</span>}
                  </td>
                  <td>
                    {speed.pass ? <span className="pill ok">Fast</span> : <span className="pill bad">Too slow</span>}
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{Math.round((speed.htmlBytes + speed.cssBytes) / 100) / 10} KB</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <div className="card sofie-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div className="avatar" aria-hidden="true">S</div>
              <h2 style={{ margin: 0 }}>Sofie</h2>
              <span className="tag">Coming soon</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Soon you’ll change anything here by chatting: “make the top darker”, “add a section about emergencies”, “update our hours”. You’ll see each change before it goes live.
            </p>
          </div>

          <div className="card">
            <h2>Website details</h2>
            <dl className="facts">
              <dt>Address</dt>
              <dd><span className="url">{liveUrl(site).replace('https://', '')}</span><br /><span className="muted" style={{ fontSize: 13 }}>Goes live when saysites.com is connected. Until then, use “View my website”.</span></dd>
              <dt>Business</dt>
              <dd>{site.business.name}</dd>
              {site.business.phone && (<><dt>Phone</dt><dd>{site.business.phone}</dd></>)}
              {site.business.email && (<><dt>Email</dt><dd>{site.business.email}</dd></>)}
              <dt>Colors</dt>
              <dd style={{ display: 'flex', gap: 6 }}>
                {(['primary', 'secondary', 'accent', 'surface'] as const).map((c) => (
                  <span key={c} title={c} style={{ width: 22, height: 22, borderRadius: '50%', background: site.globals.colors[c], border: '1px solid var(--line)' }} />
                ))}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}
