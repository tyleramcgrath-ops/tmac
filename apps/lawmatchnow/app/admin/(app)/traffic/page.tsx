import type { Metadata } from 'next'
import { Bars, Kpi, Panel, RangePicker, Ranked, Setup, daysParam, fmt, pct } from '@/components/admin/ui'
import { ga4Configured, ga4Overview } from '@/lib/admin/google'
import { trafficStats } from '@/lib/admin/traffic'

export const metadata: Metadata = { title: 'Traffic' }
type Props = { searchParams: Promise<{ d?: string }> }

export default async function Traffic({ searchParams }: Props) {
  const days = daysParam((await searchParams).d)
  const [own, ga] = await Promise.all([
    trafficStats(days).catch(() => null),
    ga4Configured() ? ga4Overview(days).then((v) => ({ v }), (e: Error) => ({ error: e.message })) : null,
  ])
  return (
    <>
      <div className="ad-head">
        <div><div className="eyebrow">Analytics</div><h1>Traffic</h1></div>
        <RangePicker days={days} base="/admin/traffic" />
      </div>

      <h2 className="ad-h2">On-site counts</h2>
      <p className="muted">Counted by the site itself (no cookies, bots filtered). Ad blockers don&apos;t affect these.</p>
      <div className="ad-kpis">
        <Kpi label="Visits" value={own?.sessions ?? 0} prev={own?.prevSessions} />
        <Kpi label="Page views" value={own?.views ?? 0} prev={own?.prevViews} />
        <Kpi label="Pages per visit" value={own && own.sessions ? (own.views / own.sessions).toFixed(1) : '—'} />
        <Kpi label="Case review clicks" value={own?.events.case_review_click ?? 0} />
        <Kpi label="Phone taps" value={own?.events.phone_click ?? 0} />
        <Kpi label="Forms submitted" value={own?.events.lead_submit ?? 0} />
      </div>
      <div className="ad-grid">
        <Panel title="Visits and page views" wide><Bars data={own?.byDay ?? []} a="sessions" b="views" labelA="Visits" labelB="Page views" /></Panel>
        <Panel title="Sources"><Ranked rows={(own?.sources ?? []).map((s) => ({ k: s.source, n: s.visits }))} /></Panel>
        <Panel title="Sections of the site"><Ranked rows={(own?.sections ?? []).map((s) => ({ k: s.section, n: s.views }))} /></Panel>
        <Panel title="Top pages" wide><Ranked rows={(own?.topPages ?? []).map((p) => ({ k: p.path, n: p.views, extra: <small className="muted"> · {fmt(p.sessions)} entries</small> }))} link={(k) => k} /></Panel>
      </div>

      <h2 className="ad-h2">Google Analytics</h2>
      {!ga && <Setup title="Connect Google Analytics to see users, engagement, devices and regions here.">The tag (G-BB1PLHVBT0) is already collecting data. Add a service account to read it in this dashboard.</Setup>}
      {ga && 'error' in ga && <div className="ad-warn">Google Analytics: {ga.error}</div>}
      {ga && 'v' in ga && (
        <>
          <div className="ad-kpis">
            <Kpi label="Users" value={ga.v.users} />
            <Kpi label="New users" value={ga.v.newUsers} />
            <Kpi label="Sessions" value={ga.v.sessions} />
            <Kpi label="Page views" value={ga.v.views} />
            <Kpi label="Engagement rate" value={pct(ga.v.engagement)} />
            <Kpi label="Avg. session" value={`${Math.floor(ga.v.avgDuration / 60)}m ${Math.round(ga.v.avgDuration % 60)}s`} />
          </div>
          <div className="ad-grid">
            <Panel title="Users per day" wide><Bars data={ga.v.daily} a="users" b="sessions" labelA="Users" labelB="Sessions" /></Panel>
            <Panel title="Channels"><Ranked rows={ga.v.channels.map((c) => ({ k: c.k, n: c.n, extra: <small className="muted"> · {pct(c.engagement, 0)} engaged</small> }))} /></Panel>
            <Panel title="Sources"><Ranked rows={ga.v.sources} /></Panel>
            <Panel title="Devices"><Ranked rows={ga.v.devices} /></Panel>
            <Panel title="States / regions"><Ranked rows={ga.v.regions} /></Panel>
            <Panel title="Events"><Ranked rows={ga.v.events} /></Panel>
            <Panel title="Top pages (GA)"><Ranked rows={ga.v.pages.map((p) => ({ k: p.path, n: p.views }))} link={(k) => k} /></Panel>
          </div>
        </>
      )}
    </>
  )
}
