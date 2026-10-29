import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Panel } from '@/components/admin/ui'
import { KIND_LABEL, STAGES, getLead, stageLabel } from '@/lib/admin/leads'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'
import { fmtDate } from '@/lib/site'
import { updateLead } from '../../../actions'

export const metadata: Metadata = { title: 'Lead' }
type Props = { params: Promise<{ id: string }> }

export default async function LeadPage({ params }: Props) {
  const l = await getLead((await params).id)
  if (!l) notFound()
  const practice = PRACTICE_AREAS.find((p) => p.slug === l.practice)
  const rows: [string, string | undefined][] = [
    ['Email', l.email], ['Phone', l.phone], ['Location', l.location], ['Legal issue', practice?.name ?? l.practice],
    ['Timing', l.data?.timing], ['Attorney', l.data?.attorney], ['Bar number', l.data?.bar], ['Firm', l.data?.firm], ['Sent from page', l.page],
  ]
  const src = l.source ?? {}
  return (
    <>
      <div className="ad-head">
        <div><div className="eyebrow"><Link href="/admin/leads">Leads</Link> · {KIND_LABEL[l.kind] ?? l.kind}</div><h1>{l.name}</h1><p className="muted">Received {fmtDate(l.created_at)} at {new Date(l.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET</p></div>
        <span className={`ad-stage big s-${l.stage}`}>{stageLabel(l.stage)}</span>
      </div>
      <div className="ad-grid">
        <Panel title="Details">
          <dl className="ad-dl">{rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{k === 'Email' ? <a href={`mailto:${v}`}>{v}</a> : k === 'Phone' ? <a href={`tel:${v}`}>{v}</a> : k === 'Sent from page' ? <Link href={v!}>{v}</Link> : v}</dd></div>)}</dl>
          {l.message && <><h3>Message</h3><p className="ad-msg">{l.message}</p></>}
        </Panel>
        <Panel title="Where they came from">
          <dl className="ad-dl">
            {[['Source', src.source], ['First page', src.landing], ['Referrer', src.referrer], ['Campaign', src.utm_campaign], ['Medium', src.utm_medium], ['Keyword', src.utm_term], ['Google Ads click', src.gclid ? 'Yes' : ''], ['First visit', src.first ? fmtDate(src.first) : '']]
              .filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <h3>Delivery</h3>
          <dl className="ad-dl">{Object.entries(l.delivered ?? {}).map(([k, ok]) => <div key={k}><dt>{k}</dt><dd>{ok ? 'Sent' : 'Failed'}</dd></div>)}</dl>
        </Panel>
        <Panel title="Update" wide>
          <form action={updateLead} className="ad-form">
            <input type="hidden" name="id" value={l.id} />
            <div className="field"><label htmlFor="stage">Stage</label>
              <select id="stage" name="stage" defaultValue={l.stage}>{STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
            </div>
            <div className="field"><label htmlFor="note">Add a note</label><textarea id="note" name="note" rows={3} placeholder="Called, left voicemail; referred to…" /></div>
            <button className="btn btn-primary">Save</button>
          </form>
          <div className="ad-quick">
            <a className="btn btn-ghost" href={`mailto:${l.email}?subject=${encodeURIComponent('Your LawMatchNow case review')}`}>Email {l.name.split(' ')[0]}</a>
            {l.phone && <a className="btn btn-ghost" href={`tel:${l.phone}`}>Call {l.phone}</a>}
          </div>
          <h3>History</h3>
          {l.activity?.length ? (
            <ul className="ad-timeline">{[...l.activity].reverse().map((a, i) => <li key={i}><span className="muted">{fmtDate(a.at)}</span> {a.text}</li>)}</ul>
          ) : <p className="muted">No activity yet.</p>}
        </Panel>
      </div>
    </>
  )
}
