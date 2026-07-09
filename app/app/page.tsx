'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard, Radar, FileText, LineChart, Link2, Plug, FileBarChart,
  Search, Loader2, ArrowUpRight, Check, AlertTriangle, Info, Download, Printer,
  Zap, ExternalLink, RefreshCw, X, Gauge, StopCircle, Network, ShieldCheck,
  Code2, Wand2, Rocket, RotateCcw, TrendingUp, Bot, type LucideIcon,
} from 'lucide-react'
import { CommandCenter, logEvent } from './command'

/* ================================================================== */
/* Types                                                              */
/* ================================================================== */

type Severity = 'critical' | 'warning' | 'info'
interface FixItem { severity: Severity; category: string; title: string }
interface PageResult {
  url: string; status: number; overall: number
  scores: { technical: number; content: number; schema: number; ai: number }
  wordCount: number; title: string; titleLength: number
  metaDescription: string; canonical: string; mixedContent: boolean
  h1Count: number; schemaTypes: string[]; internalTargets: string[]
  https: boolean; indexable: boolean; fixes: FixItem[]
}
interface Issue { severity: Severity; category: string; title: string; affectedPages: number }
interface Dup { value: string; pages: string[] }
interface Analytics {
  siteScore: number
  categories: { technical: number; content: number; schema: number; ai: number }
  severityTotals: { critical: number; warning: number; info: number }
  totals: { avgWordCount: number; pagesWithSchema: number; nonIndexable: number; httpsPages: number }
  issues: Issue[]
  distribution: { excellent: number; good: number; fair: number; poor: number }
  issuesByCategory: { category: string; count: number }[]
  duplicates: { titles: Dup[]; metas: Dup[] }
  links: { inbound: Record<string, number>; orphans: PageResult[]; topLinked: { url: string; count: number }[]; avgInbound: number; noInternalLinks: number }
  index: { noindex: PageResult[]; nonCanonical: PageResult[]; mixed: PageResult[]; nonOk: PageResult[] }
  schemaCoverage: { type: string; count: number }[]
}
interface PageSpeed { available: boolean; performance: number | null; lcpMs: number | null; cls: number | null; inpMs: number | null; strategy?: string }
interface CrawlResponse { pages?: PageResult[]; visited?: string[]; frontier?: string[]; discovered?: number; crawledTotal?: number; done?: boolean; error?: string }

type SectionId = 'command' | 'overview' | 'audit' | 'content' | 'links' | 'indexability' | 'schema' | 'rankings' | 'backlinks' | 'wordpress' | 'reports'
const NAV_GROUPS: { label: string; items: { id: SectionId; label: string; icon: LucideIcon }[] }[] = [
  { label: 'Analyze', items: [
    { id: 'command', label: 'Command Center', icon: Bot },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'audit', label: 'Site Audit', icon: Radar },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'links', label: 'Internal Links', icon: Network },
    { id: 'indexability', label: 'Indexability', icon: ShieldCheck },
    { id: 'schema', label: 'Structured Data', icon: Code2 },
  ]},
  { label: 'Grow', items: [
    { id: 'rankings', label: 'Rankings', icon: LineChart },
    { id: 'backlinks', label: 'Backlinks', icon: Link2 },
  ]},
  { label: 'Deploy', items: [
    { id: 'wordpress', label: 'WordPress', icon: Plug },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ]},
]
const ALL_SECTIONS = NAV_GROUPS.flatMap((g) => g.items)
const TONE: Record<string, string> = { critical: 'text-[var(--rf-red)]', warning: 'text-[var(--rf-amber)]', info: 'text-[var(--rf-blue-bright)]' }

/* ================================================================== */
/* Derived analytics (client, keyless)                                */
/* ================================================================== */

const norm = (u: string) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || '/') } catch { return u.replace(/\/+$/, '') } }
const gradeInfo = (s: number) => s >= 90 ? { letter: 'A', color: 'var(--rf-green)' } : s >= 80 ? { letter: 'B', color: 'var(--rf-cyan)' } : s >= 70 ? { letter: 'C', color: 'var(--rf-blue-bright)' } : s >= 55 ? { letter: 'D', color: 'var(--rf-amber)' } : { letter: 'F', color: 'var(--rf-red)' }

function analyze(pages: PageResult[]): Analytics | null {
  if (pages.length === 0) return null
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)

  const grouped = new Map<string, Issue>()
  for (const p of pages) for (const f of p.fixes) {
    const key = `${f.severity}|${f.category}|${f.title}`
    const g = grouped.get(key)
    if (g) g.affectedPages++
    else grouped.set(key, { severity: f.severity, category: f.category, title: f.title, affectedPages: 1 })
  }
  const rank: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  const issues = [...grouped.values()].sort((a, b) => rank[a.severity] - rank[b.severity] || b.affectedPages - a.affectedPages)

  const catCount = new Map<string, number>()
  for (const p of pages) for (const f of p.fixes) catCount.set(f.category, (catCount.get(f.category) || 0) + 1)
  const issuesByCategory = [...catCount.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)

  const dupOf = (key: (p: PageResult) => string): Dup[] => {
    const m = new Map<string, string[]>()
    for (const p of pages) { const v = key(p).trim(); if (!v) continue; const arr = m.get(v.toLowerCase()) || []; arr.push(p.url); m.set(v.toLowerCase(), arr) }
    return [...m.entries()].filter(([, arr]) => arr.length > 1).map(([, arr]) => ({ value: key(pages.find((p) => norm(p.url) === norm(arr[0]))!) || arr[0], pages: arr })).sort((a, b) => b.pages.length - a.pages.length)
  }

  const pageKeys = new Set(pages.map((p) => norm(p.url)))
  const keyToUrl = new Map(pages.map((p) => [norm(p.url), p.url]))
  const inbound: Record<string, number> = {}
  for (const p of pages) for (const t of p.internalTargets) { const k = norm(t); if (pageKeys.has(k) && k !== norm(p.url)) inbound[k] = (inbound[k] || 0) + 1 }
  const orphans = pages.filter((p) => { const path = pathOf(p.url); return path !== '/' && !(inbound[norm(p.url)] > 0) })
  const topLinked = Object.entries(inbound).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, count]) => ({ url: keyToUrl.get(k) || k, count }))
  const inboundVals = pages.map((p) => inbound[norm(p.url)] || 0)

  const schemaMap = new Map<string, number>()
  for (const p of pages) for (const t of p.schemaTypes) schemaMap.set(t, (schemaMap.get(t) || 0) + 1)

  return {
    siteScore: avg(pages.map((p) => p.overall)),
    categories: { technical: avg(pages.map((p) => p.scores.technical)), content: avg(pages.map((p) => p.scores.content)), schema: avg(pages.map((p) => p.scores.schema)), ai: avg(pages.map((p) => p.scores.ai)) },
    severityTotals: { critical: issues.filter((i) => i.severity === 'critical').length, warning: issues.filter((i) => i.severity === 'warning').length, info: issues.filter((i) => i.severity === 'info').length },
    totals: { avgWordCount: avg(pages.map((p) => p.wordCount)), pagesWithSchema: pages.filter((p) => p.schemaTypes.length > 0).length, nonIndexable: pages.filter((p) => !p.indexable).length, httpsPages: pages.filter((p) => p.https).length },
    issues,
    distribution: { excellent: pages.filter((p) => p.overall >= 90).length, good: pages.filter((p) => p.overall >= 70 && p.overall < 90).length, fair: pages.filter((p) => p.overall >= 50 && p.overall < 70).length, poor: pages.filter((p) => p.overall < 50).length },
    issuesByCategory,
    duplicates: { titles: dupOf((p) => p.title), metas: dupOf((p) => p.metaDescription) },
    links: { inbound, orphans, topLinked, avgInbound: inboundVals.length ? Math.round((inboundVals.reduce((a, b) => a + b, 0) / inboundVals.length) * 10) / 10 : 0, noInternalLinks: pages.filter((p) => p.internalTargets.length === 0).length },
    index: { noindex: pages.filter((p) => p.status === 200 && !p.indexable), nonCanonical: pages.filter((p) => p.canonical && norm(p.canonical) !== norm(p.url)), mixed: pages.filter((p) => p.mixedContent), nonOk: pages.filter((p) => p.status !== 200) },
    schemaCoverage: [...schemaMap.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  }
}

