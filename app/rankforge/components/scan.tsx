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
  Loader2,
  Search,
  Check,
  AlertTriangle,
  Info,
  ArrowRight,
  Lock,
  Gauge,
  Swords,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types (mirror the /api/seo-scan response)                           */
/* ------------------------------------------------------------------ */

type Severity = 'critical' | 'warning' | 'info'

interface FixItem {
  severity: Severity
  category: string
  title: string
}
interface CategoryScore {
  key: string
  label: string
  score: number
  detail?: string
}
interface PageSpeed {
  available: boolean
  performance: number | null
  lcpMs: number | null
  cls: number | null
  strategy: string
  error?: string
}
interface CompetitorRow {
  url: string
  title: string
  wordCount: number
  internalLinks: number
  schemaCount: number
}
interface Competitors {
  available: boolean
  keyword: string
  yours: { wordCount: number; internalLinks: number; schemaCount: number }
  median: { wordCount: number; internalLinks: number; schemaCount: number }
  results: CompetitorRow[]
  note?: string
}
export interface ScanResult {
  url: string
  finalUrl: string
  fetchedAt: string
  keyword: string | null
  overall: number
  categories: CategoryScore[]
  pageSpeed: PageSpeed
  competitors: Competitors | null
  backlinks: { available: boolean; note?: string }
  metrics: {
    titleLength: number
    metaDescriptionLength: number
    h1Count: number
    h2Count: number
    wordCount: number
    images: number
    imagesMissingAlt: number
    internalLinks: number
    externalLinks: number
    schemaTypes: string[]
    https: boolean
    indexable: boolean
    hasViewport: boolean
    hasFaq: boolean
    hasOpenGraph: boolean
  }
  fixes: FixItem[]
}

type Status = 'idle' | 'loading' | 'done' | 'error'

interface ScanState {
  status: Status
  domain: string
  keyword: string
  result: ScanResult | null
  error: string | null
  runScan: (domain: string, keyword?: string) => void
  close: () => void
}

const ScanContext = createContext<ScanState | null>(null)

export function useScan() {
  const ctx = useContext(ScanContext)
  if (!ctx) throw new Error('useScan must be used within <ScanProvider>')
  return ctx
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function ScanProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('idle')
  const [domain, setDomain] = useState('')
  const [keyword, setKeyword] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runScan = useCallback(async (raw: string, kw = '') => {
    const value = raw.trim()
    if (!value) return
    setDomain(value)
    setKeyword(kw.trim())
    setStatus('loading')
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/seo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value, keyword: kw.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Scan failed. Please try again.')
        setStatus('error')
        return
      }
      setResult(data as ScanResult)
      setStatus('done')
    } catch {
      setError('Network error — please try again.')
      setStatus('error')
    }
  }, [])

  const close = useCallback(() => setStatus('idle'), [])

  return (
    <ScanContext.Provider
      value={{ status, domain, keyword, result, error, runScan, close }}
    >
      {children}
      <ScanModal />
    </ScanContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Reusable domain + keyword form (hero + final CTA)                   */
/* ------------------------------------------------------------------ */

export function ScanForm({ cta = 'Start Free SEO Scan' }: { cta?: string }) {
  const { runScan, status } = useScan()
  const [domain, setDomain] = useState('')
  const [keyword, setKeyword] = useState('')
  const loading = status === 'loading'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        runScan(domain, keyword)
      }}
      className="mx-auto max-w-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="rf-card flex flex-1 items-center gap-3 px-4 py-3 focus-within:border-[var(--rf-card-line-strong)]">
          <Search className="h-5 w-5 shrink-0 text-[var(--rf-faint)]" />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter your domain"
            aria-label="Enter your domain"
            inputMode="url"
            autoComplete="off"
            className="w-full bg-transparent text-[15px] text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rf-btn-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
            </>
          ) : (
            <>
              {cta} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      <div className="rf-card mt-2.5 flex items-center gap-3 px-4 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[var(--rf-faint)]" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Target keyword for competitor analysis (optional)"
          aria-label="Target keyword (optional)"
          autoComplete="off"
          className="w-full bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
        />
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Results modal                                                       */
/* ------------------------------------------------------------------ */

function ScanModal() {
  const { status, domain, result, error, close } = useScan()
  const open = status !== 'idle'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
      onClick={close}
    >
      <div
        className="rf-card rf-topline relative my-auto w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Search className="h-4 w-4 shrink-0 text-[var(--rf-blue-bright)]" />
            <span className="truncate text-sm font-medium text-white">
              SEO Scan · <span className="text-[var(--rf-muted)]">{domain}</span>
            </span>
          </div>
          <button
            aria-label="Close"
            onClick={close}
            className="rf-btn-ghost grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
          {status === 'loading' && <ScanLoading />}
          {status === 'error' && <ScanError message={error} />}
          {status === 'done' && result && <ScanReport result={result} />}
        </div>
      </div>
    </div>
  )
}

