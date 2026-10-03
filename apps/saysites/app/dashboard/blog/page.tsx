import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { KIND_LABEL, allArticles } from '@/lib/articles'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

// saysites.com's blog, for the team: every article, published or not.
export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ removed?: string }> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const { removed } = await searchParams
  const articles = await allArticles(getStore())
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="narrow stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Blog</p>
          <h1>Blog</h1>
          <p className="muted" style={{ margin: 0 }}>Guides and news on saysites.com/blog.</p>
        </div>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-ghost" href="/blog" target="_blank" rel="noopener">View blog ↗</a>
          <a className="btn btn-primary" href="/dashboard/blog/edit">New article</a>
        </span>
      </div>
      {removed && <p className="notice good">Taken down. It’s no longer on the blog.</p>}
      <div className="card">
        <ul className="team-list">
          {articles.map((a) => (
            <li key={a.slug}>
              <span>
                <strong><a href={`/dashboard/blog/edit?slug=${a.slug}`}>{a.title}</a></strong>
                <span className="muted small"> · {KIND_LABEL[a.kind]} · {a.published}</span>
              </span>
              <span className="muted small">{a.status === 'draft' ? 'Draft' : a.published > today ? 'Scheduled' : 'Live'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3>Writing for the blog</h3>
        <ul className="small muted">
          <li>Answer the reader’s question in the first lines, then explain. Use real questions as ## headings.</li>
          <li>No invented numbers, studies, quotes or results. Link every outside fact to its source, Google’s own documentation where possible.</li>
          <li>Never promise rankings or leads, and never name or make claims about another company.</li>
        </ul>
      </div>
    </div>
  )
}
