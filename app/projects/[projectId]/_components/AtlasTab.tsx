'use client'

// Mission Atlas tab (Phase G): external SEO intelligence surfaced inside the
// existing project workspace. Its whole point is the evidence-grading
// discipline — every datum is badged Observed / Imported / Estimated /
// Unavailable, so the user never mistakes a gap for a fact. In this environment
// no external provider is reachable, so the tab honestly shows everything as
// unavailable with the reason, plus the morning briefing's "connect sources"
// guidance.

import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type AtlasSnapshotDTO, type CompetitorDTO, type EvidenceGradeDTO, type Ga4ChannelRowDTO, type Ga4ReportDTO, type Ga4TrendPointDTO, type GoogleBreakdownsDTO, type GoogleTrendsDTO, type GscBreakdownRowDTO, type GscReportDTO, type GscTrendPointDTO, type IntegrationDTO, type ObservationDTO, type OverlapDTO } from '../../../lib/client'
import { EmptyState, Field, inputClass, Spinner } from '../../../lib/ui'
import { findKeywordOpportunities } from '../../../../lib/foundation/reco/keyword-opportunities'
import { findKeywordCannibalization } from '../../../../lib/foundation/reco/keyword-cannibalization'
import { detectTrafficDecay } from '../../../../lib/foundation/reco/traffic-decay'
import { findLowCtrOutliers } from '../../../../lib/foundation/reco/ctr-outliers'

const GRADE_TONE: Record<EvidenceGradeDTO, string> = {
  observed: 'text-[var(--rf-green)] border-[var(--rf-green)]/40',
  imported: 'text-[var(--rf-blue-bright)] border-[var(--rf-blue-bright)]/40',
  estimated: 'text-yellow-300 border-yellow-400/40',
  unavailable: 'text-[var(--rf-faint)] border-[var(--rf-card-line)]',
}

function GradeBadge({ grade }: { grade: EvidenceGradeDTO }) {
  return <span className={`rf-mono rounded border px-1.5 py-0.5 text-[9px] uppercase ${GRADE_TONE[grade]}`}>{grade}</span>
}

function OverlapCell({ label, o }: { label: string; o: ObservationDTO<number> }) {
  // Unavailable values render '—' (never 0) and expose their reason on hover, so
  // a gap is never mistaken for a measured zero.
  return (
    <div className="flex items-center justify-between rounded border border-[var(--rf-card-line)] px-2 py-1" title={o.value === null ? o.evidence.note ?? 'unavailable' : `${o.evidence.grade} · ${o.evidence.source}`}>
      <span className="text-[11px] text-[var(--rf-muted)]">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`text-[11px] ${o.value === null ? 'text-[var(--rf-faint)]' : 'text-white'}`}>{o.value === null ? '—' : `${Math.round(o.value * 100)}%`}</span>
        <GradeBadge grade={o.evidence.grade} />
      </span>
    </div>
  )
}

