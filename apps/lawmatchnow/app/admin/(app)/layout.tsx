import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/admin/auth'
import { hasDb } from '@/lib/admin/db'
import { logout } from '../actions'

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s · Dashboard' }, robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/traffic', label: 'Traffic' },
  { href: '/admin/seo', label: 'SEO' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/settings', label: 'Settings' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()
  return (
    <div className="ad">
      <div className="ad-bar">
        <div className="wrap ad-bar-in">
          <nav aria-label="Dashboard">{NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}</nav>
          <form action={logout}><button className="ad-out">Sign out</button></form>
        </div>
      </div>
      {!hasDb() && (
        <div className="wrap"><div className="ad-warn">No database connected, so leads and traffic aren&apos;t being stored yet. Add <code>DATABASE_URL</code> in SiteGround (see <Link href="/admin/settings">Settings</Link>).</div></div>
      )}
      <div className="wrap ad-main">{children}</div>
    </div>
  )
}
