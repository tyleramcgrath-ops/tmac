import type { Metadata } from 'next'
import { RankForgeSite } from './components/rankforge-site'

export const metadata: Metadata = {
  title: 'RankForge AI — The Ruthless SEO & AI Search Command Center',
  description:
    'Run technical audits, content briefs, AI search tracking, competitor gaps, schema, local maps, rank tracking, backlinks, and white-label client reports from one command center. Replace your entire SEO stack.',
}

export default function RankForgePage() {
  return <RankForgeSite />
}
