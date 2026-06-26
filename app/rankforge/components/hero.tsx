'use client'

import {
  Play,
  Gauge,
  Bot,
  Target,
  ShieldAlert,
  FileText,
  Swords,
  TrendingUp,
} from 'lucide-react'
import { Reveal } from './reveal'
import { ScanForm } from './scan'
import { useDemo } from './demo'

export function Hero() {
  const demo = useDemo()
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-36">
      {/* ambient backdrop */}
      <div className="rf-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="rf-glow rf-pulse pointer-events-none absolute left-1/2 top-[-120px] -z-10 h-[520px] w-[820px] -translate-x-1/2" />
      <div className="pointer-events-none absolute right-[-10%] top-40 -z-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.18),transparent)]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--rf-card-line-strong)] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-[var(--rf-muted)]">
              <span className="rf-blink h-2 w-2 rounded-full bg-[var(--rf-green)]" />
              All-in-one SEO &amp; AI Search platform — built for operators
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Dominate Google, AI Search, and Local Rankings From One{' '}
              <span className="rf-gradient-text">Ruthless SEO Command Center</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[var(--rf-muted)] sm:text-lg">
              Run technical audits, content briefs, AI search tracking,
              competitor gaps, schema, local maps, rank tracking, backlinks, and
              client reports — without jumping between ten tools.
            </p>
          </Reveal>

          {/* Domain input */}
          <Reveal delay={240}>
            <div className="mt-8">
              <ScanForm cta="Start Free SEO Scan" />
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => demo.open()}
                className="rf-btn-ghost inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
              >
                <Play className="h-4 w-4 fill-current" />
                Watch Demo
              </button>
              <span className="text-xs text-[var(--rf-faint)]">
                No credit card · Full crawl in ~60 seconds
              </span>
            </div>
          </Reveal>
        </div>

        {/* Dashboard mockup */}
        <Reveal delay={120} className="mt-16">
          <DashboardMockup />
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Futuristic dashboard mockup                                         */
/* ------------------------------------------------------------------ */

const METRICS = [
  {
    label: 'SEO Score',
    value: '92',
    sub: '/100',
    delta: '+14',
    tone: 'green',
    icon: Gauge,
  },
  {
    label: 'AI Visibility',
    value: '78',
    sub: '%',
    delta: '+22',
    tone: 'cyan',
    icon: Bot,
  },
  {
    label: 'Keyword Wins',
    value: '1,284',
    sub: '',
    delta: '+341',
    tone: 'green',
    icon: Target,
  },
  {
    label: 'Technical Issues',
    value: '37',
    sub: '',
    delta: '-58',
    tone: 'amber',
    icon: ShieldAlert,
  },
  {
    label: 'Content Gaps',
    value: '46',
    sub: '',
    delta: 'new',
    tone: 'blue',
    icon: FileText,
  },
  {
    label: 'Competitor Threats',
    value: '9',
    sub: '',
    delta: 'live',
    tone: 'red',
    icon: Swords,
  },
]

const TONE: Record<string, string> = {
  green: 'text-[var(--rf-green)]',
  cyan: 'text-[var(--rf-cyan)]',
  amber: 'text-[var(--rf-amber)]',
  blue: 'text-[var(--rf-blue-bright)]',
  red: 'text-[var(--rf-red)]',
}

function DashboardMockup() {
  // Deterministic bar heights for the trend chart (avoids hydration drift).
  const bars = [38, 52, 44, 61, 57, 72, 66, 80, 75, 88, 84, 96]

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="rf-glow pointer-events-none absolute -inset-x-10 -bottom-10 top-20 -z-10 opacity-60" />
      <div className="rf-card rf-topline overflow-hidden shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="rf-mono ml-3 hidden text-xs text-[var(--rf-faint)] sm:inline">
              app.rankforge.ai / overview
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--rf-card-line)] px-2.5 py-1 text-[11px] text-[var(--rf-muted)]">
            <span className="rf-blink h-1.5 w-1.5 rounded-full bg-[var(--rf-green)]" />
            Live crawl
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
          {/* metric grid */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-3">
            {METRICS.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.label}
                  className="rf-card group relative overflow-hidden p-4"
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-4 w-4 ${TONE[m.tone]}`} />
                    <span
                      className={`rf-mono rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium ${TONE[m.tone]}`}
                    >
                      {m.delta}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-0.5">
                    <span className="text-2xl font-semibold tracking-tight text-white">
                      {m.value}
                    </span>
                    <span className="mb-0.5 text-sm text-[var(--rf-faint)]">
                      {m.sub}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
                    {m.label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* trend chart panel */}
          <div className="rf-card relative flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--rf-cyan)]" />
                <span className="text-sm font-medium text-white">
                  Visibility Index
                </span>
              </div>
              <span className="rf-mono text-[11px] text-[var(--rf-green)]">
                ▲ 31.4%
              </span>
            </div>

            {/* scanning line */}
            <div className="relative mt-4 flex-1">
              <div className="rf-scan pointer-events-none absolute inset-x-0 top-0 h-8 bg-[linear-gradient(to_bottom,rgba(34,211,238,0.18),transparent)]" />
              <div className="flex h-32 items-end gap-1.5">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-[var(--rf-blue)]/30 to-[var(--rf-cyan)]"
                    style={{
                      height: `${h}%`,
                      animation: `rf-bar 1.1s cubic-bezier(0.2,0.7,0.2,1) ${
                        i * 60
                      }ms both`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--rf-card-line)] pt-3">
              {[
                ['Google', '#1', TONE.green],
                ['AI Overviews', 'cited', TONE.cyan],
                ['Local Pack', 'top 3', TONE.blue],
              ].map(([k, v, c]) => (
                <div key={k}>
                  <p className="text-[10px] text-[var(--rf-faint)]">{k}</p>
                  <p className={`text-sm font-semibold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
