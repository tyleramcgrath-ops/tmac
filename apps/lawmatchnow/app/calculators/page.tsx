import type { Metadata } from 'next'
import Link from 'next/link'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, JsonLd } from '@/components/ui'
import { TOOLS, statesFor } from '@/lib/law/tools'
import { SITE, abs } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Free Legal Calculators for All 50 States',
  description: 'Free calculators for your filing deadline, shared fault, small claims, security deposits, workers’ comp, discrimination charges and minimum wage, built on each state’s statutes and cited.',
  alternates: { canonical: '/calculators' },
}

export default function ToolsHub() {
  return (
    <>
      <RevealOnScroll />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Free legal calculators', url: abs('/calculators'),
        publisher: { '@id': `${SITE.url}/#organization` },
        hasPart: TOOLS.map((t) => ({ '@type': 'WebApplication', name: t.name, url: abs(`/calculators/${t.slug}`), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } })),
      }} />
      <TopicHero
        crumbs={[{ name: 'Legal calculators', path: '/calculators' }]}
        eyebrow="Free legal tools"
        title={<>Answers for <em>your</em> dates and numbers</>}
        lede="Most legal sites tell you the rule. These tools apply it: enter your date or amount and get your deadline or result for your state, with the statute cited. Free, no sign-up."
      />
      <section className="section">
        <div className="wrap">
          <div className="tool-grid reveal">
            {TOOLS.map((t) => (
              <Link key={t.slug} href={`/calculators/${t.slug}`} className="tool-tile">
                <span className="tool-ico" aria-hidden="true">{t.icon}</span>
                <span className="tool-tile-name">{t.name}</span>
                <span className="tool-tile-blurb">{t.blurb}</span>
                <span className="tool-tile-go">{statesFor(t).length} states →</span>
              </Link>
            ))}
          </div>
          <p className="muted tool-hub-note">Every calculator uses only rules we verified against the state’s own statutes, court rules or agency pages. When a state’s rule depends on details we can’t ask about, the tool shows the rule and its citation instead of guessing.</p>
        </div>
      </section>
      <CtaBand title="Want a lawyer to check your deadline?" text="A free case review connects you with a lawyer who can confirm the dates that apply to your situation." />
    </>
  )
}
