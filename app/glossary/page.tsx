import type { Metadata } from 'next'
import { CtaBand, JsonLd, PageHero } from '@/components/ui'
import { GLOSSARY } from '@/lib/content/glossary'
import { abs } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Legal Dictionary: Common Legal Terms in Plain English',
  description: `Plain-English definitions of ${GLOSSARY.length} legal terms you may hear from a lawyer or in court, from affidavit to tort.`,
  alternates: { canonical: '/glossary' },
}

export default function Glossary() {
  const letters = [...new Set(GLOSSARY.map((t) => t.term[0].toUpperCase()))]
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'DefinedTermSet', '@id': abs('/glossary'), name: 'LawMatchNow Legal Dictionary',
        hasDefinedTerm: GLOSSARY.map((t) => ({ '@type': 'DefinedTerm', name: t.term, description: t.definition, url: abs(`/glossary#${t.slug}`), inDefinedTermSet: abs('/glossary') })),
      }} />
      <PageHero crumbs={[{ name: 'Legal Dictionary', path: '/glossary' }]} eyebrow="Legal dictionary" title="Legal terms, in plain English"
        lede="The words lawyers and courts use, explained simply. Click a letter to jump ahead." />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 920 }}>
          <nav className="alpha" aria-label="Letters">{letters.map((l) => <a key={l} href={`#letter-${l}`}>{l}</a>)}</nav>
          {letters.map((l) => (
            <div key={l}>
              <h2 className="letter" id={`letter-${l}`}>{l}</h2>
              <dl className="terms">
                {GLOSSARY.filter((t) => t.term[0].toUpperCase() === l).map((t) => (
                  <div key={t.slug}><dt id={t.slug}>{t.term}</dt><dd>{t.definition}</dd></div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  )
}
