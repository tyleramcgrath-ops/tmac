import type { Metadata } from 'next'
import { PageIntro } from '../_components/page-intro'
import { CommandCenter, FixList, AISearch } from '../../rankforge/components/sections'
import { FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'Features — Audit, fix, deploy & verify | RankForge',
  description:
    'Full-site crawls, an evidence-backed prioritized fix list, Forge (your AI SEO assistant), and one closed loop that deploys approved title, meta & schema fixes to WordPress and verifies every change by reading it back.',
  alternates: { canonical: '/features' },
}

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="Everything to audit your site — and actually ship the fixes"
        sub="Most SEO tools stop at a to-do list. RankForge closes the loop: crawl, prioritize by real business impact, let Forge write the fix, deploy it to your live WordPress site, and read it back to prove it worked."
      />
      <CommandCenter />
      <FixList />
      <AISearch />
      <FinalCTA />
    </>
  )
}
