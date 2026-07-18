'use client'

import {
  Bot,
  Radar,
  LineChart,
  PenTool,
  MapPin,
  FileBarChart,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  FileText,
  Code2,
  Link2,
  Building2,
  ExternalLink,
  Sparkles,
  Code2 as CodeIcon,
  Copy,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Reveal } from './reveal'

/* ------------------------------------------------------------------ */
/* Shared heading                                                      */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string
  title: React.ReactNode
  sub?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <span className="rf-mono inline-block rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-blue-bright)]">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={140}>
          <p className="mt-4 text-[var(--rf-muted)]">{sub}</p>
        </Reveal>
      )}
    </div>
  )
}

/* ================================================================== */
/* 1. Consolidate Your SEO Workflow                                    */
/* ================================================================== */

const STACK = [
  { name: 'Crawler exports', use: 'Technical site audits' },
  { name: 'PageSpeed tabs', use: 'Core Web Vitals checks' },
  { name: 'SERP spot-checks', use: 'Keyword rank checks' },
  { name: 'Schema validators', use: 'Structured data review' },
  { name: 'Fix spreadsheets', use: 'Prioritizing issues' },
  { name: 'CMS back-and-forth', use: 'Shipping meta fixes' },
  { name: 'Copy-paste AI chats', use: 'Title & meta rewrites' },
]

