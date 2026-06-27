'use client'

import { useCallback, useEffect, useState } from 'react'
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
  type LucideIcon,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Severity = 'critical' | 'warning' | 'info'

interface CrawlIssue {
  severity: Severity
  category: string
  title: string
  affectedPages: number
}
interface CrawlPage {
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
  fixCount: number
  criticalCount: number
}
interface CrawlData {
  domain: string
  startUrl: string
  crawledAt: string
  pagesCrawled: number
  reachedLimit: boolean
  siteScore: number
  categories: { technical: number; content: number; schema: number; ai: number }
  severityTotals: { critical: number; warning: number; info: number }
  totals: { avgWordCount: number; pagesWithSchema: number; nonIndexable: number; httpsPages: number }
  issues: CrawlIssue[]
  pages: CrawlPage[]
}

type SectionId =
  | 'overview'
  | 'audit'
  | 'content'
  | 'rankings'
  | 'backlinks'
  | 'wordpress'
  | 'reports'

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
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
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AppDashboard() {
  const [domain, setDomain] = useState('')
  const [section, setSection] = useState<SectionId>('overview')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [data, setData] = useState<CrawlData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const d = localStorage.getItem('rf_app_domain')
      if (d) setDomain(d)
      const cached = localStorage.getItem('rf_app_crawl')
      if (cached) {
        setData(JSON.parse(cached))
        setStatus('done')
      }
    } catch {
      /* ignore */
    }
  }, [])

  const runAudit = useCallback(async () => {
    const value = domain.trim()
    if (!value) return
    try {
      localStorage.setItem('rf_app_domain', value)
    } catch {
      /* ignore */
    }
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value, limit: 15 }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error ?? 'Audit failed.')
        setStatus('error')
        return
      }
      setData(json)
      setStatus('done')
      try {
        localStorage.setItem('rf_app_crawl', JSON.stringify(json))
      } catch {
        /* quota */
      }
    } catch {
      setError('Network error — please try again.')
      setStatus('error')
    }
  }, [domain])

  return (
    <div className="flex min-h-screen flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.85)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]">
              <Zap className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-[15px] font-semibold">
              RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span>
              <span className="ml-2 hidden rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)] sm:inline">
                Command Center
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="rf-card flex flex-1 items-center gap-2 px-3 py-2 sm:w-80">
              <Search className="h-4 w-4 shrink-0 text-[var(--rf-faint)]" />
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runAudit()}
                placeholder="yourdomain.com"
                className="w-full bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
              />
            </div>
            <button
              onClick={runAudit}
              disabled={status === 'loading'}
              className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70"
            >
              {status === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Crawling…</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> Run Audit</>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* sidebar */}
        <nav className="hidden w-52 shrink-0 border-r border-[var(--rf-card-line)] p-3 md:block">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const active = s.id === section
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  active ? 'bg-white/[0.06] font-medium text-white' : 'text-[var(--rf-muted)] hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[var(--rf-blue-bright)]' : ''}`} />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* mobile section tabs */}
        <div className="w-full">
          <div className="flex gap-2 overflow-x-auto border-b border-[var(--rf-card-line)] p-2 md:hidden">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  s.id === section ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)]'
                }`}
              >
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

            {section === 'overview' && <Overview data={data} status={status} onRun={runAudit} />}
            {section === 'audit' && <Audit data={data} />}
            {section === 'content' && <Content data={data} />}
            {section === 'rankings' && <Rankings domain={domain} />}
            {section === 'backlinks' && <Backlinks domain={domain} />}
            {section === 'wordpress' && <WordPress />}
            {section === 'reports' && <Reports data={data} />}
          </main>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onRun }: { onRun?: () => void }) {
  return (
    <div className="rf-card grid place-items-center px-6 py-20 text-center">
      <Radar className="h-10 w-10 text-[var(--rf-blue-bright)]" />
      <p className="mt-4 text-lg font-semibold text-white">No audit yet</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--rf-muted)]">
        Enter your domain above and run an audit. RankForge will crawl your site
        and analyze every page.
      </p>
      {onRun && (
        <button onClick={onRun} className="rf-btn-primary mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold">
          Run your first audit
        </button>
      )}
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
        <defs>
          <linearGradient id="rfAppRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f6bff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="text-3xl font-semibold text-white">{value}</span>
          <span className="block text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">Site score</span>
        </div>
      </div>
    </div>
  )
}

