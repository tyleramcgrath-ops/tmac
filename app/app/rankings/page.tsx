'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Zap, ArrowLeft, RefreshCw, ArrowUp, ArrowDown, Minus, Target } from 'lucide-react'

interface Project { id: string; name: string; domain: string }
interface Keyword {
  id: string; keyword: string; type: string; intent: string; status: string
  currentPosition: number | null; previousPosition: number | null; bestPosition: number | null
  change: number | null; rankingUrl: string | null; dataSource: string | null; lastCheckedAt: string | null; targetPageUrl: string | null
}
interface KeywordsResponse {
  ok: boolean; total: number
  summary: { total: number; tracked: number; top3: number; top10: number; top20: number; page2: number; gainers: number; losers: number; cannibalized: number }
  keywords: Keyword[]
}

const VIEWS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'top3', label: 'Top 3' }, { key: 'top10', label: 'Top 10' },
  { key: 'top20', label: 'Top 20' }, { key: 'page2', label: 'Page 2' }, { key: 'questions', label: 'Questions' },
  { key: 'local', label: 'Local' }, { key: 'branded', label: 'Branded' }, { key: 'cannibalized', label: 'Cannibalized' }, { key: 'unassigned', label: 'Unassigned' },
]

const SOURCE_LABEL: Record<string, string> = {
  rankforge_live_check: 'RankForge live', gsc: 'GSC avg', manual: 'Manual', imported: 'Imported', estimated: 'Estimated', unavailable: 'Unavailable',
}

