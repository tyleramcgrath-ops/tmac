'use client'

import { Check, ArrowRight, Zap } from 'lucide-react'
import { Reveal } from './reveal'
import { ScanForm } from './scan'

/* ================================================================== */
/* 7. Pricing                                                          */
/* ================================================================== */

const PLANS = [
  {
    name: 'Starter',
    price: 99,
    blurb: 'For solo consultants and growing sites.',
    cta: 'Start Free Scan',
    featured: false,
    features: [
      '5 projects · 500 tracked keywords',
      'Technical audits & Fix List Engine',
      'Google + AI rank tracking',
      'Content optimization briefs',
      'AI search visibility tracking',
    ],
  },
  {
    name: 'Growth',
    price: 199,
    blurb: 'For in-house teams scaling organic + AI search.',
    cta: 'Start Free Scan',
    featured: true,
    features: [
      '20 projects · 2,500 tracked keywords',
      'Everything in Starter',
      'Local SEO heatmaps & GBP tools',
      'Competitor War Room',
      'Backlink monitoring & gap finder',
      'Scheduled reports',
    ],
  },
  {
    name: 'Agency',
    price: 399,
    blurb: 'For agencies running SEO for many clients.',
    cta: 'Talk to Sales',
    featured: false,
    features: [
      'Unlimited projects · 10,000 keywords',
      'Everything in Growth',
      'White-label dashboards & PDFs',
      'Client portals & lead-capture widget',
      'Unlimited team seats',
      'Priority support & onboarding',
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
              One subscription replaces your whole stack. Cancel anytime. 14-day
              money-back guarantee.
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
                Run a full technical, content, AI, and local audit in about a
                minute. See your Fix List before you ever enter a card.
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

const FOOTER_COLS = [
  {
    title: 'Platform',
    links: [
      'AI SEO Agent',
      'Technical Audits',
      'Rank Tracking',
      'Content Optimization',
      'Local SEO',
    ],
  },
  {
    title: 'Solutions',
    links: [
      'For Agencies',
      'For Consultants',
      'For In-House Teams',
      'AI Search (AEO)',
      'White Label',
    ],
  },
  {
    title: 'Company',
    links: ['About', 'Customers', 'Pricing', 'Blog', 'Contact'],
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
              The ruthless SEO &amp; AI search command center for agencies,
              consultants, and businesses.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-[var(--rf-muted)] transition-colors hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--rf-card-line)] pt-6 text-xs text-[var(--rf-faint)] sm:flex-row">
          <p>© {new Date().getFullYear()} RankForge AI. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
            <a href="#" className="hover:text-white">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
