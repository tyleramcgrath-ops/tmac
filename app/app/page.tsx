'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Radar,
  FileText,
  LineChart,
  Link2,
  Plug,
  FileBarChart,
  Search,
  Loader2,
  ArrowUpRight,
  Check,
  AlertTriangle,
  Info,
  Download,
  Printer,
  Zap,
  ExternalLink,
  RefreshCw,
  X,
  Gauge,
  StopCircle,
  Sparkles,
  Wand2,
  Rocket,
  RotateCcw,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'
import { GrowthOpportunity } from '@/components/growth-opportunity'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Severity = 'critical' | 'warning' | 'info'
interface FixItem { severity: Severity; category: string; title: string }
export interface PageResult {
  url: string
  status: number
  overall: number
  scores: { technical: number; content: number; schema: number; ai: number }
  wordCount: number
  titleLength: number
  h1Count: number
  schemaTypes: string[]
  https: boolean
  indexable: boolean
  fixes: FixItem[]
}
interface Issue { severity: Severity; category: string; title: string; affectedPages: number }
export interface Aggregate {
  siteScore: number
  categories: { technical: number; content: number; schema: number; ai: number }
  severityTotals: { critical: number; warning: number; info: number }
  totals: { avgWordCount: number; pagesWithSchema: number; nonIndexable: number; httpsPages: number }
  issues: Issue[]
}
interface PageSpeed {
  available: boolean
  performance: number | null
  lcpMs: number | null
  cls: number | null
  inpMs: number | null
  strategy?: string
}
interface CrawlResponse {
  pages?: PageResult[]
  visited?: string[]
  frontier?: string[]
  discovered?: number
  crawledTotal?: number
  done?: boolean
  error?: string
}

type SectionId = 'overview' | 'audit' | 'content' | 'rankings' | 'backlinks' | 'wordpress' | 'reports' | 'growth-opportunity'
const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'growth-opportunity', label: 'Growth Opportunity', icon: Lightbulb },
  { id: 'audit', label: 'Site Audit', icon: Radar },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'rankings', label: 'Rankings', icon: LineChart },
  { id: 'backlinks', label: 'Backlinks', icon: Link2 },
  { id: 'wordpress', label: 'WordPress', icon: Plug },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
]
const TONE: Record<string, string> = {
  critical: 'text-[var(--rf-red)]',
  warning: 'text-[var(--rf-amber)]',
  info: 'text-[var(--rf-blue-bright)]',
}

/* ------------------------------------------------------------------ */
/* Aggregation (client-side, from accumulated pages)                   */
/* ------------------------------------------------------------------ */

