import type { Metadata } from 'next'
import Link from 'next/link'
import { pageParam } from '@/components/Directory'
import { CtaBand, PageHero, Pager } from '@/components/ui'
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
  const { items, pages } = await listPosts(page, 12)
  return (
    <>
      <PageHero crumbs={[{ name: 'Legal News', path: '/blog' }]} eyebrow="Legal news" title="Legal news, explained" lede="What new cases, rulings and laws mean for you." />
      <section className="section">
        <div className="wrap">
          {items.length ? (
            <div className="grid c3">
              {items.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="card">
                  {p.category && <div className="eyebrow" style={{ marginBottom: 10 }}>{p.category}</div>}
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                  <p style={{ marginTop: 12, fontSize: '0.82rem' }}>{fmtDate(p.created)}</p>
                </Link>
              ))}
            </div>
          ) : <div className="empty"><h3>No posts yet.</h3></div>}
          <Pager page={page} pages={pages} href={(n) => (n === 1 ? '/blog' : `/blog?page=${n}`)} />
        </div>
      </section>
      <CtaBand />
    </>
  )
}
