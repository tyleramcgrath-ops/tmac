'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  X,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  Radar,
  LineChart,
  Bot,
  Swords,
  PenTool,
  MapPin,
  FileBarChart,
  Check,
  AlertTriangle,
  Gauge,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

/* ================================================================== */
/* Context — lets any button open the product tour                     */
/* ================================================================== */

interface DemoState {
  open: (chapter?: number) => void
}
const DemoContext = createContext<DemoState | null>(null)

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within <DemoProvider>')
  return ctx
}

const CHAPTER_DURATION = 7000

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState(0)

  const open = useCallback((chapter = 0) => {
    setActive(chapter)
    setIsOpen(true)
  }, [])

  // Deep link: ?demo=<chapter-id> (or #demo) opens the tour on that chapter.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('demo')
    if (id) {
      const idx = CHAPTERS.findIndex((c) => c.id === id)
      open(idx >= 0 ? idx : 0)
    } else if (window.location.hash === '#demo') {
      open(0)
    }
  }, [open])

  // Keep the URL shareable while the tour is open; clean it up on close.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (isOpen) {
      url.searchParams.set('demo', CHAPTERS[active]?.id ?? 'overview')
      url.hash = ''
    } else {
      url.searchParams.delete('demo')
    }
    window.history.replaceState(null, '', url.toString())
  }, [isOpen, active])

  return (
    <DemoContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <DemoModal
          active={active}
          setActive={setActive}
          onClose={() => setIsOpen(false)}
        />
      )}
    </DemoContext.Provider>
  )
}

/* ================================================================== */
/* Chapters                                                            */
/* ================================================================== */

const CHAPTERS: {
  id: string
  label: string
  blurb: string
  icon: LucideIcon
  planned?: boolean
  render: () => ReactNode
}[] = [
  {
    id: 'overview',
    label: 'Command Center',
    blurb: 'How your audit scores and fix lists come together in one dashboard.',
    icon: LayoutDashboard,
    render: () => <ChapterOverview />,
  },
  {
    id: 'audit',
    label: 'Technical Audit',
    blurb: 'Full-site crawl (up to 300 pages): Core Web Vitals, indexability, and severity-scored issues.',
    icon: Radar,
    render: () => <ChapterAudit />,
  },
  {
    id: 'ranks',
    label: 'Rank Check',
    blurb: 'Point-in-time Google positions today. Tracking over time is on the roadmap.',
    icon: LineChart,
    render: () => <ChapterRanks />,
  },
  {
    id: 'ai',
    label: 'AI Citation Tracking',
    blurb: 'Roadmap concept — today, audits score AI readiness; citation tracking is not built yet.',
    icon: Bot,
    planned: true,
    render: () => <ChapterAI />,
  },
  {
    id: 'war',
    label: 'Competitor Overlap',
    blurb: 'Atlas compares your site against a tracked competitor across six real, evidence-graded overlap dimensions.',
    icon: Swords,
    render: () => <ChapterWarRoom />,
  },
  {
    id: 'content',
    label: 'Content Analysis',
    blurb: 'Audit-based content scoring, with Forge drafting title & meta fixes you approve.',
    icon: PenTool,
    render: () => <ChapterContent />,
  },
  {
    id: 'local',
    label: 'Local SEO Heatmap',
    blurb: 'Roadmap concept — geo-grid rankings and GBP health are not built yet.',
    icon: MapPin,
    planned: true,
    render: () => <ChapterLocal />,
  },
  {
    id: 'report',
    label: 'Reports & Export',
    blurb: 'Export any audit as JSON or a print-ready PDF. White-label branding is on the roadmap.',
    icon: FileBarChart,
    render: () => <ChapterReport />,
  },
]

/* ================================================================== */
/* Modal shell                                                         */
/* ================================================================== */

