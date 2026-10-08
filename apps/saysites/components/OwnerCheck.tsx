import { sendOwnerCheck } from '@/app/dashboard/sites/[id]/owner-actions'
import type { Site } from '@/lib/schema'

const NOTES: Record<string, [string, string]> = {
  sent: ['good', 'Sent. Open the link in that email within 3 days, and your site can go live.'],
  confirmed: ['good', 'Confirmed. Your site can go live now.'],
  bad: ['bad', 'Type just the first part of the address, before the @.'],
  failed: ['bad', 'That email couldn’t be sent. Check the address and try again.'],
  nomail: ['bad', 'Email isn’t switched on yet. Use one of the other ways below.'],
}

// For a site claimed from a free redesign: it stays off the public web until
// the owner confirms the business is theirs (lib/ownership).
export function OwnerCheck({ site, note }: { site: Site; note?: string }) {
  const msg = note ? NOTES[note] : undefined
  if (!site.ownership) return null
  if (site.ownership.verified) return note === 'confirmed' && msg ? <p className={`notice ${msg[0]}`}>{msg[1]}</p> : null
  const d = site.ownership.domain
  return (
    <div className="card stack">
      <div>
        <h2>Confirm you run {site.business.name}</h2>
        <p className="muted">Anyone can make a free preview of any website, so your site stays private until you confirm it’s yours. You can keep editing it in the meantime. Pick one way:</p>
      </div>
      {msg && <p className={`notice ${msg[0]}`}>{msg[1]}</p>}
      {d && (
        <form action={sendOwnerCheck.bind(null, site.id)} className="stack">
          <label className="field">
            <span><strong>1. Get a link at your business email</strong></span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="input" name="local" placeholder="you" autoComplete="off" style={{ maxWidth: 220 }} required />
              <span>@{d}</span>
              <button className="btn">Send the link</button>
            </span>
          </label>
        </form>
      )}
      <p><strong>{d ? '2' : '1'}. Connect your domain.</strong> <span className="muted">Pointing {d ?? 'your domain'} at SaySites proves it’s yours and puts your site live in one step.</span> <a href={`/dashboard/sites/${site.id}/settings`}>Connect it in Settings</a></p>
      <p><strong>{d ? '3' : '2'}. Or let us check.</strong> <span className="muted">The SaySites team checks claims by hand, usually within one working day. Nothing to do; this note goes away once it’s done.</span></p>
    </div>
  )
}
