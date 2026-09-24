import { notFound } from 'next/navigation'
import { SofieStudio } from '@/components/SofieStudio'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

// Sofie can take a little while on bigger requests.
export const maxDuration = 300

export default async function SofiePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ talk?: string }> }) {
  const [{ id }, { talk }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const [livePages, state] = await Promise.all([store.pagesForSite(site.id), store.sofieState(site.id)])
  // Page tabs follow the site's menu: Home first, then the menu order.
  const nav = (state.draft?.site ?? site).nav.map((n) => n.href)
  const rank = (slug: string) => (slug === '' ? -1 : nav.indexOf(`/${slug}`) === -1 ? 99 : nav.indexOf(`/${slug}`))
  const pages = [...(state.draft?.pages ?? livePages)].sort((a, b) => rank(a.slug) - rank(b.slug)).map((p) => ({ slug: p.slug, name: p.name }))

  return (
    <SofieStudio
      siteId={site.id}
      siteName={site.business.name}
      pages={pages}
      initial={{ chat: state.chat, hasDraft: state.draft !== null, canUndo: state.history.length > 0 }}
      ready={Boolean(process.env.ANTHROPIC_API_KEY)}
      autostart={state.chat.length === 0 ? (talk ?? '').slice(0, 2000) : ''}
    />
  )
}
