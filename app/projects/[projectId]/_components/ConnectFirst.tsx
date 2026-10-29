'use client'

// Connect-first onboarding — the "beginning where you connect everything," shown
// before a project's Command Center exists. Walks the user through the real
// setup: confirm the site, run the first audit (real crawl, persisted), connect
// WordPress (optional), connect Google (optional, only when configured). Once
// the first audit lands, "Enter Command Center" opens the full dashboard.

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Zap, Globe, Radar, Plug, Check, Loader2, ArrowRight, StopCircle,
  BarChart3, Circle, type LucideIcon,
} from 'lucide-react'
import { api, ApiError, type ProjectDTO, type ScanSummary } from '../../../lib/client'
import { runCrawl } from '../../../lib/crawl-runner'
import { WordPressTab } from './WordPressTab'

// Same safety ceiling as the Command Center's "Entire site" option and the
// crawler itself (lib/engine/crawl-batch.ts HARD_CAP) — the first audit
// should cover the whole site, not stop at an arbitrary partial sample.
const ENTIRE_SITE_MAX_PAGES = 20_000

type StepState = 'todo' | 'active' | 'done'

export function ConnectFirst({ project, scans, onReload, onEnter }: {
  project: ProjectDTO; scans: ScanSummary[]; onReload: () => void; onEnter: () => void
}) {
  const hasScan = scans.some((s) => s.status === 'completed' || s.status === 'complete')
  const [open, setOpen] = useState<number>(hasScan ? 2 : 1)
  const [wpConnected, setWpConnected] = useState(false)
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)

  // Audit runner state
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [maxPages] = useState(ENTIRE_SITE_MAX_PAGES)
  const stopRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    api.listIntegrations(project.id)
      .then(({ integrations, configured }) => {
        if (cancelled) return
        setGoogleConfigured(configured)
        setGoogleConnected(integrations.some((i) => i.status === 'connected'))
      })
      .catch(() => { if (!cancelled) setGoogleConfigured(false) })
    api.getWordpress(project.id)
      .then(({ connection }) => { if (!cancelled) setWpConnected(!!connection) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [project.id])

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
      setOpen(3)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'The crawl failed.')
      setError(message)
      if (scanId) await api.failScan(project.id, scanId, message).catch(() => {})
    } finally {
      setRunning(false); setProgress('')
    }
  }, [project.id, project.domain, maxPages, running, onReload])

  const steps: { n: number; label: string; icon: LucideIcon; state: StepState }[] = [
    { n: 1, label: 'Your website', icon: Globe, state: 'done' },
    { n: 2, label: 'Run your first audit', icon: Radar, state: hasScan ? 'done' : running ? 'active' : 'todo' },
    { n: 3, label: 'Connect WordPress', icon: Plug, state: wpConnected ? 'done' : 'todo' },
    { n: 4, label: 'Connect Google', icon: BarChart3, state: googleConnected ? 'done' : 'todo' },
  ]

  return (
    <div className="rf-root relative min-h-screen bg-[var(--rf-bg)]">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/projects" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-4 w-4 text-white" strokeWidth={2.5} /></span>
            <span className="text-[15px] font-semibold text-white">RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span></span>
          </Link>
          <Link href="/projects" className="rf-mono text-xs text-[var(--rf-muted)] hover:text-white">← All projects</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="text-center">
          <p className="rf-mono text-[11px] uppercase tracking-[0.2em] text-[var(--rf-blue-bright)]">Set up {project.name}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Let&apos;s connect everything</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--rf-muted)]">Three quick steps and your AI Command Center comes alive — real audit, real fixes, real deployments. You can always change these later.</p>
        </div>

        {/* progress rail */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold ${s.state === 'done' ? 'border-[var(--rf-green)]/50 bg-[var(--rf-green)]/15 text-[var(--rf-green)]' : s.state === 'active' ? 'border-[var(--rf-blue-bright)]/50 bg-[var(--rf-blue)]/15 text-[var(--rf-blue-bright)]' : 'border-[var(--rf-card-line-strong)] text-[var(--rf-faint)]'}`}>
                {s.state === 'done' ? <Check className="h-4 w-4" /> : s.n}
              </span>
              {i < steps.length - 1 && <span className={`h-px w-8 ${s.state === 'done' ? 'bg-[var(--rf-green)]/40' : 'bg-[var(--rf-card-line-strong)]'}`} />}
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {/* Step 1 — site */}
          <StepCard n={1} label="Your website" icon={Globe} state={steps[0].state} open={open === 1} onToggle={() => setOpen(open === 1 ? 0 : 1)}>
            <p className="text-sm text-[var(--rf-muted)]">We&apos;ll audit and optimize this domain:</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2">
              <Globe className="h-4 w-4 text-[var(--rf-blue-bright)]" />
              <span className="rf-mono text-sm text-white">{project.domain}</span>
            </div>
            <button onClick={() => setOpen(2)} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold">Looks right <ArrowRight className="h-4 w-4" /></button>
          </StepCard>

          {/* Step 2 — audit */}
          <StepCard n={2} label="Run your first audit" icon={Radar} state={steps[1].state} open={open === 2} onToggle={() => setOpen(open === 2 ? 0 : 2)}>
            <p className="text-sm text-[var(--rf-muted)]">RankForge crawls the entire site at {project.domain} (sitemap-aware), scores every page, and finds the fixes worth the most. This is a real crawl and can take a few minutes on a larger site.</p>
            {error && <p className="mt-2 rounded-lg bg-[var(--rf-red)]/10 px-3 py-2 text-xs text-[var(--rf-red)]">{error}</p>}
            {running && <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin text-[var(--rf-blue-bright)]" /> {progress}</div>}
            <div className="mt-3 flex gap-2">
              <button onClick={runAudit} className={running ? 'rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold' : 'rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold'}>
                {running ? <><StopCircle className="h-4 w-4" /> Stop</> : hasScan ? <><Radar className="h-4 w-4" /> Re-run audit</> : <><Radar className="h-4 w-4" /> Start audit</>}
              </button>
              {hasScan && !running && <span className="inline-flex items-center gap-1.5 text-sm text-[var(--rf-green)]"><Check className="h-4 w-4" /> Audit complete</span>}
            </div>
          </StepCard>

          {/* Step 3 — WordPress */}
          <StepCard n={3} label="Connect WordPress" icon={Plug} state={steps[2].state} open={open === 3} onToggle={() => setOpen(open === 3 ? 0 : 3)} optional>
            <p className="text-sm text-[var(--rf-muted)]">Connect WordPress to deploy approved title, meta, and schema fixes straight to your live site — with one-click undo. Uses an Application Password; you can skip this and do it later.</p>
            <div className="mt-3 rounded-xl border border-[var(--rf-card-line)] bg-black/20 p-3">
              <WordPressTab projectId={project.id} />
            </div>
          </StepCard>

          {/* Step 4 — Google */}
          <StepCard n={4} label="Connect Google (optional)" icon={BarChart3} state={steps[3].state} open={open === 4} onToggle={() => setOpen(open === 4 ? 0 : 4)} optional>
            {googleConfigured == null ? (
              <p className="text-sm text-[var(--rf-muted)]"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Checking…</p>
            ) : googleConfigured ? (
              <>
                <p className="text-sm text-[var(--rf-muted)]">Connect Google Search Console + Analytics to fold real search and traffic data into your reports.</p>
                {googleConnected ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--rf-green)]"><Check className="h-4 w-4" /> Google connected</p>
                ) : (
                  <GoogleConnectButton projectId={project.id} />
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--rf-muted)]">Google connect isn&apos;t enabled on this deployment yet — that&apos;s fine. Everything else works without it, and you can connect it later once it&apos;s configured.</p>
            )}
          </StepCard>
        </div>

        {/* enter */}
        <div className="mt-8 rounded-2xl border border-[var(--rf-card-line)] bg-white/[0.02] p-5 text-center">
          {hasScan ? (
            <>
              <p className="text-sm text-[var(--rf-muted)]">Your Command Center is ready.</p>
              <button onClick={onEnter} className="rf-btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">Enter Command Center <ArrowRight className="h-4 w-4" /></button>
            </>
          ) : (
            <p className="text-sm text-[var(--rf-muted)]">Run your first audit above to unlock the Command Center.</p>
          )}
        </div>
      </main>
    </div>
  )
}

function StepCard({ n, label, icon: Icon, state, open, onToggle, optional, children }: {
  n: number; label: string; icon: LucideIcon; state: StepState; open: boolean; onToggle: () => void; optional?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`rf-card overflow-hidden transition-colors ${open ? 'rf-topline' : ''}`}>
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span className="flex items-center gap-3">
          <span className={`grid h-9 w-9 place-items-center rounded-xl border ${state === 'done' ? 'border-[var(--rf-green)]/40 bg-[var(--rf-green)]/10 text-[var(--rf-green)]' : 'border-[var(--rf-card-line)] text-[var(--rf-blue-bright)]'}`}>
            {state === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </span>
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold text-white">{label}{optional && <span className="rf-mono rounded border border-[var(--rf-card-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--rf-faint)]">optional</span>}</span>
            <span className="text-[11px] text-[var(--rf-faint)]">Step {n}</span>
          </span>
        </span>
        {state === 'done' ? <Check className="h-4 w-4 text-[var(--rf-green)]" /> : <Circle className="h-3.5 w-3.5 text-[var(--rf-faint)]" />}
      </button>
      {open && <div className="border-t border-[var(--rf-card-line)] px-4 py-4">{children}</div>}
    </div>
  )
}

function GoogleConnectButton({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const connect = async () => {
    setBusy(true); setErr('')
    try {
      const { url } = await api.startGoogleConnect(projectId, 'all')
      window.location.href = url
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not start Google connect.')
      setBusy(false)
    }
  }
  return (
    <div className="mt-3">
      <button onClick={connect} disabled={busy} className="rf-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />} Connect Google
      </button>
      {err && <p className="mt-2 text-xs text-[var(--rf-red)]">{err}</p>}
    </div>
  )
}
