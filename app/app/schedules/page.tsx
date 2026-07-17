'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Zap, ArrowLeft, Play, Pause, RefreshCw, Clock } from 'lucide-react'

type JobStatus = 'scheduled' | 'queued' | 'running' | 'completed' | 'completed_with_warnings' | 'retrying' | 'failed' | 'paused' | 'blocked' | 'not_configured'
type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'missing' | 'failed' | 'not_configured'
interface Freshness { source: string; status: FreshnessStatus; ageHours: number | null; reason: string; recommendedAction: string }
interface Job {
  id: string; projectId: string; jobType: string; enabled: boolean; frequency: string
  status: JobStatus; lastSuccessAt: string | null; lastFailureAt: string | null; nextRunAt: string | null
  durationMs: number | null; retryCount: number; maxRetries: number; failureReason: string | null; failureClass: string | null
  recordsProcessed: number | null; freshness: Freshness | null
}
interface SchedulesResponse {
  ok: boolean; summary: { total: number; running: number; failed: number; retrying: number; paused: number; blocked: number; dueToday: number; stale: number }; jobs: Job[]
}
interface ListProject { id: string; name: string }

const JOB_LABEL: Record<string, string> = {
  crawl: 'Site crawl', priority_rankings: 'Priority rank checks', full_rankings: 'Full rank set',
  gsc_sync: 'GSC sync', ga4_sync: 'GA4 sync', fusion: 'Data fusion', portfolio_priority: 'Portfolio priority',
  daily_mission: 'Daily missions', morning_briefing: 'Morning briefing', opportunities: 'Opportunities',
  deployment_verification: 'Deploy verification', weekly_summary: 'Weekly summary',
}
const STATUS_COLOR: Record<JobStatus, string> = {
  scheduled: 'var(--rf-muted)', queued: 'var(--rf-cyan)', running: 'var(--rf-blue-bright)', completed: 'var(--rf-green)',
  completed_with_warnings: 'var(--rf-amber)', retrying: 'var(--rf-amber)', failed: 'var(--rf-red)', paused: 'var(--rf-faint)',
  blocked: 'var(--rf-red)', not_configured: 'var(--rf-faint)',
}
const FRESH_COLOR: Record<FreshnessStatus, string> = {
  fresh: 'var(--rf-green)', aging: 'var(--rf-amber)', stale: 'var(--rf-red)', missing: 'var(--rf-faint)', failed: 'var(--rf-red)', not_configured: 'var(--rf-faint)',
}