/* ================================================================== */
/* Page                                                               */
/* ================================================================== */

export default function AppDashboard() {
  const [domain, setDomain] = useState('')
  const [maxPages, setMaxPages] = useState(150)
  const [section, setSection] = useState<SectionId>('command')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [pages, setPages] = useState<PageResult[]>([])
  const [progress, setProgress] = useState({ crawled: 0, discovered: 0 })
  const [error, setError] = useState<string | null>(null)
  const [pageSpeed, setPageSpeed] = useState<PageSpeed | null>(null)
  const [selected, setSelected] = useState<PageResult | null>(null)
  const stopRef = useRef(false)
  const a = useMemo(() => analyze(pages), [pages])

  useEffect(() => {
    try {
      const d = localStorage.getItem('rf_app_domain'); if (d) setDomain(d)
      const cached = localStorage.getItem('rf_app_pages'); if (cached) { setPages(JSON.parse(cached)); setStatus('done') }
      const ps = localStorage.getItem('rf_app_ps'); if (ps) setPageSpeed(JSON.parse(ps))
    } catch { /* ignore */ }
  }, [])

  const runAudit = useCallback(async () => {
    const value = domain.trim(); if (!value) return
    try { localStorage.setItem('rf_app_domain', value) } catch { /* ignore */ }
    stopRef.current = false; setStatus('loading'); setError(null); setPages([]); setPageSpeed(null); setProgress({ crawled: 0, discovered: 0 })
    let frontier: string[] | undefined = undefined; let visited: string[] = []; const acc: PageResult[] = []; let safety = 0
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res: Response = await fetch('/api/crawl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: value, maxPages, frontier, visited }) })
        const json: CrawlResponse = await res.json()
        if (!res.ok) { if (acc.length === 0) { setError(json?.error ?? 'Audit failed.'); setStatus('error'); return } break }
        acc.push(...(json.pages ?? [])); visited = json.visited ?? visited; frontier = json.frontier ?? []
        setPages([...acc]); setProgress({ crawled: json.crawledTotal ?? acc.length, discovered: json.discovered ?? acc.length }); safety++
        if (json.done || stopRef.current || safety >= 40 || acc.length >= maxPages) break
      }
      setStatus('done')
      logEvent('audit', `Audited ${acc.length} pages on ${value}`)
      try { localStorage.setItem('rf_app_pages', JSON.stringify(acc)) } catch { /* quota */ }
      try { const ps = await fetch('/api/pagespeed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: value }) }).then((r) => r.json()); if (ps?.available) { setPageSpeed(ps); try { localStorage.setItem('rf_app_ps', JSON.stringify(ps)) } catch { /* ignore */ } } } catch { /* ignore */ }
    } catch { if (acc.length === 0) { setError('Network error — please try again.'); setStatus('error') } else setStatus('done') }
  }, [domain, maxPages])

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] shadow-[0_8px_24px_-8px_rgba(47,107,255,0.9)]"><Zap className="h-4 w-4 text-white" strokeWidth={2.5} /></span>
            <span className="text-[15px] font-semibold">RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span><span className="ml-2 hidden rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)] sm:inline">Command Center</span></span>
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rf-card flex flex-1 items-center gap-2 px-3 py-2 sm:w-72"><Search className="h-4 w-4 shrink-0 text-[var(--rf-faint)]" /><input value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && status !== 'loading' && runAudit()} placeholder="yourdomain.com" className="w-full bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" /></div>
            <select value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} className="rf-card cursor-pointer bg-transparent px-2.5 py-2 text-sm text-white focus:outline-none" title="Max pages to crawl">
              <option className="bg-[#0b1120]" value={50}>50 pages</option><option className="bg-[#0b1120]" value={150}>150 pages</option><option className="bg-[#0b1120]" value={300}>All (≤300)</option>
            </select>
            {status === 'loading' ? <button onClick={() => (stopRef.current = true)} className="rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"><StopCircle className="h-4 w-4" /> Stop</button>
              : <button onClick={runAudit} className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Run Audit</button>}
          </div>
        </div>
        {status === 'loading' && <CrawlProgress crawled={progress.crawled} discovered={progress.discovered} max={maxPages} />}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <nav className="hidden w-56 shrink-0 border-r border-[var(--rf-card-line)] p-3 md:block">
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
          <div className="flex gap-2 overflow-x-auto border-b border-[var(--rf-card-line)] p-2 md:hidden">
            {ALL_SECTIONS.map((s) => <button key={s.id} onClick={() => setSection(s.id)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${s.id === section ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)]'}`}>{s.label}</button>)}
          </div>
          <main className="p-4 sm:p-6">
            {error && status === 'error' && <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--rf-red)]/30 bg-[var(--rf-red)]/10 px-4 py-3 text-sm text-[var(--rf-red)]"><AlertTriangle className="h-4 w-4" /> {error}</div>}
            {section === 'command' && <CommandCenter a={a} pages={pages} pageSpeed={pageSpeed} domain={domain} status={status} onRun={runAudit} onGo={(s) => setSection(s as SectionId)} />}
            {section === 'overview' && <Overview a={a} pages={pages} status={status} onRun={runAudit} pageSpeed={pageSpeed} domain={domain} crawled={progress.crawled} onGo={setSection} />}
            {section === 'audit' && <Audit a={a} pages={pages} onSelect={setSelected} />}
            {section === 'content' && <Content a={a} pages={pages} />}
            {section === 'links' && <Links a={a} />}
            {section === 'indexability' && <Indexability a={a} pages={pages} />}
            {section === 'schema' && <Schema a={a} pages={pages} />}
            {section === 'rankings' && <Rankings domain={domain} />}
            {section === 'backlinks' && <Backlinks domain={domain} />}
            {section === 'wordpress' && <WordPress />}
            {section === 'reports' && <Reports a={a} pages={pages} domain={domain} pageSpeed={pageSpeed} />}
          </main>
        </div>
      </div>
      {selected && <PageDrawer page={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

/* ================================================================== */
/* Shared UI                                                          */
/* ================================================================== */

function CrawlProgress({ crawled, discovered, max }: { crawled: number; discovered: number; max: number }) {
  const denom = Math.max(discovered, Math.min(max, crawled + 1)); const pct = Math.min(100, Math.round((crawled / Math.max(1, denom)) * 100))
  return (
    <div className="px-4 pb-2 lg:px-6">
      <div className="flex items-center justify-between text-[11px] text-[var(--rf-muted)]"><span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin text-[var(--rf-blue-bright)]" /> Crawling… {crawled} crawled · {discovered} discovered</span><span className="rf-mono">{pct}%</span></div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue-bright)] to-[var(--rf-cyan)] transition-all duration-300" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function CountUp({ value, className }: { value: number; className?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => { let raf = 0; const start = performance.now(); const tick = (t: number) => { const p = Math.min(1, (t - start) / 800); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf) }, [value])
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

function Ring({ value, size = 128, thick = 10 }: { value: number; size?: number; thick?: number }) {
  const r = size / 2 - thick; const c = 2 * Math.PI * r; const offset = c - (value / 100) * c; const g = gradeInfo(value)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,173,224,0.12)" strokeWidth={thick} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#rfRing)" strokeWidth={thick} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.7,0.2,1)' }} />
        <defs><linearGradient id="rfRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2f6bff" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><CountUp value={value} className="text-3xl font-semibold text-white" /><span className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: g.color }}>Grade {g.letter}</span></div></div>
    </div>
  )
}

function Donut({ segments, size = 132 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = size / 2 - 9; const c = 2 * Math.PI * r; let acc = 0
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,173,224,0.10)" strokeWidth="9" />
          {segments.map((s, i) => { const frac = s.value / total; const dash = frac * c; const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth="9" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acc} />; acc += dash; return el })}
        </svg>
        <div className="absolute inset-0 grid place-items-center"><div className="text-center"><span className="text-xl font-semibold text-white">{total}</span><span className="block text-[9px] uppercase tracking-wider text-[var(--rf-faint)]">pages</span></div></div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {segments.map((s) => <li key={s.label} className="flex items-center gap-2 text-[var(--rf-muted)]"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} /><span className="text-white">{s.value}</span> {s.label}</li>)}
      </ul>
    </div>
  )
}

