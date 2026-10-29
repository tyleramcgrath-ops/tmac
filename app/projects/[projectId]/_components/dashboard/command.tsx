'use client'

// Executive Command Center — the "what should I do today?" home of a project.
//
// Everything derives from the project's real latest crawl (analytics passed in).
// Traffic & revenue figures are MODELED from user-tunable business inputs and
// are always labeled as estimates. Per-engine AI-readiness bars are MODELED
// estimates from on-page signals — never presented as live engine measurements.

import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles, Bot, AlertTriangle, Check, Gauge, Network,
  ShieldCheck, Code2, DollarSign, Clock, Settings2, X,
  Power, CalendarClock, Rocket, Radar as RadarIcon, type LucideIcon,
} from 'lucide-react'
import {
  type Analytics, type PageResult, type PageSpeed, type Severity, type Biz,
  clamp, aiReadiness, engineReadiness, buildPriorities, DEFAULT_BIZ,
} from './analytics'

export interface RfEvent { at: string; icon: 'audit' | 'deploy' | 'fix'; text: string }
type GoSection = (s: string) => void

/* Business inputs are tunable and stored in the browser only (per project). */
function bizKey(projectId: string) { return `rf_biz_${projectId}` }
function readBiz(projectId: string): Biz {
  try { const raw = localStorage.getItem(bizKey(projectId)); return raw ? { ...DEFAULT_BIZ, ...JSON.parse(raw) } : DEFAULT_BIZ } catch { return DEFAULT_BIZ }
}

