'use client'

import { Check, ArrowRight, Zap } from 'lucide-react'
import { Reveal } from './reveal'
import { ScanForm } from './scan'

/* ================================================================== */
/* 7. Pricing                                                          */
/* ================================================================== */

const PLANS: {
  name: string
  price: number
  blurb: string
  cta: string
  featured: boolean
  features: string[]
  soon: string[]
}[] = [
  {
    name: 'Starter',
    price: 99,
    blurb: 'For solo consultants and growing sites.',
    cta: 'Start Free Scan',
    featured: false,
    features: [
      'Full-site audits — up to 300 pages per crawl',
      'Technical, content, schema & AI-readiness scores',
      'Prioritized Fix List Engine',
      'Core Web Vitals via Google PageSpeed',
      'JSON export & print/PDF reports',
    ],
    soon: ['Rank tracking over time'],
  },
  {
    name: 'Growth',
    price: 199,
    blurb: 'For in-house teams scaling organic search.',
    cta: 'Start Free Scan',
    featured: true,
    features: [
      'Everything in Starter',
      'Keyword rank checks (point-in-time Google positions)',
      'Competitor top-10 comparison per keyword',
      'WordPress deploy: review, approve & undo',
      'Forge — AI SEO assistant + title/meta rewrites',
    ],
    soon: ['Scheduled crawls & monitoring', 'Backlink analysis'],
  },
  {
    name: 'Agency',
    price: 399,
    blurb: 'For agencies running SEO for many clients.',
    cta: 'Talk to Sales',
    featured: false,
    features: [
      'Everything in Growth',
      'Embeddable lead-capture audit widget',
      'Per-embed branding: your name, logo & colors',
      'Priority support & onboarding',
    ],
    soon: [
      'White-label dashboards & client portals',
      'Scheduled reports & team seats',
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="rf-glow rf-pulse pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[640px] -translate-x-1/2 opacity-40" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="rf-mono inline-block rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-blue-bright)]">
              Pricing
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple plans.{' '}
              <span className="rf-gradient-text">Ruthless ROI.</span>
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-4 text-[var(--rf-muted)]">
              One subscription that consolidates your core SEO workflow. Cancel
              anytime. 14-day money-back guarantee.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 90}>
              <div
                className={`rf-card relative flex h-full flex-col p-7 ${
                  p.featured
                    ? 'rf-topline border-[var(--rf-card-line-strong)] shadow-[0_40px_90px_-40px_rgba(47,107,255,0.6)]'
                    : 'rf-card-hover'
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--rf-blue-bright)] to-[var(--rf-cyan)] px-3 py-1 text-[11px] font-semibold text-[#04101f]">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-[var(--rf-muted)]">{p.blurb}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-white">
                    ${p.price}
                  </span>
                  <span className="text-sm text-[var(--rf-faint)]">/mo</span>
                </div>

                <a
                  href="#scan"
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                    p.featured ? 'rf-btn-primary' : 'rf-btn-ghost'
                  }`}
                >
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </a>

                <ul className="mt-7 space-y-3 border-t border-[var(--rf-card-line)] pt-6">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-[var(--rf-text)]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                {p.soon.length > 0 && (
                  <div className="mt-6 border-t border-[var(--rf-card-line)] pt-5">
                    <p className="rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">
                      Coming soon — not available yet
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {p.soon.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-sm text-[var(--rf-faint)]"
                        >
                          <span className="rf-mono mt-0.5 shrink-0 rounded border border-[var(--rf-card-line)] px-1.5 text-[9px] uppercase tracking-wider">
                            Soon
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* 8. Final CTA                                                        */
/* ================================================================== */

export function FinalCTA() {
  return (
    <section id="scan" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="rf-card rf-topline relative overflow-hidden px-6 py-16 text-center sm:px-12">
            <div className="rf-grid pointer-events-none absolute inset-0 opacity-50" />
            <div className="rf-glow rf-pulse pointer-events-none absolute left-1/2 top-0 h-[320px] w-[560px] -translate-x-1/2" />

            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Stop Guessing.{' '}
                <span className="rf-gradient-text">Start Ranking.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[var(--rf-muted)]">
                Run a full technical, content, schema, and AI-readiness audit —
                up to 300 pages. See your Fix List before you ever enter a
                card.
              </p>

              <div className="mt-8">
                <ScanForm cta="Run Free SEO Scan" />
              </div>
              <p className="mt-4 text-xs text-[var(--rf-faint)]">
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================== */
/* Footer                                                              */
/* ================================================================== */

const FOOTER_COLS: {
  title: string
  links: { label: string; href: string }[]
}[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'WordPress Deploy', href: '/wordpress' },
      { label: 'Competitor Compare', href: '/agency' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'For Agencies', href: '/agency' },
      { label: 'For WordPress', href: '/wordpress' },
      { label: 'For In-House Teams', href: '/features' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Client area', href: '/projects' },
      { label: 'Start free', href: '/signup' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--rf-card-line)] py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]">
                <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[17px] font-semibold tracking-tight">
                RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-[var(--rf-muted)]">
              The SEO audit &amp; AI-assisted optimization command center for
              agencies, consultants, and businesses.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-[var(--rf-muted)] transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--rf-card-line)] pt-6 text-xs text-[var(--rf-faint)] sm:flex-row">
          <p>© {new Date().getFullYear()} RankForge AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
