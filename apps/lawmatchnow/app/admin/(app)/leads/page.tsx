import type { Metadata } from 'next'
import Link from 'next/link'
import { KIND_LABEL, STAGES, listLeads, stageLabel } from '@/lib/admin/leads'
import { fmtDate } from '@/lib/site'

export const metadata: Metadata = { title: 'Leads' }
type Props = { searchParams: Promise<{ stage?: string; kind?: string; q?: string }> }

export default async function Leads({ searchParams }: Props) {
  const { stage, kind, q } = await searchParams
  const leads = await listLeads({ stage, kind, search: q?.slice(0, 80) }).catch(() => [])
  const qs = (o: Record<string, string | undefined>) => `?${new URLSearchParams(Object.entries({ stage, kind, q, ...o }).filter(([, v]) => v) as [string, string][])}`
  return (
    <>
      <div className="ad-head">
        <div><div className="eyebrow">Pipeline</div><h1>Leads</h1></div>
        <a className="btn btn-ghost" href={`/admin/leads/export${qs({})}`}>Download CSV</a>
      </div>
      <div className="ad-filters">
        <nav className="ad-range">
          <Link href={qs({ stage: undefined })} className={!stage ? 'on' : undefined}>All open</Link>
          {STAGES.map((s) => <Link key={s.key} href={qs({ stage: s.key })} className={stage === s.key ? 'on' : undefined}>{s.label}</Link>)}
        </nav>
        <nav className="ad-range">
          <Link href={qs({ kind: undefined })} className={!kind ? 'on' : undefined}>All types</Link>
          {Object.entries(KIND_LABEL).map(([k, v]) => <Link key={k} href={qs({ kind: k })} className={kind === k ? 'on' : undefined}>{v}</Link>)}
        </nav>
        <form className="ad-search"><input name="q" defaultValue={q} placeholder="Search name, email, phone, city" />{stage && <input type="hidden" name="stage" value={stage} />}<button className="btn btn-ghost">Search</button></form>
      </div>
      <div className="cmp-wrap">
        <table className="cmp wide ad-table">
          <thead><tr><th>Received</th><th>Name</th><th>Type</th><th>Issue</th><th>Location</th><th>Source</th><th>Stage</th></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{fmtDate(l.created_at)}<small>{new Date(l.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET</small></td>
                <td><Link href={`/admin/leads/${l.id}`}><b>{l.name}</b></Link><small>{l.email}{l.phone ? ` · ${l.phone}` : ''}</small></td>
                <td>{KIND_LABEL[l.kind] ?? l.kind}</td>
                <td>{l.practice || '—'}</td>
                <td>{l.location || '—'}</td>
                <td>{l.source?.source ?? '—'}<small>{l.source?.landing ?? ''}</small></td>
                <td><span className={`ad-stage s-${l.stage}`}>{stageLabel(l.stage)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!leads.length && <p className="muted" style={{ marginTop: 20 }}>No leads match.</p>}
    </>
  )
}
