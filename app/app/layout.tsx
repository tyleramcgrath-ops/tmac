import type { Metadata } from 'next'
import '../rankforge/rankforge.css'

export const metadata: Metadata = {
  title: 'RankForge — SEO Projects',
  description: 'Persistent SEO projects: crawl audits, evidence-backed recommendations, and auditable WordPress deployments.',
  robots: { index: false, follow: false },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="rf-root min-h-screen bg-[var(--rf-bg)]">{children}</div>
}
