import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/MarketingShell'
import { KIND_LABEL, headingsOf, publishedArticles, readingMinutes, renderBody } from '@/lib/articles'
import { getStore } from '@/lib/store'
import '../../home.css'
import '../blog.css'

export const dynamic = 'force-dynamic'

const BASE = 'https://saysites.com'
const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

async function find(slug: string) {
  const all = await publishedArticles(getStore())
  return { article: all.find((a) => a.slug === slug), all }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { article: a } = await find(slug)
  if (!a) return { title: 'Not found', robots: { index: false } }
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { type: 'article', title: a.title, description: a.description, url: `${BASE}/blog/${a.slug}`, publishedTime: a.published, modifiedTime: a.updated ?? a.published },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { article: a, all } = await find(slug)
  if (!a) notFound()
  const toc = headingsOf(a.body)
  const more = all.filter((x) => x.slug !== a.slug).slice(0, 3)
  const url = `${BASE}/blog/${a.slug}`
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': a.kind === 'news' ? 'NewsArticle' : 'Article',
      headline: a.title,
      description: a.description,
      datePublished: a.published,
      dateModified: a.updated ?? a.published,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'SaySites', url: BASE },
      publisher: { '@type': 'Organization', name: 'SaySites', url: BASE, logo: { '@type': 'ImageObject', url: `${BASE}/apple-touch-icon.png` } },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/blog` },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    },
  ]

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <article className="post">
        <div className="wrap post-wrap">
          <nav className="post-crumbs" aria-label="Breadcrumb"><a href="/blog">Blog</a> / {KIND_LABEL[a.kind]}</nav>
          <header className="post-head">
            <h1>{a.title}</h1>
            <p className="post-lede">{a.description}</p>
            <p className="blog-meta">By SaySites · <time dateTime={a.published}>{day(a.published)}</time>{a.updated && a.updated !== a.published ? <> · updated <time dateTime={a.updated}>{day(a.updated)}</time></> : null} · {readingMinutes(a.body)} min read</p>
          </header>
          {a.summary.length > 0 && (
            <aside className="post-key" aria-label="Key points">
              <h2>Key points</h2>
              <ul>{a.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </aside>
          )}
          {toc.length > 2 && (
            <nav className="post-toc" aria-label="In this article">
              <h2>In this article</h2>
              <ol>{toc.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
            </nav>
          )}
          <div className="post-body" dangerouslySetInnerHTML={{ __html: renderBody(a.body) }} />
          <aside className="post-cta">
            <h2>See how your own site measures up.</h2>
            <p>Send us your website and we’ll redesign it, free, built to everything in this guide.</p>
            <a className="b b-dark" href="/redesign">Get a free redesign</a>
          </aside>
          {more.length > 0 && (
            <nav className="post-more" aria-label="More articles">
              <h2>More from the blog</h2>
              <ul>{more.map((m) => <li key={m.slug}><a href={`/blog/${m.slug}`}>{m.title}</a></li>)}</ul>
            </nav>
          )}
        </div>
      </article>
    </MarketingShell>
  )
}
