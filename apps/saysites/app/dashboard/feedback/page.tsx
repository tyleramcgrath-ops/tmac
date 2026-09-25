import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { formatDate } from '@/lib/render'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

// The SaySites team's inbox: everything sent with the Feedback button or
// the birthday page. Only emails in SAYSITES_ADMIN_EMAILS can see it.
export default async function FeedbackInbox() {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const items = await getStore().feedback(300)
  return (
    <div className="narrow stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Feedback</p>
          <h1>Feedback</h1>
          <p className="muted" style={{ margin: 0 }}>{items.length} message{items.length === 1 ? '' : 's'}, newest first.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="muted">Nothing yet. Share saysites.com/birthday and it’ll start coming in.</p>
      ) : (
        <div className="fb-list">
          {items.map((f) => (
            <article key={f.id} className="card fb-item">
              <strong>{f.name || 'Someone'}</strong>
              <span className="muted small">
                {' '}
                {f.email && <a href={`mailto:${f.email}`}>{f.email}</a>} · {formatDate(f.at)}
                {f.page ? ` · ${f.page}` : ''}
              </span>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
