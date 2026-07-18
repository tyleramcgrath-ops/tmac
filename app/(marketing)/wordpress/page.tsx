import type { Metadata } from 'next'
import Link from 'next/link'
import { Plug, Wand2, ShieldCheck, Undo2, Layers, Check } from 'lucide-react'
import { PageIntro } from '../_components/page-intro'
import { FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'WordPress SEO on autopilot — Yoast, Rank Math & AIOSEO | RankForge',
  description:
    'Connect your WordPress site with an Application Password and let RankForge deploy SEO title, meta & schema fixes for you — in bulk. Works natively with Yoast, Rank Math and All in One SEO. Every change is verified by read-back and reversible in one click.',
  alternates: { canonical: '/wordpress' },
}

const STEPS = [
  { icon: Plug, title: 'Connect in 60 seconds', desc: 'Add your site with a WordPress Application Password. Credentials are encrypted at rest and never touch the browser. We auto-detect whether you run Yoast, Rank Math, or AIOSEO.' },
  { icon: Wand2, title: 'Forge writes the fixes', desc: 'AI-written SEO titles and meta descriptions grounded in your actual page content — one at a time or across every page and post in bulk, with an optional shorten-to-60 and JSON-LD schema.' },
  { icon: ShieldCheck, title: 'Deploy & verify', desc: 'Approved changes are written to the correct field for your plugin, then read back from the live site to prove they actually stuck — no fabricated “done”.' },
  { icon: Undo2, title: 'Roll back anytime', desc: 'Every deployment is a durable record with the captured before-value, so any change can be undone in one click. Nothing is one-way.' },
]

const PLUGINS = [
  { name: 'Yoast SEO', field: 'writes to the Yoast meta fields' },
  { name: 'Rank Math', field: 'writes to the Rank Math meta fields' },
  { name: 'All in One SEO', field: 'writes to the AIOSEO meta fields' },
  { name: 'No SEO plugin', field: 'falls back to the native excerpt' },
]

export default function WordPressPage() {
  return (
    <>
      <PageIntro
        eyebrow="For WordPress"
        title="WordPress SEO that actually does the work — Yoast, Rank Math & AIOSEO"
        sub="RankForge is the only SEO tool that audits your WordPress site and then safely deploys the fixes for you: connect once, approve, and every change is verified by read-back and reversible in one click."
      />

      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.title} className="rf-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--rf-card-line)] bg-white/[0.03] text-[var(--rf-blue-bright)]">
                <s.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="rf-card p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--rf-cyan)]" />
            <h2 className="text-xl font-semibold text-white">Works with your SEO plugin — automatically</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[var(--rf-muted)]">
            We detect the SEO plugin on your site and write the meta description to the exact field it renders from, so your snippet updates the way you expect. If a plugin blocks a write, we tell you honestly — we never report a change as done unless the live site confirms it.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PLUGINS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-lg border border-[var(--rf-card-line)] px-4 py-3">
                <Check className="h-4 w-4 shrink-0 text-[var(--rf-green)]" />
                <span className="text-sm font-medium text-white">{p.name}</span>
                <span className="text-xs text-[var(--rf-faint)]">— {p.field}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16 text-center sm:px-8">
        <p className="text-[var(--rf-muted)]">Ready to connect your site?</p>
        <Link href="/signup" className="rf-btn-primary mt-4 inline-block rounded-xl px-6 py-3 text-sm font-semibold">Start free</Link>
      </section>

      <FinalCTA />
    </>
  )
}
