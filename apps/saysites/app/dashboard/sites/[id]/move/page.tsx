import { notFound } from 'next/navigation'
import { MoveForm } from '@/components/MoveForm'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { importFromSite, publishImported } from '../manage-actions'

// Reading another site can take a while.
export const maxDuration = 120

export default async function MovePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ claimed?: string }> }) {
  const [{ id }, { claimed }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const [pages, redirects] = await Promise.all([store.pagesForSite(site.id), store.redirectsForSite(site.id)])
  const imported = pages.filter((p) => p.source)
  const drafts = imported.filter((p) => p.status === 'draft')
  const base = `/dashboard/sites/${site.id}`

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Move your website</h2>
          <p className="muted">Bring your pages over from your current website, whoever built it. We keep the same page addresses wherever we can and set up permanent redirects where we can’t, so the rankings you’ve earned come with you.</p>
        </div>
      </div>

      {claimed ? (
        <p className="notice good"><strong>Your redesigned site is saved.</strong> Your home, services and contact pages are live on your free address, and the pages we brought over are below as drafts. Publish them when you point your domain here.</p>
      ) : (
        <div className="card">
          <MoveForm action={importFromSite.bind(null, site.id)} />
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>How the switch works</h3>
        </div>
        <ol className="steps-sm">
          <li><strong>Import.</strong> We read your pages’ headings and text. Photos aren’t copied; upload your own in Photos, or ask Sofie.</li>
          <li><strong>Polish.</strong> Imported pages wait as drafts. Ask Sofie to tidy them up, match your new design, or merge thin pages.</li>
          <li><strong>Switch.</strong> Connect your domain in Settings, then publish the imported pages. Old addresses that changed redirect to the new pages automatically.</li>
        </ol>
      </div>

      {imported.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3>Imported pages</h3>
            {drafts.length > 0 && (
              <form action={publishImported.bind(null, site.id)}>
                <button className="btn btn-primary btn-sm" type="submit">Publish {drafts.length} imported page{drafts.length === 1 ? '' : 's'}</button>
              </form>
            )}
          </div>
          {!site.customDomain && drafts.length > 0 && <p className="notice" style={{ marginTop: 0 }}>Tip: connect your domain in <a href={`${base}/settings`}>Settings</a> before publishing, so the same words never live at two addresses.</p>}
          <table className="pages">
            <thead><tr><th>Page</th><th>Was</th><th>Now</th><th>Status</th></tr></thead>
            <tbody>
              {imported.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="muted small"><code>{new URL(p.source!).pathname}</code></td>
                  <td className="small">{p.status === 'published' ? <a href={`${previewPath(site)}/${p.slug}`} target="_blank" rel="noopener"><code>/{p.slug}</code></a> : <code>/{p.slug}</code>}</td>
                  <td>{p.status === 'published' ? <span className="pill ok">Live</span> : <span className="pill">Draft</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {redirects.length > 0 && (
        <details className="card">
          <summary><strong>{redirects.length} redirect{redirects.length === 1 ? '' : 's'}</strong> <span className="muted small">Old addresses and where they now go</span></summary>
          <ul className="small" style={{ marginTop: 12 }}>
            {redirects.map((r) => <li key={r.from}><code>{r.from}</code> → <code>{r.to}</code></li>)}
          </ul>
        </details>
      )}
    </section>
  )
}
