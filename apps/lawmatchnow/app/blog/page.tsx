import type { Metadata } from 'next'
import Link from 'next/link'
import { pageParam } from '@/components/Directory'
import { RevealOnScroll } from '@/components/fx/Reveal'
import { Photo } from '@/components/Photo'
import { TopicHero } from '@/components/TopicHero'
import { CtaBand, Pager } from '@/components/ui'
import { listPosts } from '@/lib/directory'
import { fmtDate } from '@/lib/site'

type Props = { searchParams: Promise<{ page?: string }> }
export const revalidate = 3600

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const paged = pageParam((await searchParams).page) > 1
  return {
    title: 'Legal News and Analysis',
    description: 'Explainers on legal news, court decisions and law changes, and what they mean for everyday people.',
    alternates: { canonical: '/blog' },
    robots: paged ? { index: false, follow: true } : undefined,
  }
}

export default async function Blog({ searchParams }: Props) {
  const page = pageParam((await searchParams).page)
  const { items, pages } = await listPosts(page, 13)
  const [lead, ...rest] = page === 1 ? items : [undefined, ...items]
  return (
    <>
      <RevealOnScroll />
      <TopicHero crumbs={[{ name: 'Legal News', path: '/blog' }]} eyebrow="Legal news" title={<>The news, and what it <em>means for you.</em></>}
        lede="Plain-English explainers on cases, rulings and new laws, written for people rather than lawyers." />
      <section className="section">
        <div className="wrap">
          {lead && (
            <Link href={`/blog/${lead.slug}`} className="gfeat reveal">
              <div className="gfeat-photo"><Photo name="scotus" sizes="(min-width: 1000px) 55vw, 100vw" /></div>
              <div className="gfeat-body">
                <span className="kicker">Latest{lead.category ? ` · ${lead.category}` : ''} · {fmtDate(lead.created)}</span>
                <h2>{lead.title}</h2>
                <p>{lead.excerpt}</p>
                <span className="btn btn-primary">Read the story →</span>
              </div>
            </Link>
          )}
          {rest.length > 0 ? (
            <div className="news-grid reveal">
              {rest.filter(Boolean).map((p) => p && (
                <Link key={p.id} href={`/blog/${p.slug}`} className="news-card">
                  <span className="kicker">{p.category || 'Legal news'}</span>
                  <span className="news-t">{p.title}</span>
                  <span className="news-d">{p.excerpt}</span>
                  <span className="news-date">{fmtDate(p.created)} <i aria-hidden="true">→</i></span>
                </Link>
              ))}
            </div>
          ) : !lead && <div className="empty"><h3>No posts yet.</h3></div>}
          <Pager page={page} pages={pages} href={(n) => (n === 1 ? '/blog' : `/blog?page=${n}`)} />
        </div>
      </section>
      <CtaBand />
    </>
  )
}