export function StackSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Consolidate"
          title={
            <>
              Consolidate your core{' '}
              <span className="rf-gradient-text">SEO workflow</span>
            </>
          }
          sub="Stop stitching together crawler exports, PageSpeed tabs, and fix spreadsheets. RankForge AI runs the audit, ranks the fixes, and deploys the approved ones — in one place."
        />

        <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          {/* legacy stack */}
          <Reveal className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {STACK.map((t) => (
              <div
                key={t.name}
                className="rf-card group flex items-center gap-3 p-3.5 opacity-80 transition-opacity hover:opacity-100"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[var(--rf-faint)]">
                  <X className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--rf-muted)] line-through decoration-[var(--rf-red)]/60">
                    {t.name}
                  </p>
                  <p className="truncate text-[11px] text-[var(--rf-faint)]">
                    {t.use}
                  </p>
                </div>
              </div>
            ))}
          </Reveal>

          {/* arrow */}
          <Reveal delay={120} className="flex justify-center">
            <div className="flex items-center gap-2 text-[var(--rf-faint)]">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--rf-blue-bright)] lg:w-6" />
              <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--rf-card-line-strong)] bg-[var(--rf-bg-2)]">
                <ArrowRight className="h-5 w-5 text-[var(--rf-blue-bright)]" />
              </span>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--rf-blue-bright)] lg:w-6" />
            </div>
          </Reveal>

          {/* rankforge */}
          <Reveal delay={200}>
            <div className="rf-card rf-topline relative overflow-hidden p-7">
              <div className="rf-glow pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-70" />
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] shadow-[0_10px_30px_-10px_rgba(47,107,255,0.9)]">
                  <Sparkles className="h-5 w-5 text-white" />
                </span>
                <div>
                  <p className="text-lg font-semibold">RankForge AI</p>
                  <p className="text-xs text-[var(--rf-muted)]">
                    One platform · One login · One source of truth
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {STACK.map((t) => (
                  <li
                    key={t.name}
                    className="flex items-center gap-2 text-sm text-[var(--rf-text)]"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[var(--rf-green)]" />
                    {t.use}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline gap-2 border-t border-[var(--rf-card-line)] pt-5">
                <span className="text-2xl font-semibold text-white">
                  One workflow
                </span>
                <span className="text-xs text-[var(--rf-faint)]">
                  audit → prioritized fixes → approved deploys
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* 2. The SEO Command Center                                           */
/* ================================================================== */

const FEATURES: {
  icon: LucideIcon
  title: string
  desc: string
  tag: string
}[] = [
  {
    icon: Bot,
    title: 'Forge — AI SEO Assistant',
    desc: 'An AI assistant grounded in your crawl. It analyzes your audit, answers questions about your site, and drafts title & meta fixes you review and approve.',
    tag: 'You approve',
  },
  {
    icon: Radar,
    title: 'Full-Site Audits',
    desc: 'Crawls up to 300 pages and scores technical health, content, schema, and AI readiness — with indexability checks, duplicate detection, and internal-link analysis.',
    tag: 'Crawl engine',
  },
  {
    icon: LineChart,
    title: 'Rank Check & Competitor Compare',
    desc: 'Check point-in-time Google positions for your keywords and line your page up against the top 10 for any single keyword.',
    tag: 'On demand',
  },
  {
    icon: PenTool,
    title: 'WordPress Deploy — Verified & Reversible',
    desc: 'Connect via Application Password, pull every page & post, and deploy AI-written title & meta fixes — one at a time or in bulk. Works with Yoast, Rank Math & AIOSEO. Every change is read back to prove it stuck, with one-click rollback.',
    tag: 'Verified · undo',
  },
  {
    icon: MapPin,
    title: 'Lead-Capture Audit Widget',
    desc: 'Embed a free single-page SEO scan — with Core Web Vitals via Google PageSpeed — on any site, branded per embed, and capture the lead.',
    tag: 'Embeddable',
  },
  {
    icon: FileBarChart,
    title: 'Reports & Export',
    desc: 'Export every audit as JSON or generate a clean print/PDF report straight from your browser — ready to hand to a client or a dev team.',
    tag: 'JSON + PDF',
  },
]

const ROADMAP: { title: string; desc: string }[] = [
  {
    title: 'Rank tracking over time',
    desc: 'Scheduled position history, trends, and share-of-voice.',
  },
  {
    title: 'Continuous monitoring',
    desc: 'Scheduled crawls and alerts when something breaks.',
  },
  {
    title: 'AI citation tracking',
    desc: 'Measure when AI answer engines cite your brand.',
  },
  {
    title: 'Backlink analysis',
    desc: 'Backlink monitoring and competitor gap discovery.',
  },
  {
    title: 'Local SEO heatmaps',
    desc: 'Geo-grid rankings and Google Business Profile tools.',
  },
  {
    title: 'White-label & client portals',
    desc: 'Branded dashboards, scheduled reports, and team seats.',
  },
]

export function CommandCenter() {
  return (
    <section id="command-center" className="relative py-24">
      <div className="rf-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="The Platform"
          title={
            <>
              Audit. Fix. Deploy.{' '}
              <span className="rf-gradient-text">Verify.</span>
            </>
          }
          sub="One closed loop for WordPress SEO: find what matters, let Forge write the fix, ship it to your live site, and read it back to prove it worked — with rollback if it didn’t. Everything below ships today."
        />

        <div className="mt-10 text-center">
          <span className="rf-mono inline-block rounded-full border border-[var(--rf-green)]/40 bg-[var(--rf-green)]/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-green)]">
            Available today
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.title} delay={i * 70}>
                <div className="rf-card rf-card-hover rf-topline group h-full overflow-hidden p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--rf-card-line)] bg-white/[0.03] text-[var(--rf-blue-bright)] transition-colors group-hover:text-[var(--rf-cyan)]">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rf-mono rounded-full border border-[var(--rf-card-line)] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
                    {f.desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--rf-blue-bright)] opacity-0 transition-opacity group-hover:opacity-100">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Reveal>
            )
          })}
        </div>

        {/* Roadmap — explicitly labeled, visually de-emphasized */}
        <div className="mt-14 text-center">
          <span className="rf-mono inline-block rounded-full border border-[var(--rf-card-line-strong)] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">
            On the roadmap — not available yet
          </span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r, i) => (
            <Reveal key={r.title} delay={i * 50}>
              <div className="rf-card h-full border-dashed p-5 opacity-70">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--rf-muted)]">
                    {r.title}
                  </h3>
                  <span className="rf-mono shrink-0 rounded-full border border-[var(--rf-card-line)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">
                    Planned
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--rf-faint)]">
                  {r.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* 3. Competitor War Room                                              */
/* ================================================================== */

type Row = {
  metric: string
  you: string
  comp: string
  win: boolean
}

// Sample comparison for illustration — labeled as such in the UI below.
const WAR_ROWS: Row[] = [
  { metric: 'Title tag', you: 'Optimized · 58 chars', comp: 'Generic · 41 chars', win: true },
  { metric: 'Meta description', you: 'CTR-tuned + CTA', comp: 'Missing keyword', win: true },
  { metric: 'Schema markup', you: 'Article + FAQ + HowTo', comp: 'None', win: true },
  { metric: 'Word count', you: '2,140', comp: '3,680', win: false },
  { metric: 'Heading structure', you: 'Clean H1–H3 outline', comp: 'Flat, missing H2s', win: true },
  { metric: 'Internal links', you: '27', comp: '12', win: true },
  { metric: 'Image alt coverage', you: '96%', comp: '61%', win: true },
  { metric: 'Page speed', you: 'LCP 1.9s', comp: 'LCP 1.4s', win: false },
]

export function WarRoom() {
  const wins = WAR_ROWS.filter((r) => r.win).length
  return (
    <section id="war-room" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Intelligence"
          title={
            <>
              Competitor <span className="rf-gradient-text">War Room</span>
            </>
          }
          sub="Pick a keyword and line your page up against the current Google top 10. See exactly which on-page gaps to close — one keyword at a time."
        />

        <Reveal className="mt-14">
          <div className="rf-card rf-topline overflow-hidden">
            {/* sample-data label */}
            <div className="flex justify-between border-b border-[var(--rf-card-line)] bg-white/[0.015] px-4 py-2 sm:px-6">
              <span className="rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-amber)]">
                Sample data for illustration
              </span>
            </div>
            {/* header */}
            <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-4 text-xs uppercase tracking-wider text-[var(--rf-faint)] sm:px-6">
              <span>Signal</span>
              <span className="text-[var(--rf-blue-bright)]">Your Page</span>
              <span>Top 10 Avg</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-[var(--rf-card-line)]">
              {WAR_ROWS.map((r) => (
                <div
                  key={r.metric}
                  className="grid grid-cols-[1.2fr_1fr_1fr_auto] items-center gap-2 px-4 py-3.5 text-sm transition-colors hover:bg-white/[0.02] sm:px-6"
                >
                  <span className="font-medium text-[var(--rf-text)]">
                    {r.metric}
                  </span>
                  <span className="text-[var(--rf-text)]">{r.you}</span>
                  <span className="text-[var(--rf-muted)]">{r.comp}</span>
                  <span className="flex justify-end">
                    {r.win ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rf-green)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--rf-green)]">
                        <Check className="h-3 w-3" /> Lead
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rf-red)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--rf-red)]">
                        <AlertTriangle className="h-3 w-3" /> Gap
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* footer summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rf-card-line)] bg-white/[0.015] px-4 py-4 sm:px-6">
              <p className="text-sm text-[var(--rf-muted)]">
                You lead on{' '}
                <span className="font-semibold text-[var(--rf-green)]">
                  {wins}/{WAR_ROWS.length}
                </span>{' '}
                ranking signals.
              </p>
              <a
                href="#scan"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--rf-blue-bright)] hover:text-white"
              >
                Generate the gap-closing plan{' '}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================== */