function Stat({ label, numeric, value, tone = 'white', icon: Icon }: { label: string; numeric?: number; value?: string; tone?: string; icon?: LucideIcon }) {
  return (
    <div className="rf-card rf-card-hover p-4">
      <div className="flex items-center justify-between"><p className="text-[11px] text-[var(--rf-faint)]">{label}</p>{Icon && <Icon className="h-3.5 w-3.5 text-[var(--rf-faint)]" />}</div>
      <p className={`mt-1 text-xl font-semibold ${tone === 'white' ? 'text-white' : tone}`}>{numeric != null ? <CountUp value={numeric} /> : value}</p>
    </div>
  )
}

function SevIcon({ s }: { s: Severity }) { return s === 'info' ? <Info className={`h-4 w-4 ${TONE.info}`} /> : <AlertTriangle className={`h-4 w-4 ${TONE[s]}`} /> }

function Card({ title, right, children, className = '' }: { title?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <div className={`rf-card overflow-hidden ${className}`}>{title && <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-2.5"><span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{title}</span>{right}</div>}<div className="p-4">{children}</div></div>
}

function LinkList({ title, rows, empty = 'Nothing here — nice.' }: { title: string; rows: [string, string, string][]; empty?: string }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{title}</div>
      <div className="divide-y divide-[var(--rf-card-line)]">
        {rows.length === 0 ? <p className="px-4 py-6 text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> {empty}</p> : rows.map(([path, meta, url], i) => <a key={url + i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.02]"><span className="truncate text-[var(--rf-muted)]">{path}</span><span className="shrink-0 rf-mono text-[11px] text-[var(--rf-faint)]">{meta}</span></a>)}
      </div>
    </div>
  )
}

/* ================================================================== */
/* Overview                                                           */
/* ================================================================== */

