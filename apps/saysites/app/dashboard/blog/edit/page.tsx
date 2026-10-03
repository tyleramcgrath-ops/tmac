import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { allArticles, renderBody, type Article } from '@/lib/articles'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { removeArticle, saveArticle } from '../actions'

export const dynamic = 'force-dynamic'

const BLANK: Article = { slug: '', title: '', description: '', kind: 'guide', summary: [], body: '', published: new Date().toISOString().slice(0, 10), status: 'draft' }

// Write or edit one article. The preview below shows the body as it'll appear.
export default async function EditArticle({ searchParams }: { searchParams: Promise<{ slug?: string; saved?: string; error?: string }> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const { slug, saved, error } = await searchParams
  const found = slug ? (await allArticles(getStore())).find((a) => a.slug === slug) : undefined
  if (slug && !found) notFound()
  const a = found ?? BLANK

  return (
    <div className="narrow stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / <a href="/dashboard/blog">Blog</a> / {found ? 'Edit' : 'New'}</p>
          <h1>{found ? a.title : 'New article'}</h1>
        </div>
        {found && a.status === 'published' && <a className="btn btn-ghost" href={`/blog/${a.slug}`} target="_blank" rel="noopener">View ↗</a>}
      </div>
      {saved && <p className="notice good">Saved{a.status === 'published' ? ' and live.' : ' as a draft.'}</p>}
      {error && <p className="notice bad">{error}</p>}

      <form action={saveArticle} className="card stack">
        <input type="hidden" name="original" value={a.slug} />
        <label className="field"><span>Title</span><input className="input" name="title" defaultValue={a.title} required maxLength={110} placeholder="How AI search decides which businesses to mention" /></label>
        <label className="field"><span>Address</span><input className="input" name="slug" defaultValue={a.slug} maxLength={80} placeholder="Made from the title if left empty" /><small>saysites.com/blog/<b>your-address</b></small></label>
        <label className="field"><span>Description</span><textarea className="input" name="description" rows={2} defaultValue={a.description} required maxLength={170} /><small>50 to 170 characters. Shown in Google and on the blog list.</small></label>
        <div className="field-row">
          <label className="field"><span>Type</span><select className="input" name="kind" defaultValue={a.kind}><option value="guide">Guide</option><option value="news">News</option></select></label>
          <label className="field"><span>Publish date</span><input className="input" type="date" name="published" defaultValue={a.published} /></label>
          <label className="field"><span>Status</span><select className="input" name="status" defaultValue={a.status}><option value="draft">Draft</option><option value="published">Published</option></select></label>
        </div>
        <label className="field"><span>Key points</span><textarea className="input" name="summary" rows={4} defaultValue={a.summary.join('\n')} /><small>One per line, up to five. Shown first, so readers (and AI answers) get the answer straight away.</small></label>
        <label className="field"><span>Article</span><textarea className="input mono" name="body" rows={24} defaultValue={a.body} required /><small>## Heading, ### Smaller heading, - list item, 1. numbered item, &gt; quote, **bold**, [link text](https://…). A blank line between paragraphs.</small></label>
        <div><button className="btn btn-primary" type="submit">Save</button></div>
      </form>

      {found && (
        <>
          <div className="card">
            <h3>Preview</h3>
            <div className="post-preview" dangerouslySetInnerHTML={{ __html: renderBody(a.body) }} />
          </div>
          <details className="card">
            <summary className="small">Take this article down</summary>
            <form action={removeArticle.bind(null, a.slug)} style={{ marginTop: 12 }}>
              <button className="btn btn-sm btn-danger" type="submit">Take it down</button>
            </form>
          </details>
        </>
      )}
    </div>
  )
}
