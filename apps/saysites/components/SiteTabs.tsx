'use client'

import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/team'

// The tabs under a site's name in the dashboard.
export function SiteTabs({ siteId, unread, role = 'owner' }: { siteId: string; unread: number; role?: Role }) {
  const path = usePathname()
  const base = `/dashboard/sites/${siteId}`
  const all = [
    { href: base, label: 'Overview' },
    { href: `${base}/visibility`, label: 'Visibility' },
    { href: `${base}/seo`, label: 'SEO' },
    { href: `${base}/sofie`, label: 'Sofie' },
    { href: `${base}/leads`, label: 'Leads', badge: unread },
    { href: `${base}/reviews`, label: 'Reviews' },
    { href: `${base}/promote`, label: 'Promote' },
    { href: `${base}/visitors`, label: 'Visitors' },
    { href: `${base}/pages`, label: 'Pages & SEO' },
    { href: `${base}/photos`, label: 'Photos' },
    { href: `${base}/posts`, label: 'Blog' },
    { href: `${base}/products`, label: 'Products' },
    { href: `${base}/settings`, label: 'Settings' },
  ]
  // Staff work the leads; the rest of the site is the owner's.
  const tabs = role === 'owner' ? all : all.filter((t) => t.label === 'Leads')
  return (
    <nav className="site-tabs" aria-label="Website">
      {tabs.map((t) => {
        const on = t.href === base ? path === base : path.startsWith(t.href)
        return (
          <a key={t.href} href={t.href} aria-current={on ? 'page' : undefined}>
            {t.label}
            {t.badge ? <span className="badge" aria-label={`${t.badge} unread`}>{t.badge}</span> : null}
          </a>
        )
      })}
    </nav>
  )
}
