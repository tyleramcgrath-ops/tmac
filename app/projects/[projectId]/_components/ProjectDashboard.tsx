'use client'

// The project Command Center — the rich sidebar dashboard, wired end-to-end to
// the real backend. It loads the project's latest persisted scan, derives all
// analytics client-side (same math the audit engine uses), and renders every
// section from real data. "Run Audit" drives the real scan pipeline
// (startScan → crawl → completeScan) so results persist. WordPress, Operator,
// Recommendations and History reuse the existing production tab components.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Radar, FileText, LineChart, Link2, Plug, FileBarChart,
  Search, Loader2, RefreshCw, StopCircle, Network, ShieldCheck, Code2, Bot,
  Zap, FolderOpen, Wand2, Sparkles, TrendingUp, History as HistoryIcon,
  LogOut, type LucideIcon,
} from 'lucide-react'
import { api, ApiError, type ProjectDTO, type ScanSummary } from '../../../lib/client'
import { useAuth } from '../../../lib/auth-context'
import { runCrawl } from '../../../lib/crawl-runner'
import { analyze, type PageResult, type PageSpeed } from './dashboard/analytics'
import { CommandCenter, type RfEvent } from './dashboard/command'
import { Overview, Audit, Content, Links, Indexability, Schema, Rankings, Backlinks, Reports, EmptyAudit } from './dashboard/sections'
import { RecommendationsTab } from './RecommendationsTab'
import { OperatorTab } from './OperatorTab'
import { WordPressTab } from './WordPressTab'
import { HistoryTab } from './HistoryTab'
import { DangerZone } from './shared'
import { PilotBar } from '../../../lib/PilotBar'

type SectionId =
  | 'command' | 'overview' | 'audit' | 'content' | 'links' | 'indexability' | 'schema'
  | 'recommendations' | 'rankings' | 'backlinks' | 'wordpress' | 'operator' | 'reports' | 'history'

const NAV_GROUPS: { label: string; items: { id: SectionId; label: string; icon: LucideIcon }[] }[] = [
  { label: 'Analyze', items: [
    { id: 'command', label: 'Command Center', icon: Bot },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'audit', label: 'Site Audit', icon: Radar },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'links', label: 'Internal Links', icon: Network },
    { id: 'indexability', label: 'Indexability', icon: ShieldCheck },
    { id: 'schema', label: 'Structured Data', icon: Code2 },
    { id: 'recommendations', label: 'Recommendations', icon: Wand2 },
  ]},
  { label: 'Grow', items: [
    { id: 'rankings', label: 'Rankings', icon: LineChart },
    { id: 'backlinks', label: 'Backlinks', icon: Link2 },
  ]},
  { label: 'Deploy', items: [
    { id: 'wordpress', label: 'WordPress', icon: Plug },
    { id: 'operator', label: 'Operator', icon: Sparkles },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ]},
]
const ALL_SECTIONS = NAV_GROUPS.flatMap((g) => g.items)

