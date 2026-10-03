'use server'

import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { allArticles, checkArticle, isLaunchArticle, slugify, DAY, type Article } from '@/lib/articles'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

async function admin() {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  return getStore()
}

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').replace(/\r\n/g, '\n').trim().slice(0, max)

// Saves an article from the editor. A launch article saved here becomes the
// stored copy, which replaces the built-in one from then on.
export async function saveArticle(form: FormData): Promise<void> {
  const store = await admin()
  const original = str(form, 'original', 80)
  const title = str(form, 'title', 110)
  const slug = slugify(str(form, 'slug', 80) || title)
  const today = new Date().toISOString().slice(0, 10)
  const published = DAY.test(str(form, 'published', 10)) ? str(form, 'published', 10) : today
  const a: Article = {
    slug,
    title,
    description: str(form, 'description', 170),
    kind: form.get('kind') === 'news' ? 'news' : 'guide',
    summary: str(form, 'summary', 1200).split('\n').map((l) => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean),
    body: str(form, 'body', 60_000),
    published,
    ...(original && published < today ? { updated: today } : {}),
    status: form.get('status') === 'published' ? 'published' : 'draft',
  }
  const problem = checkArticle(a)
  const back = `/dashboard/blog/edit?slug=${encodeURIComponent(original || '')}`
  if (problem) redirect(`${back}&error=${encodeURIComponent(problem)}`)
  const all = await allArticles(store)
  if (slug !== original && all.some((x) => x.slug === slug)) redirect(`${back}&error=${encodeURIComponent('Another article already uses that address.')}`)
  await store.saveArticle(a)
  // A renamed article: the old address goes away (a launch article is hidden instead).
  if (original && original !== slug) {
    if (isLaunchArticle(original)) {
      const old = all.find((x) => x.slug === original)
      if (old) await store.saveArticle({ ...old, status: 'draft' })
    } else await store.deleteArticle(original)
  }
  revalidatePath('/blog')
  redirect(`/dashboard/blog/edit?slug=${slug}&saved=1`)
}

// Takes an article down. Launch articles can't be deleted from code, so
// they're kept as a draft instead.
export async function removeArticle(slug: string): Promise<void> {
  const store = await admin()
  if (isLaunchArticle(slug)) {
    const a = (await allArticles(store)).find((x) => x.slug === slug)
    if (a) await store.saveArticle({ ...a, status: 'draft' })
  } else await store.deleteArticle(slug)
  revalidatePath('/blog')
  redirect('/dashboard/blog?removed=1')
}
