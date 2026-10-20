import Link from 'next/link'
import { Bars, Kpi, Panel, RangePicker, Ranked, daysParam, fmt, pct } from '@/components/admin/ui'
import { KIND_LABEL, leadStats, listLeads, stageLabel } from '@/lib/admin/leads'
import { trafficStats } from '@/lib/admin/traffic'
import { ga4Configured, ga4Realtime, gscConfigured, gscOverview } from '@/lib/admin/google'
import { fmtDate } from '@/lib/site'

type Props = { searchParams: Promise<{ d?: string }> }

export default async function Overview({ searchParams }: Props) {
  const days = daysParam((await searchParams).d)
  const [leads, traffic, latest, live, search] = await Promise.all([
    leadStats(days).catch(() => null),
    trafficStats(days).catch(() => null),
    listLeads({ limit: 8 }).catch(() => []),
    ga4Configured() ? ga4Realtime().catch(() => null) : null,
    gscConfigured() ? gscOverview(days).catch(() => null) : null,
  ])
  const conv = traffic && traffic.sessions ? (leads?.total ?? 0) / traffic.sessions : 0
  return (
    <>
      <div className="ad-head">
        <div><div className="eyebrow">Dashboard</div><h1>Overview</h1></div>
        <RangePicker days={days} base="/admin" />
      </div>
      <div className="ad-kpis">
        <Kpi label="Leads" value={leads?.total ?? 0} prev={leads?.prev} />
        <Kpi label="New, not contacted" value={leads?.open ?? 0} hint="All time" />
        <Kpi label="Visits (sessions)" value={traffic?.sessions ?? 0} prev={traffic?.prevSessions} />
        <Kpi label="Page views" value={traffic?.views ?? 0} prev={traffic?.prevViews} />
        <Kpi label="Visit → lead" value={pct(conv, 2)} />
        {live && <Kpi label="On the site now" value={live.total} hint="Google Analytics, real time" />}
        {search && <Kpi label="Google clicks" value={search.clicks} hint={`${fmt(search.impressions)} impressions`} />}
        {search && <Kpi label="Avg. Google position" value={search.position.toFixed(1)} />}
      </div>
      <div className="ad-grid">
        <Panel title="Visits and page views" wide>
          <Bars data={traffic?.byDay ?? []} a="sessions" b="views" labelA="Visits" labelB="Page views" />
        </Panel>
        <Panel title="Leads per day" wide>
          <Bars data={leads?.byDay ?? []} a="n" labelA="Leads" />
        </Panel>
        <Panel title="Latest leads" actions={<Link className="link-arrow" href="/admin/leads">All leads</Link>}>
          {latest.length ? (
            <ul className="ad-list">
              {latest.map((l) => (
                <li key={l.id}><Link href={`/admin/leads/${l.id}`}><b>{l.name}</b> · {KIND_LABEL[l.kind] ?? l.kind}{l.practice ? ` · ${l.practice}` : ''}{l.location ? ` · ${l.location}` : ''}</Link><span className={`ad-stage s-${l.stage}`}>{stageLabel(l.stage)}</span><span className="muted">{fmtDate(l.created_at)}</span></li>
              ))}
            </ul>
          ) : <p className="muted">No leads yet.</p>}
        </Panel>
        <Panel title="Where leads come from"><Ranked rows={leads?.bySource ?? []} empty="No leads yet." /></Panel>
        <Panel title="Pages that produce leads"><Ranked rows={leads?.byLanding ?? []} empty="No leads yet." /></Panel>
        <Panel title="Leads by legal issue"><Ranked rows={leads?.byPractice ?? []} empty="No leads yet." /></Panel>
        <Panel title="Traffic sources"><Ranked rows={(traffic?.sources ?? []).map((s) => ({ k: s.source, n: s.visits }))} /></Panel>
        <Panel title="Top pages"><Ranked rows={(traffic?.topPages ?? []).slice(0, 12).map((p) => ({ k: p.path, n: p.views }))} link={(k) => k} /></Panel>
        <Panel title="Key actions">
          <Ranked rows={Object.entries(traffic?.events ?? {}).map(([k, n]) => ({ k: ACTION[k] ?? k, n }))} empty="No actions recorded yet." />
        </Panel>
        {live && live.rows.length > 0 && <Panel title="Right now (Google Analytics)"><Ranked rows={live.rows.map((r) => ({ k: r.page, n: r.users }))} /></Panel>}
      </div>
    </>
  )
}

const ACTION: Record<string, string> = {
  case_review_click: 'Clicked “Free case review”',
  form_start: 'Started a form',
  lead_submit: 'Submitted a form',
  phone_click: 'Tapped a phone number',
  email_click: 'Clicked an email address',
  outbound_click: 'Clicked an outside link',
  profile_contact: 'Contacted an attorney',
  search: 'Searched the directory',
}