function Overview({ a, pages, status, onRun, pageSpeed, domain, crawled, onGo }: { a: Analytics | null; pages: PageResult[]; status: string; onRun: () => void; pageSpeed: PageSpeed | null; domain: string; crawled: number; onGo: (s: SectionId) => void }) {
  if (!a && status === 'loading') return <CrawlingState crawled={crawled} />
  if (!a) return <EmptyState onRun={onRun} />
  const g = gradeInfo(a.siteScore)
  const quickWins = a.issues.filter((i) => i.severity !== 'info').slice(0, 6)
  return (
    <div className="space-y-4">
      {/* project hero */}
      <div className="rf-card rf-topline relative overflow-hidden p-5 sm:p-6">
        <div className="rf-glow pointer-events-none absolute -right-16 -top-16 h-52 w-52 opacity-50" />
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Ring value={a.siteScore} size={132} />
          <div className="min-w-0 flex-1">
            <p className="rf-mono text-[11px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">Site health</p>
            <h1 className="mt-1 truncate text-2xl font-semibold text-white">{domain || 'your site'}</h1>
            <p className="mt-1 text-sm text-[var(--rf-muted)]">Grade <span className="font-semibold" style={{ color: g.color }}>{g.letter}</span> · {pages.length} pages analyzed · {a.severityTotals.critical} critical issue{a.severityTotals.critical !== 1 ? 's' : ''}</p>
            <div className="mt-4"><CatBars categories={a.categories} /></div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Critical issues" numeric={a.severityTotals.critical} tone={TONE.critical} icon={AlertTriangle} />
        <Stat label="Indexable" value={`${pages.length - a.totals.nonIndexable}/${pages.length}`} tone="text-[var(--rf-green)]" icon={ShieldCheck} />
        <Stat label="Orphan pages" numeric={a.links.orphans.length} tone={a.links.orphans.length ? TONE.amber : 'text-[var(--rf-green)]'} icon={Network} />
        <Stat label="Avg. words / page" numeric={a.totals.avgWordCount} icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Page score distribution"><Donut segments={[{ label: 'Excellent (90+)', value: a.distribution.excellent, color: '#34d399' }, { label: 'Good (70–89)', value: a.distribution.good, color: '#22d3ee' }, { label: 'Fair (50–69)', value: a.distribution.fair, color: '#fbbf24' }, { label: 'Poor (<50)', value: a.distribution.poor, color: '#fb6a6a' }]} /></Card>
        <Card title="Issues by category">
          <div className="space-y-2.5">
            {a.issuesByCategory.slice(0, 6).map((c) => { const max = a.issuesByCategory[0]?.count || 1; return (
              <div key={c.category}><div className="mb-1 flex items-center justify-between text-xs"><span className="text-[var(--rf-muted)]">{c.category}</span><span className="rf-mono text-white">{c.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]" style={{ width: `${(c.count / max) * 100}%` }} /></div></div>) })}
          </div>
        </Card>
      </div>

      <CoreWebVitals ps={pageSpeed} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Quick wins" right={<button onClick={() => onGo('audit')} className="text-[11px] text-[var(--rf-blue-bright)] hover:text-white">All issues →</button>}>
          <ul className="space-y-1.5">
            {quickWins.length === 0 ? <li className="text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> No priority issues.</li> : quickWins.map((i, idx) => <li key={idx} className="flex items-start justify-between gap-2 text-sm"><span className="flex items-start gap-2"><SevIcon s={i.severity} /><span className="text-[var(--rf-text)]">{i.title}</span></span><span className="shrink-0 rf-mono text-[11px] text-[var(--rf-faint)]">{i.affectedPages}p</span></li>)}
          </ul>
        </Card>
        <Card title="Lowest-scoring pages" right={<button onClick={() => onGo('audit')} className="text-[11px] text-[var(--rf-blue-bright)] hover:text-white">Details →</button>}>
          <div className="space-y-1.5">
            {[...pages].sort((x, y) => x.overall - y.overall).slice(0, 6).map((p) => <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 text-sm hover:opacity-80"><span className="truncate text-[var(--rf-muted)]">{pathOf(p.url)}</span><span className={`rf-mono font-semibold ${scoreColor(p.overall)}`}>{p.overall}</span></a>)}
          </div>
        </Card>
      </div>
    </div>
  )
}

function CatBars({ categories }: { categories: Analytics['categories'] }) {
  const items: [string, number][] = [['Technical', categories.technical], ['Content', categories.content], ['Schema', categories.schema], ['AI Readiness', categories.ai]]
  return <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">{items.map(([label, score]) => <div key={label}><div className="mb-1 flex items-center justify-between text-xs"><span className="text-[var(--rf-muted)]">{label}</span><span className="rf-mono text-white">{score}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]" style={{ width: `${score}%`, transition: 'width 0.9s cubic-bezier(0.2,0.7,0.2,1)' }} /></div></div>)}</div>
}

function CoreWebVitals({ ps }: { ps: PageSpeed | null }) {
  if (!ps || !ps.available) return null
  const tone = (v: number | null, good: number, ok: number, invert = false) => v == null ? 'text-[var(--rf-faint)]' : invert ? (v >= good ? 'text-[var(--rf-green)]' : v >= ok ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]') : (v <= good ? 'text-[var(--rf-green)]' : v <= ok ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]')
  const cells: [string, string, string][] = [['Performance', ps.performance != null ? `${ps.performance}` : '—', tone(ps.performance, 90, 50, true)], ['LCP', ps.lcpMs != null ? `${(ps.lcpMs / 1000).toFixed(1)}s` : '—', tone(ps.lcpMs, 2500, 4000)], ['CLS', ps.cls != null ? ps.cls.toFixed(3) : '—', tone(ps.cls != null ? ps.cls * 1000 : null, 100, 250)], ['INP', ps.inpMs != null ? `${Math.round(ps.inpMs)}ms` : '—', tone(ps.inpMs, 200, 500)]]
  return <div className="rf-card overflow-hidden"><div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]"><Gauge className="h-4 w-4 text-[var(--rf-cyan)]" /> Core Web Vitals <span className="text-[var(--rf-faint)]">· homepage · {ps.strategy}</span></div><div className="grid grid-cols-2 sm:grid-cols-4">{cells.map(([k, v, c]) => <div key={k} className="border-r border-[var(--rf-card-line)] p-4 text-center last:border-r-0"><p className={`text-2xl font-semibold ${c}`}>{v}</p><p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">{k}</p></div>)}</div></div>
}

function CrawlingState({ crawled }: { crawled: number }) {
  return <div className="rf-card grid place-items-center px-6 py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-[var(--rf-blue-bright)]" /><p className="mt-4 font-medium text-white">Crawling your site…</p><p className="mt-1 text-sm text-[var(--rf-muted)]">{crawled} pages analyzed so far. Results stream in as we go.</p></div>
}

/* ================================================================== */
/* Site Audit                                                         */
/* ================================================================== */

function Audit({ a, pages, onSelect }: { a: Analytics | null; pages: PageResult[]; onSelect: (p: PageResult) => void }) {
  const [filter, setFilter] = useState<'all' | Severity>('all')
  if (!a) return <EmptyState />
  const issues = filter === 'all' ? a.issues : a.issues.filter((i) => i.severity === filter)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{(['all', 'critical', 'warning', 'info'] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'rf-btn-ghost'}`}>{f}{f !== 'all' ? ` (${a.severityTotals[f]})` : ''}</button>)}</div>
      <div className="rf-card overflow-hidden"><div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Issues ({issues.length})</div><div className="divide-y divide-[var(--rf-card-line)]">{issues.length === 0 ? <p className="px-4 py-6 text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> No issues in this filter.</p> : issues.map((i, idx) => <div key={idx} className="flex items-start justify-between gap-3 px-4 py-3"><span className="flex items-start gap-3 text-sm"><SevIcon s={i.severity} /><span><span className="text-[var(--rf-text)]">{i.title}</span><span className="block text-[11px] text-[var(--rf-faint)]">{i.category}</span></span></span><span className="shrink-0 rf-mono text-[11px] text-[var(--rf-muted)]">{i.affectedPages} page{i.affectedPages > 1 ? 's' : ''}</span></div>)}</div></div>
      <PagesTable pages={pages} onSelect={onSelect} />
    </div>
  )
}

function PagesTable({ pages, onSelect }: { pages: PageResult[]; onSelect: (p: PageResult) => void }) {
  return (
    <div className="rf-card overflow-hidden"><div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Crawled pages ({pages.length}) · click a row for fixes</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]"><th className="px-4 py-2 font-medium">Page</th><th className="px-4 py-2 font-medium">Score</th><th className="px-4 py-2 font-medium">Words</th><th className="px-4 py-2 font-medium">Schema</th><th className="px-4 py-2 font-medium">Issues</th></tr></thead><tbody className="divide-y divide-[var(--rf-card-line)]">{[...pages].sort((x, y) => x.overall - y.overall).map((p) => <tr key={p.url} onClick={() => onSelect(p)} className="cursor-pointer hover:bg-white/[0.03]"><td className="max-w-[240px] truncate px-4 py-2.5 text-[var(--rf-muted)]">{pathOf(p.url)}</td><td className={`px-4 py-2.5 rf-mono font-semibold ${scoreColor(p.overall)}`}>{p.overall}</td><td className="px-4 py-2.5 text-[var(--rf-muted)]">{p.wordCount.toLocaleString()}</td><td className="px-4 py-2.5">{p.schemaTypes.length > 0 ? <Check className="h-4 w-4 text-[var(--rf-green)]" /> : <span className="text-[var(--rf-faint)]">—</span>}</td><td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{p.fixes.length}{p.fixes.filter((f) => f.severity === 'critical').length > 0 && <span className="text-[var(--rf-red)]"> ({p.fixes.filter((f) => f.severity === 'critical').length})</span>}</td></tr>)}</tbody></table></div></div>
  )
}

function PageDrawer({ page, onClose }: { page: PageResult; onClose: () => void }) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' } }, [onClose])
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rf-card flex h-full w-full max-w-md flex-col overflow-hidden rounded-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3"><span className="truncate text-sm font-medium text-white">{pathOf(page.url)}</span><button onClick={onClose} className="rf-btn-ghost grid h-8 w-8 shrink-0 place-items-center rounded-lg"><X className="h-4 w-4" /></button></div>
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2 text-center">{([['Overall', page.overall], ['Tech', page.scores.technical], ['Content', page.scores.content], ['Schema', page.scores.schema]] as [string, number][]).map(([k, v]) => <div key={k} className="rf-card p-2"><p className={`text-lg font-semibold ${scoreColor(v)}`}>{v}</p><p className="text-[10px] text-[var(--rf-faint)]">{k}</p></div>)}</div>
          <a href={page.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--rf-blue-bright)] hover:text-white">Open page <ExternalLink className="h-3 w-3" /></a>
          <h4 className="mt-5 text-sm font-semibold text-white">Fixes for this page ({page.fixes.length})</h4>
          <ul className="mt-2 space-y-1.5">{page.fixes.length === 0 ? <li className="text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> Clean — no issues.</li> : page.fixes.map((f, i) => <li key={i} className="flex items-start gap-2.5 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2 text-sm"><SevIcon s={f.severity} /><span><span className="text-[var(--rf-text)]">{f.title}</span><span className="block text-[11px] text-[var(--rf-faint)]">{f.category}</span></span></li>)}</ul>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Content                                                            */
/* ================================================================== */

function Content({ a, pages }: { a: Analytics | null; pages: PageResult[] }) {
  if (!a) return <EmptyState />
  const thin = pages.filter((p) => p.wordCount < 300); const noSchema = pages.filter((p) => p.schemaTypes.length === 0); const titleIssues = pages.filter((p) => p.titleLength < 30 || p.titleLength > 60); const noH1 = pages.filter((p) => p.h1Count !== 1)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Duplicate titles" numeric={a.duplicates.titles.length} tone={a.duplicates.titles.length ? TONE.critical : 'text-[var(--rf-green)]'} />
        <Stat label="Duplicate metas" numeric={a.duplicates.metas.length} tone={a.duplicates.metas.length ? TONE.warning : 'text-[var(--rf-green)]'} />
        <Stat label="Thin pages (<300w)" numeric={thin.length} tone={thin.length ? TONE.warning : 'text-[var(--rf-green)]'} />
        <Stat label="Missing schema" numeric={noSchema.length} tone={noSchema.length ? TONE.warning : 'text-[var(--rf-green)]'} />
      </div>
      {a.duplicates.titles.length > 0 && <DupCard title="Duplicate title tags" dups={a.duplicates.titles} />}
      {a.duplicates.metas.length > 0 && <DupCard title="Duplicate meta descriptions" dups={a.duplicates.metas} />}
      <LinkList title="Thinnest content — expand first" rows={[...pages].sort((x, y) => x.wordCount - y.wordCount).slice(0, 10).map((p) => [pathOf(p.url), `${p.wordCount.toLocaleString()} words`, p.url])} />
      <div className="grid gap-3 lg:grid-cols-2">
        <LinkList title="Title length issues" rows={titleIssues.slice(0, 10).map((p) => [pathOf(p.url), `${p.titleLength}c`, p.url])} empty="All titles well-sized." />
        <LinkList title="H1 issues" rows={noH1.slice(0, 10).map((p) => [pathOf(p.url), `${p.h1Count} H1`, p.url])} empty="Every page has one H1." />
      </div>
    </div>
  )
}

function DupCard({ title, dups }: { title: string; dups: Dup[] }) {
  return (
    <div className="rf-card overflow-hidden"><div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{title} ({dups.length})</div><div className="divide-y divide-[var(--rf-card-line)]">{dups.slice(0, 8).map((d, i) => <div key={i} className="px-4 py-3"><p className="truncate text-sm text-[var(--rf-text)]">“{d.value || '(empty)'}”</p><p className="mt-1 text-[11px] text-[var(--rf-faint)]">{d.pages.length} pages: {d.pages.slice(0, 3).map((u) => pathOf(u)).join(', ')}{d.pages.length > 3 ? '…' : ''}</p></div>)}</div></div>
  )
}

/* ================================================================== */
/* Internal Links                                                     */
/* ================================================================== */

function Links({ a }: { a: Analytics | null }) {
  if (!a) return <EmptyState />
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orphan pages" numeric={a.links.orphans.length} tone={a.links.orphans.length ? TONE.critical : 'text-[var(--rf-green)]'} icon={Network} />
        <Stat label="No outbound links" numeric={a.links.noInternalLinks} tone={a.links.noInternalLinks ? TONE.warning : 'text-[var(--rf-green)]'} />
        <Stat label="Avg. inbound links" value={String(a.links.avgInbound)} icon={TrendingUp} />
        <Stat label="Most-linked page" value={a.links.topLinked[0] ? `${a.links.topLinked[0].count}` : '—'} tone="text-[var(--rf-cyan)]" />
      </div>
      <LinkList title="Orphan pages — no internal links point here" rows={a.links.orphans.slice(0, 12).map((p) => [pathOf(p.url), 'add internal links', p.url])} empty="No orphans — great internal linking." />
      <LinkList title="Most-linked pages (internal authority)" rows={a.links.topLinked.map((t) => [pathOf(t.url), `${t.count} inbound`, t.url])} empty="Run an audit to map internal links." />
    </div>
  )
}

/* ================================================================== */
/* Indexability                                                       */
/* ================================================================== */

function Indexability({ a, pages }: { a: Analytics | null; pages: PageResult[] }) {
  if (!a) return <EmptyState />
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Indexable pages" value={`${pages.length - a.totals.nonIndexable}/${pages.length}`} tone="text-[var(--rf-green)]" icon={ShieldCheck} />
        <Stat label="Noindex" numeric={a.index.noindex.length} tone={a.index.noindex.length ? TONE.critical : 'text-[var(--rf-green)]'} />
        <Stat label="Non-canonical" numeric={a.index.nonCanonical.length} tone={a.index.nonCanonical.length ? TONE.warning : 'text-[var(--rf-green)]'} />
        <Stat label="Mixed content" numeric={a.index.mixed.length} tone={a.index.mixed.length ? TONE.critical : 'text-[var(--rf-green)]'} />
      </div>
      <LinkList title="Noindex pages (won't rank)" rows={a.index.noindex.slice(0, 12).map((p) => [pathOf(p.url), 'noindex', p.url])} empty="No noindex pages." />
      <LinkList title="Canonical points elsewhere" rows={a.index.nonCanonical.slice(0, 12).map((p) => [pathOf(p.url), '→ ' + pathOf(p.canonical), p.url])} empty="All canonicals are self-referencing." />
      <div className="grid gap-3 lg:grid-cols-2">
        <LinkList title="Mixed content (http on https)" rows={a.index.mixed.slice(0, 10).map((p) => [pathOf(p.url), 'insecure assets', p.url])} empty="No mixed content." />
        <LinkList title="Non-200 responses" rows={a.index.nonOk.slice(0, 10).map((p) => [pathOf(p.url), String(p.status || 'error'), p.url])} empty="Every page returned 200." />
      </div>
    </div>
  )
}

/* ================================================================== */
/* Structured Data                                                    */
/* ================================================================== */

function Schema({ a, pages }: { a: Analytics | null; pages: PageResult[] }) {
  if (!a) return <EmptyState />
  const covered = a.totals.pagesWithSchema; const pct = Math.round((covered / pages.length) * 100)
  const recommended = ['Organization', 'WebSite', 'BreadcrumbList', 'Article', 'FAQPage', 'Product']
  const present = new Set(a.schemaCoverage.map((s) => s.type))
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rf-card flex flex-col items-center justify-center p-6"><Ring value={pct} /><p className="mt-3 text-xs text-[var(--rf-muted)]">{covered}/{pages.length} pages have schema</p></div>
        <Card title="Schema types found">
          {a.schemaCoverage.length === 0 ? <p className="text-sm text-[var(--rf-muted)]">No structured data found across the site. Adding schema unlocks rich results and AI citations.</p> : <div className="flex flex-wrap gap-2">{a.schemaCoverage.map((s) => <span key={s.type} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--rf-blue)]/10 px-3 py-1 text-xs text-[var(--rf-blue-bright)]">{s.type} <span className="rf-mono text-[var(--rf-faint)]">{s.count}</span></span>)}</div>}
        </Card>
      </div>
      <Card title="Recommended schema coverage">
        <ul className="grid gap-2 sm:grid-cols-2">{recommended.map((t) => <li key={t} className="flex items-center gap-2 text-sm">{present.has(t) ? <Check className="h-4 w-4 text-[var(--rf-green)]" /> : <span className="h-1.5 w-1.5 rounded-full bg-[var(--rf-amber)]" />}<span className={present.has(t) ? 'text-[var(--rf-text)]' : 'text-[var(--rf-muted)]'}>{t}</span>{!present.has(t) && <span className="text-[11px] text-[var(--rf-faint)]">missing</span>}</li>)}</ul>
      </Card>
    </div>
  )
}

/* ================================================================== */
/* Rankings                                                           */
/* ================================================================== */

interface RankResp { available: boolean; note?: string; rows?: { keyword: string; position: number | null; url: string | null }[]; summary?: { tracked: number; top3: number; top10: number; avg: number | null } }
function Rankings({ domain }: { domain: string }) {
  const [kw, setKw] = useState(''); const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle'); const [resp, setResp] = useState<RankResp | null>(null); const [error, setError] = useState<string | null>(null)
  const track = async () => {
    const keywords = kw.split('\n').map((k) => k.trim()).filter(Boolean)
    if (!domain.trim()) { setError('Set your domain in the top bar first.'); setStatus('error'); return }
    if (keywords.length === 0) { setError('Add at least one keyword.'); setStatus('error'); return }
    setStatus('loading'); setError(null)
    try { const res = await fetch('/api/rankings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain, keywords }) }); const json = await res.json(); if (!res.ok) { setError(json?.error ?? 'Failed.'); setStatus('error'); return } setResp(json); setStatus('done') } catch { setError('Network error.'); setStatus('error') }
  }
  return (
    <div className="space-y-4">
      <div className="rf-card p-4"><p className="text-sm font-semibold text-white">Track keyword rankings</p><p className="mt-1 text-xs text-[var(--rf-muted)]">One keyword per line. Live Google positions for <span className="text-white">{domain || 'your domain'}</span>.</p><textarea value={kw} onChange={(e) => setKw(e.target.value)} rows={4} placeholder={'best crm software\nai crm tools'} className="rf-card mt-3 w-full resize-y bg-transparent p-3 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" /><button onClick={track} disabled={status === 'loading'} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70">{status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Check positions'}</button>{error && <p className="mt-2 text-xs text-[var(--rf-red)]">{error}</p>}</div>
      {status === 'done' && resp && !resp.available && <ConnectNote title="Live rank tracking needs a SERP API key" note={resp.note} envVar="SERPAPI_KEY" />}
      {status === 'done' && resp?.available && resp.rows && <>
        <div className="grid grid-cols-3 gap-3"><Stat label="Tracked" numeric={resp.summary?.tracked ?? 0} /><Stat label="Top 10" numeric={resp.summary?.top10 ?? 0} tone={TONE.info} /><Stat label="Avg. position" value={resp.summary?.avg != null ? String(resp.summary.avg) : '—'} tone="text-[var(--rf-green)]" /></div>
        <div className="rf-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]"><th className="px-4 py-2 font-medium">Keyword</th><th className="px-4 py-2 font-medium">Position</th><th className="px-4 py-2 font-medium">URL</th></tr></thead><tbody className="divide-y divide-[var(--rf-card-line)]">{resp.rows.map((r) => <tr key={r.keyword} className="hover:bg-white/[0.02]"><td className="px-4 py-2.5 text-[var(--rf-text)]">{r.keyword}</td><td className="px-4 py-2.5 rf-mono font-semibold text-white">{r.position != null ? `#${r.position}` : <span className="text-[var(--rf-faint)]">—</span>}</td><td className="max-w-[240px] truncate px-4 py-2.5">{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--rf-muted)] hover:text-white">{pathOf(r.url)}</a> : <span className="text-[var(--rf-faint)]">—</span>}</td></tr>)}</tbody></table></div></div>
      </>}
    </div>
  )
}

