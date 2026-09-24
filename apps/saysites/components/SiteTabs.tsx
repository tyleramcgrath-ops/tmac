'use client'

import { usePathname } from 'next/navigation'

// The tabs under a site's name in the dashboard.
export function SiteTabs({ siteId, unread }: { siteId: string; unread: number }) {
  const path = usePathname()
  const base = `/dashboard/sites/${siteId}`
  const tabs = [
    { href: base, label: 'Overview' },
    { href: `${base}/sofie`, label: 'Sofie' },
    { href: `${base}/messages`, label: 'Messages', badge: unread },
    { href: `${base}/pages`, label: 'Pages & SEO' },
    { href: `${base}/products`, label: 'Products' },
    { href: `${base}/settings`, label: 'Settings' },
  ]
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
