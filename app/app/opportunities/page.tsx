'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Zap, ArrowLeft, Target, ExternalLink, Search } from 'lucide-react'

type Effort = 'low' | 'medium' | 'high'
type Risk = 'low' | 'medium' | 'high'
interface Estimate { metric: string; value: number | null; explanation: string; inputs: Record<string, unknown>; confidence: number; missing: string[] }
interface Opportunity {
  id: string; projectId: string; projectName?: string | null; domain?: string | null
  page: string | null; keyword: string | null; type: string; title: string
  primaryReason: string; supportingSignals: string[]; conflictingSignals: string[]
  businessValue: number; expectedReturn: number; effort: Effort; risk: Risk; confidence: number
  priorityScore: number; dataSources: string[]; recommendedFix: string
  capability: string; estimate: Estimate | null; missingEvidence: string[]
}
interface OppResponse {
  ok: boolean; generatedAt: string
  summary: { total: number; byType: Record<string, number>; highValue: number }
  opportunities: Opportunity[]
}

const TYPE_LABEL: Record<string, string> = {
  ranking: 'Ranking', ctr: 'CTR', traffic_recovery: 'Traffic recovery', conversion: 'Conversion',
  tracking_quality: 'Tracking gap', strong_conversion_weak_ranking: 'Converts, under-ranks',
  deployment_regression: 'Deploy regression', technical: 'Technical', schema: 'Schema', content_gap: 'Content gap',
}
const CAPABILITY_LABEL: Record<string, string> = {
  ready_to_generate: 'Ready to generate', ready_to_preview: 'Ready to preview', ready_for_approval: 'Ready for approval',
  ready_to_deploy: 'Ready to deploy', waiting_for_wordpress: 'Waiting for WordPress', waiting_for_data: 'Waiting for data',
  waiting_for_permissions: 'Waiting for permissions', blocked: 'Blocked', completed: 'Completed', measuring_outcome: 'Measuring outcome',
}
const EFFORT_COLOR: Record<Effort, string> = { low: 'var(--rf-green)', medium: 'var(--rf-amber)', high: 'var(--rf-red)' }
const RISK_COLOR: Record<Risk, string> = { low: 'var(--rf-green)', medium: 'var(--rf-amber)', high: 'var(--rf-red)' }

