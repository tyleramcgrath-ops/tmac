'use client'

// Keyword Intelligence — the Rankings tab's decision surface.
//
// Search Console's own UI gives you one row per (query, page) pair and leaves
// the thinking to you. This view answers the question you actually have: of
// everything this site ranks for, what should I work on, and is any of it worth
// building a keyword tool around?
//
// Reading order is deliberate and top-down:
//   1. Scale      — how many keywords, how much demand, how well are we doing
//   2. Shape      — where those keywords sit (the position bands)
//   3. Decisions  — the three opportunity types, each with a count
//   4. Detail     — the full keyword table, filterable and exportable
//
// Honesty rules this file obeys: a metric that can't be computed renders as "—"
// and never as 0; landing-page outcomes are labelled as the PAGE's numbers,
// because GA4 cannot attribute a session to a query; and each of Search Console
// and Analytics degrades on its own without hiding the other.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2, Search, Download, RefreshCw, Plug, TrendingUp, Check,
  ArrowUpDown, Target, MousePointerClick, Split, Smartphone,
} from 'lucide-react'
import { api, ApiError, type KeywordIntelligenceDTO, type KeywordRowDTO, type PositionBandDTO } from '../../../../lib/client'
import { downloadCsv } from '../../../../lib/csv'

/* ── formatting ─────────────────────────────────────────────────────────── */