function Backlinks({ domain }: { domain: string }) {
  return <div className="space-y-4"><ConnectNote title="Backlink data needs a provider" note={`Connect a backlink API to see referring domains, authority, and new/lost links for ${domain || 'your domain'}.`} envVar="(backlink provider key)" /><div className="rf-card p-5"><p className="text-sm font-semibold text-white">What you'll get here</p><ul className="mt-3 grid gap-2 text-sm text-[var(--rf-muted)] sm:grid-cols-2">{['Referring domains & total backlinks', 'Domain authority trend', 'New vs lost links', 'Anchor-text distribution', 'Competitor link gap', 'Toxic link flags'].map((t) => <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--rf-green)]" /> {t}</li>)}</ul></div></div>
}

function ConnectNote({ title, note, envVar }: { title: string; note?: string; envVar: string }) {
  return <div className="rf-card rf-topline p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Plug className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-sm text-[var(--rf-muted)]">{note}</p><p className="mt-2 rf-mono text-xs text-[var(--rf-faint)]">Set <span className="text-[var(--rf-cyan)]">{envVar}</span> in your Vercel environment, then redeploy.</p></div></div></div>
}

/* ================================================================== */
/* WordPress (connect + optimize + deploy, AIOSEO-aware)              */
/* ================================================================== */

