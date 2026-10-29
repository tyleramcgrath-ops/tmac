import type { Metadata } from 'next'
import { Hero } from '../rankforge/components/hero'
import { StackSection, WarRoom } from '../rankforge/components/sections'
import { FinalCTA } from '../rankforge/components/pricing-cta'
import { Faq } from './_components/faq'

export const metadata: Metadata = {
  title: 'RankForge — The SEO tool that safely does the work on your WordPress site',
  description:
    'RankForge audits your WordPress site, fixes what matters, and deploys the change for you — then reads it back to verify it stuck, with one-click rollback and a real before/after measurement of whether it worked. Works with Yoast, Rank Math & AIOSEO. Never a number we didn’t measure.',
  alternates: { canonical: '/' },
}

const FAQ_ITEMS = [
  { q: 'What is RankForge?', a: 'An SEO tool for WordPress that runs a full-site audit, generates evidence-backed fixes, and deploys the approved ones directly to your live site — then reads the change back to verify it actually took effect, and later measures whether it moved real Search Console metrics. Most audit tools stop at a to-do list; RankForge ships the fix and proves it worked.' },
  { q: 'How is this different from a normal SEO audit tool?', a: 'Three things most tools don\'t do: it deploys the approved fix directly to WordPress instead of handing you a spreadsheet, it verifies every change by reading it back from the live site instead of trusting the write response, and it measures the real Search Console outcome 14 days later instead of stopping at "applied."' },
  { q: 'Is it safe to let a tool write to my live site?', a: 'Every change is scoped (title, meta description, schema, internal links — never arbitrary code), captured before it\'s applied, verified after by reading the live value back, and reversible in one click from a durable record. Nothing is one-way, and nothing is reported "done" unless the live site confirms it.' },
  { q: 'Does it work with Yoast, Rank Math, or All in One SEO?', a: 'Yes — RankForge auto-detects which SEO plugin your site runs and writes to the exact field that plugin renders from. If none is installed, it falls back to the post excerpt, or can install Yoast SEO or All in One SEO for you in one click.' },
  { q: 'How much does it cost to try?', a: 'The first audit is free, with no credit card required — run a full crawl and see the fix list before deciding whether to connect WordPress or pay for anything.' },
]

export default function HomePage() {
  return (
    <>
      <Hero />
      <StackSection />
      <WarRoom />
      <Faq items={FAQ_ITEMS} />
      <FinalCTA />
    </>
  )
}
