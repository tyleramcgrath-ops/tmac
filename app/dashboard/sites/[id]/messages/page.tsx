import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { removeMessage, setRead } from '../manage-actions'

export default async function MessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const messages = await store.messagesForSite(site.id)
  const unread = messages.filter((m) => !m.read).length

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Messages</h2>
          <p className="muted">
            {messages.length === 0 ? 'Messages people send from your website’s contact form show up here.' : `${messages.length} message${messages.length === 1 ? '' : 's'}${unread ? `, ${unread} new` : ''}.`}
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon" aria-hidden="true">✉</div>
          <h3>No messages yet</h3>
          <p className="muted">Your Contact page has a form. Try it yourself to see how it works.</p>
          <a className="btn btn-ghost" href={`${previewPath(site)}/contact`} target="_blank" rel="noopener">Open my Contact page ↗</a>
        </div>
      ) : (
        <ul className="inbox">
          {messages.map((m) => (
            <li key={m.id} className={m.read ? 'mail' : 'mail unread'}>
              <details open={!m.read}>
                <summary>
                  <span className="mail-dot" aria-hidden="true" />
                  <strong>{m.name || 'Someone'}</strong>
                  <span className="mail-snip">{m.body.slice(0, 120)}</span>
                  <time dateTime={m.createdAt}>{when(m.createdAt)}</time>
                </summary>
                <div className="mail-body">
                  <p className="mail-from">
                    {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
                    {m.phone && <a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>{m.phone}</a>}
                    <span className="muted">from {m.page === '/' ? 'your home page' : m.page}</span>
                  </p>
                  <p className="mail-text">{m.body}</p>
                  <div className="mail-actions">
                    {m.email && <a className="btn btn-primary btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to ${site.business.name}`)}`}>Reply by email</a>}
                    {m.phone && <a className="btn btn-ghost btn-sm" href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>Call</a>}
                    <form action={setRead.bind(null, site.id, m.id, !m.read)}>
                      <button className="btn btn-ghost btn-sm" type="submit">{m.read ? 'Mark as new' : 'Mark as read'}</button>
                    </form>
                    <form action={removeMessage.bind(null, site.id, m.id)}>
                      <button className="btn btn-ghost btn-sm danger" type="submit">Delete</button>
                    </form>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function when(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
