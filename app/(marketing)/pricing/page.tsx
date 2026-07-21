import type { Metadata } from 'next'
import { PageIntro } from '../_components/page-intro'
import { Faq } from '../_components/faq'
import { Pricing, FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'Pricing | RankForge',
  description:
    'One plan, $49/mo after a 14-day free trial. Audit, fix, and safely deploy SEO changes to WordPress — with every change verified and reversible, and real proof it moved Search Console metrics.',
  alternates: { canonical: '/pricing' },
}

const FAQ_ITEMS = [
  { q: 'Is there a free option?', a: 'Yes — running a full audit, seeing the prioritized fix list, and rolling back any change are always free, no credit card required, forever.' },
  { q: 'What does the trial include?', a: 'Everything. Every feature is unlocked for 14 days — including automatic WordPress deploys — so you can see real fixes go live and get verified before paying anything.' },
  { q: 'What happens after my trial ends?', a: 'Audits, recommendations, and rollback stay free indefinitely. The $49/mo subscription is only required to keep RankForge automatically deploying fixes to your live WordPress site.' },
  { q: 'Can I cancel?', a: 'Yes, cancel anytime from your billing settings.' },
]

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="One plan. Everything included."
        sub="Start free. Try every feature — including automatic WordPress deploy — for 14 days. Audits, recommendations, and rollback stay free forever either way."
      />
      <Pricing />
      <Faq eyebrow="Pricing FAQ" title="Pricing — questions, answered" items={FAQ_ITEMS} />
      <FinalCTA />
    </>
  )
}
