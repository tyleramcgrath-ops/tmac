import { notFound } from 'next/navigation'
import { PostForm } from '@/components/PostForm'
import { PHOTOS } from '@/lib/photos'
import { postBodyText } from '@/lib/posts'
import { formatDate } from '@/lib/render'
import { pagePath } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { BUSINESS_TYPES } from '@/lib/starter'
import { getStore } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { deletePost, savePost } from '../manage-actions'

export default async function PostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const posts = (await store.pagesForSite(site.id)).filter((p) => p.post && p.status === 'published').sort((a, b) => b.post!.date.localeCompare(a.post!.date))
  const type = (Object.entries(BUSINESS_TYPES).find(([, t]) => t.schemaType === site.business.schemaType)?.[0] ?? 'other') as keyof typeof PHOTOS
  const set = PHOTOS[type] ?? PHOTOS.other
  const own = (await store.mediaForSite(site.id)).filter((m) => m.mime !== 'image/svg+xml').map((m) => ({ src: `/u/${m.id}`, alt: m.alt }))
  const photos = [...own, set.hero, ...set.cards].map((p) => ({ src: p.src, alt: p.alt }))
  const today = new Date().toISOString().slice(0, 10)
  const ideas = ['Answer the question customers ask you most', `What to expect on a first visit to ${site.business.name}`, 'A recent job you’re proud of, start to finish', 'Seasonal tips for this time of year']

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Blog</h2>
          <p className="muted">Helpful posts are one of the best ways to show up on Google. Each one gets its own page, is added to your sitemap, and is marked up for search.</p>
        </div>
        {posts.length > 0 && <a className="btn btn-ghost btn-sm" href={`${previewPath(site)}/blog`} target="_blank" rel="noopener">View blog ↗</a>}
      </div>

      <div className="post-layout">
        <div className="card">
          <h3>Write a post</h3>
          <PostForm action={savePost.bind(null, site.id, 'new')} values={{ title: '', date: today, body: '', imageSrc: '', imageAlt: '' }} photos={photos} isNew />
        </div>
        <aside className="card sofie-card">
          <h3>Not sure what to write?</h3>
          <ul className="ideas">{ideas.map((i) => <li key={i}>{i}</li>)}</ul>
          <p className="muted small">Or ask Sofie: “Write a blog post answering the question customers ask us most.”</p>
          <a className="btn btn-ghost btn-sm" href={`/dashboard/sites/${site.id}/sofie`}>Open Sofie</a>
        </aside>
      </div>

      {posts.map((p) => (
        <details key={p.id} className="card product-row">
          <summary>
            {p.post!.image ? <img src={p.post!.image.src.replace(/w=\d+/, 'w=160')} alt="" /> : <span className="pr-dot">✎</span>}
            <strong>{p.post!.title}</strong>
            <span className="muted small">{formatDate(p.post!.date)}</span>
            <a className="small" href={previewPath(site) + pagePath(p)} target="_blank" rel="noopener">View ↗</a>
            <span className="muted small edit">Edit</span>
          </summary>
          <div style={{ padding: '0 18px 18px' }}>
            <PostForm
              action={savePost.bind(null, site.id, p.id)}
              values={{ title: p.post!.title, date: p.post!.date, body: postBodyText(p), imageSrc: p.post!.image?.src ?? '', imageAlt: p.post!.image?.alt ?? '' }}
              photos={photos}
              isNew={false}
            />
            <form action={deletePost.bind(null, site.id, p.id)} className="del-row" style={{ padding: 0, marginTop: 8 }}>
              <button className="btn btn-ghost btn-sm danger" type="submit">Remove post</button>
            </form>
          </div>
        </details>
      ))}
    </section>
  )
}