function DemoModal({
  active,
  setActive,
  onClose,
}: {
  active: number
  setActive: (n: number) => void
  onClose: () => void
}) {
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const chapter = CHAPTERS[active]

  // Esc to close, lock scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setActive((active + 1) % CHAPTERS.length)
      if (e.key === 'ArrowLeft')
        setActive((active - 1 + CHAPTERS.length) % CHAPTERS.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active, setActive, onClose])

  // Autoplay progress.
  useEffect(() => {
    setProgress(0)
    if (!playing) return
    const start = Date.now()
    const id = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / CHAPTER_DURATION) * 100)
      setProgress(pct)
      if (pct >= 100) setActive((active + 1) % CHAPTERS.length)
    }, 60)
    return () => clearInterval(id)
  }, [active, playing, setActive])

  const go = (n: number) => setActive((n + CHAPTERS.length) % CHAPTERS.length)

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="rf-card rf-topline flex h-full max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">
                RankForge AI — Product Tour
              </p>
              <p className="hidden text-[11px] text-[var(--rf-faint)] sm:block">
                {chapter.blurb}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              {playing ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Play
                </>
              )}
            </button>
            <button
              aria-label="Close demo"
              onClick={onClose}
              className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Persistent disclosure — always visible while the tour is open */}
        <div className="border-b border-[var(--rf-card-line)] bg-[var(--rf-amber)]/10 px-4 py-2 text-center sm:px-5">
          <p className="rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-amber)]">
            Interactive preview with sample data — not live measurements
          </p>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* chapter rail */}
          <nav className="hidden w-60 shrink-0 overflow-y-auto border-r border-[var(--rf-card-line)] p-3 md:block">
            {CHAPTERS.map((c, i) => {
              const Icon = c.icon
              const isActive = i === active
              return (
                <button
                  key={c.id}
                  onClick={() => go(i)}
                  className={`group relative mb-1 flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-white/[0.06] text-white'
                      : 'text-[var(--rf-muted)] hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${
                      isActive
                        ? 'border-[var(--rf-blue-bright)]/50 bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]'
                        : 'border-[var(--rf-card-line)] text-[var(--rf-faint)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.label}
                  </span>
                  {c.planned && (
                    <span className="rf-mono shrink-0 rounded border border-[var(--rf-card-line)] px-1 py-0.5 text-[8px] uppercase tracking-wider text-[var(--rf-faint)]">
                      Planned
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                      <span
                        className="block h-full bg-gradient-to-r from-[var(--rf-blue-bright)] to-[var(--rf-cyan)]"
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* mobile chapter strip */}
          <div className="flex w-full flex-col min-h-0">
            <div className="flex gap-2 overflow-x-auto border-b border-[var(--rf-card-line)] p-2 md:hidden">
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => go(i)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    i === active
                      ? 'bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]'
                      : 'text-[var(--rf-muted)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* stage */}
            <div
              key={chapter.id}
              className="rf-demo-stage min-h-0 flex-1 overflow-y-auto bg-[#070b14] p-4 sm:p-6"
            >
              <div className="mb-4 md:hidden">
                <h3 className="text-base font-semibold text-white">
                  {chapter.label}
                </h3>
                <p className="text-xs text-[var(--rf-muted)]">{chapter.blurb}</p>
              </div>
              {chapter.planned && (
                <div className="mb-4 rounded-lg border border-dashed border-[var(--rf-card-line-strong)] bg-white/[0.02] px-3 py-2 text-center">
                  <p className="rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">
                    On the roadmap — concept preview, not a shipped feature
                  </p>
                </div>
              )}
              {chapter.render()}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--rf-card-line)] px-4 py-3">
              <button
                onClick={() => go(active - 1)}
                className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="rf-mono text-[11px] text-[var(--rf-faint)]">
                {active + 1} / {CHAPTERS.length}
              </span>
              {active === CHAPTERS.length - 1 ? (
                <a
                  href="#scan"
                  onClick={onClose}
                  className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  Start Free Scan <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => go(active + 1)}
                  className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Reusable mock UI                                                    */
/* ================================================================== */

function Panel({
  title,
  right,
  children,
  className = '',
}: {
  title?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rf-card overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">
            {title}
          </span>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

function Spark({ points, color = 'var(--rf-cyan)' }: { points: number[]; color?: string }) {
  const w = 120
  const h = 34
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - min) / span) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-24" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Ring({ value, size = 120, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 9
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,173,224,0.12)" strokeWidth="9" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#rfDemoRing)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
        <defs>
          <linearGradient id="rfDemoRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f6bff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="text-2xl font-semibold text-white">{value}</span>
          {label && <span className="block text-[9px] uppercase tracking-wider text-[var(--rf-faint)]">{label}</span>}
        </div>
      </div>
    </div>
  )
}

function MetricStat({
  label,
  value,
  delta,
  tone = 'green',
  spark,
}: {
  label: string
  value: string
  delta?: string
  tone?: keyof typeof TONE
  spark?: number[]
}) {
  return (
    <div className="rf-card p-3">
      <p className="text-[11px] text-[var(--rf-faint)]">{label}</p>
      <div className="mt-1 flex items-end justify-between">
        <span className="text-xl font-semibold text-white">{value}</span>
        {spark && <Spark points={spark} />}
      </div>
      {delta && <p className={`mt-1 text-[11px] font-medium ${TONE[tone]}`}>{delta}</p>}
    </div>
  )
}

const TONE = {
  green: 'text-[var(--rf-green)]',
  cyan: 'text-[var(--rf-cyan)]',
  amber: 'text-[var(--rf-amber)]',
  blue: 'text-[var(--rf-blue-bright)]',
  red: 'text-[var(--rf-red)]',
  violet: 'text-[var(--rf-violet)]',
}

/* ================================================================== */
/* Chapter 1 — Command Center                                          */
/* ================================================================== */

// Stat cards below mirror exactly what a real scan's summary contains
// (lib/foundation/types.ts Scan.summary — the same numbers the Audit tab
// shows: pagesCrawled, urlsDiscovered, blockedCount, siteScore, critical/
// warning/info counts derived from the same recommendation list a real
// project sees, so this demo never claims a stat the backend can't produce.
function ChapterOverview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricStat label="Site score" value="76/100" delta="sample" tone="green" spark={[52, 56, 58, 63, 67, 70, 73, 76]} />
        <MetricStat label="Pages crawled" value="284/300" delta="sample" tone="green" spark={[80, 120, 160, 190, 220, 250, 270, 284]} />
        <MetricStat label="Blocked (unknown)" value="3" delta="sample" tone="amber" spark={[6, 5, 5, 4, 4, 3, 3, 3]} />
        <MetricStat label="Critical issues" value="12" delta="sample" tone="red" spark={[22, 20, 18, 16, 15, 14, 13, 12]} />
        <MetricStat label="Warning issues" value="34" delta="sample" tone="amber" spark={[48, 45, 42, 40, 38, 36, 35, 34]} />
        <MetricStat label="Info issues" value="19" delta="sample" tone="blue" spark={[24, 23, 22, 21, 20, 20, 19, 19]} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Site score, most recent scans" className="lg:col-span-2" right={<span className="rf-mono text-[11px] text-[var(--rf-faint)]">sample</span>}>
          <div className="flex h-40 items-end gap-1.5">
            {[34, 40, 38, 46, 52, 49, 58, 63, 60, 70, 68, 77, 82, 79, 88, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-[var(--rf-blue)]/30 to-[var(--rf-cyan)]" style={{ height: `${h}%` }} />
            ))}
          </div>
        </Panel>
        <Panel title="Recent activity — sample">
          <ul className="space-y-3 text-sm">
            {[
              ['scan complete — 284 pages crawled', 'green'],
              ['recommendations refreshed (12 critical, 34 warning)', 'cyan'],
              ['title + meta fix deployed to WordPress, verified', 'green'],
              ['automatic re-audit scheduled — weekly', 'blue'],
            ].map(([t, c], i) => (
              <li key={i} className="flex items-start gap-2 text-[var(--rf-muted)]">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c === 'green' ? 'bg-[var(--rf-green)]' : c === 'cyan' ? 'bg-[var(--rf-cyan)]' : 'bg-[var(--rf-blue-bright)]'}`} />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Chapter 2 — Technical Audit                                         */
/* ================================================================== */

// The four category scores are the real ones the crawler computes per page —
// scoreTechnical/scoreContent/scoreSchema/scoreAiReadiness in
// app/api/seo-scan/analyze.ts, rolled up into `overall` — not Core Web
// Vitals (RankForge doesn't run Lighthouse; there's no LCP/CLS/INP in a real
// scan). Every issue below is a real, verbatim title buildFixes() generates.
function ChapterAudit() {
  const categories: [string, string, keyof typeof TONE][] = [
    ['Technical', '82', 'green'],
    ['Content', '68', 'amber'],
    ['Schema', '54', 'amber'],
    ['AI Readiness', '71', 'cyan'],
  ]
  const issues: [string, string, keyof typeof TONE][] = [
    ['Fix mixed (http://) content on an HTTPS page', 'Critical', 'red'],
    ['Add an H1 heading', 'Critical', 'red'],
    ['Title is 84 chars — aim for 30–60', 'Warning', 'amber'],
    ['Thin content (240 words) — expand to 600+', 'Warning', 'amber'],
    ['Add structured data (JSON-LD) — none found', 'Warning', 'amber'],
    ['Add an FAQ section + FAQPage schema for AI visibility', 'Info', 'blue'],
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map(([k, v, t]) => (
          <div key={k} className="rf-card p-3 text-center">
            <Gauge className={`mx-auto h-4 w-4 ${TONE[t]}`} />
            <p className="mt-1 text-lg font-semibold text-white">{v}</p>
            <p className="text-[11px] text-[var(--rf-faint)]">{k}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Panel title="Crawl summary">
          <ul className="space-y-2.5 text-sm">
            {[
              ['Pages crawled', '284 / 300'],
              ['URLs discovered', '311'],
              ['Blocked (unknown)', '3'],
              ['Site score', '76 / 100'],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="text-[var(--rf-muted)]">{k}</span>
                <span className="rf-mono font-medium text-white">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Issues by severity">
          <ul className="space-y-1.5">
            {issues.map(([t, sev, tone], i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-[var(--rf-text)]">
                  <AlertTriangle className={`h-3.5 w-3.5 ${TONE[tone]}`} /> {t}
                </span>
                <span className={`rf-mono text-[11px] ${TONE[tone]}`}>{sev}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Chapter 3 — Rank Tracking                                           */
/* ================================================================== */

// Columns match the real /api/rankings response exactly: { keyword, position,
// url, topResult }. No search volume, SERP-feature, or trend data is
// returned by that endpoint (it queries live Google search results via
// SERPAPI_KEY for the domain's current position — nothing more) so none of
// that is shown here.
function ChapterRanks() {
  const rows: [string, number | null, string, string][] = [
    ['enterprise crm software', 3, '/platform/enterprise', 'salesforce.com'],
    ['best crm for startups', 1, '/', '(your page)'],
    ['crm pricing comparison', 7, '/pricing', 'hubspot.com'],
    ['ai crm tools', 5, '/features/ai', 'zoho.com'],
    ['sales pipeline software', null, '—', 'pipedrive.com'],
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricStat label="Keywords checked" value="5" delta="sample" tone="cyan" />
        <MetricStat label="Avg. position" value="4.0" delta="sample" tone="green" />
        <MetricStat label="Not ranking (top 100)" value="1" delta="sample" tone="amber" />
      </div>
      <Panel title="Keyword positions — point-in-time check" right={<span className="rf-mono text-[11px] text-[var(--rf-faint)]">on demand</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--rf-faint)]">
                <th className="pb-2 font-medium">Keyword</th>
                <th className="pb-2 font-medium">Position</th>
                <th className="pb-2 font-medium">Your ranking URL</th>
                <th className="pb-2 text-right font-medium">#1 result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rf-card-line)]">
              {rows.map(([kw, pos, url, top]) => (
                <tr key={kw}>
                  <td className="py-2.5 pr-3 text-[var(--rf-text)]">{kw}</td>
                  <td className="py-2.5 pr-3 rf-mono font-semibold text-white">{pos ? `#${pos}` : 'not in top 100'}</td>
                  <td className="py-2.5 pr-3 text-[var(--rf-muted)]">{url}</td>
                  <td className="py-2.5 text-right text-[var(--rf-muted)]">{top}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rf-mono mt-3 text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">
          A point-in-time Google check via SERP API — re-run it any time to see
          today&apos;s positions. History/trend tracking over time is on the roadmap.
        </p>
      </Panel>
    </div>
  )
}

/* ================================================================== */
/* Chapter 4 — AI Search Visibility                                    */
/* ================================================================== */

function ChapterAI() {
  const engines: [string, number, string][] = [
    ['ChatGPT', 82, 'Cited in 41 prompts'],
    ['Google AI Overviews', 76, 'Featured in 28 SERPs'],
    ['Perplexity', 69, 'Source on 33 answers'],
    ['Gemini', 58, 'Cited in 19 prompts'],
    ['Bing Copilot', 64, 'Linked in 22 answers'],
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Panel title="AI Visibility Score">
        <div className="flex flex-col items-center py-2">
          <Ring value={71} label="/ 100" />
          <p className="mt-3 text-xs text-[var(--rf-green)]">▲ 22 pts this month</p>
        </div>
      </Panel>
      <Panel title="Citations by engine">
        <div className="space-y-3.5">
          {engines.map(([name, score, note], i) => (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-white"><Bot className="h-4 w-4 text-[var(--rf-cyan)]" />{name}</span>
                <span className="rf-mono text-[var(--rf-muted)]">{note} · <span className="text-white">{score}</span></span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]" style={{ width: `${score}%`, animation: `rf-grow-x 0.9s cubic-bezier(0.2,0.7,0.2,1) ${i * 80}ms both` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ================================================================== */
/* Chapter 5 — Competitor War Room                                     */
/* ================================================================== */

// Mirrors what Atlas' CompetitorOverlap actually computes from BOTH sites'
// real crawls (lib/foundation/external/competitors.ts): six overlap
// dimensions, each carrying its own evidence grade — Observed (both sites
// crawled successfully), Estimated (inferred, not directly measured), or
// Unavailable (couldn't be computed, e.g. no backlink provider connected).
// There is no per-keyword "your page vs the SERP top 10" signal diff built —
// competitor intelligence works at the domain level.
function ChapterWarRoom() {
  const rows: [string, number, 'observed' | 'estimated' | 'unavailable'][] = [
    ['Topic overlap', 62, 'observed'],
    ['Service overlap', 48, 'observed'],
    ['Entity overlap', 55, 'observed'],
    ['Content overlap', 40, 'observed'],
    ['Business overlap', 71, 'estimated'],
    ['Authority overlap', 0, 'unavailable'],
  ]
  const gradeLabel = { observed: 'Observed', estimated: 'Estimated', unavailable: 'Unavailable' } as const
  const gradeTone = { observed: 'green', estimated: 'amber', unavailable: 'red' } as const
  return (
    <Panel title="Atlas — competitor overlap vs acme-competitor.com">
      <div className="space-y-3.5">
        {rows.map(([dim, pct, grade]) => (
          <div key={dim}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-white">{dim}</span>
              <span className="flex items-center gap-2">
                <span className={`rf-mono text-[10px] ${TONE[gradeTone[grade]]}`}>{gradeLabel[grade]}</span>
                <span className="rf-mono text-white">{grade === 'unavailable' ? '—' : `${pct}%`}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={`h-full rounded-full ${grade === 'unavailable' ? 'bg-white/[0.06]' : 'bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]'}`}
                style={{ width: grade === 'unavailable' ? '100%' : `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--rf-muted)]">
        Authority overlap needs a backlink provider connected for both sites — shown honestly as
        unavailable, never guessed. (Sample overlap for one tracked competitor.)
      </p>
    </Panel>
  )
}

/* ================================================================== */
/* Chapter 6 — Content Optimization                                    */
/* ================================================================== */

// The content score is the real scoreContent() category from a scan. The
// checklist mirrors what keywordUsage() actually checks per page (title/H1/
// first-100-words/meta-description placement) — the same checks Forge's
// title & meta rewrites target. There's no readability grade or auto-
// generated outline in the real engine, so those aren't shown.
function ChapterContent() {
  const checks: [string, boolean][] = [
    ['Keyword in title tag', true],
    ['Keyword in H1', true],
    ['Keyword in opening 100 words', false],
    ['Keyword in meta description', false],
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Panel title="Content score">
        <div className="flex flex-col items-center py-2">
          <Ring value={68} label="of 100" />
          <p className="mt-3 text-center text-xs text-[var(--rf-muted)]">2 of 4 keyword placements missing</p>
          <div className="mt-3 w-full space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-[var(--rf-faint)]">Word count</span><span className="text-white">240 words</span></div>
            <div className="flex justify-between"><span className="text-[var(--rf-faint)]">Open Graph tags</span><span className="text-[var(--rf-red)]">Missing</span></div>
            <div className="flex justify-between"><span className="text-[var(--rf-faint)]">FAQ section</span><span className="text-amber-300">Not found</span></div>
          </div>
        </div>
      </Panel>
      <Panel title="Keyword targeting — “sales pipeline software”">
        <div className="flex flex-wrap gap-2">
          {checks.map(([t, has]) => (
            <span key={t} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${has ? 'bg-[var(--rf-green)]/10 text-[var(--rf-green)]' : 'border border-[var(--rf-card-line-strong)] text-[var(--rf-muted)]'}`}>
              {has ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-[var(--rf-amber)]" />}
              {t}
            </span>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] p-3">
          <p className="text-xs font-semibold text-white">Forge-drafted fix</p>
          <p className="mt-2 text-xs text-[var(--rf-muted)]">
            Rewrites the title and meta description to include the target keyword — you review
            and approve before anything deploys to WordPress.
          </p>
        </div>
      </Panel>
    </div>
  )
}

/* ================================================================== */
/* Chapter 7 — Local SEO Heatmap                                       */
/* ================================================================== */

function ChapterLocal() {
  // 7x7 rank grid — lower is better.
  const grid = [
    [1, 1, 2, 2, 3, 4, 5], [1, 1, 2, 3, 3, 4, 6], [2, 2, 1, 2, 3, 5, 7],
    [2, 3, 2, 1, 2, 4, 6], [3, 3, 3, 2, 2, 3, 5], [4, 5, 4, 3, 3, 4, 6], [6, 7, 5, 4, 5, 6, 8],
  ]
  const color = (n: number) =>
    n <= 1 ? 'bg-[var(--rf-green)]' : n <= 3 ? 'bg-[var(--rf-cyan)]/80' : n <= 5 ? 'bg-[var(--rf-amber)]/80' : 'bg-[var(--rf-red)]/70'
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
      <Panel title="Rank heatmap — “coffee shop near me”" right={<span className="rf-mono text-[11px] text-[var(--rf-faint)]">7×7 geo grid</span>}>
        <div className="mx-auto grid w-fit grid-cols-7 gap-1.5">
          {grid.flat().map((n, i) => (
            <span key={i} className={`grid h-9 w-9 place-items-center rounded-md text-xs font-semibold text-[#04101f] ${color(n)}`}>{n}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[var(--rf-faint)]">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[var(--rf-green)]" /> Top 1</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[var(--rf-cyan)]/80" /> 2–3</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[var(--rf-amber)]/80" /> 4–5</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[var(--rf-red)]/70" /> 6+</span>
        </div>
      </Panel>
      <Panel title="Google Business Profile">
        <ul className="space-y-2.5 text-sm">
          {[
            ['Avg. map rank', '2.4', 'green'],
            ['Reviews', '418 (4.8★)', 'green'],
            ['Review velocity', '+22/mo', 'green'],
            ['Citations', '94% consistent', 'amber'],
            ['Photos', '+12 this week', 'cyan'],
          ].map(([k, v, t]) => (
            <li key={k} className="flex justify-between">
              <span className="text-[var(--rf-muted)]">{k}</span>
              <span className={`rf-mono font-medium ${TONE[t as keyof typeof TONE]}`}>{v}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* ================================================================== */
/* Chapter 8 — White-Label Report                                      */
/* ================================================================== */

function ChapterReport() {
  return (
    <div className="space-y-4">
      <Panel
        title="Audit report — Acme Co."
        right={<span className="rf-mono rounded bg-white/[0.05] px-2 py-0.5 text-[10px] text-[var(--rf-muted)]">JSON export · print/PDF</span>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rf-card p-3 text-center"><p className="text-[11px] text-[var(--rf-faint)]">Site score</p><p className="mt-1 text-xl font-semibold text-[var(--rf-green)]">76/100</p></div>
          <div className="rf-card p-3 text-center"><p className="text-[11px] text-[var(--rf-faint)]">Pages crawled</p><p className="mt-1 text-xl font-semibold text-[var(--rf-blue-bright)]">284</p></div>
          <div className="rf-card p-3 text-center"><p className="text-[11px] text-[var(--rf-faint)]">Critical + warning</p><p className="mt-1 text-xl font-semibold text-[var(--rf-cyan)]">46</p></div>
        </div>
        <div className="mt-4 flex h-24 items-end gap-1.5">
          {[30, 38, 35, 48, 55, 52, 64, 70, 68, 80, 84, 90].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[var(--rf-blue)]/30 to-[var(--rf-cyan)]" style={{ height: `${h}%` }} />
          ))}
        </div>
      </Panel>

      <Panel title="Prioritized fix list">
        <ul className="space-y-1.5">
          {[
            ['Fix mixed (http://) content on an HTTPS page', 'Critical', 'red'],
            ['Add an H1 heading', 'Critical', 'red'],
            ['Thin content (240 words) — expand to 600+', 'Warning', 'amber'],
            ['Only 3 internal links — add contextual links', 'Warning', 'amber'],
            ['Add BreadcrumbList schema', 'Info', 'blue'],
          ].map(([t, sev, tone], i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-[var(--rf-text)]"><Check className="h-3.5 w-3.5 text-[var(--rf-green)]" />{t}</span>
              <span className={`rf-mono text-[11px] ${TONE[tone as keyof typeof TONE]}`}>{sev}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
