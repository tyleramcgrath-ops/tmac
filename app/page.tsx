import type { Metadata } from 'next'
import { RankForgeSite } from './rankforge/components/rankforge-site'

export const metadata: Metadata = {
  title: 'RankForge AI — The Ruthless SEO & AI Search Command Center',
  description:
    'Run technical audits, content briefs, AI search tracking, competitor gaps, schema, local maps, rank tracking, backlinks, and white-label client reports from one command center. Replace your entire SEO stack.',
  openGraph: {
    title: 'RankForge AI — Dominate Google, AI Search, and Local Rankings',
    description:
      'One ruthless SEO command center for agencies, consultants, and businesses. Replace Semrush, Ahrefs, Surfer, Screaming Frog, BrightLocal, and Looker Studio.',
  },
}

export default function HomePage() {
  return <RankForgeSite />
}
