'use client'

// Mission Atlas tab (Phase G): external SEO intelligence surfaced inside the
// existing project workspace. Its whole point is the evidence-grading
// discipline — every datum is badged Observed / Imported / Estimated /
// Unavailable, so the user never mistakes a gap for a fact. In this environment
// no external provider is reachable, so the tab honestly shows everything as
// unavailable with the reason, plus the morning briefing's "connect sources"
// guidance.

import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type AtlasSnapshotDTO, type CompetitorDTO, type EvidenceGradeDTO, type Ga4ReportDTO, type GscReportDTO, type IntegrationDTO, type ObservationDTO, type OverlapDTO } from '../../../lib/client'
import { EmptyState, Field, inputClass, Spinner } from '../../../lib/ui'

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
          <GscPanel o={snapshot.gsc} />
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
