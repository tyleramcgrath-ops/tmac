import type { Metadata } from 'next'
import { RankForgeSite } from './rankforge/components/rankforge-site'

export const metadata: Metadata = {
  title: 'RankForge AI — SEO Audit & AI-Assisted Optimization Command Center',
  description:
    'Crawl up to 300 pages and get technical, content, schema, and AI-readiness scores with a prioritized fix list. Check keyword rankings, compare against the top 10, deploy approved fixes to WordPress, and work with Forge — your AI SEO assistant.',
  openGraph: {
    title: 'RankForge AI — Audit Your Site. Fix What Matters. Deploy With Confidence.',
    description:
      'Full-site SEO audits, prioritized fix lists, review-and-approve WordPress deploys, and an AI assistant grounded in your crawl — one command center that consolidates your core SEO workflow.',
  },
}

export default function HomePage() {
  return <RankForgeSite />
}
