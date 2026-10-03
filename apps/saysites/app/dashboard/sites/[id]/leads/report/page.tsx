import { notFound } from 'next/navigation'
import { LeadsNav } from '@/components/LeadsNav'
import { loadCrm } from '@/lib/leads'
import { buildReport, monthLabel, previousMonth, type MonthReport } from '@/lib/report'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { siteAccess } from '@/lib/team'

// The monthly results, as the owner gets them by email on the 1st.
export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string }> }) {
  const [{ id }, { m }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const access = await siteAccess(store, user.id, id)
  if (!access) notFound()
  const { site, role } = access
  const thisMonth = new Date().toISOString().slice(0, 7)
  const last = previousMonth()
  const month = m === last ? last : thisMonth
  const state = await loadCrm(store, site.id)
  const r = await buildReport(store, site, state, month)
  const base = `/dashboard/sites/${site.id}/leads`

  return (
    <section className="stack leads">
      <div className="sec-head">
        <div>
          <h2>Leads</h2>
          <p className="muted">Your results, month by month. This is also emailed to you on the 1st.</p>
        </div>
      </div>
      <LeadsNav siteId={site.id} on="report" role={role} />
      <div className="seg" role="group" aria-label="Month">
        <a href={`${base}/report?m=${last}`} aria-current={month === last ? 'page' : undefined}>{monthLabel(last)}</a>
        <a href={`${base}/report`} aria-current={month === thisMonth ? 'page' : undefined}>{monthLabel(thisMonth)} so far</a>
      </div>
      <Report r={r} />
    </section>
  )
}

function Report({ r }: { r: MonthReport }) {
  return (
    <div className="card report">
      <h3>{r.label}</h3>
      <div className="stats lead-stats">
        <div className="stat"><span className="stat-label">Leads</span><strong>{r.leads}</strong></div>
        <div className="stat"><span className="stat-label">Phone taps</span><strong>{r.calls}</strong></div>
        <div className="stat"><span className="stat-label">Page views</span><strong>{r.visitors}</strong></div>
        <div className="stat"><span className="stat-label">New clients</span><strong>{r.won}</strong></div>
      </div>
      <div className="report-grid">
        <div>
          <h4>Where leads came from</h4>
          {r.sources.length ? <ul className="report-list">{r.sources.map(([k, n]) => <li key={k}><span>{k}</span><b>{n}</b></li>)}</ul> : <p className="muted small">No leads this month yet.</p>}
        </div>
        <div>
          <h4>Most-read pages</h4>
          {r.topPages.length ? <ul className="report-list">{r.topPages.map(([p, n]) => <li key={p}><span>{p === '/' ? 'Home' : p}</span><b>{n}</b></li>)}</ul> : <p className="muted small">No visits recorded yet.</p>}
        </div>
        <div>
          <h4>Search</h4>
          <ul className="report-list">
            <li><span>SEO score</span><b>{r.seoScore ?? '–'}</b></li>
            <li><span>Typical time to answer</span><b>{r.responseMins === null ? '–' : r.responseMins < 60 ? `${r.responseMins} min` : `${Math.round(r.responseMins / 60)} h`}</b></li>
            {r.keywords.map((k) => <li key={k.keyword}><span>{k.keyword}</span><b>{k.position ?? 'Not yet'}</b></li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