function CatBars({ categories }: { categories: CrawlData['categories'] }) {
  const items: [string, number][] = [
    ['Technical', categories.technical],
    ['Content', categories.content],
    ['Schema', categories.schema],
    ['AI Readiness', categories.ai],
  ]
  return (
    <div className="w-full space-y-3">
      {items.map(([label, score]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--rf-muted)]">{label}</span>
            <span className="rf-mono text-white">{score}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]" style={{ width: `${score}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, tone = 'white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rf-card p-4">
      <p className="text-[11px] text-[var(--rf-faint)]">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone === 'white' ? 'text-white' : tone}`}>{value}</p>
    </div>
  )
}

function SevIcon({ s }: { s: Severity }) {
  if (s === 'info') return <Info className={`h-4 w-4 ${TONE.info}`} />
  return <AlertTriangle className={`h-4 w-4 ${TONE[s]}`} />
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function Overview({ data, status, onRun }: { data: CrawlData | null; status: string; onRun: () => void }) {
  if (status === 'loading' && !data) return <CrawlingState />
  if (!data) return <EmptyState onRun={onRun} />
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rf-card flex flex-col items-center justify-center p-6">
          <Ring value={data.siteScore} />
          <p className="mt-3 text-xs text-[var(--rf-muted)]">{data.domain}</p>
          <p className="text-[11px] text-[var(--rf-faint)]">{data.pagesCrawled} pages crawled</p>
        </div>
        <div className="rf-card flex items-center p-6">
          <CatBars categories={data.categories} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Critical issues" value={String(data.severityTotals.critical)} tone={TONE.critical} />
        <Stat label="Warnings" value={String(data.severityTotals.warning)} tone={TONE.warning} />
        <Stat label="Avg. words / page" value={data.totals.avgWordCount.toLocaleString()} />
        <Stat label="Pages with schema" value={`${data.totals.pagesWithSchema}/${data.pagesCrawled}`} />
      </div>

      <div className="rf-card overflow-hidden">
        <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
          Lowest-scoring pages
        </div>
        <div className="divide-y divide-[var(--rf-card-line)]">
          {data.pages.slice(0, 6).map((p) => (
            <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.02]">
              <span className="truncate text-[var(--rf-muted)]">{pathOf(p.url)}</span>
              <span className="flex shrink-0 items-center gap-3">
                {p.criticalCount > 0 && <span className="rf-mono text-[11px] text-[var(--rf-red)]">{p.criticalCount} crit</span>}
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

function CrawlingState() {
  return (
    <div className="rf-card grid place-items-center px-6 py-20 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--rf-blue-bright)]" />
      <p className="mt-4 font-medium text-white">Crawling your site…</p>
      <p className="mt-1 text-sm text-[var(--rf-muted)]">Fetching pages, analyzing on-page SEO, and scoring each one.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Site Audit                                                          */
/* ------------------------------------------------------------------ */

function Audit({ data }: { data: CrawlData | null }) {
  const [filter, setFilter] = useState<'all' | Severity>('all')
  if (!data) return <EmptyState />
  const issues = filter === 'all' ? data.issues : data.issues.filter((i) => i.severity === filter)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
              filter === f ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'rf-btn-ghost'
            }`}
          >
            {f}{f !== 'all' ? ` (${data.severityTotals[f]})` : ''}
          </button>
        ))}
      </div>

      <div className="rf-card overflow-hidden">
        <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
          Issues ({issues.length})
        </div>
        <div className="divide-y divide-[var(--rf-card-line)]">
          {issues.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> No issues in this filter.</p>
          ) : issues.map((i, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 px-4 py-3">
              <span className="flex items-start gap-3 text-sm">
                <SevIcon s={i.severity} />
                <span>
                  <span className="text-[var(--rf-text)]">{i.title}</span>
                  <span className="block text-[11px] text-[var(--rf-faint)]">{i.category}</span>
                </span>
              </span>
              <span className="shrink-0 rf-mono text-[11px] text-[var(--rf-muted)]">
                {i.affectedPages} page{i.affectedPages > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <PagesTable pages={data.pages} />
    </div>
  )
}

function PagesTable({ pages }: { pages: CrawlPage[] }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
        Crawled pages ({pages.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]">
              <th className="px-4 py-2 font-medium">Page</th>
              <th className="px-4 py-2 font-medium">Score</th>
              <th className="px-4 py-2 font-medium">Words</th>
              <th className="px-4 py-2 font-medium">Schema</th>
              <th className="px-4 py-2 font-medium">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rf-card-line)]">
            {pages.map((p) => (
              <tr key={p.url} className="hover:bg-white/[0.02]">
                <td className="max-w-[220px] truncate px-4 py-2.5">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[var(--rf-muted)] hover:text-white">{pathOf(p.url)}</a>
                </td>
                <td className={`px-4 py-2.5 rf-mono font-semibold ${scoreColor(p.overall)}`}>{p.overall}</td>
                <td className="px-4 py-2.5 text-[var(--rf-muted)]">{p.wordCount.toLocaleString()}</td>
                <td className="px-4 py-2.5">{p.schemaTypes.length > 0 ? <Check className="h-4 w-4 text-[var(--rf-green)]" /> : <span className="text-[var(--rf-faint)]">—</span>}</td>
                <td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{p.fixCount}{p.criticalCount > 0 && <span className="text-[var(--rf-red)]"> ({p.criticalCount})</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

function Content({ data }: { data: CrawlData | null }) {
  if (!data) return <EmptyState />
  const thin = data.pages.filter((p) => p.wordCount < 300)
  const noSchema = data.pages.filter((p) => p.schemaTypes.length === 0)
  const titleIssues = data.pages.filter((p) => p.titleLength < 30 || p.titleLength > 60)
  const noH1 = data.pages.filter((p) => p.h1Count !== 1)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Thin pages (<300w)" value={String(thin.length)} tone={thin.length ? TONE.warning : TONE.info} />
        <Stat label="Missing schema" value={String(noSchema.length)} tone={noSchema.length ? TONE.warning : TONE.info} />
        <Stat label="Title length issues" value={String(titleIssues.length)} tone={titleIssues.length ? TONE.warning : TONE.info} />
        <Stat label="H1 issues" value={String(noH1.length)} tone={noH1.length ? TONE.warning : TONE.info} />
      </div>
      <ContentList title="Thinnest content — expand these first" rows={[...data.pages].sort((a, b) => a.wordCount - b.wordCount).slice(0, 8).map((p) => [pathOf(p.url), `${p.wordCount.toLocaleString()} words`, p.url])} />
      <ContentList title="Pages missing structured data" rows={noSchema.slice(0, 8).map((p) => [pathOf(p.url), 'No schema', p.url])} />
    </div>
  )
}

function ContentList({ title, rows }: { title: string; rows: [string, string, string][] }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{title}</div>
      <div className="divide-y divide-[var(--rf-card-line)]">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> Nothing here — nice.</p>
        ) : rows.map(([path, meta, url]) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.02]">
            <span className="truncate text-[var(--rf-muted)]">{path}</span>
            <span className="shrink-0 rf-mono text-[11px] text-[var(--rf-faint)]">{meta}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Rankings                                                            */
/* ------------------------------------------------------------------ */

interface RankResp {
  available: boolean
  note?: string
  domain?: string
  rows?: { keyword: string; position: number | null; url: string | null; topResult: string | null }[]
  summary?: { tracked: number; top3: number; top10: number; avg: number | null }
}

function Rankings({ domain }: { domain: string }) {
  const [kw, setKw] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [resp, setResp] = useState<RankResp | null>(null)
  const [error, setError] = useState<string | null>(null)

  const track = async () => {
    const keywords = kw.split('\n').map((k) => k.trim()).filter(Boolean)
    if (!domain.trim()) { setError('Set your domain in the top bar first.'); setStatus('error'); return }
    if (keywords.length === 0) { setError('Add at least one keyword (one per line).'); setStatus('error'); return }
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
        <p className="mt-1 text-xs text-[var(--rf-muted)]">One keyword per line. Positions are pulled live from Google for <span className="text-white">{domain || 'your domain'}</span>.</p>
        <textarea value={kw} onChange={(e) => setKw(e.target.value)} rows={4} placeholder={'best crm software\nai crm tools\ncrm for startups'} className="rf-card mt-3 w-full resize-y bg-transparent p-3 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" />
        <button onClick={track} disabled={status === 'loading'} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70">
          {status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Check positions'}
        </button>
        {error && <p className="mt-2 text-xs text-[var(--rf-red)]">{error}</p>}
      </div>

      {status === 'done' && resp && !resp.available && (
        <ConnectNote title="Live rank tracking needs a SERP API key" note={resp.note} envVar="SERPAPI_KEY" />
      )}

      {status === 'done' && resp?.available && resp.rows && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Tracked" value={String(resp.summary?.tracked ?? 0)} />
            <Stat label="Top 10" value={String(resp.summary?.top10 ?? 0)} tone={TONE.info} />
            <Stat label="Avg. position" value={resp.summary?.avg != null ? String(resp.summary.avg) : '—'} tone="text-[var(--rf-green)]" />
          </div>
          <div className="rf-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]"><th className="px-4 py-2 font-medium">Keyword</th><th className="px-4 py-2 font-medium">Position</th><th className="px-4 py-2 font-medium">Ranking URL</th></tr></thead>
                <tbody className="divide-y divide-[var(--rf-card-line)]">
                  {resp.rows.map((r) => (
                    <tr key={r.keyword} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-[var(--rf-text)]">{r.keyword}</td>
                      <td className="px-4 py-2.5 rf-mono font-semibold text-white">{r.position != null ? `#${r.position}` : <span className="text-[var(--rf-faint)]">not in top 100</span>}</td>
                      <td className="max-w-[240px] truncate px-4 py-2.5">{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--rf-muted)] hover:text-white">{pathOf(r.url)}</a> : <span className="text-[var(--rf-faint)]">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Backlinks                                                           */
/* ------------------------------------------------------------------ */

function Backlinks({ domain }: { domain: string }) {
  return (
    <div className="space-y-4">
      <ConnectNote
        title="Backlink data needs a provider"
        note={`Connect a backlink API to see referring domains, authority, anchor text, and new/lost links for ${domain || 'your domain'}.`}
        envVar="(backlink provider key)"
      />
      <div className="rf-card p-5">
        <p className="text-sm font-semibold text-white">What you'll get here</p>
        <ul className="mt-3 grid gap-2 text-sm text-[var(--rf-muted)] sm:grid-cols-2">
          {['Referring domains & total backlinks', 'Domain authority trend', 'New vs lost links', 'Anchor-text distribution', 'Competitor link gap', 'Toxic link flags'].map((t) => (
            <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--rf-green)]" /> {t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ConnectNote({ title, note, envVar }: { title: string; note?: string; envVar: string }) {
  return (
    <div className="rf-card rf-topline p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Plug className="h-5 w-5" /></span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-[var(--rf-muted)]">{note}</p>
          <p className="mt-2 rf-mono text-xs text-[var(--rf-faint)]">Set <span className="text-[var(--rf-cyan)]">{envVar}</span> in your Vercel environment, then redeploy.</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* WordPress                                                           */
/* ------------------------------------------------------------------ */

interface WpStatus { ok: boolean; name?: string; description?: string; hasAioseo?: boolean; authProvided?: boolean; authValid?: boolean }
interface WpItem { id: number; link: string; title: string; status?: string; modified?: string }

function WordPress() {
  const [siteUrl, setSiteUrl] = useState('')
  const [username, setUsername] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle')
  const [info, setInfo] = useState<WpStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<WpItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rf_app_wp')
      if (saved) {
        const p = JSON.parse(saved)
        setSiteUrl(p.siteUrl || '')
        setUsername(p.username || '')
      }
    } catch { /* ignore */ }
  }, [])

  const test = async () => {
    setStatus('testing'); setError(null)
    try {
      const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test', siteUrl, username, appPassword }) })
      const json = await res.json()
      if (!res.ok) { setError(json?.error ?? 'Connection failed.'); setStatus('error'); return }
      setInfo(json); setStatus('connected')
      try { localStorage.setItem('rf_app_wp', JSON.stringify({ siteUrl, username })) } catch { /* ignore */ }
    } catch { setError('Could not reach the site.'); setStatus('error') }
  }

  const list = async (action: 'posts' | 'pages') => {
    setLoadingItems(true)
    try {
      const res = await fetch('/api/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, siteUrl, username, appPassword }) })
      const json = await res.json()
      if (res.ok) setItems(json.items || [])
    } catch { /* ignore */ } finally { setLoadingItems(false) }
  }

  return (
    <div className="space-y-4">
      <div className="rf-card p-5">
        <p className="text-sm font-semibold text-white">Connect WordPress</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">Use an Application Password (Users → Profile → Application Passwords). Credentials stay in your browser and are sent only to your own site. You can also set <span className="rf-mono text-[var(--rf-cyan)]">WP_SITE_URL / WP_USER / WP_APP_PASSWORD</span> in Vercel instead.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://yoursite.com" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none sm:col-span-3" />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none" />
          <input value={appPassword} onChange={(e) => setAppPassword(e.target.value)} type="password" placeholder="application password" className="rf-card bg-transparent px-3 py-2 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none sm:col-span-2" />
        </div>
        <button onClick={test} disabled={status === 'testing'} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70">
          {status === 'testing' ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</> : 'Connect'}
        </button>
        {error && <p className="mt-2 text-xs text-[var(--rf-red)]">{error}</p>}
      </div>

      {status === 'connected' && info && (
        <>
          <div className="rf-card p-5">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-[var(--rf-green)]" />
              <span className="font-semibold text-white">{info.name}</span>
            </div>
            {info.description && <p className="mt-1 text-xs text-[var(--rf-muted)]">{info.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Badge ok={!!info.authValid} text={info.authValid ? 'Authenticated' : info.authProvided ? 'Auth failed' : 'Public (no auth)'} />
              <Badge ok={!!info.hasAioseo} text={info.hasAioseo ? 'AIOSEO detected' : 'AIOSEO not detected'} />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => list('posts')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">List posts</button>
              <button onClick={() => list('pages')} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">List pages</button>
            </div>
          </div>

          {loadingItems && <p className="text-sm text-[var(--rf-muted)]"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Loading…</p>}
          {items.length > 0 && (
            <div className="rf-card overflow-hidden">
              <div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Content ({items.length})</div>
              <div className="divide-y divide-[var(--rf-card-line)]">
                {items.map((it) => (
                  <a key={it.id} href={it.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.02]">
                    <span className="truncate text-[var(--rf-text)]" dangerouslySetInnerHTML={{ __html: it.title || pathOf(it.link) }} />
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Badge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${ok ? 'bg-[var(--rf-green)]/10 text-[var(--rf-green)]' : 'bg-white/[0.05] text-[var(--rf-muted)]'}`}>
      {ok ? <Check className="h-3 w-3" /> : <Info className="h-3 w-3" />} {text}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

function Reports({ data }: { data: CrawlData | null }) {
  if (!data) return <EmptyState />
  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rankforge-audit-${data.domain}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-4">
      <div className="rf-card p-5">
        <p className="text-sm font-semibold text-white">Audit report — {data.domain}</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">Crawled {data.pagesCrawled} pages · {new Date(data.crawledAt).toLocaleString()}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={download} className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Export JSON</button>
          <button onClick={() => window.print()} className="rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"><Printer className="h-4 w-4" /> Print / Save PDF</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Site score" value={String(data.siteScore)} tone="text-[var(--rf-green)]" />
        <Stat label="Critical" value={String(data.severityTotals.critical)} tone={TONE.critical} />
        <Stat label="Warnings" value={String(data.severityTotals.warning)} tone={TONE.warning} />
        <Stat label="Pages" value={String(data.pagesCrawled)} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* utils                                                               */
/* ------------------------------------------------------------------ */

function pathOf(url: string): string {
  try {
    const u = new URL(url)
    return (u.pathname + u.search) || '/'
  } catch {
    return url
  }
}
function scoreColor(n: number): string {
  return n >= 80 ? 'text-[var(--rf-green)]' : n >= 60 ? 'text-[var(--rf-cyan)]' : n >= 40 ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]'
}