interface WpStatus { ok: boolean; name?: string; description?: string; hasAioseo?: boolean; authProvided?: boolean; authValid?: boolean }
interface WpItem { id: number; link: string; title: string }
interface WpAnalysis { title: string; titleLength: number; metaDescription: string; metaDescriptionLength: number; h1Count: number; wordCount: number; schemaTypes: string[]; hasOpenGraph: boolean }
interface WpEditPost { id: number; type: 'posts' | 'pages'; link: string; title: string; excerpt: string; content: string; aioseoTitle: string; aioseoDescription: string }
interface WpEdit { post: WpEditPost; analysis: WpAnalysis | null }
interface WpCreds { siteUrl: string; username: string; appPassword: string }

function WordPress() {
  const [siteUrl, setSiteUrl] = useState(''); const [username, setUsername] = useState(''); const [appPassword, setAppPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle'); const [info, setInfo] = useState<WpStatus | null>(null); const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<WpItem[]>([]); const [loadingItems, setLoadingItems] = useState(false)
  const [listType, setListType] = useState<'posts' | 'pages'>('posts'); const [editing, setEditing] = useState<WpEdit | null>(null); const [optimizingId, setOptimizingId] = useState<number | null>(null)
  useEffect(() => { try { const s = localStorage.getItem('rf_app_wp'); if (s) { const p = JSON.parse(s); setSiteUrl(p.siteUrl || ''); setUsername(p.username || '') } } catch { /* ignore */ } }, [])
  const test = async () => { setStatus('testing'); setError(null); try { const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test', siteUrl, username, appPassword }) }); const json = await res.json(); if (!res.ok) { setError(json?.error ?? 'Connection failed.'); setStatus('error'); return } setInfo(json); setStatus('connected'); try { localStorage.setItem('rf_app_wp', JSON.stringify({ siteUrl, username })) } catch { /* ignore */ } } catch { setError('Could not reach the site.'); setStatus('error') } }
  const list = async (action: 'posts' | 'pages') => { setListType(action); setLoadingItems(true); try { const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, siteUrl, username, appPassword }) }); const json = await res.json(); if (res.ok) setItems(json.items || []) } catch { /* ignore */ } finally { setLoadingItems(false) } }
  const optimize = async (item: WpItem) => { setOptimizingId(item.id); try { const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get', id: item.id, type: listType, siteUrl, username, appPassword }) }); const json = await res.json(); if (res.ok) setEditing(json); else setError(json?.error ?? 'Could not load item.') } catch { setError('Could not load item.') } finally { setOptimizingId(null) } }
  const creds: WpCreds = { siteUrl, username, appPassword }
  return (
    <div className="space-y-4">
      <div className="rf-card p-5">
        <p className="text-sm font-semibold text-white">Connect WordPress</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">Use an Application Password (Users → Profile → Application Passwords). Credentials stay in your browser. Or set <span className="rf-mono text-[var(--rf-cyan)]">WP_SITE_URL / WP_USER / WP_APP_PASSWORD</span> in Vercel.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3"><input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://yoursite.com" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none sm:col-span-3" /><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" /><input value={appPassword} onChange={(e) => setAppPassword(e.target.value)} type="password" placeholder="application password" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none sm:col-span-2" /></div>
        <button onClick={test} disabled={status === 'testing'} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70">{status === 'testing' ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</> : 'Connect'}</button>
        {error && <p className="mt-2 text-xs text-[var(--rf-red)]">{error}</p>}
      </div>
      {status === 'connected' && info && <>
        <div className="rf-card p-5"><div className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-[var(--rf-green)]" /><span className="font-semibold text-white">{info.name}</span></div>{info.description && <p className="mt-1 text-xs text-[var(--rf-muted)]">{info.description}</p>}<div className="mt-3 flex flex-wrap gap-2 text-[11px]"><Badge ok={!!info.authValid} text={info.authValid ? 'Authenticated' : info.authProvided ? 'Auth failed' : 'Public (no auth)'} /><Badge ok={!!info.hasAioseo} text={info.hasAioseo ? 'AIOSEO detected' : 'AIOSEO not detected'} /></div><div className="mt-4 flex gap-2"><button onClick={() => list('posts')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">List posts</button><button onClick={() => list('pages')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">List pages</button></div></div>
        {loadingItems && <p className="text-sm text-[var(--rf-muted)]"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Loading…</p>}
        {items.length > 0 && <div className="rf-card overflow-hidden"><div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{listType} ({items.length}) · optimize &amp; deploy SEO fixes</div><div className="divide-y divide-[var(--rf-card-line)]">{items.map((it) => <div key={it.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="truncate text-[var(--rf-text)]" dangerouslySetInnerHTML={{ __html: it.title || pathOf(it.link) }} /><span className="flex shrink-0 items-center gap-2"><a href={it.link} target="_blank" rel="noopener noreferrer" className="text-[var(--rf-faint)] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a><button onClick={() => optimize(it)} disabled={optimizingId === it.id} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-60">{optimizingId === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Optimize</button></span></div>)}</div></div>}
      </>}
      {editing && <Optimizer edit={editing} creds={creds} authValid={!!info?.authValid} hasAioseo={!!info?.hasAioseo} onClose={() => setEditing(null)} />}
    </div>
  )
}

const SCHEMA_RE = /\n?<!-- rankforge-schema:start -->[\s\S]*?<!-- rankforge-schema:end -->\n?/g
function schemaBlock(title: string, url: string): string { return `\n<!-- rankforge-schema:start -->\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: title, url })}</script>\n<!-- rankforge-schema:end -->\n` }

function Optimizer({ edit, creds, authValid, hasAioseo, onClose }: { edit: WpEdit; creds: WpCreds; authValid: boolean; hasAioseo: boolean; onClose: () => void }) {
  const an = edit.analysis
  const origTitle = hasAioseo ? edit.post.aioseoTitle || an?.title || edit.post.title : edit.post.title
  const origMeta = hasAioseo ? edit.post.aioseoDescription || edit.post.excerpt || an?.metaDescription || '' : edit.post.excerpt || an?.metaDescription || ''
  const [title, setTitle] = useState(origTitle); const [meta, setMeta] = useState(origMeta); const [addSchema, setAddSchema] = useState(!!an && an.schemaTypes.length === 0)
  const [step, setStep] = useState<'edit' | 'confirm' | 'applying' | 'done' | 'error'>('edit'); const [error, setError] = useState<string | null>(null); const [undone, setUndone] = useState(false)
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' } }, [onClose])
  const buildPayload = (revert: boolean) => {
    const payload: Record<string, string> = { id: String(edit.post.id) }
    const setT = (v: string) => { if (hasAioseo) payload.aioseoTitle = v; else payload.title = v }
    const setM = (v: string) => { if (hasAioseo) payload.aioseoDescription = v; else payload.excerpt = v }
    if (revert) { setT(origTitle); setM(origMeta); if (addSchema) payload.content = edit.post.content; return payload }
    if (title !== origTitle) setT(title); if (meta !== origMeta) setM(meta)
    if (addSchema) payload.content = edit.post.content.replace(SCHEMA_RE, '') + schemaBlock(title || origTitle, edit.post.link)
    return payload
  }
  const send = async (revert: boolean) => { setStep('applying'); setError(null); try { const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'apply', type: edit.post.type, ...creds, ...buildPayload(revert) }) }); const json = await res.json(); if (!res.ok) { setError(json?.error ?? 'Deploy failed.'); setStep('error'); return } setUndone(revert); setStep('done'); logEvent(revert ? 'fix' : 'deploy', revert ? `Reverted SEO changes on ${pathOf(edit.post.link)}` : `Deployed SEO fixes to ${pathOf(edit.post.link)}`) } catch { setError('Network error.'); setStep('error') } }
  const changeCount = (title !== origTitle ? 1 : 0) + (meta !== origMeta ? 1 : 0) + (addSchema ? 1 : 0)
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onClick={onClose}>
      <div className="rf-card rf-topline relative my-auto w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-3.5"><span className="flex items-center gap-2 text-sm font-semibold text-white"><Wand2 className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Optimize &amp; deploy</span><button onClick={onClose} className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg"><X className="h-4 w-4" /></button></div>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          <a href={edit.post.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--rf-blue-bright)] hover:text-white">{pathOf(edit.post.link)} <ExternalLink className="h-3 w-3" /></a>
          {an && <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><Badge ok={an.titleLength >= 30 && an.titleLength <= 60} text={`Title ${an.titleLength}c`} /><Badge ok={an.metaDescriptionLength >= 70 && an.metaDescriptionLength <= 160} text={`Meta ${an.metaDescriptionLength}c`} /><Badge ok={an.h1Count === 1} text={`${an.h1Count} H1`} /><Badge ok={an.schemaTypes.length > 0} text={an.schemaTypes.length ? 'Has schema' : 'No schema'} /></div>}
          {step === 'done' ? (
            <div className="py-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--rf-green)]/10"><Check className="h-6 w-6 text-[var(--rf-green)]" /></span><p className="mt-3 font-semibold text-white">{undone ? 'Reverted on your site' : 'Deployed to your site'}</p><p className="mt-1 text-sm text-[var(--rf-muted)]">{undone ? 'The previous values were restored.' : 'Your changes are live on WordPress.'}</p><div className="mt-4 flex justify-center gap-2">{!undone && <button onClick={() => send(true)} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium"><RotateCcw className="h-4 w-4" /> Undo</button>}<a href={edit.post.link} target="_blank" rel="noopener noreferrer" className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold">View page <ExternalLink className="h-4 w-4" /></a></div></div>
          ) : (<>
            <p className="mt-4 rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{hasAioseo ? 'Writing AIOSEO SEO fields' : 'Writing core post title / excerpt'}</p>
            <label className="mt-2 block text-xs font-medium text-[var(--rf-muted)]">SEO title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="rf-card mt-1 w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" /><p className="mt-1 text-[11px] text-[var(--rf-faint)]">{title.length} chars · aim 30–60</p>
            <label className="mt-4 block text-xs font-medium text-[var(--rf-muted)]">Meta description</label><textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} className="rf-card mt-1 w-full resize-y bg-transparent px-3 py-2 text-sm text-white focus:outline-none" /><p className="mt-1 text-[11px] text-[var(--rf-faint)]">{meta.length} chars · aim 70–160</p>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm"><input type="checkbox" checked={addSchema} onChange={(e) => setAddSchema(e.target.checked)} className="mt-0.5 accent-[var(--rf-blue)]" /><span><span className="text-[var(--rf-text)]">Add JSON-LD Article schema</span><span className="block text-[11px] text-[var(--rf-faint)]">Injected into the post content (idempotent &amp; reversible).</span></span></label>
            {!authValid && <p className="mt-4 rounded-lg border border-[var(--rf-amber)]/30 bg-[var(--rf-amber)]/10 px-3 py-2 text-xs text-[var(--rf-amber)]">Connect with a valid Application Password to deploy changes.</p>}
            {step === 'error' && <p className="mt-3 text-xs text-[var(--rf-red)]">{error}</p>}
            {step === 'confirm' ? <div className="mt-5 rounded-xl border border-[var(--rf-card-line-strong)] bg-white/[0.02] p-3"><p className="text-sm text-white">Deploy {changeCount} change{changeCount !== 1 ? 's' : ''} to your live site?</p><p className="mt-1 text-[11px] text-[var(--rf-faint)]">You can undo right after.</p><div className="mt-3 flex gap-2"><button onClick={() => send(false)} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"><Rocket className="h-4 w-4" /> Deploy now</button><button onClick={() => setStep('edit')} className="rf-btn-ghost rounded-xl px-4 py-2 text-sm font-medium">Cancel</button></div></div>
              : <button onClick={() => setStep('confirm')} disabled={!authValid || changeCount === 0 || step === 'applying'} className="rf-btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">{step === 'applying' ? <><Loader2 className="h-4 w-4 animate-spin" /> Deploying…</> : <><Rocket className="h-4 w-4" /> Review &amp; deploy ({changeCount})</>}</button>}
          </>)}
        </div>
      </div>
    </div>
  )
}