function aggregate(pages: PageResult[]): Aggregate | null {
  if (pages.length === 0) return null
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
  const grouped = new Map<string, Issue>()
  for (const p of pages) {
    for (const f of p.fixes) {
      const key = `${f.severity}|${f.category}|${f.title}`
      const g = grouped.get(key)
      if (g) g.affectedPages++
      else grouped.set(key, { severity: f.severity, category: f.category, title: f.title, affectedPages: 1 })
    }
  }
  const rank: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  const issues = [...grouped.values()].sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.affectedPages - a.affectedPages
  )
  return {
    siteScore: avg(pages.map((p) => p.overall)),
    categories: {
      technical: avg(pages.map((p) => p.scores.technical)),
      content: avg(pages.map((p) => p.scores.content)),
      schema: avg(pages.map((p) => p.scores.schema)),
      ai: avg(pages.map((p) => p.scores.ai)),
    },
    severityTotals: {
      critical: issues.filter((i) => i.severity === 'critical').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    },
    totals: {
      avgWordCount: avg(pages.map((p) => p.wordCount)),
      pagesWithSchema: pages.filter((p) => p.schemaTypes.length > 0).length,
      nonIndexable: pages.filter((p) => !p.indexable).length,
      httpsPages: pages.filter((p) => p.https).length,
    },
    issues,
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AppDashboard() {
  const [domain, setDomain] = useState('')
  const [maxPages, setMaxPages] = useState(150)
  const [section, setSection] = useState<SectionId>('overview')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [pages, setPages] = useState<PageResult[]>([])
  const [progress, setProgress] = useState({ crawled: 0, discovered: 0 })
  const [error, setError] = useState<string | null>(null)
  const [pageSpeed, setPageSpeed] = useState<PageSpeed | null>(null)
  const [selected, setSelected] = useState<PageResult | null>(null)
  const stopRef = useRef(false)

  const agg = useMemo(() => aggregate(pages), [pages])

  useEffect(() => {
    try {
      const d = localStorage.getItem('rf_app_domain')
      if (d) setDomain(d)
      const cached = localStorage.getItem('rf_app_pages')
      if (cached) {
        setPages(JSON.parse(cached))
        setStatus('done')
      }
      const ps = localStorage.getItem('rf_app_ps')
      if (ps) setPageSpeed(JSON.parse(ps))
    } catch { /* ignore */ }
  }, [])

  const runAudit = useCallback(async () => {
    const value = domain.trim()
    if (!value) return
    try { localStorage.setItem('rf_app_domain', value) } catch { /* ignore */ }
    stopRef.current = false
    setStatus('loading')
    setError(null)
    setPages([])
    setPageSpeed(null)
    setProgress({ crawled: 0, discovered: 0 })

    let frontier: string[] | undefined = undefined
    let visited: string[] = []
    const acc: PageResult[] = []
    let safety = 0
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res: Response = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value, maxPages, frontier, visited }),
        })
        const json: CrawlResponse = await res.json()
        if (!res.ok) {
          if (acc.length === 0) { setError(json?.error ?? 'Audit failed.'); setStatus('error'); return }
          break
        }
        acc.push(...(json.pages ?? []))
        visited = json.visited ?? visited
        frontier = json.frontier ?? []
        setPages([...acc])
        setProgress({ crawled: json.crawledTotal ?? acc.length, discovered: json.discovered ?? acc.length })
        safety++
        if (json.done || stopRef.current || safety >= 40 || acc.length >= maxPages) break
      }
      setStatus('done')
      try { localStorage.setItem('rf_app_pages', JSON.stringify(acc)) } catch { /* quota */ }
      // Core Web Vitals for the homepage (best-effort).
      try {
        const ps = await fetch('/api/pagespeed', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: value }),
        }).then((r) => r.json())
        if (ps?.available) { setPageSpeed(ps); try { localStorage.setItem('rf_app_ps', JSON.stringify(ps)) } catch { /* ignore */ } }
      } catch { /* ignore */ }
    } catch {
      if (acc.length === 0) { setError('Network error — please try again.'); setStatus('error') }
      else setStatus('done')
    }
  }, [domain, maxPages])

  const stop = () => { stopRef.current = true }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* ambient backdrop */}
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] shadow-[0_8px_24px_-8px_rgba(47,107,255,0.9)]">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-[15px] font-semibold">
              RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span>
              <span className="ml-2 hidden rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)] sm:inline">Command Center</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rf-card flex flex-1 items-center gap-2 px-3 py-2 sm:w-72">
              <Search className="h-4 w-4 shrink-0 text-[var(--rf-faint)]" />
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && status !== 'loading' && runAudit()}
                placeholder="yourdomain.com"
                className="w-full bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
              />
            </div>
            <select
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="rf-card cursor-pointer bg-transparent px-2.5 py-2 text-sm text-white focus:outline-none"
              title="Max pages to crawl"
            >
              <option className="bg-[#0b1120]" value={50}>50 pages</option>
              <option className="bg-[#0b1120]" value={150}>150 pages</option>
              <option className="bg-[#0b1120]" value={300}>All (≤300)</option>
            </select>
            {status === 'loading' ? (
              <button onClick={stop} className="rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold">
                <StopCircle className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button onClick={runAudit} className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold">
                <RefreshCw className="h-4 w-4" /> Run Audit
              </button>
            )}
          </div>
        </div>
        {status === 'loading' && (
          <CrawlProgress crawled={progress.crawled} discovered={progress.discovered} max={maxPages} />
        )}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <nav className="hidden w-52 shrink-0 border-r border-[var(--rf-card-line)] p-3 md:block">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const active = s.id === section
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active ? 'bg-white/[0.06] font-medium text-white' : 'text-[var(--rf-muted)] hover:bg-white/[0.03] hover:text-white'}`}>
                <Icon className={`h-4 w-4 ${active ? 'text-[var(--rf-blue-bright)]' : ''}`} />
                {s.label}
              </button>
            )
          })}
        </nav>

        <div className="w-full min-w-0">
          <div className="flex gap-2 overflow-x-auto border-b border-[var(--rf-card-line)] p-2 md:hidden">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${s.id === section ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)]'}`}>
                {s.label}
              </button>
            ))}
          </div>

          <main className="p-4 sm:p-6">
            {error && status === 'error' && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--rf-red)]/30 bg-[var(--rf-red)]/10 px-4 py-3 text-sm text-[var(--rf-red)]">
                <AlertTriangle className="h-4 w-4" /> {error}
              </div>
            )}
            {section === 'overview' && <Overview agg={agg} pages={pages} status={status} onRun={runAudit} pageSpeed={pageSpeed} crawled={progress.crawled} />}
            {section === 'growth-opportunity' && <GrowthOpportunity pages={pages} agg={agg} domain={domain} />}
            {section === 'audit' && <Audit agg={agg} pages={pages} onSelect={setSelected} />}
            {section === 'content' && <Content pages={pages} />}
            {section === 'rankings' && <Rankings domain={domain} />}
            {section === 'backlinks' && <Backlinks domain={domain} />}
            {section === 'wordpress' && <WordPress />}
            {section === 'reports' && <Reports agg={agg} pages={pages} domain={domain} pageSpeed={pageSpeed} />}
          </main>
        </div>
      </div>

      {selected && <PageDrawer page={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Crawl progress strip                                                */
/* ------------------------------------------------------------------ */

function CrawlProgress({ crawled, discovered, max }: { crawled: number; discovered: number; max: number }) {
  const denom = Math.max(discovered, Math.min(max, crawled + 1))
  const pct = Math.min(100, Math.round((crawled / Math.max(1, denom)) * 100))
  return (
    <div className="px-4 pb-2 lg:px-6">
      <div className="flex items-center justify-between text-[11px] text-[var(--rf-muted)]">
        <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin text-[var(--rf-blue-bright)]" /> Crawling… {crawled} crawled · {discovered} discovered</span>
        <span className="rf-mono">{pct}%</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue-bright)] to-[var(--rf-cyan)] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function CountUp({ value, className }: { value: number; className?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const from = 0
    const dur = 800
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className}>{n.toLocaleString()}</span>
}

function EmptyState({ onRun }: { onRun?: () => void }) {
  return (
    <div className="rf-card rf-topline grid place-items-center px-6 py-20 text-center">
      <span className="rf-pulse grid h-14 w-14 place-items-center rounded-2xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Radar className="h-7 w-7" /></span>
      <p className="mt-4 text-lg font-semibold text-white">Run a full-site audit</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--rf-muted)]">Enter your domain, pick how many pages to crawl, and RankForge will crawl your whole site (sitemap-aware) and score every page.</p>
      {onRun && <button onClick={onRun} className="rf-btn-primary mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold">Start audit</button>}
    </div>
  )
}