export default function SchedulesPage() {
  const [projects, setProjects] = useState<ListProject[]>([])
  const [projectId, setProjectId] = useState('')
  const [data, setData] = useState<SchedulesResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

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
      const res = await fetch(`/api/schedules?projectId=${encodeURIComponent(pid)}`)
      if (res.status === 401) { setStatus('unauth'); return }
      const json = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setData(json); setStatus('ready')
    } catch { setStatus('error') }
  }, [])
  useEffect(() => { if (projectId) load(projectId) }, [projectId, load])

  const act = async (action: string, jobType?: string) => {
    setBusy(jobType ?? action); setNote(null)
    try {
      const res = await fetch('/api/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, projectId, jobType }) })
      const json = await res.json()
      if (!res.ok) { setNote(json?.error ?? 'Action failed.'); return }
      if (action === 'run_now') setNote(`Queued ${JOB_LABEL[jobType!] ?? jobType} — job ${json.jobId}.`)
      if (action === 'ensure_defaults') setNote(`Created ${json.ensured} default schedules.`)
      load(projectId)
    } catch { setNote('Network error.') } finally { setBusy(null) }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />
      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/app" className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</a>
            <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} /></span><span className="text-sm font-semibold text-white">Schedules</span></span>
          </div>
          {projects.length > 0 && <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rf-card cursor-pointer bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none">{projects.map((p) => <option key={p.id} value={p.id} className="bg-[#0b1120]">{p.name}</option>)}</select>}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        {status === 'loading' && <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>}
        {status === 'unauth' && <div className="rf-card rf-topline grid place-items-center py-16 text-center"><p className="text-lg font-semibold text-white">Sign in to manage schedules</p><a href="/app" className="rf-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">Go to sign in</a></div>}
        {status === 'error' && <div className="rf-card grid place-items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-[var(--rf-red)]" /><p className="mt-3 text-sm text-[var(--rf-muted)]">Couldn&apos;t load schedules.</p></div>}

        {status === 'ready' && data && (
          <div className="space-y-4">
            {note && <div className="rounded-xl border border-[var(--rf-card-line)] bg-white/[0.02] px-4 py-2.5 text-xs text-[var(--rf-muted)]">{note}</div>}

            {data.jobs.length === 0 ? (
              <div className="rf-card grid place-items-center py-14 text-center">
                <Clock className="h-8 w-8 text-[var(--rf-faint)]" />
                <p className="mt-3 text-sm font-medium text-white">No schedules yet for this project</p>
                <p className="mt-1 text-xs text-[var(--rf-muted)]">Create the default schedule set to start tracking freshness and running jobs.</p>
                <button onClick={() => act('ensure_defaults')} disabled={busy === 'ensure_defaults'} className="rf-btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70">{busy === 'ensure_defaults' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Create default schedules</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  <Stat label="Total" value={data.summary.total} />
                  <Stat label="Running" value={data.summary.running} tone="var(--rf-blue-bright)" />
                  <Stat label="Failed" value={data.summary.failed} tone={data.summary.failed ? 'var(--rf-red)' : 'var(--rf-green)'} />
                  <Stat label="Blocked" value={data.summary.blocked} tone={data.summary.blocked ? 'var(--rf-amber)' : 'var(--rf-green)'} />
                  <Stat label="Stale" value={data.summary.stale} tone={data.summary.stale ? 'var(--rf-red)' : 'var(--rf-green)'} />
                  <Stat label="Due today" value={data.summary.dueToday} tone="var(--rf-cyan)" />
                </div>

                <div className="rf-card overflow-hidden">
                  <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Scheduled jobs</div>
                  <div className="divide-y divide-[var(--rf-card-line)]">
                    {data.jobs.map((j) => (
                      <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-white">{JOB_LABEL[j.jobType] ?? j.jobType}</span>
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: STATUS_COLOR[j.status], background: 'rgba(255,255,255,0.05)' }}>{j.status.replace(/_/g, ' ')}</span>
                            {j.freshness && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: FRESH_COLOR[j.freshness.status], background: 'rgba(255,255,255,0.04)' }}>{j.freshness.status}</span>}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">
                            {j.frequency} · next {j.nextRunAt ? new Date(j.nextRunAt).toLocaleString() : 'event-driven'} · last success {j.lastSuccessAt ? new Date(j.lastSuccessAt).toLocaleDateString() : '—'}
                            {j.failureReason && <span className="text-[var(--rf-red)]"> · {j.failureReason}</span>}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button onClick={() => act('run_now', j.jobType)} disabled={busy === j.jobType || j.status === 'running' || j.status === 'queued'} className="rf-btn-ghost inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium disabled:opacity-50">{busy === j.jobType ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Run now</button>
                          <button onClick={() => act(j.enabled ? 'pause' : 'resume', j.jobType)} className="rf-btn-ghost inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium">{j.enabled ? <><Pause className="h-3 w-3" /> Pause</> : <><RefreshCw className="h-3 w-3" /> Resume</>}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-center text-[11px] text-[var(--rf-faint)]">Run now creates a real queued job (duplicate-prevented) processed by the background worker — not a local spinner.</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, tone = 'white' }: { label: string; value: number; tone?: string }) {
  return <div className="rf-card p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p><p className="mt-0.5 text-xl font-semibold" style={{ color: tone === 'white' ? '#fff' : tone }}>{value}</p></div>
}