export function CommandCenter({ a, pages, pageSpeed, domain, projectId, status, events, onRun, onGo }: {
  a: Analytics | null; pages: PageResult[]; pageSpeed: PageSpeed | null
  domain: string; projectId: string; status: string; events: RfEvent[]
  onRun: () => void; onGo: GoSection
}) {
  const [biz, setBiz] = useState<Biz>(DEFAULT_BIZ)
  const [showBiz, setShowBiz] = useState(false)
  useEffect(() => { setBiz(readBiz(projectId)) }, [projectId, status])

  const ai = useMemo(() => (a ? aiReadiness(a, pages.length) : 0), [a, pages.length])
  const engines = useMemo(() => (a ? engineReadiness(a, pages.length) : []), [a, pages.length])
  const priorities = useMemo(() => (a ? buildPriorities(a, pages.length, biz) : null), [a, pages.length, biz])
  const hasBiz = biz.monthlyVisits > 0 && biz.valuePerVisit > 0

  if (!a) {
    return (
      <div className="rf-card rf-topline grid place-items-center px-6 py-20 text-center">
        <span className="rf-pulse grid h-14 w-14 place-items-center rounded-2xl bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]"><Bot className="h-7 w-7" /></span>
        <p className="mt-4 text-lg font-semibold text-white">{greeting(biz.name)}</p>
        <p className="mt-1 max-w-sm text-sm text-[var(--rf-muted)]">I&apos;m Forge, your AI SEO assistant. Run an audit of {domain || 'your site'} and I&apos;ll brief you on exactly what to fix and what it&apos;s worth.</p>
        <button onClick={onRun} disabled={status === 'loading'} className="rf-btn-primary mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{status === 'loading' ? 'Auditing…' : 'Run audit'}</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Morning brief ── */}
      <div className="rf-card rf-topline relative overflow-hidden p-5 sm:p-6">
        <div className="rf-glow pointer-events-none absolute -right-20 -top-20 h-64 w-64 opacity-40" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="rf-mono flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-faint)]"><Sparkles className="h-3.5 w-3.5" /> What&apos;s happening with {domain || 'your site'}</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">{greeting(biz.name)}</h1>
            <p className="mt-0.5 text-sm text-[var(--rf-muted)]">Here are the opportunities you should focus on today.</p>
          </div>
          <button onClick={() => setShowBiz(true)} className="rf-btn-ghost inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"><Settings2 className="h-3.5 w-3.5" /> Your numbers</button>
        </div>
        <ul className="mt-4 space-y-2">
          {brief(a, pages.length, hasBiz ? priorities!.totalRevenue : null).map((b, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--rf-card-line)] bg-white/[0.02] px-3.5 py-2.5 text-sm">
              <span className="flex items-start gap-2.5"><b.icon className={`mt-0.5 h-4 w-4 shrink-0 ${b.tone}`} /><span className="text-[var(--rf-text)]">{b.text}</span></span>
              <button onClick={() => onGo(b.section)} className="shrink-0 rf-mono text-[11px] text-[var(--rf-blue-bright)] hover:text-white">{b.cta} →</button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── AI visibility + health radar ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rf-card rf-card-hover relative overflow-hidden p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">AI Visibility Score</p>
          <div className="mt-3 flex items-center gap-6">
            <BigGauge value={ai} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--rf-text)]">{ai >= 80 ? 'Excellent — AI models will readily understand and cite this site.' : ai >= 60 ? 'Good — a few upgrades (schema, FAQs, depth) would improve machine readability.' : 'Weak structural readiness. Fix schema coverage and content structure first.'}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-[var(--rf-faint)]">How easily AI can understand and cite your content</p>
            </div>
          </div>
          {/* per-engine estimates */}
          <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {engines.map((e, i) => (
              <div key={e.name}>
                <div className="mb-1 flex items-center justify-between text-[13px]"><span className="text-[var(--rf-muted)]">{e.name}</span><span className="rf-mono text-white">{e.score}</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]" style={{ width: `${e.score}%`, animation: `rf-grow-x 0.9s cubic-bezier(0.2,0.7,0.2,1) ${i * 50}ms both`, transformOrigin: 'left' }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-4 rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-amber)]">Modeled on-page readiness estimates — derived from crawl signals, not live citation measurements</p>
        </div>

        <div className="rf-card rf-card-hover p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]"><RadarIcon className="h-4 w-4 text-[var(--rf-cyan)]" /> Website Health Radar</p>
          <div className="mt-2 flex justify-center"><HealthRadar a={a} pages={pages.length} pageSpeed={pageSpeed} /></div>
        </div>
      </div>

      {/* ── Revenue at stake ── */}
      <div className="rf-card rf-topline relative overflow-hidden p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]"><DollarSign className="h-4 w-4 text-[var(--rf-green)]" /> Revenue at stake</p>
            {hasBiz ? (
              <>
                <p className="mt-1 text-3xl font-semibold text-[var(--rf-green)]">~${priorities!.totalRevenue.toLocaleString()}<span className="text-base text-[var(--rf-faint)]">/mo</span></p>
                <p className="mt-1 text-xs text-[var(--rf-muted)]">≈ {priorities!.totalTraffic.toLocaleString()} recoverable visits/mo if today&apos;s issues are fixed.</p>
              </>
            ) : (
              <>
                <p className="mt-1 text-2xl font-semibold text-white">Enter your traffic &amp; conversion value</p>
                <p className="mt-1 text-xs text-[var(--rf-muted)]">So we can show you the real revenue impact of each improvement.</p>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{hasBiz ? 'Modeled estimate*' : 'Not calculated'}</p>
            {hasBiz && <p className="mt-1 text-xs text-[var(--rf-muted)]">Based on: {biz.monthlyVisits.toLocaleString()} visits/mo · ${biz.valuePerVisit}/visit</p>}
            <button onClick={() => setShowBiz(true)} className="mt-1 text-xs text-[var(--rf-blue-bright)] hover:text-white">{hasBiz ? 'Tune inputs →' : 'Configure →'}</button>
          </div>
        </div>
      </div>

      {/* ── Growth roadmap ── */}
      <div className="rf-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-2.5"><span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Your growth roadmap (ranked by impact)</span><span className="rf-mono text-[10px] text-[var(--rf-faint)]">{hasBiz ? 'estimates*' : ''}</span></div>
        <div className="divide-y divide-[var(--rf-card-line)]">
          {priorities!.list.slice(0, 6).map((p, i) => (
            <div key={i} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm text-[var(--rf-text)]"><SevDot s={p.severity} />{p.title}</p>
                <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">{p.category} · affects {p.affectedPages} page{p.affectedPages > 1 ? 's' : ''} · <span className="text-[var(--rf-amber)]">{p.difficulty}</span></p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {hasBiz && <span className="text-right"><span className="block rf-mono text-sm font-semibold text-[var(--rf-green)]">+${p.revenueGain.toLocaleString()}/mo</span><span className="block text-[10px] text-[var(--rf-faint)]">+{p.trafficGain.toLocaleString()} visits</span></span>}
                <span className="text-right"><span className="block text-xs text-[var(--rf-muted)]">{p.confidence}% conf.</span><span className="flex items-center gap-1 text-[10px] text-[var(--rf-faint)]"><Clock className="h-3 w-3" />{p.minutes} min</span></span>
                <button onClick={() => onGo(p.section)} className="rf-btn-primary rounded-lg px-3.5 py-1.5 text-xs font-semibold">Fix now</button>
              </div>
            </div>
          ))}
        </div>
        {hasBiz && <p className="border-t border-[var(--rf-card-line)] px-4 py-2 text-[10px] text-[var(--rf-faint)]">*Traffic &amp; revenue are modeled from your business inputs — not measured analytics.</p>}
      </div>

      {/* ── Autopilot + timeline ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Autopilot onRun={onRun} status={status} projectId={projectId} />
        <Timeline events={events} />
      </div>

      <BizModalHost open={showBiz} projectId={projectId} onClose={() => setShowBiz(false)} onSaved={setBiz} />
    </div>
  )
}

function greeting(name: string): string {
  const h = new Date().getHours()
  const base = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return name ? `${base}, ${name}.` : `${base}.`
}

function brief(a: Analytics, pages: number, revenue: number | null) {
  const items: { icon: LucideIcon; tone: string; text: string; cta: string; section: string }[] = []
  const top = a.issues.find((i) => i.severity === 'critical') ?? a.issues[0]
  if (a.severityTotals.critical > 0 && top) items.push({ icon: AlertTriangle, tone: 'text-[var(--rf-red)]', text: `${a.severityTotals.critical} high-impact issue${a.severityTotals.critical > 1 ? 's are' : ' is'} blocking rankings — top priority: “${top.title}”.`, cta: 'Prioritize', section: 'audit' })
  if (a.links.orphans.length > 0) items.push({ icon: Network, tone: 'text-[var(--rf-amber)]', text: `${a.links.orphans.length} pages are undiscovered — linking them could improve visibility.`, cta: 'Connect', section: 'links' })
  const schemaPct = pages ? Math.round((a.totals.pagesWithSchema / pages) * 100) : 0
  if (schemaPct < 70) items.push({ icon: Code2, tone: 'text-[var(--rf-blue-bright)]', text: `Schema coverage is only ${schemaPct}% — structured data is the fastest AI-visibility win available.`, cta: 'Add schema', section: 'schema' })
  if (a.totals.nonIndexable > 0) items.push({ icon: ShieldCheck, tone: 'text-[var(--rf-amber)]', text: `${a.totals.nonIndexable} crawled page${a.totals.nonIndexable > 1 ? 's' : ''} can't rank at all (noindex or errors).`, cta: 'Review', section: 'indexability' })
  if (revenue != null) items.push({ icon: DollarSign, tone: 'text-[var(--rf-green)]', text: `I estimate ~$${revenue.toLocaleString()}/mo of recoverable value in today's fix list.*`, cta: 'See plan', section: 'audit' })
  return items.slice(0, 4)
}

function BigGauge({ value }: { value: number }) {
  const size = 140; const r = size / 2 - 12; const c = 2 * Math.PI * r
  const [shown, setShown] = useState(0)
  useEffect(() => { let raf = 0; const t0 = performance.now(); const tick = (t: number) => { const p = Math.min(1, (t - t0) / 900); setShown(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf) }, [value])
  const offset = c - (shown / 100) * c
  const label = value >= 80 ? 'Excellent' : value >= 60 ? 'Good' : value >= 40 ? 'Needs work' : 'Critical'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,173,224,0.12)" strokeWidth="12" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#rfAI)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
        <defs><linearGradient id="rfAI" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7c5cff" /><stop offset="50%" stopColor="#2f6bff" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><span className="text-4xl font-semibold text-white">{shown}</span><span className="block text-[10px] font-medium uppercase tracking-wider text-[var(--rf-cyan)]">{label}</span></div></div>
    </div>
  )
}

function HealthRadar({ a, pages, pageSpeed }: { a: Analytics; pages: number; pageSpeed: PageSpeed | null }) {
  const orphanPct = pages ? clamp(100 - (a.links.orphans.length / pages) * 100) : 50
  const indexPct = pages ? clamp(((pages - a.totals.nonIndexable) / pages) * 100) : 50
  const perf = pageSpeed?.available && pageSpeed.performance != null ? pageSpeed.performance : Math.round((a.categories.technical + 40) / 2)
  const axes: [string, number][] = [
    ['Technical', a.categories.technical], ['Content', a.categories.content],
    ['Schema', a.categories.schema], ['AI Search', a.categories.ai],
    ['Links', orphanPct], ['Indexability', indexPct],
    ['Performance', perf], ['UX', clamp((a.categories.technical + a.categories.content) / 2)],
  ]
  const size = 240; const cx = size / 2; const cy = size / 2; const R = size / 2 - 34
  const pt = (i: number, v: number) => { const ang = (Math.PI * 2 * i) / axes.length - Math.PI / 2; const rr = (v / 100) * R; return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)] }
  const poly = axes.map(([, v], i) => pt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ')
  const gridPoly = (frac: number) => axes.map((_, i) => pt(i, frac * 100).map((n) => n.toFixed(1)).join(',')).join(' ')
  return (
    <svg viewBox={`-34 0 ${size + 68} ${size}`} className="h-64 w-80">
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={gridPoly(f)} fill="none" stroke="rgba(148,173,224,0.12)" strokeWidth="1" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(148,173,224,0.10)" strokeWidth="1" /> })}
      <polygon points={poly} fill="rgba(47,107,255,0.25)" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" style={{ transformOrigin: 'center', animation: 'rf-radar-in 0.9s cubic-bezier(0.2,0.7,0.2,1) both' }} />
      {axes.map(([label, v], i) => { const [x, y] = pt(i, 118); return <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(159,176,208,0.9)" fontSize="9.5" fontFamily="inherit">{label} <tspan fill="#fff" fontWeight="600">{Math.round(v)}</tspan></text> })}
      <style>{`@keyframes rf-radar-in { from { transform: scale(0.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </svg>
  )
}

function SevDot({ s }: { s: Severity }) {
  const c = s === 'critical' ? 'bg-[var(--rf-red)]' : s === 'warning' ? 'bg-[var(--rf-amber)]' : 'bg-[var(--rf-blue-bright)]'
  return <span className={`h-2 w-2 shrink-0 rounded-full ${c}`} />
}

const AUTOMATIONS: { label: string; ready: boolean }[] = [
  { label: 'Full-site crawl & scoring', ready: true },
  { label: 'Schema injection (via WordPress)', ready: true },
  { label: 'Title & meta optimization (via WordPress)', ready: true },
  { label: 'Priority & revenue re-ranking', ready: true },
  { label: 'Daily scheduled crawls', ready: false },
  { label: 'Automatic morning summaries', ready: false },
  { label: 'Competitor monitoring', ready: false },
  { label: 'Auto content generation', ready: false },
]

function Autopilot({ onRun, status, projectId }: { onRun: () => void; status: string; projectId: string }) {
  const [on, setOn] = useState(false)
  const key = `rf_autopilot_${projectId}`
  useEffect(() => { try { setOn(localStorage.getItem(key) === '1') } catch { /* ignore */ } }, [key])
  const toggle = () => { const v = !on; setOn(v); try { localStorage.setItem(key, v ? '1' : '0') } catch { /* ignore */ } }
  return (
    <div className="rf-card rf-topline overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]"><Power className={`h-4 w-4 ${on ? 'text-[var(--rf-green)]' : 'text-[var(--rf-faint)]'}`} /> SEO Autopilot</span>
        <button onClick={toggle} aria-pressed={on} className={`relative h-7 w-14 rounded-full transition-colors ${on ? 'bg-[var(--rf-green)]/80' : 'bg-white/[0.08]'}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[30px]' : 'left-0.5'}`} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-[var(--rf-muted)]">{on ? 'Autopilot is armed. Every deploy still requires your approval — nothing ships without you.' : 'Turn on to keep audits, priorities, and prepared fixes continuously up to date.'}</p>
        <ul className="mt-3 space-y-1.5">
          {AUTOMATIONS.map((t) => (
            <li key={t.label} className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-2 ${t.ready ? 'text-[var(--rf-text)]' : 'text-[var(--rf-faint)]'}`}>{t.ready ? <Check className="h-3.5 w-3.5 text-[var(--rf-green)]" /> : <CalendarClock className="h-3.5 w-3.5" />}{t.label}</span>
              {!t.ready && <span className="rf-mono text-[9px] uppercase tracking-wider text-[var(--rf-faint)]">needs scheduler</span>}
            </li>
          ))}
        </ul>
        {on && <button onClick={onRun} disabled={status === 'loading'} className="rf-btn-primary mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60"><Rocket className="h-3.5 w-3.5" /> Run cycle now</button>}
      </div>
    </div>
  )
}

const EVENT_ICON: Record<RfEvent['icon'], LucideIcon> = { audit: Gauge, deploy: Rocket, fix: Check }

function Timeline({ events }: { events: RfEvent[] }) {
  return (
    <div className="rf-card overflow-hidden">
      <div className="border-b border-[var(--rf-card-line)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Activity</div>
      <div className="p-4">
        {events.length === 0 ? <p className="text-sm text-[var(--rf-muted)]">No activity yet — run an audit or deploy a fix and it shows up here.</p> : (
          <ol className="relative space-y-4 border-l border-[var(--rf-card-line)] pl-5">
            {events.slice(0, 8).map((e, i) => { const Icon = EVENT_ICON[e.icon] ?? Sparkles; return (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] grid h-4 w-4 place-items-center rounded-full bg-[var(--rf-blue)]/20"><Icon className="h-2.5 w-2.5 text-[var(--rf-blue-bright)]" /></span>
                <p className="text-sm text-[var(--rf-text)]">{e.text}</p>
                <p className="text-[10px] text-[var(--rf-faint)]">{timeAgo(e.at)}</p>
              </li>) })}
          </ol>
        )}
      </div>
    </div>
  )
}

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

function BizModalHost({ open, projectId, onClose, onSaved }: { open: boolean; projectId: string; onClose: () => void; onSaved: (b: Biz) => void }) {
  const [b, setB] = useState<Biz>(DEFAULT_BIZ)
  useEffect(() => { if (open) setB(readBiz(projectId)) }, [open, projectId])
  if (!open) return null
  const save = () => { try { localStorage.setItem(bizKey(projectId), JSON.stringify(b)) } catch { /* ignore */ } onSaved(b); onClose() }
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="rf-card rf-topline w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3"><span className="text-sm font-semibold text-white">Your numbers</span><button onClick={onClose} className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg"><X className="h-4 w-4" /></button></div>
        <div className="space-y-3 p-4">
          <p className="text-xs text-[var(--rf-muted)]">These drive every traffic &amp; revenue estimate. They&apos;re stored in your browser only.</p>
          <label className="block text-xs text-[var(--rf-muted)]">Your name (for the greeting)<input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} className="rf-card mt-1 w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" placeholder="Tyler" /></label>
          <label className="block text-xs text-[var(--rf-muted)]">Estimated monthly organic visits<input type="number" min={0} value={b.monthlyVisits || ''} onChange={(e) => setB({ ...b, monthlyVisits: Math.max(0, Number(e.target.value)) })} className="rf-card mt-1 w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" placeholder="1000" /></label>
          <label className="block text-xs text-[var(--rf-muted)]">Value per visit ($)<input type="number" min={0} step={0.5} value={b.valuePerVisit || ''} onChange={(e) => setB({ ...b, valuePerVisit: Math.max(0, Number(e.target.value)) })} className="rf-card mt-1 w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" placeholder="2" /></label>
          <button onClick={save} className="rf-btn-primary w-full rounded-xl px-4 py-2.5 text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  )
}
