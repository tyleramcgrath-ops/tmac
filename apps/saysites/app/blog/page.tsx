import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { KIND_LABEL, publishedArticles, readingMinutes, type ArticleKind } from '@/lib/articles'
import { getStore } from '@/lib/store'
import '../home.css'
import './blog.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Guides and news on getting found in Google and AI answers',
  description: 'Plain-English guides for law firms, medical practices and local businesses on Google search, AI Overviews and AI answers, plus SaySites news.',
  alternates: { canonical: '/blog', types: { 'application/rss+xml': '/blog/rss.xml' } },
}

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams
  const filter = kind === 'guide' || kind === 'news' ? (kind as ArticleKind) : null
  const all = await publishedArticles(getStore())
  const shown = filter ? all.filter((a) => a.kind === filter) : all

  return (
    <MarketingShell>
      <section className="page-hero blog-hero">
        <div className="wrap">
          <p className="kicker">Blog</p>
          <h1>Getting found in Google and AI answers.</h1>
          <p>Plain-English guides for law firms, medical practices and local businesses, and news from SaySites. No tricks, no invented numbers, and every outside fact linked to its source.</p>
        </div>
      </section>
      <section className="blog-list">
        <div className="wrap">
          <nav className="blog-tabs" aria-label="Filter articles">
            <a href="/blog" aria-current={!filter ? 'page' : undefined}>All</a>
            <a href="/blog?kind=guide" aria-current={filter === 'guide' ? 'page' : undefined}>Guides</a>
            <a href="/blog?kind=news" aria-current={filter === 'news' ? 'page' : undefined}>News</a>
          </nav>
          {shown.length === 0 ? (
            <p className="blog-empty">Nothing here yet.</p>
          ) : (
            <ol className="blog-items">
              {shown.map((a) => (
                <li key={a.slug}>
                  <a href={`/blog/${a.slug}`}>
                    <span className="blog-meta">{KIND_LABEL[a.kind]} · <time dateTime={a.published}>{day(a.published)}</time> · {readingMinutes(a.body)} min read</span>
                    <h2>{a.title}</h2>
                    <p>{a.description}</p>
                  </a>
                </li>
              ))}
            </ol>
          )}
          <p className="blog-rss"><a href="/blog/rss.xml">Follow by RSS</a></p>
        </div>
      </section>
    </MarketingShell>
  )
}
