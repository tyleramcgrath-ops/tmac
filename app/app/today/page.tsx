'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Loader2, AlertTriangle, TrendingUp, Zap, ArrowLeft, Target, Clock,
  ShieldAlert, Sparkles, Hourglass, Ban, CheckCircle2, Activity, Trophy, Gauge,
} from 'lucide-react'

type PortfolioStatus = 'critical' | 'needs_attention' | 'opportunity' | 'improving' | 'stable' | 'waiting_for_data' | 'blocked' | 'no_action_needed'
type AvailableTime = '15m' | '30m' | '1h' | '2h' | 'half_day' | 'full_day'

interface Briefing { projectCount: number; needingAttention: number; critical: number; improving: number; waitingForData: number; stable: number; opportunities: number }
type Mission = { projectId: string; projectName: string; domain: string; status: PortfolioStatus; headline: string; whyThisFirst: string; recommendedAction: string; reasons: string[]; missingData: string[] } | null
interface BucketItem { projectId: string; projectName: string; domain: string; status: PortfolioStatus; headline: string; action: string }
interface Incident { id: string; kind: string; scope: string; severity: 'critical' | 'warning' | 'info'; title: string; detail?: string; occurrences: number; sources: string[]; projectName?: string | null }
interface AttentionJob { id: string; projectId: string; jobType: string; status: string; failureClass: string | null; failureReason: string | null; retryable: boolean; needsUser: boolean; needsConfig: boolean; projectName?: string | null }
interface Measuring { id: string; projectId: string; page: string | null; keyword: string | null; changeType: string; status: string; confidence: number; reviewAt: string | null; notes: string | null; projectName?: string | null }
interface Win { id: string; projectId: string; page: string | null; keyword: string | null; changeType: string; confidence: number; at: string; notes: string | null; projectName?: string | null }
interface TodayResponse {
  ok: boolean
  generatedAt: string
  briefing: Briefing
  mission: Mission
  buckets: Record<'do_first' | 'quick_wins' | 'strategic' | 'risks' | 'waiting' | 'blocked', BucketItem[]>
  availableTime: AvailableTime
  scheduleHealth?: { total: number; running: number; failed: number; retrying: number; blocked: number; paused: number; healthy: number; score: number }
  dataProblems?: Incident[]
  jobsRequiringAttention?: AttentionJob[]
  measuringResults?: Measuring[]
  winsSinceYesterday?: Win[]
}

const SEV_COLOR: Record<string, string> = { critical: 'var(--rf-red)', warning: 'var(--rf-amber)', info: 'var(--rf-faint)' }
const JOB_LABEL: Record<string, string> = {
  crawl: 'Site crawl', priority_rankings: 'Priority ranks', full_rankings: 'Full ranks', gsc_sync: 'GSC sync', ga4_sync: 'GA4 sync',
  fusion: 'Data fusion', portfolio_priority: 'Portfolio priority', daily_mission: 'Daily mission', morning_briefing: 'Morning briefing',
  opportunities: 'Opportunities', deployment_verification: 'Deploy verification', weekly_summary: 'Weekly summary',
}
const MEASURE_COLOR: Record<string, string> = {
  awaiting_data: 'var(--rf-faint)', too_early: 'var(--rf-faint)', improving: 'var(--rf-green)', neutral: 'var(--rf-muted)',
  declining: 'var(--rf-red)', inconclusive: 'var(--rf-amber)', needs_review: 'var(--rf-amber)', successful: 'var(--rf-green)',
}

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

const TIME_OPTIONS: { key: AvailableTime; label: string }[] = [
  { key: '15m', label: '15 min' }, { key: '30m', label: '30 min' }, { key: '1h', label: '1 hour' },
  { key: '2h', label: '2 hours' }, { key: 'half_day', label: 'Half day' }, { key: 'full_day', label: 'Full day' },
]

const BUCKET_META: { key: keyof TodayResponse['buckets']; label: string; icon: typeof Target; color: string }[] = [
  { key: 'do_first', label: 'Do first', icon: AlertTriangle, color: 'var(--rf-red)' },
  { key: 'quick_wins', label: 'Quick wins', icon: Sparkles, color: 'var(--rf-cyan)' },
  { key: 'strategic', label: 'Strategic work', icon: TrendingUp, color: 'var(--rf-blue-bright)' },
  { key: 'risks', label: 'Risks to watch', icon: ShieldAlert, color: 'var(--rf-amber)' },
  { key: 'waiting', label: 'Waiting for data', icon: Hourglass, color: 'var(--rf-faint)' },
  { key: 'blocked', label: 'Blocked', icon: Ban, color: 'var(--rf-red)' },
]

function StatusBadge({ status }: { status: PortfolioStatus }) {
  const m = STATUS_META[status]
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: m.color, background: m.bg }}>{m.label}</span>
}