const num = (n: number) => n.toLocaleString()
// A null metric means "we could not compute this", which is NOT zero. Every
// formatter here keeps that distinction rather than rendering a confident 0.
const pct = (n: number | null | undefined) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`)
const pos = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(1))
const pathOf = (u: string) => {
  try { return new URL(u).pathname || '/' } catch { return u }
}

const BANDS: { id: PositionBandDTO; label: string; range: string; color: string; blurb: string }[] = [
  { id: 'top3', label: 'Winning', range: '1-3', color: 'var(--rf-green)', blurb: 'Already at the top. Protect these — a drop here costs the most traffic.' },
  { id: 'page1', label: 'Page 1', range: '4-10', color: 'var(--rf-blue-bright)', blurb: 'On page one but below the fold of attention. Better titles move these.' },
  { id: 'striking', label: 'Striking distance', range: '11-20', color: 'var(--rf-amber)', blurb: 'Page two. The cheapest wins on the site — Google already thinks the page is relevant.' },
  { id: 'deep', label: 'Deep', range: '21+', color: 'var(--rf-faint)', blurb: 'Needs real work, not a tweak. Useful mostly as demand research.' },
]

type SortKey = 'impressions' | 'clicks' | 'ctr' | 'position'

/* ── small primitives ───────────────────────────────────────────────────── */

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rf-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-[var(--rf-faint)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone ?? 'text-white'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">{sub}</p>}
    </div>
  )
}

function Panel({ icon: Icon, title, count, blurb, children }: {
  icon: typeof Target; title: string; count: number; blurb: string; children: React.ReactNode
}) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-[var(--rf-card-line)] px-4 py-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-blue-bright)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title} <span className="rf-mono text-xs font-normal text-[var(--rf-faint)]">{count}</span></p>
          <p className="mt-0.5 text-xs text-[var(--rf-muted)]">{blurb}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-5 text-sm text-[var(--rf-muted)]">{children}</p>
}

/* ── main ───────────────────────────────────────────────────────────────── */

export function KeywordIntelligence({ projectId, onTrack }: { projectId: string; onTrack?: () => void }) {
  const [data, setData] = useState<KeywordIntelligenceDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [band, setBand] = useState<PositionBandDTO | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('impressions')
  const [tracking, setTracking] = useState<string | null>(null)
  const [justTracked, setJustTracked] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(50)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await api.keywordIntelligence(projectId)) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not load Search Console keywords.') }
    finally { setLoading(false) }
  }, [projectId])
  useEffect(() => { void load() }, [load])

  const rows = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    return data.keywords
      .filter((r) => (band === 'all' || r.band === band) && (!needle || r.query.toLowerCase().includes(needle)))
      .slice()
      // Position sorts ascending (1 is best); every other column sorts descending.
      .sort((a, b) => (sort === 'position' ? a.position - b.position : b[sort] - a[sort]))
  }, [data, q, band, sort])

  async function track(keyword: string) {
    setTracking(keyword)
    try {
      await api.addTrackedKeyword(projectId, keyword)
      setJustTracked((s) => new Set(s).add(keyword))
      onTrack?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not track that keyword.')
    } finally { setTracking(null) }
  }

  function exportCsv() {
    if (!data) return
    const hasLanding = data.keywords.some((r) => r.landing)
    const header = ['Keyword', 'Position', 'Clicks', 'Impressions', 'CTR', 'Band', 'Landing page', 'Pages ranking', 'Tracked']
    if (hasLanding) header.push('Page sessions', 'Page conversions', 'Page revenue')
    const body = rows.map((r) => {
      const base: (string | number)[] = [
        r.query, r.position, r.clicks, r.impressions, (r.ctr * 100).toFixed(2) + '%',
        r.band, r.bestPage, r.pageCount, r.tracked ? 'yes' : 'no',
      ]
      // Blank, not 0 — GA4 having no row for a page is not the same as zero sessions.
      if (hasLanding) base.push(r.landing?.sessions ?? '', r.landing?.conversions ?? '', r.landing?.revenue ?? '')
      return base
    })
    downloadCsv(`keywords-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...body])
  }

  if (loading && !data) {
    return <div className="rf-card flex items-center gap-2 p-6 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading Search Console keywords…</div>
  }
  if (error && !data) {
    return <div className="rf-card p-5"><p className="text-sm text-[var(--rf-red)]">{error}</p><button onClick={() => void load()} className="rf-btn-ghost mt-3 rounded-lg px-3 py-1.5 text-xs">Retry</button></div>
  }
  if (!data) return null

  // Search Console unavailable: say why, and stop. There is nothing honest to
  // render below this point — every panel is derived from that one corpus.
  if (data.unavailable) {
    return (
      <div className="rf-card rf-topline p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Plug className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold text-white">Connect Google Search Console to see every keyword this site ranks for</p>
            <p className="mt-1 text-sm text-[var(--rf-muted)]">{data.unavailable}</p>
            <p className="mt-2 text-xs text-[var(--rf-faint)]">Search Console is the only source of real impression, click, and position data for your own site — it is free, and it is what the keyword analysis below is built on. Connect it under Integrations.</p>
            <button onClick={() => void load()} className="rf-btn-ghost mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Check again</button>
          </div>
        </div>
      </div>
    )
  }

  const s = data.summary
  const totalBanded = s ? s.bands.top3 + s.bands.page1 + s.bands.striking + s.bands.deep : 0
  const hasLanding = data.keywords.some((r) => r.landing)

  return (
    <div className="space-y-4">
      {/* ── 1. Scale ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">Keyword intelligence</p>
          <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
            Google Search Console{data.range ? ` · ${data.range.from} to ${data.range.to}` : ''}
            {hasLanding ? ' · joined to Google Analytics' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export CSV</button>
          <button onClick={() => void load()} disabled={loading} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs disabled:opacity-60">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-[var(--rf-red)]">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Keywords" value={s ? num(s.keywords) : '—'} sub={s ? `${num(s.pages)} landing pages` : undefined} />
        <Metric label="Clicks" value={s ? num(s.clicks) : '—'} sub="last 28 days" />
        <Metric label="Impressions" value={s ? num(s.impressions) : '—'} sub="search demand reached" />
        <Metric label="CTR" value={pct(s?.ctr)} sub="clicks ÷ impressions" />
        <Metric label="Avg. position" value={pos(s?.avgPosition)} sub="weighted by impressions" tone="text-[var(--rf-blue-bright)]" />
      </div>

      {/* ── 2. Shape: where the keywords actually sit ────────────────────── */}
      <div className="rf-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Where your keywords sit</p>
          <button onClick={() => setBand('all')} className={`text-[11px] ${band === 'all' ? 'text-[var(--rf-faint)]' : 'text-[var(--rf-blue-bright)] hover:underline'}`}>
            {band === 'all' ? 'showing all' : 'clear filter'}
          </button>
        </div>

        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/[0.05]">
          {BANDS.map((b) => {
            const v = s?.bands[b.id] ?? 0
            if (!totalBanded || !v) return null
            return <div key={b.id} title={`${b.label}: ${v}`} style={{ width: `${(v / totalBanded) * 100}%`, background: b.color }} />
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BANDS.map((b) => {
            const v = s?.bands[b.id] ?? 0
            const active = band === b.id
            return (
              <button
                key={b.id}
                onClick={() => setBand(active ? 'all' : b.id)}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${active ? 'border-[var(--rf-blue-bright)] bg-white/[0.04]' : 'border-[var(--rf-card-line)] hover:bg-white/[0.02]'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
                  <span className="text-sm font-semibold text-white">{num(v)}</span>
                  <span className="text-xs text-[var(--rf-muted)]">{b.label}</span>
                  <span className="ml-auto rf-mono text-[10px] text-[var(--rf-faint)]">{b.range}</span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[var(--rf-faint)]">{b.blurb}</p>
              </button>
            )
          })}
        </div>

        {s?.clickConcentration != null && (
          <p className="mt-3 border-t border-[var(--rf-card-line)] pt-3 text-xs text-[var(--rf-muted)]">
            Your top 10 keywords carry <span className="font-semibold text-white">{pct(s.clickConcentration)}</span> of all clicks.
            {s.clickConcentration > 0.8
              ? ' That is heavy concentration — one ranking drop would be felt immediately. Widening the keyword base is a defensive priority.'
              : ' Traffic is spread across a healthy range of queries.'}
          </p>
        )}
      </div>

      {/* ── 3. Decisions: the three opportunity types, each already counted ── */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel icon={Target} title="Striking distance" count={data.opportunities.length}
          blurb="Ranking 4-20 with real impressions. The closest wins available.">
          {data.opportunities.length === 0 ? (
            <EmptyRow>Nothing in positions 4-20 with meaningful impressions yet.</EmptyRow>
          ) : (
            <ul className="divide-y divide-[var(--rf-card-line)]">
              {data.opportunities.slice(0, 6).map((o) => (
                <li key={`${o.query}|${o.page}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{o.query}</p>
                    <p className="truncate text-[11px] text-[var(--rf-faint)]">{pathOf(o.page)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="rf-mono text-sm font-semibold text-[var(--rf-amber)]">#{o.position.toFixed(1)}</p>
                    <p className="text-[11px] text-[var(--rf-faint)]">{num(o.impressions)} impr.</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={MousePointerClick} title="Underperforming CTR" count={data.lowCtr.length}
          blurb="Ranking well but under-clicked versus your own keywords at the same position. Title/meta rewrites.">
          {data.lowCtr.length === 0 ? (
            <EmptyRow>No keyword is clicking meaningfully below its peers.</EmptyRow>
          ) : (
            <ul className="divide-y divide-[var(--rf-card-line)]">
              {data.lowCtr.slice(0, 6).map((o) => (
                <li key={`${o.query}|${o.page}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{o.query}</p>
                    <p className="truncate text-[11px] text-[var(--rf-faint)]">#{o.position.toFixed(1)} · {pathOf(o.page)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="rf-mono text-sm font-semibold text-[var(--rf-red)]">{pct(o.ctr)}</p>
                    <p className="text-[11px] text-[var(--rf-faint)]">peers {pct(o.cohortMedianCtr)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={Split} title="Cannibalization" count={data.cannibalization.length}
          blurb="One query, several of your pages competing. Splits the signal Google would concentrate on one.">
          {data.cannibalization.length === 0 ? (
            <EmptyRow>No query is being split across multiple pages.</EmptyRow>
          ) : (
            <ul className="divide-y divide-[var(--rf-card-line)]">
              {data.cannibalization.slice(0, 6).map((c) => (
                <li key={c.query} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-white">{c.query}</p>
                    <p className="shrink-0 rf-mono text-[11px] text-[var(--rf-faint)]">{c.pages.length} pages</p>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--rf-faint)]">
                    {c.pages.slice(0, 3).map((p) => pathOf(p.page)).join('  ·  ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Device split — one line, only when there is something to say. */}
      {(data.mobileGap || data.devices.length > 0) && (
        <div className="rf-card p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]"><Smartphone className="h-4 w-4" /> By device</span>
            {data.devices.map((d) => (
              <span key={d.key} className="text-xs text-[var(--rf-muted)]">
                {d.key.toLowerCase()} <span className="rf-mono text-white">#{d.position.toFixed(1)}</span> · {num(d.clicks)} clicks
              </span>
            ))}
          </div>
          {data.mobileGap && (
            <p className="mt-2 text-xs text-[var(--rf-amber)]">
              Mobile ranks {data.mobileGap.gap.toFixed(1)} positions worse than desktop (#{data.mobileGap.mobilePosition.toFixed(1)} vs #{data.mobileGap.desktopPosition.toFixed(1)}). Google ranks mobile-first, so this is costing real traffic.
            </p>
          )}
        </div>
      )}

      {/* ── 4. Detail: the full table ────────────────────────────────────── */}
      <div className="rf-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--rf-faint)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter keywords…"
              className="w-full rounded-lg border border-[var(--rf-card-line)] bg-transparent py-1.5 pl-8 pr-3 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--rf-faint)]">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {(['impressions', 'clicks', 'ctr', 'position'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => setSort(k)} className={`rounded px-2 py-1 ${sort === k ? 'bg-white/[0.06] text-white' : 'hover:text-[var(--rf-muted)]'}`}>{k}</button>
            ))}
          </div>
          <span className="rf-mono text-[11px] text-[var(--rf-faint)]">{num(rows.length)} shown</span>
        </div>

        {rows.length === 0 ? (
          <EmptyRow>No keyword matches this filter.</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]">
                  <th className="px-4 py-2 font-medium">Keyword</th>
                  <th className="px-4 py-2 font-medium">Pos.</th>
                  <th className="px-4 py-2 font-medium">Clicks</th>
                  <th className="px-4 py-2 font-medium">Impr.</th>
                  <th className="px-4 py-2 font-medium">CTR</th>
                  <th className="px-4 py-2 font-medium">Landing page</th>
                  {hasLanding && <th className="px-4 py-2 font-medium" title="Sessions and conversions for the LANDING PAGE, from Google Analytics — not attributable to this keyword alone.">Page outcome</th>}
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rf-card-line)]">
                {rows.slice(0, limit).map((r) => <Row key={r.query} r={r} hasLanding={hasLanding} tracking={tracking} justTracked={justTracked} onTrack={track} />)}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > limit && (
          <button onClick={() => setLimit((n) => n + 100)} className="w-full border-t border-[var(--rf-card-line)] py-2.5 text-xs text-[var(--rf-blue-bright)] hover:bg-white/[0.02]">
            Show more ({num(rows.length - limit)} remaining)
          </button>
        )}
      </div>

      {data.analyticsUnavailable && (
        <p className="text-xs text-[var(--rf-faint)]">
          <Plug className="mr-1 inline h-3 w-3" />
          Connect Google Analytics to see what the pages behind these keywords actually earn. {data.analyticsUnavailable}
        </p>
      )}
    </div>
  )
}

function Row({ r, hasLanding, tracking, justTracked, onTrack }: {
  r: KeywordRowDTO
  hasLanding: boolean
  tracking: string | null
  justTracked: Set<string>
  onTrack: (k: string) => void
}) {
  const bandColor = BANDS.find((b) => b.id === r.band)?.color ?? 'var(--rf-faint)'
  const tracked = r.tracked || justTracked.has(r.query)
  return (
    <tr className="hover:bg-white/[0.02]">
      <td className="max-w-[280px] px-4 py-2.5">
        <span className="block truncate text-[var(--rf-text)]" title={r.query}>{r.query}</span>
        {r.pageCount > 1 && <span className="text-[10px] text-[var(--rf-amber)]">{r.pageCount} pages competing</span>}
      </td>
      <td className="whitespace-nowrap px-4 py-2.5">
        <span className="rf-mono font-semibold" style={{ color: bandColor }}>{r.position.toFixed(1)}</span>
      </td>
      <td className="px-4 py-2.5 rf-mono text-white">{num(r.clicks)}</td>
      <td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{num(r.impressions)}</td>
      <td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{pct(r.ctr)}</td>
      <td className="max-w-[200px] px-4 py-2.5">
        {r.bestPage
          ? <a href={r.bestPage} target="_blank" rel="noopener noreferrer" className="block truncate text-[var(--rf-muted)] hover:text-white" title={r.bestPage}>{pathOf(r.bestPage)}</a>
          : <span className="text-[var(--rf-faint)]">—</span>}
      </td>
      {hasLanding && (
        <td className="whitespace-nowrap px-4 py-2.5 text-[var(--rf-muted)]">
          {r.landing
            ? <span className="rf-mono text-xs">{num(r.landing.sessions)} sess · {num(r.landing.conversions)} conv</span>
            : <span className="text-[var(--rf-faint)]">—</span>}
        </td>
      )}
      <td className="whitespace-nowrap px-4 py-2.5 text-right">
        {tracked
          ? <span className="inline-flex items-center gap-1 text-[11px] text-[var(--rf-green)]"><Check className="h-3.5 w-3.5" /> tracked</span>
          : (
            <button onClick={() => onTrack(r.query)} disabled={tracking === r.query} className="rf-btn-ghost inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] disabled:opacity-60">
              {tracking === r.query ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />} Track
            </button>
          )}
      </td>
    </tr>
  )
}
