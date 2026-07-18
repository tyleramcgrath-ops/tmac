import type { Metadata } from 'next'
import { PageIntro } from '../_components/page-intro'
import { Pricing, FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'Pricing | RankForge',
  description:
    'Simple plans for operators, consultants, and agencies. Audit, fix, and safely deploy SEO changes to WordPress — with every change verified and reversible.',
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="Pricing that scales from one site to a whole agency"
        sub="Start free. Upgrade when you’re deploying fixes across more sites. Every plan includes the verified, reversible WordPress deploy loop — that’s the whole point."
      />
      <Pricing />
      <FinalCTA />
    </>
  )
}