function Ring({ value, size = 132 }: { value: number; size?: number }) {
  const r = size / 2 - 10
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,173,224,0.12)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#rfAppRing)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.7,0.2,1)' }} />
        <defs><linearGradient id="rfAppRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2f6bff" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><CountUp value={value} className="text-3xl font-semibold text-white" /><span className="block text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">Site score</span></div>
      </div>
    </div>
  )
}

function CatBars({ categories }: { categories: Aggregate['categories'] }) {
  const items: [string, number][] = [['Technical', categories.technical], ['Content', categories.content], ['Schema', categories.schema], ['AI Readiness', categories.ai]]
  return (
    <div className="w-full space-y-3">
      {items.map(([label, score]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between text-xs"><span className="text-[var(--rf-muted)]">{label}</span><span className="rf-mono text-white">{score}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]" style={{ width: `${score}%`, transition: 'width 0.9s cubic-bezier(0.2,0.7,0.2,1)' }} /></div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, tone = 'white', numeric }: { label: string; value: string; tone?: string; numeric?: number }) {
  return (
    <div className="rf-card rf-card-hover p-4">
      <p className="text-[11px] text-[var(--rf-faint)]">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone === 'white' ? 'text-white' : tone}`}>{numeric != null ? <CountUp value={numeric} /> : value}</p>
    </div>
  )
}

function SevIcon({ s }: { s: Severity }) { return s === 'info' ? <Info className={`h-4 w-4 ${TONE.info}`} /> : <AlertTriangle className={`h-4 w-4 ${TONE[s]}`} /> }

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function Overview({ agg, pages, status, onRun, pageSpeed, crawled }: { agg: Aggregate | null; pages: PageResult[]; status: string; onRun: () => void; pageSpeed: PageSpeed | null; crawled: number }) {
  if (!agg && status === 'loading') return <CrawlingState crawled={crawled} />
  if (!agg) return <EmptyState onRun={onRun} />
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rf-card rf-topline flex flex-col items-center justify-center p-6">
          <Ring value={agg.siteScore} />
          <p className="mt-3 rf-mono text-xs text-[var(--rf-muted)]">{pages.length} pages analyzed</p>
        </div>
        <div className="rf-card flex items-center p-6"><CatBars categories={agg.categories} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Critical issues" value="" numeric={agg.severityTotals.critical} tone={TONE.critical} />
        <Stat label="Warnings" value="" numeric={agg.severityTotals.warning} tone={TONE.warning} />
        <Stat label="Avg. words / page" value="" numeric={agg.totals.avgWordCount} />
        <Stat label="Pages with schema" value={`${agg.totals.pagesWithSchema}/${pages.length}`} />
      </div>

      <CoreWebVitals ps={pageSpeed} />

      <div className="rf-card overflow-hidden">
        <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Lowest-scoring pages</div>
        <div className="divide-y divide-[var(--rf-card-line)]">
          {[...pages].sort((a, b) => a.overall - b.overall).slice(0, 8).map((p) => (
            <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.02]">
              <span className="truncate text-[var(--rf-muted)]">{pathOf(p.url)}</span>
              <span className="flex shrink-0 items-center gap-3">
                {p.fixes.filter((f) => f.severity === 'critical').length > 0 && <span className="rf-mono text-[11px] text-[var(--rf-red)]">{p.fixes.filter((f) => f.severity === 'critical').length} crit</span>}
                <span className={`rf-mono font-semibold ${scoreColor(p.overall)}`}>{p.overall}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--rf-faint)]" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function CoreWebVitals({ ps }: { ps: PageSpeed | null }) {
  if (!ps || !ps.available) return null
  const tone = (v: number | null, good: number, ok: number, invert = false) => {
    if (v == null) return 'text-[var(--rf-faint)]'
    const x = v
    if (invert) return x >= good ? 'text-[var(--rf-green)]' : x >= ok ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]'
    return x <= good ? 'text-[var(--rf-green)]' : x <= ok ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]'
  }
  const cells: [string, string, string][] = [
    ['Performance', ps.performance != null ? `${ps.performance}` : '—', tone(ps.performance, 90, 50, true)],
    ['LCP', ps.lcpMs != null ? `${(ps.lcpMs / 1000).toFixed(1)}s` : '—', tone(ps.lcpMs, 2500, 4000)],
    ['CLS', ps.cls != null ? ps.cls.toFixed(3) : '—', tone(ps.cls != null ? ps.cls * 1000 : null, 100, 250)],
    ['INP', ps.inpMs != null ? `${Math.round(ps.inpMs)}ms` : '—', tone(ps.inpMs, 200, 500)],
  ]
  return (
    <div className="rf-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
        <Gauge className="h-4 w-4 text-[var(--rf-cyan)]" /> Core Web Vitals <span className="text-[var(--rf-faint)]">· homepage · {ps.strategy}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {cells.map(([k, v, c]) => (
          <div key={k} className="border-r border-[var(--rf-card-line)] p-4 text-center last:border-r-0">
            <p className={`text-2xl font-semibold ${c}`}>{v}</p>
            <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">{k}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CrawlingState({ crawled }: { crawled: number }) {
  return (
    <div className="rf-card grid place-items-center px-6 py-20 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--rf-blue-bright)]" />
      <p className="mt-4 font-medium text-white">Crawling your site…</p>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">{crawled} pages analyzed so far. Results stream in as we go.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Site Audit                                                          */
/* ------------------------------------------------------------------ */

function Audit({ agg, pages, onSelect }: { agg: Aggregate | null; pages: PageResult[]; onSelect: (p: PageResult) => void }) {
  const [filter, setFilter] = useState<'all' | Severity>('all')
  if (!agg) return <EmptyState />
  const issues = filter === 'all' ? agg.issues : agg.issues.filter((i) => i.severity === filter)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'rf-btn-ghost'}`}>
            {f}{f !== 'all' ? ` (${agg.severityTotals[f]})` : ''}
          </button>
        ))}
      </div>
      <div className="rf-card overflow-hidden">
        <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Issues ({issues.length})</div>
        <div className="divide-y divide-[var(--rf-card-line)]">
          {issues.length === 0 ? <p className="px-4 py-6 text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> No issues in this filter.</p> : issues.map((i, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 px-4 py-3">
              <span className="flex items-start gap-3 text-sm"><SevIcon s={i.severity} /><span><span className="text-[var(--rf-text)]">{i.title}</span><span className="block text-[11px] text-[var(--rf-faint)]">{i.category}</span></span></span>
              <span className="shrink-0 rf-mono text-[11px] text-[var(--rf-muted)]">{i.affectedPages} page{i.affectedPages > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>
      <PagesTable pages={pages} onSelect={onSelect} />
    </div>
  )
}

