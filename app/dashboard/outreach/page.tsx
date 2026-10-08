import { notFound } from 'next/navigation'
import { approveOwner } from '@/app/dashboard/sites/[id]/owner-actions'
import { isAdmin } from '@/lib/admin'
import { awaitingOwner } from '@/lib/ownership'
import { serpApiKey } from '@/lib/rankforge/serp'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { newCampaign } from './actions'

export const dynamic = 'force-dynamic'

const NOTES: Record<string, string> = {
  empty: 'Add a trade and a city, or paste a list of websites.',
  approved: 'Approved. That site can go live now.',
}

// Outreach, for the team (admins only): name a trade and a city, and
// SaySites finds the businesses, builds each a free redesign and drafts a
// city report (lib/outreach). Emails go out from the team's own tool.
export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ note?: string; owner?: string }> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const sp = await searchParams
  const store = getStore()
  const [campaigns, prospects, sites] = await Promise.all([store.campaigns(), store.prospects(), store.allSites()])
  const waiting = sites.filter(awaitingOwner)
  const count = (slug: string, f: (p: (typeof prospects)[number]) => unknown) => prospects.filter((p) => p.campaign === slug && f(p)).length
  const note = sp.note ? NOTES[sp.note] : sp.owner === 'approved' ? NOTES.approved : undefined

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Outreach</h2>
          <p className="muted">Name a trade and a city. SaySites finds the businesses, builds each a free redesign and drafts a city report. Download the list with each business’s personal link and the email wording, and send it from your own email tool.</p>
        </div>
      </div>
      {note && <p className="notice good">{note}</p>}

      <div className="card stack">
        <h3>What’s switched on</h3>
        <ul className="intake-qs">
          <li><strong>Finding businesses:</strong> {serpApiKey() ? 'On (Google search).' : 'Off: add SERPAPI_KEY to search by trade and city. Pasted lists work without it.'}</li>
          <li><strong>Building redesigns:</strong> In batches of 25, from each campaign’s page.</li>
          <li><strong>Email wording:</strong> {process.env.OUTREACH_ADDRESS ? 'Ready, with your postal address.' : 'Add OUTREACH_ADDRESS (your business postal address, required in every marketing email by US law) before sending.'}</li>
        </ul>
      </div>

      <form action={newCampaign} className="card stack">
        <h3>Start a campaign</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <label className="field"><span>Trade</span><input className="input" name="trade" placeholder="personal injury lawyer" maxLength={60} /></label>
          <label className="field"><span>City</span><input className="input" name="city" placeholder="Tulsa, OK" maxLength={60} /></label>
        </div>
        <label className="field">
          <span>Or paste websites, one per line (optional: an email and a name on the same line)</span>
          <textarea className="input" name="list" rows={4} placeholder={'smithlaw.com, jane@smithlaw.com, Smith Law\nrivertownplumbing.com'} />
        </label>
        <div><button className="btn btn-primary">Start</button></div>
      </form>

      {campaigns.length > 0 && (
        <div className="card">
          <h3>Campaigns</h3>
          <div className="seo-table-wrap">
            <table className="seo-table">
              <thead><tr><th>Campaign</th><th>Found</th><th>Built</th><th>With email</th><th>Opened</th><th>Claimed</th><th>Unsubscribed</th><th /></tr></thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.slug}>
                    <th><a href={`/dashboard/outreach/${c.slug}`}>{c.title}</a>{c.paused ? ' (paused)' : ''}</th>
                    <td>{count(c.slug, () => true)}</td>
                    <td>{count(c.slug, (p) => p.previewId)}</td>
                    <td>{count(c.slug, (p) => p.previewId && p.email && !p.noEmail)}</td>
                    <td>{count(c.slug, (p) => p.viewedAt)}</td>
                    <td>{count(c.slug, (p) => p.claimedAt)}</td>
                    <td>{count(c.slug, (p) => p.unsubscribedAt)}</td>
                    <td><a href={`/dashboard/outreach/${c.slug}`}>Open</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card stack">
        <h3>Claims waiting for an ownership check</h3>
        {waiting.length === 0 ? (
          <p className="muted">None right now. Most owners confirm themselves, through their business email or their domain.</p>
        ) : (
          <ul className="intake-qs">
            {waiting.map((s) => (
              <li key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span><strong>{s.business.name}</strong> <span className="muted small">{s.ownership?.domain ?? 'no website'}{s.business.phone ? `, ${s.business.phone}` : ''}{s.business.email ? `, ${s.business.email}` : ''}</span></span>
                <form action={approveOwner.bind(null, s.id)}><button className="btn btn-sm">Approve</button></form>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">Before approving, call the business on the number from its own website or Google listing and ask for the person who claimed it.</p>
      </div>
    </section>
  )
}
