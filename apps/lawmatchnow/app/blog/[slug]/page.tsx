import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaseReviewCard, JsonLd, PageHero } from '@/components/ui'
import { getPost } from '@/lib/directory'
import { SITE, abs, cleanHtml, fmtDate } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPost((await params).slug)
  if (!p) return { title: 'Post not found', robots: { index: false } }
  return {
    title: p.title,
    description: p.excerpt.slice(0, 160),
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: 'article', title: p.title, description: p.excerpt, url: abs(`/blog/${p.slug}`), publishedTime: p.created, modifiedTime: p.updated },
  }
}

export default async function Post({ params }: Props) {
  const p = await getPost((await params).slug)
  if (!p) notFound()
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'NewsArticle', headline: p.title, description: p.excerpt, url: abs(`/blog/${p.slug}`),
        datePublished: p.created.replace(' ', 'T'), dateModified: (p.updated || p.created).replace(' ', 'T'),
        author: { '@type': 'Organization', name: `${SITE.name} Editorial Team`, url: abs('/about') },
        publisher: { '@id': `${SITE.url}/#organization` },
      }} />
      <PageHero crumbs={[{ name: 'Legal News', path: '/blog' }, { name: p.title, path: `/blog/${p.slug}` }]} eyebrow={p.category || 'Legal news'} title={p.title}>
        <div className="byline"><span>{SITE.name} editorial team</span><span>{fmtDate(p.created)}</span></div>
      </PageHero>
      <section className="section">
        <div className="wrap layout">
          <article className="prose">
            <div dangerouslySetInnerHTML={{ __html: cleanHtml(p.content) }} />
            <p className="muted" style={{ fontSize: '0.88rem', marginTop: 32 }}>General information, not legal advice. <Link href="/disclaimer">Disclaimer</Link>.</p>
          </article>
          <aside className="sidebar"><CaseReviewCard /></aside>
        </div>
      </section>
    </>
  )
}
