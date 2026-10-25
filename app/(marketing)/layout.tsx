import '../rankforge/rankforge.css'
import type { ReactNode } from 'react'
import { ScanProvider } from '../rankforge/components/scan'
import { DemoProvider } from '../rankforge/components/demo'
import { Footer } from '../rankforge/components/pricing-cta'
import { SiteNav } from './_components/site-nav'
import { siteUrl } from '../lib/site-url'

// Kept alongside the structured data below so the two can never disagree.
const description =
  'RankForge audits your WordPress site, fixes what matters, and deploys the change for you — then verifies it by read-back, with one-click rollback. Works with Yoast, Rank Math & AIOSEO.'

// Structured data for the RankForge marketing site: who RankForge is
// (Organization) and what the product is (SoftwareApplication). This lives here
// rather than in the root layout so it is emitted only on RankForge pages — the
// Contact Studios site under /contact is a different brand and declares its own.
// Original note: who RankForge is (Organization) and what the
// product is (SoftwareApplication). This is read by both classic search
// (Google's knowledge panel / rich results) and AI search engines (Google
// AI Overviews, Perplexity, ChatGPT search) that ground answers in
// structured data rather than re-parsing prose. Kept honest — every claim
// here matches what's actually shipped, not aspirational marketing copy.
const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RankForge',
  url: siteUrl(),
  description,
  sameAs: [],
}
const APP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RankForge',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free SEO audit, no credit card required.' },
}


// Shared chrome for the public marketing site. Each route under (marketing) is a
// real, separately-crawlable page (good SEO — we practice what we sell) that
// shares this nav + footer. The app itself lives at /projects (the client area).
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="rf-root">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_JSON_LD) }} />
      <ScanProvider>
        <DemoProvider>
          <div className="min-h-screen bg-[var(--rf-bg)]">
            <SiteNav />
            <main>{children}</main>
            <Footer />
          </div>
        </DemoProvider>
      </ScanProvider>
    </div>
  )
}
