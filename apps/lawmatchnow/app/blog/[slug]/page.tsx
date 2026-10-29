import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyLink } from '@/components/CopyLink'
import { ReadingProgress } from '@/components/fx/ReadingProgress'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { Photo } from '@/components/Photo'
import { Breadcrumbs, CaseReviewCard, CtaBand, JsonLd } from '@/components/ui'
import { getPost, listPosts } from '@/lib/directory'
import { SITE, abs, cleanHtml, fmtDate } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }
export const revalidate = 3600

const minutes = (html: string) => Math.max(2, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 230))

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
  const more = (await listPosts(1, 4)).items.filter((x) => x.slug !== p.slug).slice(0, 3)
  return (
    <>
      <RevealOnScroll />
      <ReadingProgress target=".art-body" />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'NewsArticle', headline: p.title, description: p.excerpt, url: abs(`/blog/${p.slug}`),
        datePublished: p.created.replace(' ', 'T'), dateModified: (p.updated || p.created).replace(' ', 'T'),
        author: { '@type': 'Organization', name: `${SITE.name} Editorial Team`, url: abs('/about') },
        publisher: { '@id': `${SITE.url}/#organization` },
      }} />
      <header className="art-hero">
        <div className="wrap">
          <Breadcrumbs crumbs={[{ name: 'Legal News', path: '/blog' }, { name: p.title, path: `/blog/${p.slug}` }]} light />
          <div className="art-hero-in rise">
            <span className="kicker">{p.category || 'Legal news'}</span>
            <h1>{p.title}</h1>
            {p.excerpt && <p className="lede">{p.excerpt}</p>}
            <div className="art-by">
              <span className="art-mark" aria-hidden="true">L</span>
              <span><b>{SITE.name} editorial team</b><br />{fmtDate(p.created)} · {minutes(p.content)} min read</span>
              <CopyLink />
            </div>
          </div>
        </div>
        <div className="wrap"><div className="art-photo rise"><Photo name="scotus" priority sizes="(min-width: 1240px) 1180px, 100vw" /></div></div>
      </header>
      <section className="section art-section">
        <div className="wrap art-layout no-toc">
          <article className="art-body prose news-body">
            <div dangerouslySetInnerHTML={{ __html: cleanHtml(p.content) }} />
            <p className="art-note">General information, not legal advice. <Link href="/disclaimer">Disclaimer</Link>.</p>
          </article>
          <aside className="art-side"><CaseReviewCard /></aside>
        </div>
      </section>
      {more.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <div className="section-head reveal"><div><div className="eyebrow">More news</div><h2>Keep <em>reading</em></h2></div><p><Link className="link-arrow" href="/blog">All legal news</Link></p></div>
            <div className="news-grid reveal">
              {more.map((x) => (
                <Link key={x.id} href={`/blog/${x.slug}`} className="news-card">
                  <span className="kicker">{x.category || 'Legal news'}</span>
                  <span className="news-t">{x.title}</span>
                  <span className="news-d">{x.excerpt}</span>
                  <span className="news-date">{fmtDate(x.created)} <i aria-hidden="true">→</i></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  )
}
