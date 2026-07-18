import type { Metadata } from 'next'
import { PageIntro } from '../_components/page-intro'
import { Agency, WarRoom } from '../../rankforge/components/sections'
import { FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'For Agencies — Audit & fix client WordPress sites at scale | RankForge',
  description:
    'Run audits across every client WordPress site, deploy approved fixes with a full verified, reversible audit trail, and compare any page against the top 10. Built to be agency infrastructure, not another dashboard.',
  alternates: { canonical: '/agency' },
}

export default function AgencyPage() {
  return (
    <>
      <PageIntro
        eyebrow="For Agencies"
        title="Audit and fix every client’s WordPress site — safely, at scale"
        sub="Deploy approved title, meta & schema fixes across a portfolio of client sites. Every change is read back to verify it stuck and can be rolled back in one click — with a durable audit trail per client."
      />
      <Agency />
      <WarRoom />
      <FinalCTA />
    </>
  )
}