export default function TodayPage() {
  const [time, setTime] = useState<AvailableTime>('1h')
  const [data, setData] = useState<TodayResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')

  const load = useCallback(async (t: AvailableTime) => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/today?time=${t}`)
      if (res.status === 401) { setStatus('unauth'); return }
      const json = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setData(json); setStatus('ready')
    } catch { setStatus('error') }
  }, [])

  useEffect(() => { load(time) }, [time, load])

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/app" className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</a>
            <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} /></span><span className="text-sm font-semibold text-white">Today</span></span>
          </div>
          <div className="-mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1">
            <Clock className="mr-1 hidden h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)] sm:block" />
            {TIME_OPTIONS.map((o) => (
              <button key={o.key} onClick={() => setTime(o.key)} className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${time === o.key ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)] hover:text-white'}`}>{o.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {status === 'loading' && <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>}
        {status === 'unauth' && <div className="rf-card rf-topline grid place-items-center py-16 text-center"><p className="text-lg font-semibold text-white">Sign in to see your morning briefing</p><a href="/app" className="rf-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">Go to sign in</a></div>}
        {status === 'error' && <div className="rf-card grid place-items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-[var(--rf-red)]" /><p className="mt-3 text-sm text-[var(--rf-muted)]">Couldn&apos;t load today&apos;s plan. <button onClick={() => load(time)} className="text-[var(--rf-blue-bright)] hover:text-white">Retry</button></p></div>}

        {status === 'ready' && data && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-white">Good morning</h1>
              <p className="mt-1 text-sm text-[var(--rf-muted)]">Here&apos;s what needs your attention across {data.briefing.projectCount} project{data.briefing.projectCount !== 1 ? 's' : ''} today.</p>
            </div>

            {/* Briefing strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <BriefStat label="Need attention" value={data.briefing.needingAttention} tone={data.briefing.needingAttention ? 'var(--rf-amber)' : 'var(--rf-green)'} />
              <BriefStat label="Critical" value={data.briefing.critical} tone={data.briefing.critical ? 'var(--rf-red)' : 'var(--rf-green)'} />
              <BriefStat label="Opportunities" value={data.briefing.opportunities} tone="var(--rf-cyan)" />
              <BriefStat label="Improving" value={data.briefing.improving} tone="var(--rf-green)" />
              <BriefStat label="Stable" value={data.briefing.stable} tone="var(--rf-muted)" />
              <BriefStat label="Waiting for data" value={data.briefing.waitingForData} tone="var(--rf-faint)" />
            </div>

            {/* Portfolio Mission */}
            {data.mission ? (
              <div className="rf-card rf-topline p-5">
                <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[var(--rf-blue-bright)]" /><span className="rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">Today&apos;s Portfolio Mission</span></div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a href="/app" className="text-lg font-semibold text-white hover:text-[var(--rf-blue-bright)]">{data.mission.projectName}</a>
                  <StatusBadge status={data.mission.status} />
                  <span className="text-xs text-[var(--rf-faint)]">{data.mission.domain}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-[var(--rf-text)]">{data.mission.headline}</p>
                <p className="mt-1 text-sm text-[var(--rf-muted)]"><span className="text-[var(--rf-text)]">Why this first:</span> {data.mission.whyThisFirst}</p>
                <div className="mt-3 rounded-xl border border-[var(--rf-card-line-strong)] bg-white/[0.02] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--rf-faint)]">Next action</p>
                  <p className="mt-1 text-sm text-white">{data.mission.recommendedAction}</p>
                </div>
                {data.mission.reasons.length > 0 && (
                  <ul className="mt-3 space-y-1">{data.mission.reasons.slice(0, 4).map((r, i) => <li key={i} className="flex items-start gap-2 text-xs text-[var(--rf-muted)]"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--rf-blue)]" />{r}</li>)}</ul>
                )}
                {data.mission.missingData.length > 0 && <p className="mt-2 text-[11px] text-[var(--rf-faint)]">Missing data: {data.mission.missingData.join(', ')}</p>}
              </div>
            ) : (
              <div className="rf-card p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--rf-green)]" />
                <p className="mt-2 text-sm font-medium text-white">Nothing urgent across your portfolio right now.</p>
                <p className="mt-1 text-xs text-[var(--rf-muted)]">No losses, failures, or reachable opportunities detected. Run an audit or a ranking check to surface new work.</p>
              </div>
            )}

            {/* Priority buckets */}
            <div className="grid gap-4 lg:grid-cols-2">
              {BUCKET_META.map((b) => {
                const items = data.buckets[b.key]
                if (items.length === 0) return null
                const Icon = b.icon
                return (
                  <div key={b.key} className="rf-card overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5"><Icon className="h-4 w-4" style={{ color: b.color }} /><span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{b.label}</span><span className="rf-mono text-[11px] text-[var(--rf-faint)]">{items.length}</span></div>
                    <div className="divide-y divide-[var(--rf-card-line)]">
                      {items.map((it) => (
                        <a key={it.projectId} href="/app" className="block px-4 py-3 hover:bg-white/[0.02]">
                          <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-white">{it.projectName}</span><StatusBadge status={it.status} /></div>
                          <p className="mt-1 text-xs text-[var(--rf-text)]">{it.headline}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--rf-muted)]">{it.action}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Data Problems Blocking Decisions ── */}
            {(data.dataProblems?.length ?? 0) > 0 && (
              <Section icon={ShieldAlert} color="var(--rf-red)" title="Data problems blocking decisions" count={data.dataProblems!.length}>
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.dataProblems!.map((p) => (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEV_COLOR[p.severity] }} />
                        <span className="text-sm font-medium text-white">{p.title}</span>
                        {p.projectName && <span className="text-[11px] text-[var(--rf-faint)]">{p.projectName}</span>}
                        {p.occurrences > 1 && <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-[var(--rf-muted)]">seen {p.occurrences}× · 1 incident</span>}
                      </div>
                      {p.detail && <p className="mt-1 pl-3.5 text-xs text-[var(--rf-muted)]">{p.detail}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Jobs Requiring Attention ── */}
            {(data.jobsRequiringAttention?.length ?? 0) > 0 && (
              <Section icon={Activity} color="var(--rf-amber)" title="Jobs requiring attention" count={data.jobsRequiringAttention!.length}>
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.jobsRequiringAttention!.map((j) => (
                    <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{JOB_LABEL[j.jobType] ?? j.jobType}</span>
                          {j.projectName && <span className="text-[11px] text-[var(--rf-faint)]">{j.projectName}</span>}
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: j.status === 'failed' ? 'var(--rf-red)' : 'var(--rf-amber)', background: 'rgba(255,255,255,0.05)' }}>{j.status.replace(/_/g, ' ')}</span>
                        </div>
                        {j.failureReason && <p className="mt-1 text-xs text-[var(--rf-muted)]">{j.failureReason}</p>}
                      </div>
                      <span className="shrink-0 text-[11px]" style={{ color: j.needsConfig ? 'var(--rf-cyan)' : j.needsUser ? 'var(--rf-amber)' : 'var(--rf-green)' }}>{j.needsConfig ? 'Needs setup' : j.needsUser ? 'Needs you' : 'Auto-retrying'}</span>
                    </div>
                  ))}
                </div>
                <a href="/app/schedules" className="block border-t border-[var(--rf-card-line)] px-4 py-2 text-center text-[11px] text-[var(--rf-blue-bright)] hover:text-white">Manage schedules →</a>
              </Section>
            )}

            {/* ── Measuring Results ── */}
            {(data.measuringResults?.length ?? 0) > 0 && (
              <Section icon={Gauge} color="var(--rf-blue-bright)" title="Measuring results" count={data.measuringResults!.length}>
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.measuringResults!.slice(0, 8).map((m) => (
                    <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-white">{m.keyword ?? m.page ?? m.changeType}</span>
                          {m.projectName && <span className="text-[11px] text-[var(--rf-faint)]">{m.projectName}</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">{m.changeType.replace(/_/g, ' ')}{m.reviewAt ? ` · review ${new Date(m.reviewAt).toLocaleDateString()}` : ''}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: MEASURE_COLOR[m.status] ?? 'var(--rf-muted)', background: 'rgba(255,255,255,0.05)' }}>{m.status.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Wins Since Yesterday (measured/verified only) ── */}
            {(data.winsSinceYesterday?.length ?? 0) > 0 && (
              <Section icon={Trophy} color="var(--rf-green)" title="Wins since yesterday" count={data.winsSinceYesterday!.length}>
                <div className="divide-y divide-[var(--rf-card-line)]">
                  {data.winsSinceYesterday!.map((w) => (
                    <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <span className="truncate text-sm font-medium text-white">{w.keyword ?? w.page ?? w.changeType}</span>
                        {w.projectName && <span className="ml-2 text-[11px] text-[var(--rf-faint)]">{w.projectName}</span>}
                        {w.notes && <p className="mt-0.5 text-xs text-[var(--rf-muted)]">{w.notes}</p>}
                      </div>
                      <span className="shrink-0 text-[11px] text-[var(--rf-green)]">verified · {Math.round(w.confidence * 100)}% conf</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <p className="text-center text-[11px] text-[var(--rf-faint)]">Generated {new Date(data.generatedAt).toLocaleString()} · adjust your available time above to reshape the plan.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function Section({ icon: Icon, color, title, count, children }: { icon: typeof Target; color: string; title: string; count: number; children: ReactNode }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{title}</span>
        <span className="rf-mono text-[11px] text-[var(--rf-faint)]">{count}</span>
      </div>
      {children}
    </div>
  )
}

function BriefStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rf-card p-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p>
      <p className="mt-0.5 text-xl font-semibold" style={{ color: tone }}>{value}</p>
    </div>
  )
}
