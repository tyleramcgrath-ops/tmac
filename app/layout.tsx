import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO Competitor Intelligence',
  description: 'Compare your page against the top 10 Google organic results for any keyword.',
}

const NAV_LINKS = [
  { href: '/', label: 'New Analysis' },
  { href: '/reports', label: 'Report History' },
  { href: '/settings', label: 'Settings' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">
                SI
              </span>
              <span className="text-base font-semibold tracking-tight text-slate-900">
                SEO Competitor <span className="text-blue-700">Intelligence</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-slate-400 sm:px-6">
          SEO Competitor Intelligence — SERP data via SerpAPI · Speed via Google PageSpeed Insights · Backlinks via DataForSEO
        </footer>
      </body>
    </html>
  )
}
