import { notFound } from 'next/navigation'
import { SiteTabs } from '@/components/SiteTabs'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { liveUrl, previewPath } from '@/lib/urls'

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const unread = await store.unreadCount(site.id)

  return (
    <>
      <div className="site-head">
        <div className="site-head-id">
          <span className="site-mono" style={{ background: site.globals.colors.primary }} aria-hidden="true">{site.business.name.trim().charAt(0).toUpperCase()}</span>
          <div>
            <p className="crumbs"><a href="/dashboard">My sites</a> / {site.business.name}</p>
            <h1>{site.business.name}</h1>
            <span className="url muted">{liveUrl(site).replace('https://', '')}</span>
          </div>
        </div>
        <a className="btn btn-ghost" href={previewPath(site)} target="_blank" rel="noopener">View website ↗</a>
      </div>
      <SiteTabs siteId={site.id} unread={unread} />
      {children}
    </>
  )
}
