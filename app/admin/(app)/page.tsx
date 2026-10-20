import Link from 'next/link'
import { Bars, Kpi, Panel, RangePicker, Ranked, daysParam, fmt, pct } from '@/components/admin/ui'
import { KIND_LABEL, leadStats, listLeads, stageLabel } from '@/lib/admin/leads'
import { trafficStats } from '@/lib/admin/traffic'
import { ga4Configured, ga4Realtime, gscConfigured, gscOverview } from '@/lib/admin/google'
import { fmtDate } from '@/lib/site'
import { setupItems } from '@/lib/admin/setup'
import { STATES } from '@/lib/geo'
import { FIELDS, type FieldKey, allStates } from '@/lib/law/facts'
import { topicsFor } from '@/lib/law/topics'
import { TOOLS, statesFor } from '@/lib/law/tools'

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
  const setup = setupItems()
  const todo = setup.filter((s) => !s.on)
  const guides = STATES.reduce((n, s) => n + topicsFor(s.code).length, 0)
  const calcPages = TOOLS.reduce((n, t) => n + statesFor(t).length, 0)
  const facts = (Object.keys(FIELDS) as FieldKey[]).reduce((n, k) => n + allStates(k).length, 0)
  return (
    <>
      <div className="ad-head">
        <div><div className="eyebrow">Dashboard</div><h1>Overview</h1></div>
        <RangePicker days={days} base="/admin" />
      </div>
      {todo.length > 0 && (
        <div className="ad-start">
          <div className="ad-start-head">
            <h2>Finish setup: {setup.length - todo.length} of {setup.length} connected</h2>
            <p className="muted">Numbers below stay at zero until the pieces that collect them are connected. Google is connected by uploading its key file on the Settings page; the rest are environment variables in SiteGround (Site Tools → Devs → Node.js → Environment variables), followed by an app restart.</p>
          </div>
          <ul>
            {setup.map((s) => (
              <li key={s.key} className={s.on ? 'on' : ''}>
                <span className="ad-check" aria-hidden="true">{s.on ? '✓' : ''}</span>
                <div><b>{s.name}</b> <span className="muted">{s.on ? 'Connected' : s.env.map((e) => e).join(', ')}</span><br /><span className="ad-start-why">{s.unlocks}</span></div>
              </li>
            ))}
          </ul>
          <Link className="btn btn-primary btn-sm" href="/admin/settings">Step-by-step setup</Link>
        </div>
      )}
      <div className="ad-kpis">
        <Kpi label="State law guides live" value={guides} hint="Each fact cited" />
        <Kpi label="Calculator pages live" value={calcPages} hint={`${TOOLS.length} tools`} />
        <Kpi label="Verified legal facts" value={facts} />
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
