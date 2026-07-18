import type { Metadata } from 'next'
import { PageIntro } from '../_components/page-intro'
import { Faq } from '../_components/faq'
import { Pricing, FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'Pricing | RankForge',
  description:
    'Simple plans for operators, consultants, and agencies. Audit, fix, and safely deploy SEO changes to WordPress — with every change verified and reversible, and real proof it moved Search Console metrics.',
  alternates: { canonical: '/pricing' },
}

const FAQ_ITEMS = [
  { q: 'Is there a free option?', a: 'Yes — running a full audit and seeing the fix list is free, no credit card required, on any plan tier.' },
  { q: 'What\'s the difference between Starter and Growth?', a: 'Starter covers full audits and the prioritized fix list. Growth adds the WordPress deploy loop (review, approve, deploy, verify, undo), Forge\'s AI-written title/meta rewrites, automatic scheduled re-audits, and Search Console outcome measurement — the parts of the product that actually make and prove changes on your live site, not just report on it.' },
  { q: 'What does Agency add beyond Growth?', a: 'Everything in Growth, applied across a portfolio of client sites, plus the embeddable lead-capture audit widget with per-client branding and priority onboarding support.' },
  { q: 'Can I cancel?', a: 'Yes, cancel anytime.' },
]

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="Pricing that scales from one site to a whole agency"
        sub="Start free. Upgrade when you’re deploying fixes across more sites. Every plan includes the verified, reversible WordPress deploy loop — that’s the whole point."
      />
      <Pricing />
      <Faq eyebrow="Pricing FAQ" title="Plans — questions, answered" items={FAQ_ITEMS} />
      <FinalCTA />
    </>
  )
}
