import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'

export default async function Dashboard() {
  const user = await requireUser()
  const sites = await getStore().sitesForUser(user.id)
  return (
    <>
      <div className="dash-head">
        <h1>Hi {user.name.split(' ')[0]}, here are your websites</h1>
        {sites.length > 0 && <a className="btn btn-primary" href="/dashboard/new">New website</a>}
      </div>
      {sites.length === 0 ? (
        <div className="card empty">
          <h2>Let’s build your first website</h2>
          <p className="muted">Tell us a little about your business and your site will be ready in seconds.</p>
          <a className="btn btn-primary" href="/dashboard/new">Build my website</a>
        </div>
      ) : (
        <div className="cards">
          {sites.map((s) => (
            <a key={s.id} className="card site-card" href={`/dashboard/sites/${s.id}`}>
              <h2 style={{ margin: 0 }}>{s.business.name}</h2>
              <span className="url muted">{previewPath(s)}</span>
              <span><span className="pill ok">Live</span></span>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