export function ScanLoading() {
  const steps = [
    'Fetching page & following redirects',
    'Extracting on-page SEO signals',
    'Measuring Core Web Vitals & schema',
    'Building your prioritized fix list',
  ]
  return (
    <div className="py-6 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--rf-blue-bright)]" />
      <p className="mt-4 font-medium text-white">Running your live SEO scan…</p>
      <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-2 text-sm text-[var(--rf-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--rf-cyan)]" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ScanError({ message }: { message: string | null }) {
  return (
    <div className="py-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--rf-red)]/10">
        <AlertTriangle className="h-6 w-6 text-[var(--rf-red)]" />
      </span>
      <p className="mt-4 font-medium text-white">Scan couldn’t complete</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--rf-muted)]">
        {message ?? 'Something went wrong. Please try again.'}
      </p>
    </div>
  )
}

const SEV_STYLE: Record<Severity, { dot: string; label: string; icon: typeof Info }> = {
  critical: { dot: 'text-[var(--rf-red)]', label: 'Critical', icon: AlertTriangle },
  warning: { dot: 'text-[var(--rf-amber)]', label: 'Warning', icon: AlertTriangle },
  info: { dot: 'text-[var(--rf-blue-bright)]', label: 'Improve', icon: Info },
}

const UNLOCK_KEY = 'rf_scan_unlocked'

