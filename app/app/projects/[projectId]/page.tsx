'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import {
  Loader2, AlertTriangle, Zap, ArrowLeft, Target, Plug, LineChart, ShieldAlert,
  Activity, CheckCircle2, ExternalLink, BarChart3, Clock, Gauge, Rocket, Trophy, Layers,
} from 'lucide-react'

type PortfolioStatus = 'critical' | 'needs_attention' | 'opportunity' | 'improving' | 'stable' | 'waiting_for_data' | 'blocked' | 'no_action_needed'
interface Overview {
  ok: boolean
  project: { id: string; name: string; domain: string; description: string | null; isFavorite: boolean; createdAt: string }
  priority: { status: PortfolioStatus; score: number; headline: string; reasons: string[]; recommendedFocus: string; missingData: string[] }
  lastCrawlAt: string | null
  latestAudit: { siteScore: number; criticalCount: number; pageCount: number } | null
  rankingSummary: { tracked: number; total: number; top3: number; top10: number; top20: number; page2: number; gainers: number; losers: number }
  opportunities: { id: string; type: string; title: string; businessValue: number; effort: string; risk: string; page: string | null; keyword: string | null }[]
  integrations: { wordpress: { connected: boolean; detail: string | null }; gsc: { connected: boolean; hasData: boolean }; ga4: { connected: boolean; hasData: boolean } }
  recentActivity: { type: string; action: string | null; at: string }[]
  scheduleHealth?: { total: number; running: number; failed: number; retrying: number; blocked: number; paused: number; healthy: number; score: number }
  dataFreshness?: { source: string; status: string; ageHours: number | null; reason: string; recommendedAction: string }[]
  decisionBlockers?: { id: string; scope: string; severity: string; title: string; detail?: string; occurrences: number; sources: string[] }[]
  fusedOpportunities?: { id: string; type: string; title: string; capability: string; businessValue: number; page: string | null; primaryReason: string; recommendedFix: string }[]
  readyToDeploy?: { id: string; title: string; page: string | null; businessValue: number; capability: string; recommendedFix: string }[]
  measuringOutcomes?: { id: string; page: string | null; keyword: string | null; changeType: string; status: string; confidence: number; reviewAt: string | null; notes: string | null }[]
  recentWins?: { id: string; page: string | null; keyword: string | null; changeType: string; confidence: number; at: string; notes: string | null }[]
}

const FRESH_COLOR: Record<string, string> = { fresh: 'var(--rf-green)', aging: 'var(--rf-amber)', stale: 'var(--rf-red)', missing: 'var(--rf-faint)', failed: 'var(--rf-red)', not_configured: 'var(--rf-faint)' }
const SEV_COLOR: Record<string, string> = { critical: 'var(--rf-red)', warning: 'var(--rf-amber)', info: 'var(--rf-faint)' }
const MEASURE_COLOR: Record<string, string> = { awaiting_data: 'var(--rf-faint)', too_early: 'var(--rf-faint)', improving: 'var(--rf-green)', neutral: 'var(--rf-muted)', declining: 'var(--rf-red)', inconclusive: 'var(--rf-amber)', needs_review: 'var(--rf-amber)', successful: 'var(--rf-green)' }
const SOURCE_LABEL: Record<string, string> = { crawl: 'Crawl', priority_rankings: 'Priority ranks', full_rankings: 'Full ranks', gsc: 'Search Console', ga4: 'Analytics 4', fusion: 'Data fusion', portfolio_priority: 'Portfolio priority', opportunities: 'Opportunities' }