/* 4. AI Search Visibility                                             */
/* ================================================================== */

// Sample AI-readiness factor scores for illustration — labeled in the UI.
const AI_FACTORS = [
  { name: 'Content structure', score: 82, note: 'Answer-ready headings' },
  { name: 'Schema coverage', score: 76, note: 'Machine-readable markup' },
  { name: 'Extractability', score: 69, note: 'Clear, quotable passages' },
  { name: 'Entity clarity', score: 58, note: 'Who/what is unambiguous' },
  { name: 'Crawl access', score: 64, note: 'Bots can reach your pages' },
]

export function AISearch() {
  const overall = Math.round(
    AI_FACTORS.reduce((a, e) => a + e.score, 0) / AI_FACTORS.length
  )
  return (
    <section id="ai-search" className="relative py-24">
      <div className="rf-glow rf-pulse pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[700px] -translate-x-1/2 -translate-y-1/2 opacity-40" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="AEO / GEO"
          title={
            <>
              AI Search <span className="rf-gradient-text">Readiness</span>
            </>
          }
          sub="Search isn't just Google anymore. Every audit scores how ready your pages are to be understood and quoted by AI answer engines — structure, schema, and extractability. (Citation tracking across engines is on our roadmap, not available yet.)"
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* score gauge */}
          <Reveal>
            <div className="rf-card rf-topline flex h-full flex-col items-center justify-center p-8 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--rf-faint)]">
                AI Readiness Score
              </p>
              <ScoreRing value={overall} />
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--rf-cyan)]">
                <Sparkles className="h-4 w-4" /> Scored on every audit
              </p>
              <p className="rf-mono mt-2 text-[10px] uppercase tracking-wider text-[var(--rf-amber)]">
                Sample data for illustration
              </p>
            </div>
          </Reveal>

          {/* per-factor bars */}
          <Reveal delay={120}>
            <div className="rf-card grid h-full gap-4 p-6 sm:p-8">
              {AI_FACTORS.map((e, i) => (
                <div key={e.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <Bot className="h-4 w-4 text-[var(--rf-cyan)]" />
                      {e.name}
                    </span>
                    <span className="rf-mono text-[var(--rf-muted)]">
                      {e.note} ·{' '}
                      <span className="text-white">{e.score}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full origin-left rounded-full bg-gradient-to-r from-[var(--rf-blue)] to-[var(--rf-cyan)]"
                      style={{
                        width: `${e.score}%`,
                        animation: `rf-grow-x 1s cubic-bezier(0.2,0.7,0.2,1) ${
                          i * 90
                        }ms both`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="rf-mono self-end text-right text-[10px] uppercase tracking-wider text-[var(--rf-amber)]">
                Sample data for illustration
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 64
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative mt-5 h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="rgba(148,173,224,0.12)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#rfRing)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="rfRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f6bff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <span className="text-4xl font-semibold text-white">{value}</span>
          <span className="block text-xs text-[var(--rf-faint)]">/ 100</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* 5. Fix List Engine                                                  */
/* ================================================================== */

const FIX_GROUPS: {
  icon: LucideIcon
  label: string
  count: number
  tone: string
  items: string[]
}[] = [
  {
    icon: AlertTriangle,
    label: 'Critical technical fixes',
    count: 6,
    tone: 'red',
    items: [
      'Resolve 4 soft-404s blocking indexation',
      'Fix LCP on /pricing (3.8s → <2.5s)',
      'Add canonical to 11 duplicate URLs',
    ],
  },
  {
    icon: FileText,
    label: 'Content gaps',
    count: 12,
    tone: 'blue',
    items: [
      'Cover "best for agencies" intent cluster',
      'Expand comparison page entity coverage',
      'Add FAQ block to 5 money pages',
    ],
  },
  {
    icon: Code2,
    label: 'Schema opportunities',
    count: 9,
    tone: 'cyan',
    items: [
      'Add Product + Review schema to 7 pages',
      'Implement Breadcrumb on blog',
      'Add HowTo markup to top guide',
    ],
  },
  {
    icon: Link2,
    label: 'Internal link targets',
    count: 18,
    tone: 'violet',
    items: [
      'Link 8 posts → /features hub',
      'Add contextual links to orphan pages',
      'Pass authority to 3 priority URLs',
    ],
  },
  {
    icon: MapPin,
    label: 'Indexability blockers',
    count: 5,
    tone: 'green',
    items: [
      'Unblock 2 pages disallowed in robots.txt',
      'Remove stray noindex on /guides',
      'Add 3 missing pages to the sitemap',
    ],
  },
  {
    icon: ExternalLink,
    label: 'Duplicate content',
    count: 23,
    tone: 'amber',
    items: [
      'Merge 3 near-duplicate service pages',
      'Canonicalize parameterized URLs',
      'De-duplicate 9 boilerplate titles',
    ],
  },
]

const FIX_TONE: Record<string, string> = {
  red: 'text-[var(--rf-red)] bg-[var(--rf-red)]/10',
  blue: 'text-[var(--rf-blue-bright)] bg-[var(--rf-blue)]/10',
  cyan: 'text-[var(--rf-cyan)] bg-[var(--rf-cyan)]/10',
  violet: 'text-[var(--rf-violet)] bg-[var(--rf-violet)]/10',
  green: 'text-[var(--rf-green)] bg-[var(--rf-green)]/10',
  amber: 'text-[var(--rf-amber)] bg-[var(--rf-amber)]/10',
}

export function FixList() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Action, not dashboards"
          title={
            <>
              The <span className="rf-gradient-text">Fix List Engine</span>
            </>
          }
          sub="Most tools dump data and walk away. RankForge turns every audit signal into a single prioritized action list — ranked by impact, ready to assign."
        />

        <div className="mt-8 text-center">
          <span className="rf-mono inline-block rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--rf-amber)]">
            Sample data for illustration
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIX_GROUPS.map((g, i) => {
            const Icon = g.icon
            return (
              <Reveal key={g.label} delay={i * 70}>
                <div className="rf-card rf-card-hover h-full p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        FIX_TONE[g.tone]
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rf-mono text-2xl font-semibold text-white">
                      {g.count}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{g.label}</h3>
                  <ul className="mt-3 space-y-2">
                    {g.items.map((it) => (
                      <li
                        key={it}
                        className="flex items-start gap-2 text-sm text-[var(--rf-muted)]"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-green)]" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* 6. Agency Mode                                                      */
/* ================================================================== */

const AGENCY_TODAY = [
  'Lead-capture SEO audit widget for your site',
  'Per-embed branding: your name, logo & colors',
  'Full-site audits you can run per client',
  'JSON export + print/PDF report deliverables',
]

const AGENCY_ROADMAP = [
  'White-label dashboards & client portals',
  'Scheduled reports & team seats',
]

export function Agency() {
  return (
    <section id="agency" className="relative py-24">
      <div className="rf-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="rf-mono inline-flex items-center gap-2 rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-blue-bright)]">
                <Building2 className="h-3.5 w-3.5" /> Agency Mode
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Run your agency like a{' '}
                <span className="rf-gradient-text">product company</span>
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-4 text-[var(--rf-muted)]">
                Win clients with an instant, branded audit widget on your own
                site, then deliver audits and fix lists that speak for
                themselves.
              </p>
            </Reveal>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {AGENCY_TODAY.map((a, i) => (
                <Reveal as="li" key={a} delay={i * 60}>
                  <span className="flex items-start gap-2.5 text-sm text-[var(--rf-text)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" />
                    {a}
                  </span>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={160}>
              <p className="rf-mono mt-6 text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">
                On the roadmap — not available yet
              </p>
            </Reveal>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {AGENCY_ROADMAP.map((a, i) => (
                <Reveal as="li" key={a} delay={i * 60}>
                  <span className="flex items-start gap-2.5 text-sm text-[var(--rf-faint)]">
                    <span className="rf-mono mt-0.5 shrink-0 rounded border border-[var(--rf-card-line)] px-1.5 text-[9px] uppercase tracking-wider">
                      Soon
                    </span>
                    {a}
                  </span>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={200}>
              <a
                href="#pricing"
                className="rf-btn-primary mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
              >
                See Agency plan <ArrowRight className="h-4 w-4" />
              </a>
            </Reveal>
          </div>

          {/* portal mockup */}
          <Reveal delay={120}>
            <div className="rf-card rf-topline rf-float relative overflow-hidden p-5">
              <div className="rf-glow pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-60" />
              <div className="mb-4 flex justify-center">
                <span className="rf-mono rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--rf-amber)]">
                  Roadmap concept — sample data
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] text-xs font-bold text-white">
                    YA
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Your Agency</p>
                    <p className="text-[10px] text-[var(--rf-faint)]">
                      client portal · acme-corp
                    </p>
                  </div>
                </div>
                <span className="rf-mono rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-[var(--rf-muted)]">
                  PDF ready
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ['Traffic', '+38%', 'green'],
                  ['Rankings', '+126', 'blue'],
                  ['Leads', '+54', 'cyan'],
                ].map(([k, v, t]) => (
                  <div
                    key={k}
                    className="rf-card p-3"
                  >
                    <p className="text-[10px] text-[var(--rf-faint)]">{k}</p>
                    <p
                      className={`mt-1 text-lg font-semibold ${
                        t === 'green'
                          ? 'text-[var(--rf-green)]'
                          : t === 'blue'
                          ? 'text-[var(--rf-blue-bright)]'
                          : 'text-[var(--rf-cyan)]'
                      }`}
                    >
                      {v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rf-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[var(--rf-muted)]">
                    Monthly progress
                  </p>
                  <span className="rf-mono text-[10px] text-[var(--rf-green)]">
                    on track
                  </span>
                </div>
                <div className="mt-3 flex h-20 items-end gap-1.5">
                  {[30, 42, 38, 55, 60, 72, 68, 84].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-[var(--rf-blue)]/30 to-[var(--rf-cyan)]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Embeddable lead-capture widget */}
        <Reveal delay={120} className="mt-8">
          <EmbedWidget />
        </Reveal>
      </div>
    </section>
  )
}

/* Copy-paste snippet for the standalone audit widget. */
function EmbedWidget() {
  const [origin, setOrigin] = useState('https://your-rankforge-domain.com')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  const snippet = `<script async\n  src="${origin}/widget.js"\n  data-domain="clientsite.com"\n  data-name="Your Agency"\n  data-accent="#7c5cff"\n  data-logo="https://youragency.com/logo.svg"></script>`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="rf-card rf-topline overflow-hidden">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--rf-card-line)] bg-white/[0.03] text-[var(--rf-blue-bright)]">
            <CodeIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">
              Embed the lead-capture audit widget
            </h3>
            <p className="mt-1 text-sm text-[var(--rf-muted)]">
              Drop one line on any client or prospect site. Visitors run a free
              scan; you capture the lead.
            </p>
          </div>
        </div>
        <a
          href="/widget"
          target="_blank"
          rel="noopener noreferrer"
          className="rf-btn-ghost inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
        >
          Preview widget <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="relative border-t border-[var(--rf-card-line)] bg-[#070b15] p-4">
        <pre className="rf-mono overflow-x-auto pr-24 text-[12.5px] leading-relaxed text-[var(--rf-muted)]">
          <code>{snippet}</code>
        </pre>
        <button
          onClick={copy}
          className="rf-btn-ghost absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[var(--rf-green)]" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}
