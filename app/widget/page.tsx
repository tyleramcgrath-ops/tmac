import type { Metadata } from 'next'
import '../rankforge/rankforge.css'
import { ScanWidget } from './widget'

export const metadata: Metadata = {
  title: 'Free SEO Audit — RankForge AI',
  description: 'Run a free on-page SEO audit powered by RankForge AI.',
  robots: { index: false, follow: false },
}

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>
}) {
  const { domain = '' } = await searchParams
  return (
    <div
      className="rf-root"
      style={{ background: 'transparent', padding: '8px' }}
    >
      <ScanWidget initialDomain={domain} />
    </div>
  )
}
