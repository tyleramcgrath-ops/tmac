import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { siteUrl } from '@/app/lib/site-url'
import { SiteFooter, SiteNav } from '../_components/site-chrome'
import { CompareCta } from '../_components/compare'
import { Reveal } from '../_components/primitives'
import { COMPARISONS, PRICING_CHECKED, SCAN } from '../_lib/competitors'

const TITLE = 'AI visibility tools compared: Contact Scan vs the alternatives (2026)'
const DESCRIPTION =
  'Honest side-by-side comparisons of the tools that measure whether AI assistants recommend your brand — Profound, Peec AI, Otterly.AI, Scrunch, Semrush, Ahrefs Brand Radar and more. Pricing, free options and which to use.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${siteUrl()}/contact/compare` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: `${siteUrl()}/contact/compare`,
    siteName: 'Contact Studios',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function CompareHub() {
  const base = siteUrl()

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Contact Studios', item: `${base}/contact` },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${base}/contact/compare` },
    ],
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI visibility tool comparisons',
    itemListElement: COMPARISONS.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${SCAN.name} vs ${item.name}`,
      url: `${base}/contact/compare/${item.slug}`,
    })),
  }

  return (
    <>
      <a href="#main" className="ctc-skip">
        Skip to content
      </a>
      <SiteNav />

      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      <main id="main">
        <section className="ctc-compare-hero ctc-grain">
          <div className="ctc-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <nav aria-label="Breadcrumb" className="ctc-crumbs">
              <Link href="/contact">Contact Studios</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Compare</span>
            </nav>

            <Reveal>
              <h1 className="ctc-h2" style={{ maxWidth: '18ch', marginTop: 'var(--s-4)' }}>
                Every AI visibility tool, compared honestly.
              </h1>
            </Reveal>
            <Reveal delay={90}>
              <p className="ctc-lead" style={{ maxWidth: '58ch', marginTop: 'var(--s-4)' }}>
                {SCAN.name} is {SCAN.what}. It is free, and it is not the only option. Below is a
                straight comparison against the tools people actually shortlist — including where
                they beat us, because a comparison page that never concedes anything is worth
                nothing to you.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <div className="ctc-row ctc-g3 ctc-wrapflex" style={{ marginTop: 'var(--s-5)' }}>
                <Link href="/contact/app" className="ctc-btn ctc-btn-ember ctc-btn-lg">
                  <Search size={16} aria-hidden="true" /> Run a free scan
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="ctc-section" aria-labelledby="all-title" style={{ paddingTop: 'var(--s-7)' }}>
          <div className="ctc-wrap">
            <div className="ctc-between ctc-wrapflex ctc-g3" style={{ marginBottom: 'var(--s-5)' }}>
              <h2 id="all-title" className="ctc-h3">
                All comparisons
              </h2>
              <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
                Pricing checked {PRICING_CHECKED}
              </span>
            </div>

            <ul className="ctc-comparegrid">
              {COMPARISONS.map((item, index) => (
                <Reveal as="li" key={item.slug} delay={index * 50}>
                  <Link href={`/contact/compare/${item.slug}`} className="ctc-comparecard">
                    <span className="ctc-eyebrow">{item.category}</span>
                    <h3 className="ctc-comparecard-title">
                      {SCAN.name} <span className="ctc-serif-italic ctc-faint">vs</span> {item.name}
                    </h3>
                    <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', lineHeight: 1.6 }}>
                      {item.blurb}
                    </p>
                    <span className="ctc-comparecard-go">
                      Read the comparison <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>

            <p className="ctc-faint" style={{ fontSize: 'var(--t-xs)', marginTop: 'var(--s-6)', maxWidth: '70ch' }}>
              Pricing and features move constantly in this category. Everything here was checked in{' '}
              {PRICING_CHECKED} against public pricing pages and industry round-ups — confirm with
              the vendor before you buy. Where a rival is genuinely better, these pages say so.
            </p>
          </div>
        </section>

        <div className="ctc-wrap" style={{ paddingBottom: 'var(--s-9)' }}>
          <CompareCta />
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