function PagesTable({ pages, onSelect }: { pages: PageResult[]; onSelect: (p: PageResult) => void }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Crawled pages ({pages.length}) · click a row for fixes</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]"><th className="px-4 py-2 font-medium">Page</th><th className="px-4 py-2 font-medium">Score</th><th className="px-4 py-2 font-medium">Words</th><th className="px-4 py-2 font-medium">Schema</th><th className="px-4 py-2 font-medium">Issues</th></tr></thead>
          <tbody className="divide-y divide-[var(--rf-card-line)]">
            {[...pages].sort((a, b) => a.overall - b.overall).map((p) => (
              <tr key={p.url} onClick={() => onSelect(p)} className="cursor-pointer hover:bg-white/[0.03]">
                <td className="max-w-[240px] truncate px-4 py-2.5 text-[var(--rf-muted)]">{pathOf(p.url)}</td>
                <td className={`px-4 py-2.5 rf-mono font-semibold ${scoreColor(p.overall)}`}>{p.overall}</td>
                <td className="px-4 py-2.5 text-[var(--rf-muted)]">{p.wordCount.toLocaleString()}</td>
                <td className="px-4 py-2.5">{p.schemaTypes.length > 0 ? <Check className="h-4 w-4 text-[var(--rf-green)]" /> : <span className="text-[var(--rf-faint)]">—</span>}</td>
                <td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{p.fixes.length}{p.fixes.filter((f) => f.severity === 'critical').length > 0 && <span className="text-[var(--rf-red)]"> ({p.fixes.filter((f) => f.severity === 'critical').length})</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PageDrawer({ page, onClose }: { page: PageResult; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rf-card flex h-full w-full max-w-md flex-col overflow-hidden rounded-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3">
          <span className="truncate text-sm font-medium text-white">{pathOf(page.url)}</span>
          <button onClick={onClose} className="rf-btn-ghost grid h-8 w-8 shrink-0 place-items-center rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {([['Overall', page.overall], ['Tech', page.scores.technical], ['Content', page.scores.content], ['Schema', page.scores.schema]] as [string, number][]).map(([k, v]) => (
              <div key={k} className="rf-card p-2"><p className={`text-lg font-semibold ${scoreColor(v)}`}>{v}</p><p className="text-[10px] text-[var(--rf-faint)]">{k}</p></div>
            ))}
          </div>
          <a href={page.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--rf-blue-bright)] hover:text-white">Open page <ExternalLink className="h-3 w-3" /></a>
          <h4 className="mt-5 text-sm font-semibold text-white">Fixes for this page ({page.fixes.length})</h4>
          <ul className="mt-2 space-y-1.5">
            {page.fixes.length === 0 ? <li className="text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> Clean — no issues.</li> : page.fixes.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2 text-sm">
                <SevIcon s={f.severity} /><span><span className="text-[var(--rf-text)]">{f.title}</span><span className="block text-[11px] text-[var(--rf-faint)]">{f.category}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

function Content({ pages }: { pages: PageResult[] }) {
  if (pages.length === 0) return <EmptyState />
  const thin = pages.filter((p) => p.wordCount < 300)
  const noSchema = pages.filter((p) => p.schemaTypes.length === 0)
  const titleIssues = pages.filter((p) => p.titleLength < 30 || p.titleLength > 60)
  const noH1 = pages.filter((p) => p.h1Count !== 1)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Thin pages (<300w)" value="" numeric={thin.length} tone={thin.length ? TONE.warning : TONE.info} />
        <Stat label="Missing schema" value="" numeric={noSchema.length} tone={noSchema.length ? TONE.warning : TONE.info} />
        <Stat label="Title length issues" value="" numeric={titleIssues.length} tone={titleIssues.length ? TONE.warning : TONE.info} />
        <Stat label="H1 issues" value="" numeric={noH1.length} tone={noH1.length ? TONE.warning : TONE.info} />
      </div>
      <ContentList title="Thinnest content — expand these first" rows={[...pages].sort((a, b) => a.wordCount - b.wordCount).slice(0, 10).map((p) => [pathOf(p.url), `${p.wordCount.toLocaleString()} words`, p.url])} />
      <ContentList title="Pages missing structured data" rows={noSchema.slice(0, 10).map((p) => [pathOf(p.url), 'No schema', p.url])} />
    </div>
  )
}

function ContentList({ title, rows }: { title: string; rows: [string, string, string][] }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{title}</div>
      <div className="divide-y divide-[var(--rf-card-line)]">
        {rows.length === 0 ? <p className="px-4 py-6 text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> Nothing here — nice.</p> : rows.map(([path, meta, url]) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.02]"><span className="truncate text-[var(--rf-muted)]">{path}</span><span className="shrink-0 rf-mono text-[11px] text-[var(--rf-faint)]">{meta}</span></a>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Rankings                                                            */
/* ------------------------------------------------------------------ */

interface RankResp { available: boolean; note?: string; rows?: { keyword: string; position: number | null; url: string | null }[]; summary?: { tracked: number; top3: number; top10: number; avg: number | null } }

function Rankings({ domain }: { domain: string }) {
  const [kw, setKw] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [resp, setResp] = useState<RankResp | null>(null)
  const [error, setError] = useState<string | null>(null)
  const track = async () => {
    const keywords = kw.split('\n').map((k) => k.trim()).filter(Boolean)
    if (!domain.trim()) { setError('Set your domain in the top bar first.'); setStatus('error'); return }
    if (keywords.length === 0) { setError('Add at least one keyword.'); setStatus('error'); return }
    setStatus('loading'); setError(null)
    try {
      const res = await fetch('/api/rankings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain, keywords }) })
      const json = await res.json()
      if (!res.ok) { setError(json?.error ?? 'Failed.'); setStatus('error'); return }
      setResp(json); setStatus('done')
    } catch { setError('Network error.'); setStatus('error') }
  }
  return (
    <div className="space-y-4">
      <div className="rf-card p-4">
        <p className="text-sm font-semibold text-white">Track keyword rankings</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">One keyword per line. Live Google positions for <span className="text-white">{domain || 'your domain'}</span>.</p>
        <textarea value={kw} onChange={(e) => setKw(e.target.value)} rows={4} placeholder={'best crm software\nai crm tools\ncrm for startups'} className="rf-card mt-3 w-full resize-y bg-transparent p-3 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" />
        <button onClick={track} disabled={status === 'loading'} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70">{status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Check positions'}</button>
        {error && <p className="mt-2 text-xs text-[var(--rf-red)]">{error}</p>}
      </div>
      {status === 'done' && resp && !resp.available && <ConnectNote title="Live rank tracking needs a SERP API key" note={resp.note} envVar="SERPAPI_KEY" />}
      {status === 'done' && resp?.available && resp.rows && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Tracked" value="" numeric={resp.summary?.tracked ?? 0} />
            <Stat label="Top 10" value="" numeric={resp.summary?.top10 ?? 0} tone={TONE.info} />
            <Stat label="Avg. position" value={resp.summary?.avg != null ? String(resp.summary.avg) : '—'} tone="text-[var(--rf-green)]" />
          </div>
          <div className="rf-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]"><th className="px-4 py-2 font-medium">Keyword</th><th className="px-4 py-2 font-medium">Position</th><th className="px-4 py-2 font-medium">URL</th></tr></thead><tbody className="divide-y divide-[var(--rf-card-line)]">{resp.rows.map((r) => (<tr key={r.keyword} className="hover:bg-white/[0.02]"><td className="px-4 py-2.5 text-[var(--rf-text)]">{r.keyword}</td><td className="px-4 py-2.5 rf-mono font-semibold text-white">{r.position != null ? `#${r.position}` : <span className="text-[var(--rf-faint)]">—</span>}</td><td className="max-w-[240px] truncate px-4 py-2.5">{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--rf-muted)] hover:text-white">{pathOf(r.url)}</a> : <span className="text-[var(--rf-faint)]">—</span>}</td></tr>))}</tbody></table></div></div>
        </>
      )}
    </div>
  )
}

function Backlinks({ domain }: { domain: string }) {
  return (
    <div className="space-y-4">
      <ConnectNote title="Backlink data needs a provider" note={`Connect a backlink API to see referring domains, authority, and new/lost links for ${domain || 'your domain'}.`} envVar="(backlink provider key)" />
      <div className="rf-card p-5"><p className="text-sm font-semibold text-white">What you'll get here</p><ul className="mt-3 grid gap-2 text-sm text-[var(--rf-muted)] sm:grid-cols-2">{['Referring domains & total backlinks', 'Domain authority trend', 'New vs lost links', 'Anchor-text distribution', 'Competitor link gap', 'Toxic link flags'].map((t) => (<li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--rf-green)]" /> {t}</li>))}</ul></div>
    </div>
  )
}

function ConnectNote({ title, note, envVar }: { title: string; note?: string; envVar: string }) {
  return (
    <div className="rf-card rf-topline p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Plug className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-sm text-[var(--rf-muted)]">{note}</p><p className="mt-2 rf-mono text-xs text-[var(--rf-faint)]">Set <span className="text-[var(--rf-cyan)]">{envVar}</span> in your Vercel environment, then redeploy.</p></div></div></div>
  )
}

/* ------------------------------------------------------------------ */
/* WordPress                                                           */
/* ------------------------------------------------------------------ */

interface WpStatus { ok: boolean; name?: string; description?: string; hasAioseo?: boolean; authProvided?: boolean; authValid?: boolean }
interface WpItem { id: number; link: string; title: string }
interface WpAnalysis { title: string; titleLength: number; metaDescription: string; metaDescriptionLength: number; h1Count: number; wordCount: number; schemaTypes: string[]; hasOpenGraph: boolean }
interface WpEditPost { id: number; type: 'posts' | 'pages'; link: string; title: string; excerpt: string; content: string }
interface WpEdit { post: WpEditPost; analysis: WpAnalysis | null }
interface WpCreds { siteUrl: string; username: string; appPassword: string }

function WordPress() {
  const [siteUrl, setSiteUrl] = useState('')
  const [username, setUsername] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle')
  const [info, setInfo] = useState<WpStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<WpItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  useEffect(() => { try { const s = localStorage.getItem('rf_app_wp'); if (s) { const p = JSON.parse(s); setSiteUrl(p.siteUrl || ''); setUsername(p.username || '') } } catch { /* ignore */ } }, [])
  const test = async () => {
    setStatus('testing'); setError(null)
    try { const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test', siteUrl, username, appPassword }) }); const json = await res.json(); if (!res.ok) { setError(json?.error ?? 'Connection failed.'); setStatus('error'); return } setInfo(json); setStatus('connected'); try { localStorage.setItem('rf_app_wp', JSON.stringify({ siteUrl, username })) } catch { /* ignore */ } } catch { setError('Could not reach the site.'); setStatus('error') }
  }
  const [listType, setListType] = useState<'posts' | 'pages'>('posts')
  const [editing, setEditing] = useState<WpEdit | null>(null)
  const [optimizingId, setOptimizingId] = useState<number | null>(null)
  const list = async (action: 'posts' | 'pages') => { setListType(action); setLoadingItems(true); try { const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, siteUrl, username, appPassword }) }); const json = await res.json(); if (res.ok) setItems(json.items || []) } catch { /* ignore */ } finally { setLoadingItems(false) } }
  const optimize = async (item: WpItem) => {
    setOptimizingId(item.id)
    try {
      const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get', id: item.id, type: listType, siteUrl, username, appPassword }) })
      const json = await res.json()
      if (res.ok) setEditing(json)
      else setError(json?.error ?? 'Could not load item.')
    } catch { setError('Could not load item.') } finally { setOptimizingId(null) }
  }
  const creds: WpCreds = { siteUrl, username, appPassword }
  return (
    <div className="space-y-4">
      <div className="rf-card p-5">
        <p className="text-sm font-semibold text-white">Connect WordPress</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">Use an Application Password (Users → Profile → Application Passwords). Credentials stay in your browser. Or set <span className="rf-mono text-[var(--rf-cyan)]">WP_SITE_URL / WP_USER / WP_APP_PASSWORD</span> in Vercel.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://yoursite.com" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none sm:col-span-3" />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" />
          <input value={appPassword} onChange={(e) => setAppPassword(e.target.value)} type="password" placeholder="application password" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none sm:col-span-2" />
        </div>
        <button onClick={test} disabled={status === 'testing'} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70">{status === 'testing' ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</> : 'Connect'}</button>
        {error && <p className="mt-2 text-xs text-[var(--rf-red)]">{error}</p>}
      </div>
      {status === 'connected' && info && (
        <>
          <div className="rf-card p-5">
            <div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-[var(--rf-green)]" /><span className="font-semibold text-white">{info.name}</span></div>
            {info.description && <p className="mt-1 text-xs text-[var(--rf-muted)]">{info.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><Badge ok={!!info.authValid} text={info.authValid ? 'Authenticated' : info.authProvided ? 'Auth failed' : 'Public (no auth)'} /><Badge ok={!!info.hasAioseo} text={info.hasAioseo ? 'AIOSEO detected' : 'AIOSEO not detected'} /></div>
            <div className="mt-4 flex gap-2"><button onClick={() => list('posts')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">List posts</button><button onClick={() => list('pages')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">List pages</button></div>
          </div>
          {loadingItems && <p className="text-sm text-[var(--rf-muted)]"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Loading…</p>}
          {items.length > 0 && (
            <div className="rf-card overflow-hidden">
              <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{listType} ({items.length}) · optimize &amp; deploy SEO fixes</div>
              <div className="divide-y divide-[var(--rf-card-line)]">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="truncate text-[var(--rf-text)]" dangerouslySetInnerHTML={{ __html: it.title || pathOf(it.link) }} />
                    <span className="flex shrink-0 items-center gap-2">
                      <a href={it.link} target="_blank" rel="noopener noreferrer" className="text-[var(--rf-faint)] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
                      <button onClick={() => optimize(it)} disabled={optimizingId === it.id} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-60">
                        {optimizingId === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Optimize
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {editing && <Optimizer edit={editing} creds={creds} authValid={!!info?.authValid} onClose={() => setEditing(null)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* WordPress optimizer + deploy                                        */
/* ------------------------------------------------------------------ */

const SCHEMA_RE = /\n?<!-- rankforge-schema:start -->[\s\S]*?<!-- rankforge-schema:end -->\n?/g
function schemaBlock(title: string, url: string): string {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: title, url })
  return `\n<!-- rankforge-schema:start -->\n<script type="application/ld+json">${json}</script>\n<!-- rankforge-schema:end -->\n`
}

function Optimizer({ edit, creds, authValid, onClose }: { edit: WpEdit; creds: WpCreds; authValid: boolean; onClose: () => void }) {
  const a = edit.analysis
  const [title, setTitle] = useState(edit.post.title)
  const [meta, setMeta] = useState(edit.post.excerpt || a?.metaDescription || '')
  const [addSchema, setAddSchema] = useState(!!a && a.schemaTypes.length === 0)
  const [step, setStep] = useState<'edit' | 'confirm' | 'applying' | 'done' | 'error'>('edit')
  const [error, setError] = useState<string | null>(null)
  const [undone, setUndone] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const buildPayload = (revert: boolean) => {
    const payload: Record<string, string> = { id: String(edit.post.id) }
    if (revert) {
      payload.title = edit.post.title
      payload.excerpt = edit.post.excerpt
      if (addSchema) payload.content = edit.post.content
      return payload
    }
    if (title !== edit.post.title) payload.title = title
    if (meta !== edit.post.excerpt) payload.excerpt = meta
    if (addSchema) payload.content = edit.post.content.replace(SCHEMA_RE, '') + schemaBlock(title || edit.post.title, edit.post.link)
    return payload
  }

  const send = async (revert: boolean) => {
    setStep('applying'); setError(null)
    try {
      const res = await fetch('/api/wordpress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', type: edit.post.type, ...creds, ...buildPayload(revert) }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json?.error ?? 'Deploy failed.'); setStep('error'); return }
      setUndone(revert); setStep('done')
    } catch { setError('Network error.'); setStep('error') }
  }

  const changeCount = (title !== edit.post.title ? 1 : 0) + (meta !== edit.post.excerpt ? 1 : 0) + (addSchema ? 1 : 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onClick={onClose}>
      <div className="rf-card rf-topline relative my-auto w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-white"><Wand2 className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Optimize &amp; deploy</span>
          <button onClick={onClose} className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5">
          <a href={edit.post.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--rf-blue-bright)] hover:text-white">{pathOf(edit.post.link)} <ExternalLink className="h-3 w-3" /></a>

          {a && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Badge ok={a.titleLength >= 30 && a.titleLength <= 60} text={`Title ${a.titleLength}c`} />
              <Badge ok={a.metaDescriptionLength >= 70 && a.metaDescriptionLength <= 160} text={`Meta ${a.metaDescriptionLength}c`} />
              <Badge ok={a.h1Count === 1} text={`${a.h1Count} H1`} />
              <Badge ok={a.schemaTypes.length > 0} text={a.schemaTypes.length ? 'Has schema' : 'No schema'} />
            </div>
          )}

          {step === 'done' ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--rf-green)]/10"><Check className="h-6 w-6 text-[var(--rf-green)]" /></span>
              <p className="mt-3 font-semibold text-white">{undone ? 'Reverted on your site' : 'Deployed to your site'}</p>
              <p className="mt-1 text-sm text-[var(--rf-muted)]">{undone ? 'The previous values were restored.' : 'Your changes are live on WordPress.'}</p>
              <div className="mt-4 flex justify-center gap-2">
                {!undone && <button onClick={() => send(true)} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium"><RotateCcw className="h-4 w-4" /> Undo</button>}
                <a href={edit.post.link} target="_blank" rel="noopener noreferrer" className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold">View page <ExternalLink className="h-4 w-4" /></a>
              </div>
            </div>
          ) : (
            <>
              <label className="mt-5 block text-xs font-medium text-[var(--rf-muted)]">SEO title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rf-card mt-1 w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
              <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{title.length} chars · aim 30–60</p>

              <label className="mt-4 block text-xs font-medium text-[var(--rf-muted)]">Meta description (excerpt)</label>
              <textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} className="rf-card mt-1 w-full resize-y bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
              <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{meta.length} chars · aim 70–160</p>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
                <input type="checkbox" checked={addSchema} onChange={(e) => setAddSchema(e.target.checked)} className="mt-0.5 accent-[var(--rf-blue)]" />
                <span><span className="text-[var(--rf-text)]">Add JSON-LD Article schema</span><span className="block text-[11px] text-[var(--rf-faint)]">Injected into the post content (idempotent &amp; reversible).</span></span>
              </label>

              {!authValid && (
                <p className="mt-4 rounded-lg border border-[var(--rf-amber)]/30 bg-[var(--rf-amber)]/10 px-3 py-2 text-xs text-[var(--rf-amber)]">Connect with a valid Application Password to deploy changes.</p>
              )}
              {step === 'error' && <p className="mt-3 text-xs text-[var(--rf-red)]">{error}</p>}

              {step === 'confirm' ? (
                <div className="mt-5 rounded-xl border border-[var(--rf-card-line-strong)] bg-white/[0.02] p-3">
                  <p className="text-sm text-white">Deploy {changeCount} change{changeCount !== 1 ? 's' : ''} to your live site?</p>
                  <p className="mt-1 text-[11px] text-[var(--rf-faint)]">You can undo right after.</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => send(false)} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"><Rocket className="h-4 w-4" /> Deploy now</button>
                    <button onClick={() => setStep('edit')} className="rf-btn-ghost rounded-xl px-4 py-2 text-sm font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!authValid || changeCount === 0 || step === 'applying'}
                  className="rf-btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step === 'applying' ? <><Loader2 className="h-4 w-4 animate-spin" /> Deploying…</> : <><Rocket className="h-4 w-4" /> Review &amp; deploy ({changeCount})</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ ok, text }: { ok: boolean; text: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${ok ? 'bg-[var(--rf-green)]/10 text-[var(--rf-green)]' : 'bg-white/[0.05] text-[var(--rf-muted)]'}`}>{ok ? <Check className="h-3 w-3" /> : <Info className="h-3 w-3" />} {text}</span>
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

function Reports({ agg, pages, domain, pageSpeed }: { agg: Aggregate | null; pages: PageResult[]; domain: string; pageSpeed: PageSpeed | null }) {
  if (!agg) return <EmptyState />
  const download = () => {
    const blob = new Blob([JSON.stringify({ domain, crawledAt: new Date().toISOString(), pagesCrawled: pages.length, ...agg, pageSpeed, pages }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `rankforge-audit-${domain || 'site'}.json`; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-4">
      <div className="rf-card rf-topline p-5">
        <p className="text-sm font-semibold text-white">Audit report — {domain || 'your site'}</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">{pages.length} pages · {new Date().toLocaleString()}</p>
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={download} className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Export JSON</button><button onClick={() => window.print()} className="rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"><Printer className="h-4 w-4" /> Print / Save PDF</button></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Site score" value="" numeric={agg.siteScore} tone="text-[var(--rf-green)]" />
        <Stat label="Critical" value="" numeric={agg.severityTotals.critical} tone={TONE.critical} />
        <Stat label="Warnings" value="" numeric={agg.severityTotals.warning} tone={TONE.warning} />
        <Stat label="Pages" value="" numeric={pages.length} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* utils                                                               */
/* ------------------------------------------------------------------ */

function pathOf(url: string): string { try { const u = new URL(url); return (u.pathname + u.search) || '/' } catch { return url } }
function scoreColor(n: number): string { return n >= 80 ? 'text-[var(--rf-green)]' : n >= 60 ? 'text-[var(--rf-cyan)]' : n >= 40 ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]' }
