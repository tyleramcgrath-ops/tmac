import '../rankforge.css'
import { Nav } from './nav'
import { Hero } from './hero'
import {
  StackSection,
  CommandCenter,
  WarRoom,
  AISearch,
  FixList,
  Agency,
} from './sections'
import { Pricing, FinalCTA, Footer } from './pricing-cta'
import { ScanProvider } from './scan'

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

/**
 * The full RankForge AI marketing site. Rendered both at `/` (homepage) and at
 * `/rankforge`. Self-contained: imports its own scoped stylesheet and wraps
 * everything in `.rf-root` so it never depends on the app's global theme.
 */
export function RankForgeSite() {
  return (
    <div className="rf-root">
      <ScanProvider>
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
      </ScanProvider>
    </div>
  )
}
