'use client'

// Sidebar sections for the project Command Center. Every section renders from
// the project's real latest-scan analytics (passed in) — the same derived data
// the old dashboard used, now sourced from persisted scans instead of client
// state. Rankings uses the live /api/rankings endpoint (keyed, honest fallback).

import { useState } from 'react'
import {
  Radar, FileText, Plug, Download, Printer, Check, AlertTriangle, Info,
  ExternalLink, Loader2, Gauge, Network, ShieldCheck, TrendingUp, X, type LucideIcon,
} from 'lucide-react'
import {
  type Analytics, type PageResult, type PageSpeed, type Severity, type Dup,
  pathOf, scoreColor, gradeInfo,
} from './analytics'
import { InternalLinksPanel, type LinkTarget } from '../InternalLinksPanel'

const TONE: Record<string, string> = { critical: 'text-[var(--rf-red)]', warning: 'text-[var(--rf-amber)]', info: 'text-[var(--rf-blue-bright)]' }

/* ── shared primitives ──────────────────────────────────────────────────── */

function CountUp({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{value.toLocaleString()}</span>
}

export function Ring({ value, size = 128, thick = 10 }: { value: number; size?: number; thick?: number }) {
  const r = size / 2 - thick; const c = 2 * Math.PI * r; const offset = c - (value / 100) * c; const g = gradeInfo(value)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,173,224,0.12)" strokeWidth={thick} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#rfRing2)" strokeWidth={thick} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.7,0.2,1)' }} />
        <defs><linearGradient id="rfRing2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2f6bff" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
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

/* ── Overview ───────────────────────────────────────────────────────────── */

