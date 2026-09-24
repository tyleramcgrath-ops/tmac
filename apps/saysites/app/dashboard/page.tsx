import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { liveUrl, previewPath } from '@/lib/urls'

export default async function Dashboard() {
  const user = await requireUser()
  const store = getStore()
  const sites = await store.sitesForUser(user.id)
  const unread = await Promise.all(sites.map((s) => store.unreadCount(s.id)))
  return (
    <>
      <div className="dash-head">
        <div>
          <p className="crumbs">Dashboard</p>
          <h1>Hi {user.name.split(' ')[0]}, here are your websites</h1>
        </div>
        {sites.length > 0 && <a className="btn btn-primary" href="/dashboard/new">New website</a>}
      </div>
      {sites.length === 0 ? (
        <div className="card empty">
          <h2>Let’s build your first website</h2>
          <p className="muted">Tell us a little about your business and your site will be ready in seconds.</p>
          <a className="btn btn-primary" href="/dashboard/new">Build my website</a>
        </div>
      ) : (
        <div className="site-grid">
          {sites.map((s, i) => (
            <a key={s.id} className="card site-tile" href={`/dashboard/sites/${s.id}`}>
              <div className="tile-shot">
                <iframe src={previewPath(s)} title="" loading="lazy" tabIndex={-1} aria-hidden="true" />
              </div>
              <div className="tile-meta">
                <div>
                  <h2>{s.business.name}</h2>
                  <span className="url muted">{liveUrl(s).replace('https://', '')}</span>
                </div>
                <div className="tile-pills">
                  <span className="pill ok">Live</span>
                  {unread[i] > 0 && <span className="pill warn">{unread[i]} new message{unread[i] > 1 ? 's' : ''}</span>}
                </div>
              </div>
            </a>
          ))}
          <a className="card site-tile add-tile" href="/dashboard/new">
            <span className="add-plus" aria-hidden="true">+</span>
            <strong>New website</strong>
            <span className="muted small">Ready in seconds</span>
          </a>
        </div>
      )}
    </>
  )
}
