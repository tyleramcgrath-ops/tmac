import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { ToolStateJump } from '@/components/tools/Calculator'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, JsonLd } from '@/components/ui'
import { TOOLS, statesFor, toolBySlug } from '@/lib/law/tools'
import { SITE, abs } from '@/lib/site'

type Props = { params: Promise<{ tool: string }> }
export const dynamicParams = false
export const generateStaticParams = () => TOOLS.map((t) => ({ tool: t.slug }))

const national = (name: string) => name.replace(/^./, (c) => c.toUpperCase())

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = toolBySlug((await params).tool)
  if (!t) return {}
  const title = `${national(t.name)}: Free for All 50 States`
  return { title, description: `${t.blurb} Free, with each state’s law cited.`, alternates: { canonical: `/calculators/${t.slug}` }, openGraph: { title, url: abs(`/calculators/${t.slug}`) } }
}

export default async function ToolPage({ params }: Props) {
  const t = toolBySlug((await params).tool)
  if (!t) notFound()
  const states = statesFor(t)
  const list = states.map((s) => ({ slug: s.slug, name: s.name }))
  const others = TOOLS.filter((x) => x.slug !== t.slug)
  return (
    <>
      <RevealOnScroll />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebApplication', name: national(t.name), description: t.blurb, url: abs(`/calculators/${t.slug}`),
        applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': `${SITE.url}/#organization` },
      }} />
      <TopicHero
        crumbs={[{ name: 'Legal calculators', path: '/calculators' }, { name: national(t.name), path: `/calculators/${t.slug}` }]}
        eyebrow="Free legal tool"
        title={national(t.name)}
        lede={t.blurb}
      >
        <ToolStateJump tool={t.slug} states={list} />
      </TopicHero>
      <section className="section">
        <div className="wrap art-layout tool-layout">
          <article className="prose">
            <h2>How it works</h2>
            {t.how.map((p) => <p key={p}>{p}</p>)}
            <h2>Pick your state</h2>
            <div className="state-pills">
              {states.map((s) => <Link key={s.slug} className="pill" href={`/calculators/${t.slug}/${s.slug}`}>{s.name}</Link>)}
            </div>
            <p className="art-note">General legal information, not legal advice. Rules change and exceptions apply; a lawyer licensed in your state can confirm what applies to you.</p>
          </article>
          <aside className="art-side">
            <div className="card art-related">
              <div className="kicker">More free tools</div>
              {others.map((x) => <Link key={x.slug} href={`/calculators/${x.slug}`}>{national(x.name)} <span aria-hidden="true">→</span></Link>)}
            </div>
          </aside>
        </div>
      </section>
      <CtaBand practice={t.practice} />
    </>
  )
}