export function Overview({ a, pages, pageSpeed, domain, onGo }: { a: Analytics; pages: PageResult[]; pageSpeed: PageSpeed | null; domain: string; onGo: (s: string) => void }) {
  const g = gradeInfo(a.siteScore)
  const quickWins = a.issues.filter((i) => i.severity !== 'info').slice(0, 6)
  return (
    <div className="space-y-4">
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

/* ── Site Audit ─────────────────────────────────────────────────────────── */

export function Audit({ a, pages }: { a: Analytics; pages: PageResult[] }) {
  const [filter, setFilter] = useState<'all' | Severity>('all')
  const [selected, setSelected] = useState<PageResult | null>(null)
  const issues = filter === 'all' ? a.issues : a.issues.filter((i) => i.severity === filter)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{(['all', 'critical', 'warning', 'info'] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'rf-btn-ghost'}`}>{f}{f !== 'all' ? ` (${a.severityTotals[f]})` : ''}</button>)}</div>
      <div className="rf-card overflow-hidden"><div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Issues ({issues.length})</div><div className="divide-y divide-[var(--rf-card-line)]">{issues.length === 0 ? <p className="px-4 py-6 text-sm text-[var(--rf-green)]"><Check className="mr-1 inline h-4 w-4" /> No issues in this filter.</p> : issues.map((i, idx) => <div key={idx} className="flex items-start justify-between gap-3 px-4 py-3"><span className="flex items-start gap-3 text-sm"><SevIcon s={i.severity} /><span><span className="text-[var(--rf-text)]">{i.title}</span><span className="block text-[11px] text-[var(--rf-faint)]">{i.category}</span></span></span><span className="shrink-0 rf-mono text-[11px] text-[var(--rf-muted)]">{i.affectedPages} page{i.affectedPages > 1 ? 's' : ''}</span></div>)}</div></div>
      <PagesTable pages={pages} onSelect={setSelected} />
      {selected && <PageDrawer page={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function PagesTable({ pages, onSelect }: { pages: PageResult[]; onSelect: (p: PageResult) => void }) {
  return (
    <div className="rf-card overflow-hidden"><div className="border-b border-[var(--rf-card-line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Crawled pages ({pages.length}) · click a row for fixes</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]"><th className="px-4 py-2 font-medium">Page</th><th className="px-4 py-2 font-medium">Score</th><th className="px-4 py-2 font-medium">Words</th><th className="px-4 py-2 font-medium">Schema</th><th className="px-4 py-2 font-medium">Issues</th></tr></thead><tbody className="divide-y divide-[var(--rf-card-line)]">{[...pages].sort((x, y) => x.overall - y.overall).map((p) => <tr key={p.url} onClick={() => onSelect(p)} className="cursor-pointer hover:bg-white/[0.03]"><td className="max-w-[240px] truncate px-4 py-2.5 text-[var(--rf-muted)]">{pathOf(p.url)}</td><td className={`px-4 py-2.5 rf-mono font-semibold ${scoreColor(p.overall)}`}>{p.overall}</td><td className="px-4 py-2.5 text-[var(--rf-muted)]">{p.wordCount.toLocaleString()}</td><td className="px-4 py-2.5">{p.schemaTypes.length > 0 ? <Check className="h-4 w-4 text-[var(--rf-green)]" /> : <span className="text-[var(--rf-faint)]">—</span>}</td><td className="px-4 py-2.5 rf-mono text-[var(--rf-muted)]">{p.fixes.length}{p.fixes.filter((f) => f.severity === 'critical').length > 0 && <span className="text-[var(--rf-red)]"> ({p.fixes.filter((f) => f.severity === 'critical').length})</span>}</td></tr>)}</tbody></table></div></div>
  )
}

function PageDrawer({ page, onClose }: { page: PageResult; onClose: () => void }) {
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

/* ── Content ────────────────────────────────────────────────────────────── */

export function Content({ a, pages }: { a: Analytics; pages: PageResult[] }) {
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

/* ── Internal Links ─────────────────────────────────────────────────────── */

export function Links({ a, pages, projectId }: { a: Analytics; pages: PageResult[]; projectId: string }) {
  // Merge orphans + no-outbound-link pages into one actionable fix list —
  // a page can be both, and either reason is fixed the same way (link it to
  // a few other real pages on the site).
  const targets: LinkTarget[] = (() => {
    const byUrl = new Map<string, LinkTarget>()
    for (const p of a.links.orphans) byUrl.set(p.url, { url: p.url, title: p.title, reason: 'no inbound links' })
    for (const p of pages.filter((p) => p.internalTargets.length === 0)) {
      const existing = byUrl.get(p.url)
      byUrl.set(p.url, { url: p.url, title: p.title, reason: existing ? 'no inbound or outbound links' : 'no outbound links' })
    }
    return [...byUrl.values()]
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orphan pages" numeric={a.links.orphans.length} tone={a.links.orphans.length ? TONE.critical : 'text-[var(--rf-green)]'} icon={Network} />
        <Stat label="No outbound links" numeric={a.links.noInternalLinks} tone={a.links.noInternalLinks ? TONE.warning : 'text-[var(--rf-green)]'} />
        <Stat label="Avg. inbound links" value={String(a.links.avgInbound)} icon={TrendingUp} />
        <Stat label="Most-linked page" value={a.links.topLinked[0] ? `${a.links.topLinked[0].count}` : '—'} tone="text-[var(--rf-cyan)]" />
      </div>
      <InternalLinksPanel projectId={projectId} targets={targets} />
      <LinkList title="Most-linked pages (internal authority)" rows={a.links.topLinked.map((t) => [pathOf(t.url), `${t.count} inbound`, t.url])} empty="Run an audit to map internal links." />
    </div>
  )
}

/* ── Indexability ───────────────────────────────────────────────────────── */

export function Indexability({ a, pages }: { a: Analytics; pages: PageResult[] }) {
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

/* ── Structured Data ────────────────────────────────────────────────────── */

export function Schema({ a, pages }: { a: Analytics; pages: PageResult[] }) {
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

/* ── Rankings (live /api/rankings, honest fallback) ─────────────────────── */

interface RankResp { available: boolean; note?: string; rows?: { keyword: string; position: number | null; url: string | null }[]; summary?: { tracked: number; top3: number; top10: number; avg: number | null } }
export function Rankings({ domain }: { domain: string }) {
  const [kw, setKw] = useState(''); const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle'); const [resp, setResp] = useState<RankResp | null>(null); const [error, setError] = useState<string | null>(null)
  const track = async () => {
    const keywords = kw.split('\n').map((k) => k.trim()).filter(Boolean)
    if (!domain.trim()) { setError('This project has no domain set.'); setStatus('error'); return }
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

export function Backlinks({ domain }: { domain: string }) {
  return <div className="space-y-4"><ConnectNote title="Backlink data needs a provider" note={`Connect a backlink API to see referring domains, authority, and new/lost links for ${domain || 'your domain'}.`} envVar="(backlink provider key)" /><div className="rf-card p-5"><p className="text-sm font-semibold text-white">What you&apos;ll get here</p><ul className="mt-3 grid gap-2 text-sm text-[var(--rf-muted)] sm:grid-cols-2">{['Referring domains & total backlinks', 'Domain authority trend', 'New vs lost links', 'Anchor-text distribution', 'Competitor link gap', 'Toxic link flags'].map((t) => <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--rf-green)]" /> {t}</li>)}</ul></div></div>
}

function ConnectNote({ title, note, envVar }: { title: string; note?: string; envVar: string }) {
  return <div className="rf-card rf-topline p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Plug className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-sm text-[var(--rf-muted)]">{note}</p><p className="mt-2 rf-mono text-xs text-[var(--rf-faint)]">Set <span className="text-[var(--rf-cyan)]">{envVar}</span> in your Vercel environment, then redeploy.</p></div></div></div>
}

/* ── Reports ────────────────────────────────────────────────────────────── */

export function Reports({ a, pages, domain, pageSpeed }: { a: Analytics; pages: PageResult[]; domain: string; pageSpeed: PageSpeed | null }) {
  const download = () => { const blob = new Blob([JSON.stringify({ domain, crawledAt: new Date().toISOString(), pagesCrawled: pages.length, ...a, pageSpeed, pages }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = url; el.download = `rankforge-audit-${domain || 'site'}.json`; el.click(); URL.revokeObjectURL(url) }
  const g = gradeInfo(a.siteScore)
  return (
    <div className="space-y-4">
      <div className="rf-card rf-topline p-5"><p className="text-sm font-semibold text-white">Audit report — {domain || 'your site'}</p><p className="mt-1 text-xs text-[var(--rf-muted)]">Grade <span style={{ color: g.color }}>{g.letter}</span> · {pages.length} pages · {new Date().toLocaleString()}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={download} className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Export JSON</button><button onClick={() => window.print()} className="rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"><Printer className="h-4 w-4" /> Print / Save PDF</button></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Site score" numeric={a.siteScore} tone="text-[var(--rf-green)]" /><Stat label="Critical" numeric={a.severityTotals.critical} tone={TONE.critical} /><Stat label="Orphans" numeric={a.links.orphans.length} tone={TONE.amber} /><Stat label="Pages" numeric={pages.length} /></div>
    </div>
  )
}

export function EmptyAudit({ onRun, status, domain }: { onRun: () => void; status: string; domain: string }) {
  return (
    <div className="rf-card rf-topline grid place-items-center px-6 py-20 text-center">
      <span className="rf-pulse grid h-14 w-14 place-items-center rounded-2xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Radar className="h-7 w-7" /></span>
      <p className="mt-4 text-lg font-semibold text-white">Run a full-site audit</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--rf-muted)]">RankForge will crawl {domain || 'your site'} (sitemap-aware), score every page, and populate every section here.</p>
      <button onClick={onRun} disabled={status === 'loading'} className="rf-btn-primary mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{status === 'loading' ? 'Auditing…' : 'Start audit'}</button>
    </div>
  )
}
