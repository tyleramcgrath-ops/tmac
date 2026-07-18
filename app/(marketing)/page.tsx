import type { Metadata } from 'next'
import { Hero } from '../rankforge/components/hero'
import { StackSection } from '../rankforge/components/sections'
import { FinalCTA } from '../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'RankForge — The SEO tool that safely does the work on your WordPress site',
  description:
    'RankForge audits your WordPress site, fixes what matters, and deploys the change for you — then reads it back to verify it stuck, with one-click rollback. Works with Yoast, Rank Math & AIOSEO. Never a number we didn’t measure.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <StackSection />
      <FinalCTA />
    </>
  )
}