export default function RankingsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string>('')
  const [orgId, setOrgId] = useState<string>('')
  const [data, setData] = useState<KeywordsResponse | null>(null)
  const [view, setView] = useState('all')
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauth' | 'error' | 'no-projects'>('loading')
  const [rechecking, setRechecking] = useState(false)
  const [recheckNote, setRecheckNote] = useState<string | null>(null)

  // Load session + projects
  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/auth/session')
        if (s.status === 401) { setStatus('unauth'); return }
        const sj = await s.json()
        const oid = sj.organization?.id
        setOrgId(oid ?? '')
        const pr = await fetch(`/api/projects/list?organizationId=${encodeURIComponent(oid)}`)
        const pj = await pr.json()
        const list: Project[] = (pj.projects ?? []).map((p: any) => ({ id: p.id, name: p.name, domain: p.domain }))
        setProjects(list)
        if (list.length === 0) { setStatus('no-projects'); return }
        setProjectId(list[0].id)
      } catch { setStatus('error') }
    })()
  }, [])

  const loadKeywords = useCallback(async (pid: string, v: string) => {
    if (!pid) return
    setStatus('loading')
    try {
      const res = await fetch(`/api/keywords?projectId=${encodeURIComponent(pid)}&view=${v}`)
      if (res.status === 401) { setStatus('unauth'); return }
      const json = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setData(json); setStatus('ready')
    } catch { setStatus('error') }
  }, [])

  useEffect(() => { if (projectId) loadKeywords(projectId, view) }, [projectId, view, loadKeywords])

  const recheck = async () => {
    if (!projectId) return
    setRechecking(true); setRecheckNote(null)
    try {
      const res = await fetch('/api/rankings/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
      const json = await res.json()
      if (!res.ok) { setRecheckNote(json?.error ?? 'Recheck failed.'); return }
      const s = json.summary
      setRecheckNote(json.liveSourceConfigured
        ? `Checked ${s.checked}: ${s.ranking} ranking, ${s.unavailable} unavailable.`
        : `No live SERP source configured — ${s.unavailable} checks recorded as unavailable (no positions were invented).`)
      loadKeywords(projectId, view)
    } catch { setRecheckNote('Network error.') } finally { setRechecking(false) }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/app" className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</a>
            <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} /></span><span className="text-sm font-semibold text-white">Rankings</span></span>
          </div>
          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rf-card cursor-pointer bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none">
                {projects.map((p) => <option key={p.id} value={p.id} className="bg-[#0b1120]">{p.name}</option>)}
              </select>
            )}
            <button onClick={recheck} disabled={rechecking || !projectId} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60">{rechecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Recheck</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {status === 'unauth' && <div className="rf-card rf-topline grid place-items-center py-16 text-center"><p className="text-lg font-semibold text-white">Sign in to track rankings</p><a href="/app" className="rf-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">Go to sign in</a></div>}
        {status === 'no-projects' && <div className="rf-card grid place-items-center py-16 text-center"><Target className="h-8 w-8 text-[var(--rf-faint)]" /><p className="mt-3 text-sm font-medium text-white">No projects yet</p><p className="mt-1 text-xs text-[var(--rf-muted)]">Create a project and run an audit to discover keywords to track.</p></div>}
        {status === 'error' && <div className="rf-card grid place-items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-[var(--rf-red)]" /><p className="mt-3 text-sm text-[var(--rf-muted)]">Couldn&apos;t load rankings. <button onClick={() => loadKeywords(projectId, view)} className="text-[var(--rf-blue-bright)] hover:text-white">Retry</button></p></div>}

        {(status === 'ready' || status === 'loading') && data && (
          <div className="space-y-4">
            {recheckNote && <div className="rounded-xl border border-[var(--rf-card-line)] bg-white/[0.02] px-4 py-2.5 text-xs text-[var(--rf-muted)]">{recheckNote}</div>}

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <Stat label="Tracked" value={data.summary.tracked} />
              <Stat label="Top 3" value={data.summary.top3} tone="var(--rf-green)" />
              <Stat label="Top 10" value={data.summary.top10} tone="var(--rf-cyan)" />
              <Stat label="Page 2" value={data.summary.page2} tone="var(--rf-amber)" />
              <Stat label="Gainers" value={data.summary.gainers} tone="var(--rf-green)" />
              <Stat label="Losers" value={data.summary.losers} tone="var(--rf-red)" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {VIEWS.map((v) => <button key={v.key} onClick={() => setView(v.key)} className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${view === v.key ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'rf-btn-ghost'}`}>{v.label}</button>)}
            </div>

            {data.keywords.length === 0 ? (
              <div className="rf-card grid place-items-center py-14 text-center">
                <p className="text-sm font-medium text-white">{data.total === 0 ? 'No keywords tracked yet' : 'No keywords in this view'}</p>
                <p className="mt-1 max-w-md text-xs text-[var(--rf-muted)]">{data.total === 0 ? 'Run an audit to auto-discover keywords, then Recheck to record their positions.' : 'Try a different view.'}</p>
              </div>
            ) : (
              <div className="rf-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]">
                      <th className="px-4 py-2 font-medium">Keyword</th><th className="px-4 py-2 font-medium">Position</th><th className="px-4 py-2 font-medium">Change</th><th className="px-4 py-2 font-medium">Best</th><th className="px-4 py-2 font-medium">Intent</th><th className="px-4 py-2 font-medium">Source</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[var(--rf-card-line)]">
                      {data.keywords.map((k) => (
                        <tr key={k.id} className="hover:bg-white/[0.02]">
                          <td className="max-w-[280px] px-4 py-2.5"><span className="truncate text-[var(--rf-text)]">{k.keyword}</span>{k.status === 'cannibalized' && <span className="ml-2 rounded bg-[var(--rf-amber)]/10 px-1.5 py-0.5 text-[9px] uppercase text-[var(--rf-amber)]">cannibalized</span>}</td>
                          <td className="px-4 py-2.5 rf-mono font-semibold text-white">{k.currentPosition !== null ? `#${k.currentPosition}` : <span className="text-[var(--rf-faint)]">—</span>}</td>
                          <td className="px-4 py-2.5"><ChangeCell change={k.change} /></td>
                          <td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{k.bestPosition !== null ? `#${k.bestPosition}` : '—'}</td>
                          <td className="px-4 py-2.5 text-[var(--rf-muted)]">{k.intent}</td>
                          <td className="px-4 py-2.5 text-[11px] text-[var(--rf-faint)]">{k.dataSource ? (SOURCE_LABEL[k.dataSource] ?? k.dataSource) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p className="text-center text-[11px] text-[var(--rf-faint)]">Observed positions come from real rank checks. GSC average position, when connected, is labeled separately — the two are never mixed.</p>
          </div>
        )}
        {status === 'loading' && !data && <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>}
      </main>
    </div>
  )
}

function Stat({ label, value, tone = 'white' }: { label: string; value: number; tone?: string }) {
  return <div className="rf-card p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--rf-faint)]">{label}</p><p className="mt-0.5 text-xl font-semibold" style={{ color: tone === 'white' ? '#fff' : tone }}>{value}</p></div>
}

function ChangeCell({ change }: { change: number | null }) {
  if (change === null) return <span className="text-[var(--rf-faint)]">—</span>
  if (change > 0) return <span className="inline-flex items-center gap-0.5 text-[var(--rf-green)]"><ArrowUp className="h-3.5 w-3.5" />{change}</span>
  if (change < 0) return <span className="inline-flex items-center gap-0.5 text-[var(--rf-red)]"><ArrowDown className="h-3.5 w-3.5" />{Math.abs(change)}</span>
  return <span className="inline-flex items-center gap-0.5 text-[var(--rf-faint)]"><Minus className="h-3.5 w-3.5" /></span>
}