function Badge({ ok, text }: { ok: boolean; text: string }) { return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${ok ? 'bg-[var(--rf-green)]/10 text-[var(--rf-green)]' : 'bg-white/[0.05] text-[var(--rf-muted)]'}`}>{ok ? <Check className="h-3 w-3" /> : <Info className="h-3 w-3" />} {text}</span> }

/* ================================================================== */
/* Reports                                                            */
/* ================================================================== */

function Reports({ a, pages, domain, pageSpeed }: { a: Analytics | null; pages: PageResult[]; domain: string; pageSpeed: PageSpeed | null }) {
  if (!a) return <EmptyState />
  const download = () => { const blob = new Blob([JSON.stringify({ domain, crawledAt: new Date().toISOString(), pagesCrawled: pages.length, ...a, pageSpeed, pages }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = url; el.download = `rankforge-audit-${domain || 'site'}.json`; el.click(); URL.revokeObjectURL(url) }
  const g = gradeInfo(a.siteScore)
  return (
    <div className="space-y-4">
      <div className="rf-card rf-topline p-5"><p className="text-sm font-semibold text-white">Audit report — {domain || 'your site'}</p><p className="mt-1 text-xs text-[var(--rf-muted)]">Grade <span style={{ color: g.color }}>{g.letter}</span> · {pages.length} pages · {new Date().toLocaleString()}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={download} className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Export JSON</button><button onClick={() => window.print()} className="rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"><Printer className="h-4 w-4" /> Print / Save PDF</button></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Site score" numeric={a.siteScore} tone="text-[var(--rf-green)]" /><Stat label="Critical" numeric={a.severityTotals.critical} tone={TONE.critical} /><Stat label="Orphans" numeric={a.links.orphans.length} tone={TONE.amber} /><Stat label="Pages" numeric={pages.length} /></div>
    </div>
  )
}

/* ================================================================== */
/* utils                                                              */
/* ================================================================== */

function pathOf(url: string): string { try { const u = new URL(url); return (u.pathname + u.search) || '/' } catch { return url } }
function scoreColor(n: number): string { return n >= 80 ? 'text-[var(--rf-green)]' : n >= 60 ? 'text-[var(--rf-cyan)]' : n >= 40 ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]' }