const STATUS_META: Record<PortfolioStatus, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'var(--rf-red)', bg: 'rgba(251,106,106,0.12)' },
  needs_attention: { label: 'Needs attention', color: 'var(--rf-amber)', bg: 'rgba(251,191,36,0.12)' },
  opportunity: { label: 'Opportunity', color: 'var(--rf-cyan)', bg: 'rgba(34,211,238,0.12)' },
  improving: { label: 'Improving', color: 'var(--rf-green)', bg: 'rgba(52,211,153,0.12)' },
  stable: { label: 'Stable', color: 'var(--rf-muted)', bg: 'rgba(148,173,224,0.10)' },
  waiting_for_data: { label: 'Waiting for data', color: 'var(--rf-faint)', bg: 'rgba(148,173,224,0.08)' },
  blocked: { label: 'Blocked', color: 'var(--rf-red)', bg: 'rgba(251,106,106,0.12)' },
  no_action_needed: { label: 'No action needed', color: 'var(--rf-muted)', bg: 'rgba(148,173,224,0.10)' },
}

function fmtDate(s: string | null) { return s ? new Date(s).toLocaleDateString() : '—' }

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const projectId = params?.projectId
  const [data, setData] = useState<Overview | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')

  const load = useCallback(async () => {
    if (!projectId) return
    setStatus('loading')
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/overview`)
      if (res.status === 401) { setStatus('unauth'); return }
      const json = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setData(json); setStatus('ready')
    } catch { setStatus('error') }
  }, [projectId])
  useEffect(() => { load() }, [load])

  const pr = data?.priority
  const meta = pr ? STATUS_META[pr.status] : null

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <a href="/app" className="rf-btn-ghost inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</a>
            <span className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} /></span><span className="truncate text-sm font-semibold text-white">{data?.project.name ?? 'Project'}</span></span>
          </div>
          <div className="-mx-1 flex max-w-full shrink-0 items-center gap-1.5 overflow-x-auto px-1">
            <a href="/app/rankings" className="rf-btn-ghost inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><LineChart className="h-3.5 w-3.5" /> Rankings</a>
            <a href="/app/opportunities" className="rf-btn-ghost inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><Target className="h-3.5 w-3.5" /> Opportunities</a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {status === 'loading' && <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>}
        {status === 'unauth' && <div className="rf-card rf-topline grid place-items-center py-16 text-center"><p className="text-lg font-semibold text-white">Sign in to view this project</p><a href="/app" className="rf-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">Go to sign in</a></div>}
        {status === 'error' && <div className="rf-card grid place-items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-[var(--rf-red)]" /><p className="mt-3 text-sm text-[var(--rf-muted)]">Couldn&apos;t load this project. <button onClick={load} className="text-[var(--rf-blue-bright)] hover:text-white">Retry</button></p></div>}

        {status === 'ready' && data && pr && meta && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="rf-card rf-topline p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-white">{data.project.name}</h1>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--rf-faint)]">{data.project.domain}</p>
                </div>
                {data.latestAudit && <div className="text-right"><p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">Site health</p><p className="text-2xl font-semibold text-white">{data.latestAudit.siteScore}</p></div>}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[var(--rf-muted)]">
                <span>Last crawl <span className="text-white">{fmtDate(data.lastCrawlAt)}</span></span>
                <span>Pages <span className="text-white">{data.latestAudit?.pageCount ?? 0}</span></span>
                <span>Tracked keywords <span className="text-white">{data.rankingSummary.total}</span></span>
              </div>
            </div>

            {/* Primary mission */}
            <div className="rf-card p-5">
              <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[var(--rf-blue-bright)]" /><span className="rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">Primary mission</span></div>
              <p className="mt-2 text-sm font-medium text-[var(--rf-text)]">{pr.headline}</p>
              <div className="mt-2 rounded-xl border border-[var(--rf-card-line-strong)] bg-white/[0.02] p-3">
                <p className="text-[11px] uppercase tracking-wide text-[var(--rf-faint)]">Recommended focus</p>
                <p className="mt-1 text-sm text-white">{pr.recommendedFocus}</p>
              </div>
              {pr.missingData.length > 0 && <p className="mt-2 text-[11px] text-[var(--rf-faint)]">Missing data: {pr.missingData.join(', ')}</p>}
            </div>

            {/* Performance + integrations */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rf-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5"><BarChart3 className="h-4 w-4 text-[var(--rf-cyan)]" /><span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Ranking summary</span></div>
                <div className="grid grid-cols-3 gap-px bg-[var(--rf-card-line)]">
                  {[['Tracked', data.rankingSummary.tracked], ['Top 3', data.rankingSummary.top3], ['Top 10', data.rankingSummary.top10], ['Page 2', data.rankingSummary.page2], ['Gainers', data.rankingSummary.gainers], ['Losers', data.rankingSummary.losers]].map(([l, v]) => (
                    <div key={l as string} className="bg-[var(--rf-bg,#0b1120)] p-3 text-center"><p className="text-lg font-semibold text-white">{v as number}</p><p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{l as string}</p></div>
                  ))}
                </div>
              </div>

              <div className="rf-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5"><Plug className="h-4 w-4 text-[var(--rf-violet)]" /><span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Integrations</span></div>
                <div className="divide-y divide-[var(--rf-card-line)]">
                  <IntegrationRow label="WordPress" connected={data.integrations.wordpress.connected} detail={data.integrations.wordpress.detail ?? undefined} connectHref="/app" adds="Deploy fixes directly to your site." />
                  <IntegrationRow label="Search Console" connected={data.integrations.gsc.connected} detail={data.integrations.gsc.connected ? (data.integrations.gsc.hasData ? 'Synced' : 'Connected, awaiting sync') : undefined} connectHref="/app/integrations/google" adds="Real clicks, impressions, CTR, and average position." />
                  <IntegrationRow label="Analytics 4" connected={data.integrations.ga4.connected} detail={data.integrations.ga4.connected ? (data.integrations.ga4.hasData ? 'Synced' : 'Connected, awaiting sync') : undefined} connectHref="/app/integrations/google" adds="Organic sessions, conversions, and revenue." />
                </div>
              </div>
            </div>

            {/* Schedule health + Data freshness */}
            <div className="grid gap-4 lg:grid-cols-2">
              {data.scheduleHealth && (
                <PSection icon={Gauge} color="var(--rf-blue-bright)" title="Schedule health">
                  <div className="p-4">
                    <div className="flex items-end justify-between">
                      <div><p className="text-3xl font-semibold text-white">{data.scheduleHealth.score}<span className="text-sm text-[var(--rf-faint)]">%</span></p><p className="text-[11px] text-[var(--rf-faint)]">{data.scheduleHealth.healthy}/{data.scheduleHealth.total} jobs healthy</p></div>
                      <a href="/app/schedules" className="rf-btn-ghost inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium">Manage <ExternalLink className="h-3 w-3" /></a>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                      {data.scheduleHealth.failed > 0 && <span className="text-[var(--rf-red)]">{data.scheduleHealth.failed} failed</span>}
                      {data.scheduleHealth.blocked > 0 && <span className="text-[var(--rf-amber)]">{data.scheduleHealth.blocked} blocked</span>}
                      {data.scheduleHealth.retrying > 0 && <span className="text-[var(--rf-amber)]">{data.scheduleHealth.retrying} retrying</span>}
                      {data.scheduleHealth.running > 0 && <span className="text-[var(--rf-blue-bright)]">{data.scheduleHealth.running} running</span>}
                      {data.scheduleHealth.paused > 0 && <span className="text-[var(--rf-faint)]">{data.scheduleHealth.paused} paused</span>}
                      {data.scheduleHealth.failed === 0 && data.scheduleHealth.blocked === 0 && <span className="text-[var(--rf-green)]">All clear</span>}
                    </div>
                  </div>
                </PSection>
              )}
              {data.dataFreshness && (
                <PSection icon={Clock} color="var(--rf-cyan)" title="Data freshness · 8 sources">
                  <div className="divide-y divide-[var(--rf-card-line)]">
                    {data.dataFreshness.map((f) => (
                      <div key={f.source} className="flex items-center justify-between gap-2 px-4 py-2">
                        <span className="text-xs text-[var(--rf-text)]">{SOURCE_LABEL[f.source] ?? f.source}</span>
                        <span className="flex items-center gap-2">
                          {f.ageHours != null && <span className="text-[10px] text-[var(--rf-faint)]">{f.ageHours < 24 ? `${Math.round(f.ageHours)}h` : `${Math.round(f.ageHours / 24)}d`}</span>}
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: FRESH_COLOR[f.status] ?? 'var(--rf-muted)', background: 'rgba(255,255,255,0.05)' }}>{f.status.replace(/_/g, ' ')}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </PSection>
              )}
            </div>

            {/* Decision blockers (deduped incidents) */}
            {(data.decisionBlockers?.length ?? 0) > 0 && (
              <PSection icon={ShieldAlert} color="var(--rf-red)" title="Decision blockers" count={data.decisionBlockers!.length}>
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.decisionBlockers!.map((b) => (
                    <div key={b.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEV_COLOR[b.severity] }} />
                        <span className="text-sm font-medium text-white">{b.title}</span>
                        {b.occurrences > 1 && <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-[var(--rf-muted)]">{b.occurrences} signals · 1 incident</span>}
                      </div>
                      {b.detail && <p className="mt-1 pl-3.5 text-xs text-[var(--rf-muted)]">{b.detail}</p>}
                    </div>
                  ))}
                </div>
              </PSection>
            )}

            {/* Fused opportunities */}
            {(data.fusedOpportunities?.length ?? 0) > 0 && (
              <PSection icon={Layers} color="var(--rf-cyan)" title="Fused opportunities" count={data.fusedOpportunities!.length} href="/app/opportunities">
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.fusedOpportunities!.map((o) => (
                    <div key={o.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{o.title}</span>
                          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-[var(--rf-muted)]">{o.capability.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--rf-muted)]">{o.primaryReason}</p>
                      </div>
                      <span className="shrink-0 rf-mono text-sm font-semibold text-[var(--rf-cyan)]">{o.businessValue}</span>
                    </div>
                  ))}
                </div>
              </PSection>
            )}

            {/* Ready to deploy */}
            {(data.readyToDeploy?.length ?? 0) > 0 && (
              <PSection icon={Rocket} color="var(--rf-green)" title="Ready to deploy" count={data.readyToDeploy!.length}>
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.readyToDeploy!.map((o) => (
                    <div key={o.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-white">{o.title}</span>
                        <span className="shrink-0 rf-mono text-sm font-semibold text-[var(--rf-green)]">{o.businessValue}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--rf-muted)]">{o.recommendedFix}</p>
                      {o.page && <a href={o.page} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--rf-blue-bright)] hover:text-white">{o.page} <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                  ))}
                </div>
              </PSection>
            )}

            {/* Measuring outcomes + Recent wins */}
            <div className="grid gap-4 lg:grid-cols-2">
              {(data.measuringOutcomes?.length ?? 0) > 0 && (
                <PSection icon={Gauge} color="var(--rf-blue-bright)" title="Measuring outcomes" count={data.measuringOutcomes!.length}>
                  <div className="divide-y divide-[var(--rf-card-line)]">
                    {data.measuringOutcomes!.slice(0, 8).map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                        <div className="min-w-0"><p className="truncate text-sm text-[var(--rf-text)]">{m.keyword ?? m.page ?? m.changeType}</p><p className="text-[11px] text-[var(--rf-faint)]">{m.changeType.replace(/_/g, ' ')}{m.reviewAt ? ` · review ${new Date(m.reviewAt).toLocaleDateString()}` : ''}</p></div>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: MEASURE_COLOR[m.status] ?? 'var(--rf-muted)', background: 'rgba(255,255,255,0.05)' }}>{m.status.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </PSection>
              )}
              {(data.recentWins?.length ?? 0) > 0 && (
                <PSection icon={Trophy} color="var(--rf-green)" title="Recent wins" count={data.recentWins!.length}>
                  <div className="divide-y divide-[var(--rf-card-line)]">
                    {data.recentWins!.map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                        <div className="min-w-0"><p className="truncate text-sm text-[var(--rf-text)]">{w.keyword ?? w.page ?? w.changeType}</p>{w.notes && <p className="text-[11px] text-[var(--rf-faint)]">{w.notes}</p>}</div>
                        <span className="shrink-0 text-[11px] text-[var(--rf-green)]">{Math.round(w.confidence * 100)}% conf</span>
                      </div>
                    ))}
                  </div>
                </PSection>
              )}
            </div>

            {/* Opportunities */}
            <div className="rf-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-2.5"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]"><Target className="h-4 w-4 text-[var(--rf-cyan)]" /> Top opportunities</span><a href="/app/opportunities" className="text-[11px] text-[var(--rf-blue-bright)] hover:text-white">All →</a></div>
              {data.opportunities.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--rf-muted)]">No opportunities yet — run an audit and track keywords to generate them.</p>
              ) : (
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.opportunities.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0"><p className="truncate text-sm text-[var(--rf-text)]">{o.title}</p><p className="text-[11px] text-[var(--rf-faint)]">{o.type} · effort {o.effort} · risk {o.risk}</p></div>
                      <span className="shrink-0 rf-mono text-sm font-semibold text-[var(--rf-cyan)]">{o.businessValue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risks + activity */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rf-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5"><ShieldAlert className="h-4 w-4 text-[var(--rf-amber)]" /><span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Risks</span></div>
                <div className="p-4">
                  {pr.status === 'critical' || data.rankingSummary.losers > 0 || (data.latestAudit?.criticalCount ?? 0) > 0 ? (
                    <ul className="space-y-1.5 text-sm">
                      {(data.latestAudit?.criticalCount ?? 0) > 0 && <li className="flex items-start gap-2 text-[var(--rf-text)]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-red)]" />{data.latestAudit!.criticalCount} critical technical issue{data.latestAudit!.criticalCount !== 1 ? 's' : ''}</li>}
                      {data.rankingSummary.losers > 0 && <li className="flex items-start gap-2 text-[var(--rf-text)]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-amber)]" />{data.rankingSummary.losers} keyword{data.rankingSummary.losers !== 1 ? 's' : ''} lost ranking</li>}
                    </ul>
                  ) : <p className="flex items-center gap-2 text-sm text-[var(--rf-green)]"><CheckCircle2 className="h-4 w-4" /> No material risks detected.</p>}
                </div>
              </div>

              <div className="rf-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5"><Activity className="h-4 w-4 text-[var(--rf-blue-bright)]" /><span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Recent activity</span></div>
                <div className="p-4">
                  {data.recentActivity.length === 0 ? <p className="text-sm text-[var(--rf-muted)]">No activity recorded yet.</p> : (
                    <ul className="space-y-1.5 text-sm">
                      {data.recentActivity.map((a, i) => <li key={i} className="flex items-center justify-between gap-2"><span className="text-[var(--rf-text)]">{a.type}{a.action ? ` · ${a.action}` : ''}</span><span className="shrink-0 text-[11px] text-[var(--rf-faint)]">{new Date(a.at).toLocaleDateString()}</span></li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PSection({ icon: Icon, color, title, count, href, children }: { icon: typeof Target; color: string; title: string; count?: number; href?: string; children: ReactNode }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]"><Icon className="h-4 w-4" style={{ color }} /> {title}{count != null && <span className="rf-mono text-[11px] text-[var(--rf-faint)]">{count}</span>}</span>
        {href && <a href={href} className="text-[11px] text-[var(--rf-blue-bright)] hover:text-white">All →</a>}
      </div>
      {children}
    </div>
  )
}

function IntegrationRow({ label, connected, detail, connectHref, adds }: { label: string; connected: boolean; detail?: string; connectHref: string; adds: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><span className="text-sm text-[var(--rf-text)]">{label}</span>{connected ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rf-green)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--rf-green)]"><CheckCircle2 className="h-3 w-3" /> Connected</span> : <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-[var(--rf-muted)]">Not connected</span>}</div>
        <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">{connected ? (detail ?? 'Connected') : adds}</p>
      </div>
      {!connected && <a href={connectHref} className="rf-btn-ghost inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium">Connect <ExternalLink className="h-3 w-3" /></a>}
    </div>
  )
}
