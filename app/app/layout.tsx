import type { Metadata } from 'next'
import '../rankforge/rankforge.css'

export const metadata: Metadata = {
  title: 'RankForge AI — SEO Command Center',
  description: 'Your all-in-one SEO command center: site audits, content, rankings, backlinks, and WordPress.',
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="rf-root min-h-screen bg-[var(--rf-bg)]">{children}</div>
}
