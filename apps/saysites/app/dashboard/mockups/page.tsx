import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { markMockupSent } from './actions'

export const dynamic = 'force-dynamic'

// Free mockup requests (admins only). Make each one with
// `npx tsx scripts/mockup.ts <url>` and email the picture back.
export default async function MockupsPage() {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const list = await getStore().mockups()
  const waiting = list.filter((m) => m.status === 'new')
  const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
  return (
    <div className="stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Mockup requests</p>
          <h1>Mockup requests</h1>
          <p className="muted" style={{ margin: 0 }}>{waiting.length} waiting. Make each with <code>npx tsx scripts/mockup.ts &lt;their site&gt;</code>, email the picture, then mark it sent.</p>
        </div>
      </div>
      {list.length === 0 ? (
        <p className="card muted">No requests yet. They come from saysites.com/mockup.</p>
      ) : (
        <div className="card launch-table">
          <table>
            <thead><tr><th>Asked</th><th>Business</th><th>Website</th><th>From</th><th>Note</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td>{when(m.at)}</td>
                  <td>{m.business ?? '–'}</td>
                  <td><a href={m.url} target="_blank" rel="noopener noreferrer">{m.url.replace(/^https?:\/\//, '')}</a></td>
                  <td>{m.name}<br /><a className="small" href={`mailto:${m.email}?subject=${encodeURIComponent('Your free homepage mockup')}`}>{m.email}</a></td>
                  <td className="small" style={{ whiteSpace: 'normal', maxWidth: 260 }}>{m.note ?? ''}</td>
                  <td>
                    {m.status === 'sent' ? (
                      <span className="pill ok">Sent {m.sentAt ? when(m.sentAt) : ''}</span>
                    ) : (
                      <form action={markMockupSent.bind(null, m.id)}><button className="btn btn-ghost btn-sm" type="submit">Mark sent</button></form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
