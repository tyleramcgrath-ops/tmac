import type { Metadata } from 'next'
import { CalendarClock, LineChart, Users } from 'lucide-react'
import { PageIntro } from '../_components/page-intro'
import { Faq } from '../_components/faq'
import { CommandCenter, FixList, AISearch } from '../../rankforge/components/sections'
import { FinalCTA } from '../../rankforge/components/pricing-cta'

export const metadata: Metadata = {
  title: 'Features — Audit, fix, deploy, verify & measure | RankForge',
  description:
    'Full-site crawls, an evidence-backed prioritized fix list reviewed by a multi-agent consensus, Forge (your AI SEO assistant), scheduled automatic re-audits, and a closed loop that deploys approved fixes to WordPress, verifies them by reading them back, and measures whether they actually moved Search Console metrics.',
  alternates: { canonical: '/features' },
}

const CLOSES_THE_LOOP = [
  { icon: Users, title: 'Multi-agent consensus', desc: 'Every recommendation is independently reviewed by specialist agents (technical, content, schema, AI-readiness) plus a QA critic — you see a team verdict, not one unchecked opinion.' },
  { icon: CalendarClock, title: 'Runs on its own schedule', desc: 'Turn on daily or weekly automatic re-audits per project. RankForge re-crawls the site and refreshes the fix list without you clicking anything.' },
  { icon: LineChart, title: 'Measures the outcome', desc: 'Connect Google Search Console and every verified fix gets a real 14-day before/after comparison of clicks, impressions, and position — proof it worked, not a promise.' },
]

const FAQ_ITEMS = [
  { q: 'What does an audit actually check?', a: 'A real crawl of your entire site (sitemap-aware) scores four categories per page — technical, content, schema, and AI-readiness — from the fetched HTML itself: title/meta length, H1 structure, canonical tags, HTTPS, mixed content, structured data, image alt coverage, internal links, and more. Nothing is estimated from a domain name; every score traces to a specific crawled page.' },
  { q: 'How is the fix list prioritized?', a: 'By severity (critical/warning/info) derived from the exact same evidence shown in the recommendation — so the audit summary and the fix list can never disagree, because they come from one shared source. Each fix carries the specific page and signal it was derived from.' },
  { q: 'What is the multi-agent review?', a: 'Before a recommendation reaches you, it is independently evaluated by specialist agents (technical, content, schema, AI-readiness) and challenged by a QA critic. You see the consensus — agree, disagree, or needs-human-review — not a single model\'s unchecked guess.' },
  { q: 'Does RankForge run itself, or do I have to babysit it?', a: 'Either. Run a scan on demand, or enable automatic recurring re-audits (daily or weekly) per project. The scheduler re-crawls the site, refreshes the fix list, and — for deployed fixes with Search Console connected — captures the 14-day outcome measurement, all without manual triggering.' },
  { q: 'How do I know a fix actually moved the needle, not just "was applied"?', a: 'Two separate proofs. Applying: every write is read back from the live site before it\'s marked verified. Working: if Search Console is connected, every verified deployment gets a real before/after comparison of clicks, impressions, and position for that exact URL, 14 days apart — reported honestly as "not measured" if Search Console isn\'t connected, never invented.' },
]

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="Everything to audit your site — and actually ship the fixes"
        sub="Most SEO tools stop at a to-do list. RankForge closes the loop: crawl, prioritize by real business impact, let Forge write the fix, deploy it to your live WordPress site, read it back to prove it worked, and measure whether it moved a real metric."
      />
      <CommandCenter />
      <FixList />
      <AISearch />

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <h2 className="text-center text-xl font-semibold text-white">Beyond one deploy — the full loop</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {CLOSES_THE_LOOP.map((s) => (
            <div key={s.title} className="rf-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--rf-card-line)] bg-white/[0.03] text-[var(--rf-cyan)]">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq eyebrow="Features FAQ" title="How the platform works — questions, answered" items={FAQ_ITEMS} />

      <FinalCTA />
    </>
  )
}
