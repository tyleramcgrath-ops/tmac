import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { siteUrl } from '@/app/lib/site-url'
import { SiteFooter, SiteNav } from '../../_components/site-chrome'
import {
  CompareCta,
  ComparisonMatrix,
  FaqList,
  MoreComparisons,
  ProsCons,
  Verdict,
} from '../../_components/compare'
import {
  COMPARISONS,
  PRICING_CHECKED,
  SCAN,
  findComparison,
  otherComparisons,
} from '../../_lib/competitors'

// Every comparison is known at build time, so all of these are static HTML —
// which is the point: fast pages with the content in the markup, not fetched
// after hydration.
export function generateStaticParams() {
  return COMPARISONS.map((item) => ({ slug: item.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const rival = findComparison(slug)
  if (!rival) return { title: 'Comparison not found — Contact Studios' }

  const url = `${siteUrl()}/contact/compare/${rival.slug}`
  return {
    title: rival.metaTitle,
    description: rival.metaDescription,
    alternates: { canonical: url },
    keywords: [
      `${rival.name} alternative`,
      `${rival.name} vs ${SCAN.name}`,
      `${SCAN.name} vs ${rival.name}`,
      `${rival.name} alternatives`,
      'AI visibility tool',
      'LLM visibility tracking',
      'best AI search visibility tool',
    ],
    openGraph: {
      title: rival.metaTitle,
      description: rival.metaDescription,
      type: 'article',
      url,
      siteName: 'Contact Studios',
    },
    twitter: { card: 'summary_large_image', title: rival.metaTitle, description: rival.metaDescription },
  }
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rival = findComparison(slug)
  if (!rival) notFound()

  const base = siteUrl()
  const url = `${base}/contact/compare/${rival.slug}`
  const others = otherComparisons(rival.slug)

  // SoftwareApplication is a subtype of Product, so this is eligible for
  // product-style rich results while describing the thing accurately.
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SCAN.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${base}/contact/app`,
    description: `${SCAN.name} is ${SCAN.what}.`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free, with no account required.',
    },
    publisher: { '@type': 'Organization', name: 'Contact Studios', url: `${base}/contact` },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: rival.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Contact Studios', item: `${base}/contact` },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${base}/contact/compare` },
      { '@type': 'ListItem', position: 3, name: `${SCAN.name} vs ${rival.name}`, item: url },
    ],
  }

  return (
    <>
      <a href="#main" className="ctc-skip">
        Skip to content
      </a>
      <SiteNav />

      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main id="main">
        <article>
          <header className="ctc-compare-hero ctc-grain">
            <div className="ctc-wrap" style={{ position: 'relative', zIndex: 1 }}>
              <nav aria-label="Breadcrumb" className="ctc-crumbs">
                <Link href="/contact">Contact Studios</Link>
                <span aria-hidden="true">/</span>
                <Link href="/contact/compare">Compare</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{rival.name}</span>
              </nav>

              <span className="ctc-eyebrow ctc-eyebrow-ember" style={{ display: 'block', marginTop: 'var(--s-5)' }}>
                {rival.category}
              </span>
              <h1 className="ctc-h2" style={{ maxWidth: '20ch', marginTop: 'var(--s-3)' }}>
                {SCAN.name} vs {rival.name}
              </h1>
              <p className="ctc-lead" style={{ maxWidth: '58ch', marginTop: 'var(--s-4)' }}>
                Features, pricing, and which is better in 2026.
              </p>
            </div>
          </header>

          <div className="ctc-wrap ctc-compare-body">
            <section aria-labelledby="intro-title">
              <h2 id="intro-title" className="ctc-sr">
                Overview
              </h2>
              {rival.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="ctc-prose">
                  {paragraph}
                </p>
              ))}
            </section>

            <section aria-labelledby="matrix-title">
              <h2 id="matrix-title" className="ctc-h3">
                Side by side
              </h2>
              <p className="ctc-faint" style={{ fontSize: 'var(--t-xs)', margin: 'var(--s-2) 0 var(--s-4)' }}>
                Pricing checked {PRICING_CHECKED}. Figures come from public pricing pages and change
                often — confirm on{' '}
                <a href={rival.url} rel="nofollow noopener" target="_blank" className="ctc-inline-link">
                  {rival.name}
                </a>{' '}
                before deciding.
              </p>
              <ComparisonMatrix rival={rival} />
            </section>

            <section aria-labelledby="proscons-title">
              <h2 id="proscons-title" className="ctc-h3" style={{ marginBottom: 'var(--s-4)' }}>
                Strengths and limitations
              </h2>
              <ProsCons rival={rival} />
            </section>

            <section aria-labelledby="verdict-title">
              <h2 id="verdict-title" className="ctc-sr">
                Verdict
              </h2>
              <Verdict rival={rival} />
            </section>

            <CompareCta rivalName={rival.name} />

            <section aria-labelledby="faq-title">
              <h2 id="faq-title" className="ctc-h3" style={{ marginBottom: 'var(--s-3)' }}>
                Questions people ask
              </h2>
              <FaqList faqs={rival.faqs} />
            </section>

            <MoreComparisons items={others} title="Compare with something else" />
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  )
}