export function ProjectDashboard({ project, scans, onReload, initialSection = 'command' }: {
  project: ProjectDTO; scans: ScanSummary[]; onReload: () => void; initialSection?: SectionId
}) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [section, setSection] = useState<SectionId>(initialSection)
  const [pages, setPages] = useState<PageResult[]>([])
  const [pageSpeed, setPageSpeed] = useState<PageSpeed | null>(null)
  const [events, setEvents] = useState<RfEvent[]>([])
  const [loadingPages, setLoadingPages] = useState(true)
  const [maxPages, setMaxPages] = useState(150)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const stopRef = useRef(false)

  const latestDone = useMemo(() => scans.find((s) => s.status === 'completed' || s.status === 'complete') ?? null, [scans])

  // Load the latest completed scan's persisted pages → derive analytics.
  useEffect(() => {
    let cancelled = false
    async function loadPages() {
      if (!latestDone) { setPages([]); setLoadingPages(false); return }
      setLoadingPages(true)
      try {
        const { scan } = await api.getScan(project.id, latestDone.id)
        if (!cancelled) setPages((scan.pages as PageResult[]) ?? [])
      } catch {
        if (!cancelled) setPages([])
      } finally {
        if (!cancelled) setLoadingPages(false)
      }
    }
    void loadPages()
    return () => { cancelled = true }
  }, [project.id, latestDone])

  // Best-effort Core Web Vitals for the homepage (keyless-friendly endpoint).
  useEffect(() => {
    let cancelled = false
    if (!latestDone) return
    fetch('/api/pagespeed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: project.domain }) })
      .then((r) => r.json()).then((ps) => { if (!cancelled && ps?.available) setPageSpeed(ps) }).catch(() => {})
    return () => { cancelled = true }
  }, [project.id, project.domain, latestDone])

  // Build the activity timeline from REAL events: scans + WordPress deployments.
  useEffect(() => {
    let cancelled = false
    async function loadEvents() {
      const evs: RfEvent[] = scans
        .filter((s) => s.status === 'completed' || s.status === 'complete')
        .map((s) => ({ at: s.completedAt || s.createdAt, icon: 'audit' as const, text: `Audited ${s.summary.pagesCrawled} pages · score ${s.summary.siteScore}` }))
      try {
        const { deployments } = await api.getWordpress(project.id)
        for (const d of deployments) {
          evs.push({ at: d.rolledBackAt || d.createdAt, icon: d.rolledBackAt ? 'fix' : 'deploy', text: d.rolledBackAt ? `Reverted changes on ${d.postUrl}` : `Deployed SEO fixes to ${d.postUrl}` })
        }
      } catch { /* wordpress not connected yet — scans-only timeline */ }
      evs.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      if (!cancelled) setEvents(evs)
    }
    void loadEvents()
    return () => { cancelled = true }
  }, [project.id, scans])

  const a = useMemo(() => analyze(pages), [pages])

  const runAudit = useCallback(async () => {
    if (running) { stopRef.current = true; return }
    setRunning(true); setError(''); setProgress('Starting scan…')
    stopRef.current = false
    let scanId = ''
    try {
      const started = await api.startScan(project.id)
      scanId = started.scan.id
      const result = await runCrawl(project.domain, (msg) => setProgress(msg), maxPages)
      setProgress('Saving results…')
      await api.completeScan(project.id, scanId, result.pages, result.blocked, result.discovered)
      onReload()
      setSection('command')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'The crawl failed.')
      setError(message)
      if (scanId) await api.failScan(project.id, scanId, message).catch(() => {})
    } finally {
      setRunning(false); setProgress('')
    }
  }, [project.id, project.domain, maxPages, running, onReload])

  const status = running ? 'loading' : 'done'
  const go = (s: string) => setSection(s as SectionId)

  return (
    <div className="rf-root relative flex min-h-screen flex-col bg-[var(--rf-bg)]">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      {/* ── top bar ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <Link href="/projects" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] shadow-[0_8px_24px_-8px_rgba(47,107,255,0.9)]"><Zap className="h-4 w-4 text-white" strokeWidth={2.5} /></span>
            <span className="text-[15px] font-semibold text-white">RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span><span className="ml-2 hidden rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)] sm:inline">Command Center</span></span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rf-card flex flex-1 items-center gap-2 px-3 py-2 sm:w-72"><Search className="h-4 w-4 shrink-0 text-[var(--rf-faint)]" /><span className="truncate text-sm text-white">{project.domain}</span></div>
            <select value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} className="rf-card cursor-pointer bg-transparent px-2.5 py-2 text-sm text-white focus:outline-none" title="Max pages to crawl" disabled={running}>
              <option className="bg-[#0b1120]" value={50}>50 pages</option><option className="bg-[#0b1120]" value={150}>150 pages</option><option className="bg-[#0b1120]" value={300}>All (≤300)</option>
            </select>
            <button onClick={runAudit} className={running ? 'rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold' : 'rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold'}>
              {running ? <><StopCircle className="h-4 w-4" /> Stop</> : <><RefreshCw className="h-4 w-4" /> Run Audit</>}
            </button>
            <button onClick={() => setSection('command')} className="rf-btn-ghost hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium sm:inline-flex"><Sparkles className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Today</button>
            <button onClick={() => setSection('audit')} className="rf-btn-ghost hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium sm:inline-flex"><TrendingUp className="h-4 w-4 text-[var(--rf-green)]" /> Opportunities</button>
            <button onClick={async () => { await logout(); router.replace('/') }} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" title={user?.email}><span className="hidden max-w-[120px] truncate sm:inline">{user?.name || user?.email?.split('@')[0]}</span><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        {running && <div className="px-4 pb-2 lg:px-6"><div className="flex items-center justify-between text-[11px] text-[var(--rf-muted)]"><span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin text-[var(--rf-blue-bright)]" /> {progress || 'Crawling…'}</span></div></div>}
      </header>

      <PilotBar />

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* ── sidebar ── */}
        <nav className="hidden w-56 shrink-0 border-r border-[var(--rf-card-line)] p-3 md:block">
          <div className="mb-3">
            <p className="px-3 py-1.5 rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">Workspace</p>
            <Link href="/projects" className="mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[var(--rf-muted)] transition-colors hover:bg-white/[0.03] hover:text-white"><FolderOpen className="h-4 w-4" /> My Projects</Link>
          </div>
          {NAV_GROUPS.map((grp) => (
            <div key={grp.label} className="mb-3">
              <p className="px-3 py-1.5 rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">{grp.label}</p>
              {grp.items.map((s) => { const Icon = s.icon; const active = s.id === section; return (
                <button key={s.id} onClick={() => setSection(s.id)} className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${active ? 'bg-white/[0.06] font-medium text-white' : 'text-[var(--rf-muted)] hover:bg-white/[0.03] hover:text-white'}`}>
                  <Icon className={`h-4 w-4 ${active ? 'text-[var(--rf-blue-bright)]' : ''}`} />{s.label}
                </button>) })}
            </div>
          ))}
        </nav>

        <div className="w-full min-w-0">
          {/* mobile section strip */}
          <div className="flex gap-2 overflow-x-auto border-b border-[var(--rf-card-line)] p-2 md:hidden">
            {ALL_SECTIONS.map((s) => <button key={s.id} onClick={() => setSection(s.id)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${s.id === section ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)]'}`}>{s.label}</button>)}
          </div>

          <main className="p-4 sm:p-6">
            {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--rf-red)]/30 bg-[var(--rf-red)]/10 px-4 py-3 text-sm text-[var(--rf-red)]"><StopCircle className="h-4 w-4" /> {error}</div>}

            {section === 'command' && <CommandCenter a={a} pages={pages} pageSpeed={pageSpeed} domain={project.domain} projectId={project.id} status={status} events={events} onRun={runAudit} onGo={go} />}

            {/* analytics sections need a completed scan */}
            {['overview', 'audit', 'content', 'links', 'indexability', 'schema', 'reports'].includes(section) && (
              loadingPages ? <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>
              : !a ? <EmptyAudit onRun={runAudit} status={status} domain={project.domain} />
              : section === 'overview' ? <Overview a={a} pages={pages} pageSpeed={pageSpeed} domain={project.domain} onGo={go} />
              : section === 'audit' ? <Audit a={a} pages={pages} />
              : section === 'content' ? <Content a={a} pages={pages} />
              : section === 'links' ? <Links a={a} />
              : section === 'indexability' ? <Indexability a={a} pages={pages} />
              : section === 'schema' ? <Schema a={a} pages={pages} />
              : section === 'reports' ? <Reports a={a} pages={pages} domain={project.domain} pageSpeed={pageSpeed} />
              : null
            )}

            {section === 'recommendations' && <RecommendationsTab projectId={project.id} />}
            {section === 'rankings' && <Rankings domain={project.domain} />}
            {section === 'backlinks' && <Backlinks domain={project.domain} />}
            {section === 'wordpress' && <WordPressTab projectId={project.id} />}
            {section === 'operator' && <OperatorTab projectId={project.id} />}
            {section === 'history' && (
              <div className="space-y-6">
                <HistoryTab scans={scans} />
                <div className="flex justify-end"><DangerZone projectId={project.id} onDeleted={() => router.replace('/projects')} /></div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
