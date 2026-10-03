import { notFound } from 'next/navigation'
import { LeadsNav } from '@/components/LeadsNav'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { invitePath } from '@/lib/team'
import { cancelInvite, inviteStaff, removeStaff } from '../actions'

const NOTES: Record<string, { text: string; good?: boolean }> = {
  sent: { text: 'Invite sent. They’ll get an email with a link to join.', good: true },
  link: { text: 'Invite made. Copy the link below and send it to them yourself.', good: true },
  bad: { text: 'That email address doesn’t look right. Try again.' },
  many: { text: 'You have 20 invites waiting. Cancel some before sending more.' },
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// The team: staff who work this site's leads with their own login.
export default async function TeamPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ note?: string }> }) {
  const [{ id }, { note }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const [members, invites] = await Promise.all([store.membersForSite(site.id), store.invitesForSite(site.id)])
  const n = note ? NOTES[note] : undefined

  return (
    <section className="stack leads">
      <div className="sec-head">
        <div>
          <h2>Leads</h2>
          <p className="muted">Give your intake staff, paralegal or office manager their own login to work your leads.</p>
        </div>
      </div>
      <LeadsNav siteId={site.id} on="team" />
      {n && <p className={`notice${n.good ? ' good' : ''}`}>{n.text}</p>}

      <div className="card stack">
        <h3>Invite someone</h3>
        <p className="muted small">They can see and work every lead: move it along, call, email, add notes, set follow-ups and assign it. Your website, settings, billing, automations and integrations stay yours. Every change shows who made it.</p>
        <form action={inviteStaff.bind(null, site.id)} className="team-invite">
          <label className="field">
            <span>Their email</span>
            <input className="input" type="email" name="email" required maxLength={200} placeholder="name@yourfirm.com" autoComplete="off" />
          </label>
          <button className="btn">Send invite</button>
        </form>
      </div>

      <div className="card stack">
        <h3>Your team</h3>
        <ul className="team-list">
          <li>
            <span><strong>{user.name}</strong> <span className="muted small">{user.email}</span></span>
            <span className="muted small">Owner</span>
          </li>
          {members.map((m) => (
            <li key={m.userId}>
              <span><strong>{m.name}</strong> <span className="muted small">{m.email} · joined {day(m.addedAt)}</span></span>
              <form action={removeStaff.bind(null, site.id, m.userId)}>
                <button className="btn btn-ghost btn-sm">Remove</button>
              </form>
            </li>
          ))}
        </ul>
        {members.length === 0 && <p className="muted small">No one else yet.</p>}
      </div>

      {invites.length > 0 && (
        <div className="card stack">
          <h3>Waiting to join</h3>
          <ul className="team-list">
            {invites.map((i) => (
              <li key={i.code}>
                <span className="team-invite-link">
                  <strong>{i.email}</strong> <span className="muted small">invited {day(i.createdAt)}</span>
                  <input className="input" readOnly value={`https://saysites.com${invitePath(i.code)}`} aria-label={`Invite link for ${i.email}`} />
                </span>
                <form action={cancelInvite.bind(null, site.id, i.code)}>
                  <button className="btn btn-ghost btn-sm">Cancel</button>
                </form>
              </li>
            ))}
          </ul>
          <p className="muted small">The link works once, for that email address.</p>
        </div>
      )}
    </section>
  )
}