export function ScanReport({ result }: { result: ScanResult }) {
  const m = result.metrics
  const ps = result.pageSpeed
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(UNLOCK_KEY) === '1') setUnlocked(true)
    } catch {
      /* ignore */
    }
  }, [])

  const metricChips: [string, string, boolean][] = [
    ['HTTPS', m.https ? 'Yes' : 'No', m.https],
    ['Indexable', m.indexable ? 'Yes' : 'No', m.indexable],
    ['Title', `${m.titleLength} chars`, m.titleLength >= 30 && m.titleLength <= 60],
    ['Meta desc', `${m.metaDescriptionLength} chars`, m.metaDescriptionLength >= 70 && m.metaDescriptionLength <= 160],
    ['H1', String(m.h1Count), m.h1Count === 1],
    ['Words', m.wordCount.toLocaleString(), m.wordCount >= 600],
    ['Schema', m.schemaTypes.length ? m.schemaTypes.length + ' types' : 'None', m.schemaTypes.length > 0],
    ['Internal links', String(m.internalLinks), m.internalLinks >= 5],
  ]

  return (
    <div>
      {/* score + categories */}
      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto">
          <ScoreRing value={result.overall} />
        </div>
        <div className="space-y-2.5">
          {result.categories.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[var(--rf-muted)]">
                  {c.label}
                  {c.detail && (
                    <span className="ml-1.5 text-[var(--rf-faint)]">· {c.detail}</span>
                  )}
                </span>
                <span className="rf-mono text-white">{c.score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]"
                  style={{ width: `${c.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Web Vitals */}
      {ps.available && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[var(--rf-card-line)] bg-white/[0.02] px-4 py-3">
          <span className="flex items-center gap-2 text-xs font-medium text-white">
            <Gauge className="h-4 w-4 text-[var(--rf-cyan)]" /> Core Web Vitals
            <span className="text-[var(--rf-faint)]">({ps.strategy})</span>
          </span>
          <Vital label="Performance" value={ps.performance != null ? `${ps.performance}/100` : '—'} />
          <Vital label="LCP" value={ps.lcpMs != null ? `${(ps.lcpMs / 1000).toFixed(1)}s` : '—'} />
          <Vital label="CLS" value={ps.cls != null ? ps.cls.toFixed(3) : '—'} />
        </div>
      )}

      {/* metric chips */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metricChips.map(([k, v, ok]) => (
          <div key={k} className="rf-card px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{k}</p>
            <p className={`mt-0.5 text-sm font-semibold ${ok ? 'text-[var(--rf-green)]' : 'text-[var(--rf-amber)]'}`}>
              {v}
            </p>
          </div>
        ))}
      </div>

      {/* gated section: fix list + competitor comparison */}
      {unlocked ? (
        <>
          <FixListView fixes={result.fixes} />
          <CompetitorView competitors={result.competitors} />
        </>
      ) : (
        <LeadGate result={result} onUnlock={() => setUnlocked(true)} />
      )}

      <div className="mt-6 flex flex-col items-center gap-2 border-t border-[var(--rf-card-line)] pt-5 text-center">
        <p className="text-sm text-[var(--rf-muted)]">
          Want rank tracking, AI-search visibility, and white-label reports too?
        </p>
        <a
          href="#pricing"
          className="rf-btn-primary mt-1 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          See plans <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs">
      <span className="text-[var(--rf-faint)]">{label} </span>
      <span className="rf-mono font-semibold text-white">{value}</span>
    </span>
  )
}

function FixListView({ fixes }: { fixes: FixItem[] }) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-white">
        Your prioritized fix list
        <span className="ml-2 rf-mono text-xs font-normal text-[var(--rf-faint)]">
          {fixes.length} items
        </span>
      </h4>
      {fixes.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-[var(--rf-green)]">
          <Check className="h-4 w-4" /> No major on-page issues found. Nice work.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {fixes.map((fix, i) => {
            const s = SEV_STYLE[fix.severity]
            const Icon = s.icon
            return (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2.5"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.dot}`} />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--rf-text)]">{fix.title}</p>
                  <p className="text-[11px] text-[var(--rf-faint)]">
                    {s.label} · {fix.category}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function CompetitorView({ competitors }: { competitors: Competitors | null }) {
  if (!competitors) return null
  return (
    <div className="mt-6">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Swords className="h-4 w-4 text-[var(--rf-blue-bright)]" />
        Competitor War Room
        <span className="rf-mono text-xs font-normal text-[var(--rf-faint)]">
          “{competitors.keyword}”
        </span>
      </h4>

      {!competitors.available ? (
        <p className="mt-2 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2.5 text-xs text-[var(--rf-muted)]">
          {competitors.note}
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <CompareCell
              label="Word count"
              you={competitors.yours.wordCount}
              comp={competitors.median.wordCount}
            />
            <CompareCell
              label="Internal links"
              you={competitors.yours.internalLinks}
              comp={competitors.median.internalLinks}
            />
            <CompareCell
              label="Schema types"
              you={competitors.yours.schemaCount}
              comp={competitors.median.schemaCount}
            />
          </div>
          <ul className="mt-3 space-y-1">
            {competitors.results.map((r, i) => (
              <li key={i} className="truncate text-xs text-[var(--rf-muted)]">
                <span className="rf-mono text-[var(--rf-faint)]">#{i + 1}</span>{' '}
                {r.title || r.url}{' '}
                <span className="text-[var(--rf-faint)]">
                  · {r.wordCount.toLocaleString()} words
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function CompareCell({ label, you, comp }: { label: string; you: number; comp: number }) {
  const ahead = you >= comp
  return (
    <div className="rf-card px-2 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${ahead ? 'text-[var(--rf-green)]' : 'text-[var(--rf-amber)]'}`}>
        {you.toLocaleString()}
      </p>
      <p className="text-[10px] text-[var(--rf-faint)]">top-10 med {comp.toLocaleString()}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Lead capture gate                                                   */
/* ------------------------------------------------------------------ */

function LeadGate({ result, onUnlock }: { result: ScanResult; onUnlock: () => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const critical = result.fixes.filter((f) => f.severity === 'critical').length

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          domain: result.finalUrl,
          keyword: result.keyword,
          score: result.overall,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data?.error ?? 'Please try again.')
        setBusy(false)
        return
      }
      try {
        localStorage.setItem(UNLOCK_KEY, '1')
      } catch {
        /* ignore */
      }
      onUnlock()
    } catch {
      setErr('Network error — please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="relative mt-6 overflow-hidden rounded-xl border border-[var(--rf-card-line-strong)]">
      {/* blurred teaser behind */}
      <div className="pointer-events-none select-none p-4 opacity-40 blur-[6px]" aria-hidden>
        <div className="space-y-2">
          {result.fixes.slice(0, 4).map((f, i) => (
            <div key={i} className="h-8 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(8,12,22,0.7)] px-5 text-center backdrop-blur-sm">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--rf-blue)]/15">
          <Lock className="h-5 w-5 text-[var(--rf-blue-bright)]" />
        </span>
        <p className="mt-3 text-sm font-semibold text-white">
          Unlock your full fix list — {result.fixes.length} items
          {critical > 0 && (
            <span className="text-[var(--rf-red)]"> ({critical} critical)</span>
          )}
        </p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">
          Enter your email to reveal every fix{result.keyword ? ' and the competitor comparison' : ''}.
        </p>
        <form onSubmit={submit} className="mt-4 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-label="Your email"
            className="rf-card flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rf-btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reveal fixes'}
          </button>
        </form>
        {err && <p className="mt-2 text-xs text-[var(--rf-red)]">{err}</p>}
        <p className="mt-2 text-[10px] text-[var(--rf-faint)]">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(148,173,224,0.12)" strokeWidth="11" />
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="url(#rfScanRing)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
        <defs>
          <linearGradient id="rfScanRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f6bff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="text-3xl font-semibold text-white">{value}</span>
          <span className="block text-[10px] text-[var(--rf-faint)]">SEO SCORE</span>
        </div>
      </div>
    </div>
  )
}
