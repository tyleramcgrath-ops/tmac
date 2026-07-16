'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Zap, ArrowLeft, BarChart3, Plug } from 'lucide-react'

type State = 'not_configured' | 'disconnected' | 'connected' | 'healthy'
interface LandingPage { url: string; sessions: number; conversions: number; engagementRate: number; revenue: number | null }
interface Ga4Response {
  ok: boolean; state: State; connected: boolean
  project: { name: string; domain: string }
  totals: { sessions: number; users: number; conversions: number; revenue: number | null; conversionRate: number } | null
  landingPages: LandingPage[]; highTrafficLowConversion: { url: string; sessions: number; conversions: number }[]; lastSync: string | null
}
interface ListProject { id: string; name: string }

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<ListProject[]>([])
  const [projectId, setProjectId] = useState('')
  const [data, setData] = useState<Ga4Response | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/auth/session')
        if (s.status === 401) { setStatus('unauth'); return }
        const sj = await s.json()
        const pr = await fetch(`/api/projects/list?organizationId=${encodeURIComponent(sj.organization?.id)}`)
        const pj = await pr.json()
        const list = (pj.projects ?? []).map((p: any) => ({ id: p.id, name: p.name }))
        setProjects(list)
        if (list.length > 0) setProjectId(list[0].id); else setStatus('ready')
      } catch { setStatus('error') }
    })()
  }, [])

  const load = useCallback(async (pid: string) => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/analytics?projectId=${encodeURIComponent(pid)}`)
      if (res.status === 401) { setStatus('unauth'); return }
      const json = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setData(json); setStatus('ready')
    } catch { setStatus('error') }
  }, [])
  useEffect(() => { if (projectId) load(projectId) }, [projectId, load])

  const disconnected = data && (data.state === 'not_configured' || data.state === 'disconnected' || !data.totals)

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />
      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/app" className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</a>
            <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} /></span><span className="text-sm font-semibold text-white">Analytics</span></span>
          </div>
          {projects.length > 0 && <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rf-card cursor-pointer bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none">{projects.map((p) => <option key={p.id} value={p.id} className="bg-[#0b1120]">{p.name}</option>)}</select>}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        {status === 'loading' && <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>}
        {status === 'unauth' && <div className="rf-card rf-topline grid place-items-center py-16 text-center"><p className="text-lg font-semibold text-white">Sign in to view Analytics data</p><a href="/app" className="rf-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">Go to sign in</a></div>}
        {status === 'error' && <div className="rf-card grid place-items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-[var(--rf-red)]" /><p className="mt-3 text-sm text-[var(--rf-muted)]">Couldn&apos;t load Analytics data.</p></div>}

        {status === 'ready' && data && disconnected && (
          <div className="rf-card rf-topline grid place-items-center py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--rf-violet)]/15 text-[var(--rf-violet)]"><BarChart3 className="h-6 w-6" /></span>
            <p className="mt-4 text-lg font-semibold text-white">{data.state === 'not_configured' ? 'Google OAuth not configured' : data.state === 'disconnected' ? 'Analytics not connected' : 'Connected — awaiting first sync'}</p>
            <p className="mt-1 max-w-md text-sm text-[var(--rf-muted)]">Connecting GA4 adds real organic sessions, engagement, conversions, and revenue by landing page — and reveals high-traffic, low-conversion pages worth optimizing.</p>
            <a href="/app/integrations/google" className="rf-btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"><Plug className="h-4 w-4" /> {data.state === 'not_configured' ? 'Set up Google' : 'Connect Analytics'}</a>
          </div>
        )}

        {status === 'ready' && data && data.totals && !disconnected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Sessions" value={data.totals.sessions.toLocaleString()} />
              <Stat label="Users" value={data.totals.users.toLocaleString()} />
              <Stat label="Conversions" value={data.totals.conversions.toLocaleString()} />
              <Stat label="Conv. rate" value={`${data.totals.conversionRate}%`} />
              <Stat label="Revenue" value={data.totals.revenue != null ? `$${data.totals.revenue.toLocaleString()}` : 'Not tracked'} />
            </div>
            <div className="rf-card overflow-hidden">
              <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Landing pages</div>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]"><th className="px-4 py-2 font-medium">Page</th><th className="px-4 py-2 font-medium">Sessions</th><th className="px-4 py-2 font-medium">Conv.</th><th className="px-4 py-2 font-medium">Engagement</th><th className="px-4 py-2 font-medium">Revenue</th></tr></thead>
                <tbody className="divide-y divide-[var(--rf-card-line)]">{data.landingPages.map((r) => <tr key={r.url} className="hover:bg-white/[0.02]"><td className="max-w-[260px] truncate px-4 py-2.5 text-[var(--rf-muted)]">{r.url}</td><td className="px-4 py-2.5 rf-mono text-white">{r.sessions}</td><td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{r.conversions}</td><td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{(r.engagementRate * 100).toFixed(0)}%</td><td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{r.revenue != null ? `$${r.revenue}` : '—'}</td></tr>)}</tbody></table></div>
            </div>
            {data.highTrafficLowConversion.length > 0 && (
              <div className="rf-card overflow-hidden">
                <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">High traffic, no conversions — optimization targets</div>
                <div className="divide-y divide-[var(--rf-card-line)]">{data.highTrafficLowConversion.map((r) => <div key={r.url} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="truncate text-[var(--rf-muted)]">{r.url}</span><span className="shrink-0 rf-mono text-[var(--rf-amber)]">{r.sessions} sessions · 0 conv.</span></div>)}</div>
              </div>
            )}
            <p className="text-center text-[11px] text-[var(--rf-faint)]">Revenue and conversions come straight from GA4 — never estimated. Last sync {data.lastSync ? new Date(data.lastSync).toLocaleString() : '—'}.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rf-card p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p><p className="mt-0.5 text-lg font-semibold text-white">{value}</p></div>
}
