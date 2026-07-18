import type { Metadata } from 'next'
import { PageIntro } from '../_components/page-intro'
import { Faq } from '../_components/faq'
import { Agency, WarRoom } from '../../rankforge/components/sections'
import { FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'For Agencies — Audit & fix client WordPress sites at scale | RankForge',
  description:
    'Run audits across every client WordPress site, deploy approved fixes with a full verified, reversible audit trail, schedule recurring re-audits per client, and prove to clients that fixes moved real Search Console metrics — not just a to-do list someone marked done.',
  alternates: { canonical: '/agency' },
}

const FAQ_ITEMS = [
  { q: 'Can I manage audits for multiple client sites?', a: 'Yes — each client is a separate project with its own WordPress connection, audit history, fix list, and deployment record. Nothing is shared or mixed between clients.' },
  { q: 'How do I prove to a client that a fix actually helped?', a: 'Connect that client\'s Google Search Console and every verified deployment gets a real 14-day before/after comparison of clicks, impressions, and position for the affected URL — a measured number to show the client, not a claim.' },
  { q: 'Can I set up recurring audits so I\'m not manually re-running scans for every client?', a: 'Yes — enable daily or weekly automatic re-audits per project. RankForge re-crawls the site and refreshes the fix list on its own schedule.' },
  { q: 'What if a client\'s site has no SEO plugin?', a: 'RankForge falls back to writing meta descriptions to the post excerpt, or can install Yoast SEO or All in One SEO on the client\'s site in one click — an explicit action you approve, never automatic.' },
  { q: 'Is every change auditable — who approved what, and when?', a: 'Yes. Every deployment is a durable, server-side record: who approved it, when, the exact before/after values, the read-back verification result, and (once measured) the outcome delta. It survives browser refresh, logout, and device change.' },
]

export default function AgencyPage() {
  return (
    <>
      <PageIntro
        eyebrow="For Agencies"
        title="Audit and fix every client’s WordPress site — safely, at scale"
        sub="Deploy approved title, meta & schema fixes across a portfolio of client sites. Every change is read back to verify it stuck and can be rolled back in one click — with a durable audit trail per client and a real measurement of whether each fix worked."
      />
      <Agency />
      <WarRoom />
      <Faq eyebrow="Agency FAQ" title="Running RankForge across client sites" items={FAQ_ITEMS} />
      <FinalCTA />
    </>
  )
}