export default function OpportunitiesPage() {
  const [data, setData] = useState<OppResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/opportunities')
      if (res.status === 401) { setStatus('unauth'); return }
      const json = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setData(json); setStatus('ready')
    } catch { setStatus('error') }
  }, [])
  useEffect(() => { load() }, [load])

  const items = (data?.opportunities ?? [])
    .filter((o) => !typeFilter || o.type === typeFilter)
    .filter((o) => !query || `${o.title} ${o.keyword ?? ''} ${o.projectName ?? ''}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/app" className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</a>
            <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} /></span><span className="text-sm font-semibold text-white">Opportunities</span></span>
          </div>
          <a href="/app/today" className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><Target className="h-3.5 w-3.5" /> Today</a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {status === 'loading' && <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>}
        {status === 'unauth' && <div className="rf-card rf-topline grid place-items-center py-16 text-center"><p className="text-lg font-semibold text-white">Sign in to see your opportunities</p><a href="/app" className="rf-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">Go to sign in</a></div>}
        {status === 'error' && <div className="rf-card grid place-items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-[var(--rf-red)]" /><p className="mt-3 text-sm text-[var(--rf-muted)]">Couldn&apos;t load opportunities. <button onClick={load} className="text-[var(--rf-blue-bright)] hover:text-white">Retry</button></p></div>}

        {status === 'ready' && data && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-white">SEO Opportunities</h1>
                <p className="mt-1 text-sm text-[var(--rf-muted)]">{data.summary.total} opportunit{data.summary.total !== 1 ? 'ies' : 'y'} across your portfolio · {data.summary.highValue} high-value</p>
              </div>
              <div className="rf-card flex items-center gap-2 px-3 py-2"><Search className="h-4 w-4 shrink-0 text-[var(--rf-faint)]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search opportunities…" className="w-48 bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" /></div>
            </div>

            {/* type filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTypeFilter('')} className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${!typeFilter ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'rf-btn-ghost'}`}>All ({data.summary.total})</button>
              {Object.entries(data.summary.byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
                <button key={t} onClick={() => setTypeFilter(t === typeFilter ? '' : t)} className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${typeFilter === t ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'rf-btn-ghost'}`}>{TYPE_LABEL[t] ?? t} ({n})</button>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="rf-card grid place-items-center py-16 text-center">
                <Target className="h-8 w-8 text-[var(--rf-faint)]" />
                <p className="mt-3 text-sm font-medium text-white">{data.summary.total === 0 ? 'No opportunities found yet' : 'Nothing matches this filter'}</p>
                <p className="mt-1 max-w-md text-xs text-[var(--rf-muted)]">{data.summary.total === 0 ? 'Run an audit and track some keywords — opportunities are generated from real crawl and ranking data.' : 'Try a different type or clear your search.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((o) => (
                  <div key={o.id} className="rf-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-[var(--rf-blue)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--rf-blue-bright)]">{TYPE_LABEL[o.type] ?? o.type}</span>
                          {o.projectName && <span className="text-[11px] text-[var(--rf-faint)]">{o.projectName}</span>}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-white">{o.title}</p>
                          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-[var(--rf-muted)]">{CAPABILITY_LABEL[o.capability] ?? o.capability}</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--rf-muted)]">{o.primaryReason}</p>
                        {o.supportingSignals.length > 0 && <p className="mt-1 text-[11px] text-[var(--rf-faint)]">Supporting: {o.supportingSignals.join(' · ')}</p>}
                        {o.conflictingSignals.length > 0 && <p className="mt-1 text-[11px] text-[var(--rf-amber)]">Conflicting: {o.conflictingSignals.join(' · ')}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">Business value</p>
                        <p className="text-xl font-semibold text-[var(--rf-cyan)]">{o.businessValue}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                      <span className="text-[var(--rf-muted)]">Est. return <span className="font-semibold text-white">{o.expectedReturn}</span></span>
                      <span className="text-[var(--rf-muted)]">Effort <span className="font-semibold" style={{ color: EFFORT_COLOR[o.effort] }}>{o.effort}</span></span>
                      <span className="text-[var(--rf-muted)]">Risk <span className="font-semibold" style={{ color: RISK_COLOR[o.risk] }}>{o.risk}</span></span>
                      <span className="text-[var(--rf-muted)]">Confidence <span className="font-semibold text-white">{Math.round(o.confidence * 100)}%</span></span>
                      <span className="rf-mono text-[var(--rf-faint)]">sources: {o.dataSources.join(', ')}</span>
                      {o.page && <a href={o.page} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--rf-blue-bright)] hover:text-white">page <ExternalLink className="h-3 w-3" /></a>}
                    </div>
                    {o.estimate && (
                      <div className="mt-2.5 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">Estimate · {o.estimate.metric.replace(/_/g, ' ')}</p>
                        <p className="mt-0.5 text-xs text-white">{o.estimate.value != null ? o.estimate.value.toLocaleString() : 'Insufficient data to estimate.'}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">{o.estimate.explanation}{o.estimate.missing.length > 0 ? ` · missing: ${o.estimate.missing.join(', ')}` : ''}</p>
                      </div>
                    )}
                    <div className="mt-2.5 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">Recommended fix</p>
                      <p className="mt-0.5 text-xs text-[var(--rf-text)]">{o.recommendedFix}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-center text-[11px] text-[var(--rf-faint)]">Generated {new Date(data.generatedAt).toLocaleString()} from fused crawl, ranking, GSC, and GA4 evidence.</p>
          </div>
        )}
      </main>
    </div>
  )
}
