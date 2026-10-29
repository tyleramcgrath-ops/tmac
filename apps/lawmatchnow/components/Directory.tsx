import Link from 'next/link'
import { AttorneyCard, CaseReviewCard, Pager } from '@/components/ui'
import { searchAttorneys, type AttorneyQuery } from '@/lib/directory'

/** Attorney results plus the sidebar, shared by search, practice, state and city pages. */
export async function DirectoryResults({ query, heading, basePath, practiceSlug, aside, emptyHint }: {
  query: AttorneyQuery
  heading: string
  basePath: string
  practiceSlug?: string
  aside?: React.ReactNode
  emptyHint?: React.ReactNode
}) {
  const page = query.page ?? 1
  const { items, total, pages } = await searchAttorneys({ ...query, perPage: 15 })
  const sep = basePath.includes('?') ? '&' : '?'
  return (
    <div className="layout">
      <div>
        <div className="results-bar">
          <h2>{heading}</h2>
          {total > 0 && <span className="muted">{total.toLocaleString()} {total === 1 ? 'listing' : 'listings'}</span>}
        </div>
        {items.length ? (
          <div className="list">{items.map((a) => <AttorneyCard key={a.id} a={a} />)}</div>
        ) : (
          <div className="empty">
            <h3>We&apos;re still adding attorneys here.</h3>
            <p className="muted">
              We only list attorneys we can show accurate details for, so some searches are thin while the directory grows.
              {emptyHint ? <> {emptyHint}</> : null}
            </p>
            <p style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: 0 }}>
              <Link className="btn btn-primary" href={practiceSlug ? `/get-started?practice=${practiceSlug}` : '/get-started'}>Get a free case review</Link>
              <Link className="btn btn-ghost" href="/find-a-lawyer">Search everywhere</Link>
            </p>
          </div>
        )}
        <Pager page={page} pages={Math.min(pages, 50)} href={(p) => (p === 1 ? basePath : `${basePath}${sep}page=${p}`)} />
      </div>
      <aside className="sidebar">
        <CaseReviewCard practice={practiceSlug} />
        {aside}
        <div className="card">
          <h3>Are you an attorney here?</h3>
          <p>Claim your free profile so clients can see your practice areas, experience and contact details.</p>
          <p style={{ marginTop: 12 }}><Link className="link-arrow" href="/for-attorneys#claim">Claim your profile</Link></p>
        </div>
      </aside>
    </div>
  )
}

export const pageParam = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isInteger(n) && n > 1 && n <= 50 ? n : 1
}