export function AtlasTab({ projectId }: { projectId: string }) {
  const [snapshot, setSnapshot] = useState<AtlasSnapshotDTO | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorDTO[]>([])
  const [integrations, setIntegrations] = useState<IntegrationDTO[]>([])
  const [googleConfigured, setGoogleConfigured] = useState(false)
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [connectNotice, setConnectNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [refreshNotes, setRefreshNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const [{ snapshot }, { competitors }, integ] = await Promise.all([
        api.getAtlas(projectId),
        api.listCompetitors(projectId),
        api.listIntegrations(projectId),
      ])
      setSnapshot(snapshot)
      setCompetitors(competitors)
      setIntegrations(integ.integrations)
      setGoogleConfigured(integ.configured)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load Mission Atlas.')
      setSnapshot(null)
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  // Surface the result of the Google OAuth round-trip (?google=connected|error).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const g = params.get('google')
    if (!g) return
    if (g === 'connected') setConnectNotice({ ok: true, text: 'Google connected. Search Console & Analytics are now live for this project.' })
    else setConnectNotice({ ok: false, text: `Google connection failed: ${params.get('reason') ?? 'unknown error'}` })
    // Clean the query so a refresh doesn't repeat the banner.
    const url = new URL(window.location.href)
    ;['google', 'reason', 'tab'].forEach((k) => url.searchParams.delete(k))
    window.history.replaceState({}, '', url.toString())
  }, [])

  async function connectGoogle() {
    setError('')
    try {
      const { url } = await api.startGoogleConnect(projectId, 'all')
      window.location.href = url
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start Google connect. Is GOOGLE_CLIENT_ID configured?')
    }
  }
  async function disconnect(kind: 'search-console' | 'analytics') {
    try {
      await api.disconnectIntegration(projectId, kind)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect.')
    }
  }
  async function saveResource(kind: 'search-console' | 'analytics', resourceId: string) {
    try {
      await api.setIntegrationResource(projectId, kind, resourceId)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.')
    }
  }

  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.addCompetitor(projectId, domain)
      setDomain('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add competitor.')
    } finally {
      setBusy(false)
    }
  }
  async function remove(id: string) {
    try {
      await api.deleteCompetitor(projectId, id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove competitor.')
    }
  }
  async function refresh(id: string) {
    setRefreshingId(id)
    setRefreshNotes((n) => ({ ...n, [id]: '' }))
    try {
      const r = await api.refreshCompetitor(projectId, id)
      setRefreshNotes((n) => ({
        ...n,
        [id]: r.crawled ? `Crawled ${r.pagesCrawled} page${r.pagesCrawled !== 1 ? 's' : ''} — overlap updated.` : `Could not crawl this site: ${r.error ?? 'unknown reason'}`,
      }))
      await load()
    } catch (err) {
      setRefreshNotes((n) => ({ ...n, [id]: err instanceof ApiError ? err.message : 'Refresh failed.' }))
    } finally {
      setRefreshingId(null)
    }
  }

  if (!snapshot) return <Spinner label="Assembling Mission Atlas…" />
  const b = snapshot.briefing
  const overlapByCompetitor = new Map(snapshot.competitors.map((c) => [c.competitor.id, c.overlap]))

  return (
    <div className="space-y-5">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {/* Morning briefing */}
      <div className="rf-card space-y-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Morning briefing · {b.date}</p>
          <span className="text-[11px] text-[var(--rf-muted)]">
            Generated {new Date(snapshot.generatedAt).toLocaleString()} · Confidence: {b.confidence === 'unknown' ? 'unknown' : `${b.confidence}%`}
          </span>
        </div>
        <p className="text-xs text-[var(--rf-muted)]">{b.headline}</p>
        <p className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2 text-xs text-white">
          <span className="text-[var(--rf-blue-bright)]">Recommended mission:</span> {b.recommendedMission}
        </p>
        {(b.newThreats.length > 0 || b.newOpportunities.length > 0) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <BriefingList title="Threats" items={b.newThreats} tone="text-red-300" />
            <BriefingList title="Opportunities" items={b.newOpportunities} tone="text-[var(--rf-green)]" />
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {(['observed', 'imported', 'estimated', 'unavailable'] as EvidenceGradeDTO[]).map((g) => (
            <span key={g} className="flex items-center gap-1"><GradeBadge grade={g} /><span className="text-[10px] text-[var(--rf-faint)]">{b.evidenceSummary[g]}</span></span>
          ))}
        </div>
      </div>

      {/* External data sources — Connect Google (Phase H / RC2 P2).
          Only shown when this deployment actually has Google OAuth configured,
          so a customer never clicks "Connect Google" and hits a dead end. */}
      {googleConfigured ? (
        <div className="rf-card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">External data sources</p>
            <button onClick={connectGoogle} className="rf-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold">
              Connect Google
            </button>
          </div>
          {connectNotice && (
            <p className={`rounded-lg px-3 py-2 text-xs ${connectNotice.ok ? 'bg-[var(--rf-green)]/10 text-[var(--rf-green)]' : 'bg-red-500/10 text-red-300'}`}>{connectNotice.text}</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {integrations.map((it) => (
              <GoogleIntegrationCard key={it.kind} projectId={projectId} it={it} onDisconnect={() => disconnect(it.kind)} onSaveResource={(v) => saveResource(it.kind, v)} />
            ))}
          </div>
          {/* Imported Google data (RC2 P2): rendered when observed, honest failure/unavailable otherwise. */}
          <TrendCharts projectId={projectId} />
          <BreakdownTables projectId={projectId} />
          <GscPanel o={snapshot.gsc} />
          <OpportunityPanel o={snapshot.gsc} />
          <CannibalizationPanel o={snapshot.gsc} />
          <CtrOutlierPanel o={snapshot.gsc} />
          <Ga4Panel o={snapshot.analytics} />
          <p className="text-[10px] text-[var(--rf-faint)]">
            Connecting opens Google’s consent screen for read-only Search Console + Analytics access. Credentials are encrypted; when a source is disconnected its intelligence is reported as Unavailable — never fabricated.
          </p>
        </div>
      ) : (
        <div className="rf-card p-4">
          <p className="text-sm font-semibold text-white">External data sources</p>
          <p className="mt-1 text-xs text-[var(--rf-muted)]">Google Search Console &amp; Analytics are not enabled on this workspace yet. Competitor tracking below works without them.</p>
        </div>
      )}

      {/* Competitors */}
      <div className="rf-card space-y-3 p-4">
        <p className="text-sm font-semibold text-white">Competitors</p>
        <form onSubmit={addCompetitor} className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Competitor domain">
              <input className={inputClass} placeholder="rival.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            </Field>
          </div>
          <button type="submit" disabled={busy} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">Track</button>
        </form>
        {competitors.length === 0 ? (
          <EmptyState title="No competitors tracked" detail="Add a competitor domain to compute topic, service, entity, and content overlap from real crawls. Overlap shows as Unavailable until the competitor site can be crawled." />
        ) : (
          <div className="space-y-2">
            {competitors.map((c) => {
              const overlap = overlapByCompetitor.get(c.id) as OverlapDTO | undefined
              return (
                <div key={c.id} className="rounded-lg border border-[var(--rf-card-line)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="rf-mono truncate text-xs text-[var(--rf-blue-bright)]">{c.domain}</p>
                      <p className="text-[10px] text-[var(--rf-faint)]">{c.lastSnapshotAt ? `Last crawled ${new Date(c.lastSnapshotAt).toLocaleString()}` : 'Never crawled — overlap is unavailable until refreshed'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => refresh(c.id)}
                        disabled={refreshingId === c.id}
                        className="rf-btn-primary rounded-md px-2.5 py-1 text-[11px] font-medium disabled:opacity-60"
                      >
                        {refreshingId === c.id ? 'Crawling…' : 'Refresh'}
                      </button>
                      <button onClick={() => remove(c.id)} className="rf-btn-ghost rounded-md px-2 py-1 text-[11px] text-red-300">Remove</button>
                    </div>
                  </div>
                  {refreshNotes[c.id] && <p className="mt-1.5 text-[11px] text-[var(--rf-muted)]">{refreshNotes[c.id]}</p>}
                  {overlap && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      <OverlapCell label="Business" o={overlap.businessOverlap} />
                      <OverlapCell label="Topic" o={overlap.topicOverlap} />
                      <OverlapCell label="Service" o={overlap.serviceOverlap} />
                      <OverlapCell label="Entity" o={overlap.entityOverlap} />
                      <OverlapCell label="Content" o={overlap.contentOverlap} />
                      <OverlapCell label="Authority" o={overlap.authorityOverlap} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const KIND_LABEL: Record<IntegrationDTO['kind'], string> = {
  'search-console': 'Search Console',
  analytics: 'Analytics (GA4)',
}

// Shared header for a Google data panel: grade badge + last-sync + failure note.
function DataPanelHeader({ title, o }: { title: string; o: ObservationDTO<unknown> }) {
  const synced = o.evidence.fetchedAt ? new Date(o.evidence.fetchedAt).toLocaleString() : null
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-white">{title}</span>
      <span className="flex items-center gap-2">
        {synced && <span className="text-[10px] text-[var(--rf-faint)]">last sync {synced}</span>}
        {o.evidence.freshness && <span className="text-[9px] uppercase text-[var(--rf-faint)]">{o.evidence.freshness}</span>}
        <GradeBadge grade={o.evidence.grade} />
      </span>
    </div>
  )
}

/* ── Day-by-day GSC/GA4 trend charts — the actual "analytics dashboard" view,
   distinct from the top-queries/top-pages tables below. Lightweight inline
   SVG (no charting dependency) so every point plotted is a real number
   returned by Google, never interpolated or estimated. ─────────────────── */

function TrendMetricChart({ label, points, format }: { label: string; points: { date: string; value: number | null }[]; format?: (v: number) => string }) {
  const known = points.filter((p): p is { date: string; value: number } => p.value != null)
  const fmt = format ?? ((v: number) => Math.round(v).toLocaleString())
  if (known.length < 2) {
    return (
      <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
        <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p>
        <p className="mt-2 text-[11px] text-[var(--rf-faint)]">Not enough daily data yet.</p>
      </div>
    )
  }
  const w = 280, h = 56, pad = 4
  const min = Math.min(...known.map((p) => p.value)), max = Math.max(...known.map((p) => p.value))
  const span = Math.max(1e-9, max - min)
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  // Higher value renders higher on the chart — except "position", where a
  // LOWER Google rank position is the improvement; callers pass invert=true
  // via a wrapped format/points transform when that matters (see below).
  const y = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2)
  let path = ''
  points.forEach((p, i) => {
    if (p.value == null) return
    const x = pad + i * step
    path += `${path === '' ? 'M' : 'L'}${x.toFixed(1)},${y(p.value).toFixed(1)} `
  })
  const latest = known[known.length - 1].value
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p>
        <p className="text-sm font-semibold text-white">{fmt(latest)}</p>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2 overflow-visible">
        <path d={path.trim()} fill="none" stroke="var(--rf-blue-bright)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-[var(--rf-faint)]">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  )
}

function GscTrendCharts({ points }: { points: GscTrendPointDTO[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <TrendMetricChart label="Clicks / day" points={points.map((p) => ({ date: p.date, value: p.clicks }))} />
      <TrendMetricChart label="Impressions / day" points={points.map((p) => ({ date: p.date, value: p.impressions }))} />
      <TrendMetricChart label="Avg. CTR" points={points.map((p) => ({ date: p.date, value: p.ctr * 100 }))} format={(v) => `${v.toFixed(1)}%`} />
      <TrendMetricChart label="Avg. position" points={points.map((p) => ({ date: p.date, value: p.position }))} format={(v) => v.toFixed(1)} />
    </div>
  )
}

// Traffic decay: derived client-side from the same 30-day GSC trend points
// TrendCharts already fetched — no extra request. Only renders when a real,
// meaningful decline is detected; silent otherwise (no "all clear" noise).
function TrafficDecayBanner({ points }: { points: GscTrendPointDTO[] }) {
  const decay = detectTrafficDecay(points)
  if (!decay) return null
  return (
    <p className="rounded-lg bg-yellow-500/10 px-3 py-2 text-[11px] text-yellow-300">
      Organic clicks are down {Math.abs(decay.changePct).toFixed(0)}% in the last half of this window ({decay.earlierClicks} → {decay.recentClicks}) — worth checking for a ranking drop, a lost featured snippet, or a seasonal shift.
    </p>
  )
}

function Ga4TrendCharts({ points }: { points: Ga4TrendPointDTO[] }) {
  const hasRevenue = points.some((p) => p.revenue != null)
  return (
    <div className={`grid grid-cols-2 gap-2 ${hasRevenue ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
      <TrendMetricChart label="Sessions / day" points={points.map((p) => ({ date: p.date, value: p.sessions }))} />
      <TrendMetricChart label="Engaged sessions / day" points={points.map((p) => ({ date: p.date, value: p.engagedSessions }))} />
      <TrendMetricChart label="Conversions / day" points={points.map((p) => ({ date: p.date, value: p.conversions }))} />
      {hasRevenue && <TrendMetricChart label="Revenue / day" points={points.map((p) => ({ date: p.date, value: p.revenue }))} format={(v) => `$${v.toFixed(2)}`} />}
    </div>
  )
}

function TrendCharts({ projectId }: { projectId: string }) {
  const [trends, setTrends] = useState<GoogleTrendsDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    api.getGoogleTrends(projectId)
      .then((t) => { if (!cancelled) setTrends(t) })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load trend data.') })
    return () => { cancelled = true }
  }, [projectId])

  if (error) return <p className="text-[11px] text-yellow-300">{error}</p>
  if (!trends) return null
  // Both sides unavailable (nothing connected yet, or both errored) — the
  // tables below already explain why in detail, so stay quiet here rather
  // than showing four empty chart shells.
  if (!trends.gsc.ok && !trends.analytics.ok) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-white">28-day trend</p>
      {trends.gsc.ok ? (
        <>
          <TrafficDecayBanner points={trends.gsc.points} />
          <GscTrendCharts points={trends.gsc.points} />
        </>
      ) : (
        <p className="text-[11px] text-[var(--rf-faint)]">Search Console trend unavailable: {trends.gsc.reason}</p>
      )}
      {trends.analytics.ok ? <Ga4TrendCharts points={trends.analytics.points} /> : <p className="text-[11px] text-[var(--rf-faint)]">Analytics trend unavailable: {trends.analytics.reason}</p>}
    </div>
  )
}

/* ── Device/country (GSC) + traffic-channel (GA4) breakdowns — the
   "everything you'd see in the native tool" views, beyond the query/page
   tables. Small ranked tables, not charts — a bar-per-row would just be
   these same numbers with extra pixels. ─────────────────────────────────── */

function BreakdownTable({ title, rows, keyLabel }: { title: string; rows: { key: string; clicks: number; impressions: number; ctr: number; position: number }[]; keyLabel: string }) {
  if (rows.length === 0) return <p className="mt-1 text-[11px] text-[var(--rf-faint)]">No rows in the current window.</p>
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{title}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead><tr className="text-left text-[var(--rf-faint)]"><th className="pr-2 font-normal">{keyLabel}</th><th className="px-2 font-normal">Clicks</th><th className="px-2 font-normal">Impr.</th><th className="px-2 font-normal">CTR</th><th className="pl-2 font-normal">Pos.</th></tr></thead>
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.key} className="text-[var(--rf-muted)]">
                <td className="truncate pr-2 text-white">{r.key}</td>
                <td className="px-2">{r.clicks}</td>
                <td className="px-2">{r.impressions}</td>
                <td className="px-2">{(r.ctr * 100).toFixed(1)}%</td>
                <td className="pl-2">{r.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Ga4ChannelTable({ rows }: { rows: Ga4ChannelRowDTO[] }) {
  if (rows.length === 0) return <p className="mt-1 text-[11px] text-[var(--rf-faint)]">No rows in the current window.</p>
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">Analytics — traffic channel</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead><tr className="text-left text-[var(--rf-faint)]"><th className="pr-2 font-normal">Channel</th><th className="px-2 font-normal">Sessions</th><th className="px-2 font-normal">Engaged</th><th className="pl-2 font-normal">Conv.</th></tr></thead>
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.channel} className="text-[var(--rf-muted)]">
                <td className="truncate pr-2 text-white">{r.channel}</td>
                <td className="px-2">{r.sessions}</td>
                <td className="px-2">{r.engagedSessions}</td>
                <td className="pl-2">{r.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BreakdownTables({ projectId }: { projectId: string }) {
  const [data, setData] = useState<GoogleBreakdownsDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    api.getGoogleBreakdowns(projectId)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load breakdown data.') })
    return () => { cancelled = true }
  }, [projectId])

  if (error) return <p className="text-[11px] text-yellow-300">{error}</p>
  if (!data) return null
  const allUnavailable = !data.gscDevice.ok && !data.gscCountry.ok && !data.ga4Channel.ok
  if (allUnavailable) return null

  const toBreakdownRows = (rows: GscBreakdownRowDTO[]) => rows.map((r) => ({ key: r.key, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }))

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {data.gscDevice.ok ? <BreakdownTable title="Search Console — by device" keyLabel="Device" rows={toBreakdownRows(data.gscDevice.rows)} /> : <p className="text-[11px] text-[var(--rf-faint)]">Device breakdown unavailable: {data.gscDevice.reason}</p>}
      {data.gscCountry.ok ? <BreakdownTable title="Search Console — by country" keyLabel="Country" rows={toBreakdownRows(data.gscCountry.rows)} /> : <p className="text-[11px] text-[var(--rf-faint)]">Country breakdown unavailable: {data.gscCountry.reason}</p>}
      {data.ga4Channel.ok ? <Ga4ChannelTable rows={data.ga4Channel.rows} /> : <p className="text-[11px] text-[var(--rf-faint)]">Channel breakdown unavailable: {data.ga4Channel.reason}</p>}
    </div>
  )
}

function GscPanel({ o }: { o: ObservationDTO<GscReportDTO> }) {
  const rows = o.value?.rows ?? []
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <DataPanelHeader title="Search Console — top queries" o={o} />
      {o.value === null ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{o.evidence.note ?? 'Unavailable.'}</p>
      ) : rows.length === 0 ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">Connected — no query rows in the current window.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="text-left text-[var(--rf-faint)]"><th className="pr-2 font-normal">Query</th><th className="px-2 font-normal">Clicks</th><th className="px-2 font-normal">Impr.</th><th className="px-2 font-normal">CTR</th><th className="pl-2 font-normal">Pos.</th></tr></thead>
            <tbody>
              {rows.slice(0, 8).map((r, i) => (
                <tr key={i} className="text-[var(--rf-muted)]">
                  <td className="truncate pr-2 text-white">{r.query}</td>
                  <td className="px-2">{r.clicks}</td>
                  <td className="px-2">{r.impressions}</td>
                  <td className="px-2">{(r.ctr * 100).toFixed(1)}%</td>
                  <td className="pl-2">{r.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Quick-win keyword opportunities: derived client-side from the same GSC rows
// GscPanel already has (no extra fetch). Positions 4-20 with real, non-trivial
// impressions — pages Google already ranks, closest to a page-1 breakthrough.
function OpportunityPanel({ o }: { o: ObservationDTO<GscReportDTO> }) {
  const rows = o.value?.rows ?? []
  const opportunities = findKeywordOpportunities(rows)
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <DataPanelHeader title="Keyword opportunities — quick wins" o={o} />
      {o.value === null ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{o.evidence.note ?? 'Unavailable.'}</p>
      ) : opportunities.length === 0 ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">No queries currently ranking positions 4–20 with meaningful impressions.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <p className="mb-1 text-[10px] text-[var(--rf-faint)]">Ranking on page 1–2 with real search volume — the closest, cheapest wins available.</p>
          <table className="w-full text-[11px]">
            <thead><tr className="text-left text-[var(--rf-faint)]"><th className="pr-2 font-normal">Query</th><th className="px-2 font-normal">Page</th><th className="px-2 font-normal">Impr.</th><th className="px-2 font-normal">Clicks</th><th className="pl-2 font-normal">Pos.</th></tr></thead>
            <tbody>
              {opportunities.map((r, i) => (
                <tr key={i} className="text-[var(--rf-muted)]">
                  <td className="truncate pr-2 text-white">{r.query}</td>
                  <td className="max-w-[160px] truncate px-2">{r.page}</td>
                  <td className="px-2">{r.impressions}</td>
                  <td className="px-2">{r.clicks}</td>
                  <td className="pl-2">{r.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Keyword cannibalization: also derived client-side from the same GSC rows —
// queries where impressions are split across 2+ distinct real pages, which
// splits the ranking signal Google would otherwise concentrate on one page.
function CannibalizationPanel({ o }: { o: ObservationDTO<GscReportDTO> }) {
  const rows = o.value?.rows ?? []
  const conflicts = findKeywordCannibalization(rows)
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <DataPanelHeader title="Keyword cannibalization" o={o} />
      {o.value === null ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{o.evidence.note ?? 'Unavailable.'}</p>
      ) : conflicts.length === 0 ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">No query is currently split across multiple ranking pages.</p>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-[10px] text-[var(--rf-faint)]">Same query, multiple real pages competing — consolidating usually outranks splitting.</p>
          {conflicts.map((c, i) => (
            <div key={i} className="rounded border border-[var(--rf-card-line)] p-2">
              <p className="text-[11px] font-semibold text-white">{c.query}</p>
              <table className="mt-1 w-full text-[11px]">
                <tbody>
                  {c.pages.map((p, j) => (
                    <tr key={j} className="text-[var(--rf-muted)]">
                      <td className="max-w-[220px] truncate pr-2">{p.page}</td>
                      <td className="px-2">{p.impressions} impr.</td>
                      <td className="pl-2">pos. {p.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Low-CTR outliers: also derived client-side from the same GSC rows — flags
// queries underperforming their own site's cohort at a similar position,
// a real signal the title/meta may be worth rewriting.
function CtrOutlierPanel({ o }: { o: ObservationDTO<GscReportDTO> }) {
  const rows = o.value?.rows ?? []
  const outliers = findLowCtrOutliers(rows)
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <DataPanelHeader title="Low-CTR outliers — title/meta rewrite candidates" o={o} />
      {o.value === null ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{o.evidence.note ?? 'Unavailable.'}</p>
      ) : outliers.length === 0 ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">No query is currently underperforming its own position cohort.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <p className="mb-1 text-[10px] text-[var(--rf-faint)]">CTR well below other queries at a similar rank on this site — a real, self-relative signal, not an assumed industry average.</p>
          <table className="w-full text-[11px]">
            <thead><tr className="text-left text-[var(--rf-faint)]"><th className="pr-2 font-normal">Query</th><th className="px-2 font-normal">Page</th><th className="px-2 font-normal">Pos.</th><th className="px-2 font-normal">CTR</th><th className="pl-2 font-normal">Cohort median</th></tr></thead>
            <tbody>
              {outliers.map((r, i) => (
                <tr key={i} className="text-[var(--rf-muted)]">
                  <td className="truncate pr-2 text-white">{r.query}</td>
                  <td className="max-w-[140px] truncate px-2">{r.page}</td>
                  <td className="px-2">{r.position.toFixed(1)}</td>
                  <td className="px-2">{(r.ctr * 100).toFixed(1)}%</td>
                  <td className="pl-2">{(r.cohortMedianCtr * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Ga4Panel({ o }: { o: ObservationDTO<Ga4ReportDTO> }) {
  const pages = o.value?.pages ?? []
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <DataPanelHeader title="Analytics — top pages" o={o} />
      {o.value === null ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{o.evidence.note ?? 'Unavailable.'}</p>
      ) : pages.length === 0 ? (
        <p className="mt-1 text-[11px] text-[var(--rf-faint)]">Connected — no page rows in the current window.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="text-left text-[var(--rf-faint)]"><th className="pr-2 font-normal">Page</th><th className="px-2 font-normal">Sessions</th><th className="px-2 font-normal">Engaged</th><th className="pl-2 font-normal">Conv.</th></tr></thead>
            <tbody>
              {pages.slice(0, 8).map((r, i) => (
                <tr key={i} className="text-[var(--rf-muted)]">
                  <td className="truncate pr-2 text-white">{r.page}</td>
                  <td className="px-2">{r.sessions}</td>
                  <td className="px-2">{r.engagedSessions}</td>
                  <td className="pl-2">{r.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function GoogleIntegrationCard({ projectId, it, onDisconnect, onSaveResource }: { projectId: string; it: IntegrationDTO; onDisconnect: () => void; onSaveResource: (v: string) => void }) {
  const [resource, setResource] = useState(it.resourceId ?? '')
  const connected = it.status === 'connected'
  const tone = connected ? 'text-[var(--rf-green)]' : it.status === 'error' ? 'text-yellow-300' : 'text-[var(--rf-faint)]'
  // Verified Search Console properties for this account — fetched lazily so a
  // picker can replace guessing the exact resourceId string that avoids a 403.
  const [sites, setSites] = useState<{ siteUrl: string; permissionLevel: string }[] | null>(null)
  const [sitesError, setSitesError] = useState<string | null>(null)
  useEffect(() => {
    if (!(connected && it.kind === 'search-console')) return
    let cancelled = false
    api.listGoogleSearchConsoleSites(projectId).then((r) => {
      if (cancelled) return
      setSites(r.sites)
      setSitesError(r.sites.length === 0 ? r.error ?? null : null)
    }).catch((e) => { if (!cancelled) setSitesError(e instanceof Error ? e.message : String(e)) })
    return () => { cancelled = true }
  }, [connected, it.kind, projectId])
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white">{KIND_LABEL[it.kind]}</span>
        <span className={`rf-mono text-[9px] uppercase ${tone}`}>{it.status}</span>
      </div>
      <p className="mt-0.5 text-[10px] leading-tight text-[var(--rf-muted)]">{it.detail}</p>
      {it.accountEmail && <p className="mt-0.5 text-[10px] text-[var(--rf-faint)]">as {it.accountEmail}</p>}
      {connected && it.kind === 'analytics' && (
        // GA4 needs a numeric property id to query; capture it here.
        <div className="mt-2 flex items-end gap-1.5">
          <div className="flex-1">
            <Field label="GA4 property ID">
              <input className={inputClass} placeholder="e.g. 123456789" value={resource} onChange={(e) => setResource(e.target.value)} />
            </Field>
          </div>
          <button onClick={() => onSaveResource(resource)} className="rf-btn-ghost rounded-md px-2 py-1.5 text-[11px]">Save</button>
        </div>
      )}
      {connected && it.kind === 'search-console' && (
        // Without an override we assume a Domain property (sc-domain:<domain>).
        // If the site is verified as a URL-prefix property instead, the account
        // can be a full user there and still get a 403 on the guessed
        // sc-domain resource — let the user point us at the exact property.
        // sites/sitesError come from the account's real verified-property list,
        // fetched via the Search Console API — the dropdown never guesses.
        <div className="mt-2 flex items-end gap-1.5">
          <div className="flex-1">
            <Field label="Search Console property (optional override)">
              <input className={inputClass} list={`gsc-sites-${it.kind}`} placeholder="e.g. https://example.com/ or sc-domain:example.com" value={resource} onChange={(e) => setResource(e.target.value)} />
              <datalist id={`gsc-sites-${it.kind}`}>
                {(sites ?? []).map((s) => <option key={s.siteUrl} value={s.siteUrl}>{s.permissionLevel}</option>)}
              </datalist>
            </Field>
            {sites && sites.length > 0 && (
              <p className="mt-1 text-[10px] text-[var(--rf-faint)]">
                {sites.length} verified {sites.length === 1 ? 'property' : 'properties'} on this account — pick one from the dropdown.
              </p>
            )}
            {sitesError && <p className="mt-1 text-[10px] text-yellow-300">{sitesError}</p>}
          </div>
          <button onClick={() => onSaveResource(resource)} className="rf-btn-ghost rounded-md px-2 py-1.5 text-[11px]">Save</button>
        </div>
      )}
      {connected && (
        <button onClick={onDisconnect} className="mt-2 rf-btn-ghost rounded-md px-2 py-1 text-[10px] text-red-300">Disconnect</button>
      )}
    </div>
  )
}

function BriefingList({ title, items, tone }: { title: string; items: AtlasSnapshotDTO['briefing']['newThreats']; tone: string }) {
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-2">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${tone}`}>{title} ({items.length})</p>
      {items.length === 0 ? (
        <p className="text-[11px] text-[var(--rf-faint)]">None detected.</p>
      ) : (
        items.slice(0, 4).map((it, i) => (
          <p key={i} className="mt-0.5 text-[11px] text-[var(--rf-muted)]">
            <GradeBadge grade={it.evidence.grade} /> {it.title}
          </p>
        ))
      )}
    </div>
  )
}
