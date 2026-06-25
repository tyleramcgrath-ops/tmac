import { Nav } from './components/nav'
import { Hero } from './components/hero'
import {
  StackSection,
  CommandCenter,
  WarRoom,
  AISearch,
  FixList,
  Agency,
} from './components/sections'
import { Pricing, FinalCTA, Footer } from './components/pricing-cta'

const TRUST = [
  'Technical SEO',
  'AI Search (AEO/GEO)',
  'Rank Tracking',
  'Content Briefs',
  'Local Heatmaps',
  'Backlink Gaps',
  'Schema Engine',
  'White-Label Reports',
]

function TrustBar() {
  return (
    <div className="rf-marquee relative overflow-hidden border-y border-[var(--rf-card-line)] py-5">
      <div className="rf-marquee-track gap-12">
        {[...TRUST, ...TRUST].map((t, i) => (
          <span
            key={i}
            className="rf-mono flex shrink-0 items-center gap-3 text-sm uppercase tracking-[0.18em] text-[var(--rf-faint)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--rf-blue-bright)]" />
            {t}
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--rf-bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--rf-bg)] to-transparent" />
    </div>
  )
}

export default function RankForgePage() {
  return (
    <main className="min-h-screen bg-[var(--rf-bg)]">
      <Nav />
      <Hero />
      <TrustBar />
      <StackSection />
      <CommandCenter />
      <WarRoom />
      <AISearch />
      <FixList />
      <Agency />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  )
}
