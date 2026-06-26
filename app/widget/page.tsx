import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import '../rankforge/rankforge.css'
import { ScanWidget } from './widget'

export const metadata: Metadata = {
  title: 'Free SEO Audit — RankForge AI',
  description: 'Run a free on-page SEO audit powered by RankForge AI.',
  robots: { index: false, follow: false },
}

// Accept only a safe hex color so the value can't break out of the style attr.
function safeHex(input?: string): string | null {
  if (!input) return null
  const v = input.startsWith('#') ? input : `#${input}`
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : null
}

// Only allow http(s) image URLs for the logo.
function safeUrl(input?: string): string | undefined {
  if (!input) return undefined
  try {
    const u = new URL(input)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : undefined
  } catch {
    return undefined
  }
}

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{
    domain?: string
    accent?: string
    logo?: string
    name?: string
  }>
}) {
  const sp = await searchParams
  const accent = safeHex(sp.accent)
  const logo = safeUrl(sp.logo)
  const name = sp.name ? sp.name.slice(0, 40) : undefined

  // Per-embed accent: override the blue/cyan accents used across the widget.
  const style: CSSProperties = { background: 'transparent', padding: '8px' }
  if (accent) {
    const s = style as Record<string, string>
    s['--rf-blue'] = accent
    s['--rf-blue-bright'] = accent
    s['--rf-cyan'] = accent
  }

  return (
    <div className="rf-root" style={style}>
      <ScanWidget initialDomain={sp.domain ?? ''} brand={{ name, logo }} />
    </div>
  )
}
