import { notFound } from 'next/navigation'
import { INTEGRATIONS, INTEGRATION_INFO } from '@/lib/crm-sync'
import { STAGES, STAGE_LABEL, fill, loadCrm, valuesFor, type LeadEventKind } from '@/lib/leads'
import { mailReady } from '@/lib/mail'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { addNote, deleteLead, emailLead, logCall, moveLead, resendLead, setFollowUp } from '../actions'

const NOTES: Record<string, { text: string; tone?: 'good' | 'bad' }> = {
  sent: { text: 'Email sent. It’s on the timeline below.', tone: 'good' },
  notsent: { text: 'The email didn’t send. The reason is on the timeline below.', tone: 'bad' },
  empty: { text: 'Add a subject and a message first.', tone: 'bad' },
}

const ICON: Record<LeadEventKind | 'lead', string> = { lead: 'Lead', note: 'Note', stage: 'Stage', email: 'Email', call: 'Call', sync: 'CRM', auto: 'Automatic', reminder: 'Reminder' }

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string; leadId: string }>; searchParams: Promise<{ note?: string }> }) {
  const [{ id, leadId }, { note }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const m = (await store.messagesForSite(site.id)).find((x) => x.id === leadId)
  if (!m) notFound()
  if (!m.read) await store.setMessageRead(site.id, m.id, true)
  const state = await loadCrm(store, site.id)
  const meta = state.leads[m.id] ?? { stage: 'new' as const, activity: [] }
  const base = `/dashboard/sites/${site.id}/leads`
  const tel = m.phone.replace(/[^\d+]/g, '')
  const v = valuesFor(site, m)
  const draftSubject = `Re: your message to ${site.business.name}`
  const draftBody = fill(`Hi {first},\n\nThank you for reaching out to {business}.\n\n\n\n${user.name || '{business}'}`, v)
  const connected = INTEGRATIONS.filter((k) => state.integrations[k]?.on)
  const flash = note ? NOTES[note] : undefined
  const timeline = [{ at: m.createdAt, kind: 'lead' as LeadEventKind | 'lead', text: `Sent a request from ${m.page === '/' ? 'your home page' : m.page}`, ok: undefined as boolean | undefined }, ...meta.activity].reverse()

  return (
    <section className="stack lead-detail">
      <p className="crumbs small"><a href={base}>Leads</a> / {m.name || 'Someone'}</p>
      {flash && <p className={`notice${flash.tone ? ` ${flash.tone}` : ''}`}>{flash.text}</p>}

      <div className="lead-top">
        <div>
          <h2>{m.name || 'Someone'}</h2>
          <p className="muted small" style={{ margin: 0 }}>
            {new Date(m.createdAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            {meta.contactedAt && <> · answered after {fmtWait(Date.parse(meta.contactedAt) - Date.parse(m.createdAt))}</>}
          </p>
        </div>
        <form action={moveLead.bind(null, site.id, m.id)} className="lead-stages" aria-label="Stage">
          {STAGES.map((s) => (
            <button key={s} type="submit" name="stage" value={s} className={s === meta.stage ? 'on' : undefined} aria-pressed={s === meta.stage}>{STAGE_LABEL[s]}</button>
          ))}
        </form>
      </div>

      <div className="lead-grid">
        <div className="stack">
          <div className="card">
            <p className="lead-msg">{m.body}</p>
            <div className="lead-contact">
              {m.phone && <a className="btn btn-primary" href={`tel:${tel}`}>Call {m.phone}</a>}
              {m.phone && <a className="btn btn-ghost" href={`sms:${tel}`}>Text</a>}
              {m.email && <a className="btn btn-ghost" href={`mailto:${m.email}?subject=${encodeURIComponent(draftSubject)}`}>{m.email}</a>}
            </div>
            {m.phone && (
              <form action={logCall.bind(null, site.id, m.id)}>
                <button className="btn btn-ghost btn-sm" type="submit">I called them</button>
              </form>
            )}
          </div>

          {m.email && (
            <div className="card">
              <div className="card-head"><h3>Email {v.first === 'there' ? 'them' : v.first}</h3>{!mailReady() && <span className="muted small">Not switched on yet</span>}</div>
              {mailReady() ? (
                <form action={emailLead.bind(null, site.id, m.id)} className="lead-email">
                  <label className="field"><span>Subject</span><input className="input" name="subject" defaultValue={draftSubject} maxLength={200} required /></label>
                  <label className="field"><span>Message</span><textarea className="input" name="body" rows={8} defaultValue={draftBody} required /></label>
                  <p className="muted small" style={{ margin: 0 }}>Sent from SaySites under {site.business.name}’s name. {site.business.email ? `Their reply goes to ${site.business.email}.` : 'Add your email in Settings so replies reach you.'}</p>
                  <button className="btn btn-primary" type="submit">Send email</button>
                </form>
              ) : (
                <p className="muted small">Sending from here starts once email is switched on for SaySites. Until then, <a href={`mailto:${m.email}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`}>reply from your own email</a>.</p>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-head"><h3>Timeline</h3></div>
            <form action={addNote.bind(null, site.id, m.id)} className="lead-note">
              <label className="sr-only" htmlFor="lead-note">Add a note</label>
              <textarea className="input" id="lead-note" name="note" rows={2} placeholder="Add a note: what they need, what you agreed…" maxLength={2000} required />
              <button className="btn btn-ghost btn-sm" type="submit">Add note</button>
            </form>
            <ol className="timeline">
              {timeline.map((e, i) => (
                <li key={i} className={e.ok === false ? 'bad' : undefined}>
                  <span className="tl-kind">{ICON[e.kind]}</span>
                  <span className="tl-text">{e.text}</span>
                  <time className="muted small" dateTime={e.at}>{new Date(e.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h3>Follow up</h3>
            <form action={setFollowUp.bind(null, site.id, m.id)} className="lead-follow">
              <label className="sr-only" htmlFor="lead-day">Follow-up date</label>
              <input className="input" id="lead-day" type="date" name="day" defaultValue={meta.followUpOn ?? ''} min={new Date().toISOString().slice(0, 10)} />
              <button className="btn btn-ghost btn-sm" type="submit">{meta.followUpOn ? 'Change' : 'Set'}</button>
            </form>
            <p className="muted small" style={{ marginBottom: 0 }}>{mailReady() ? 'You’ll get an email that morning.' : 'It shows at the top of Leads that day.'}</p>
          </div>

          <div className="card">
            <h3>Details</h3>
            <dl className="lead-dl">
              {m.email && <><dt>Email</dt><dd>{m.email}</dd></>}
              {m.phone && <><dt>Phone</dt><dd>{m.phone}</dd></>}
              <dt>Came from</dt><dd>{meta.source ? <>{meta.source.label}{meta.source.campaign ? ` (${meta.source.campaign})` : ''}</> : 'Search or direct'}</dd>
              {meta.source?.landing && meta.source.landing !== m.page && <><dt>First page they saw</dt><dd>{meta.source.landing === '/' ? 'Home page' : meta.source.landing}</dd></>}
              <dt>Sent from</dt><dd>{m.page === '/' ? 'Home page' : m.page}</dd>
            </dl>
          </div>

          <div className="card">
            <h3>Your CRM</h3>
            {connected.length ? (
              <>
                <p className="muted small">Sent to {connected.map((k) => INTEGRATION_INFO[k].name).join(', ')} when it arrived.</p>
                <form action={resendLead.bind(null, site.id, m.id)}>
                  <button className="btn btn-ghost btn-sm" type="submit">Send again</button>
                </form>
              </>
            ) : (
              <p className="muted small">Not connected. <a href={`${base}/integrations`}>Connect HubSpot, Salesforce or another CRM</a>.</p>
            )}
          </div>

          <details className="lead-delete">
            <summary className="btn btn-ghost btn-sm danger">Delete this lead</summary>
            <form action={deleteLead.bind(null, site.id, m.id)}>
              <p className="small">This removes {m.name || 'this lead'} and their message for good. Copies already sent to your CRM stay there.</p>
              <button className="btn btn-sm btn-danger" type="submit">Yes, delete it</button>
            </form>
          </details>
        </div>
      </div>
    </section>
  )
}

function fmtWait(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60_000))
  if (mins < 60) return `${mins} min`
  const h = Math.round(mins / 60)
  return h < 48 ? `${h} hours` : `${Math.round(h / 24)} days`
}
