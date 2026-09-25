import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// One typeface everywhere, self-hosted so builds never depend on a font CDN.
const sans = localFont({
  src: [{ path: './fonts/instrument-sans.woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 100%' }],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://saysites.com'),
  title: { default: 'SaySites: say what your business does, get a website that ranks', template: '%s | SaySites' },
  description: 'Describe your business in a sentence and SaySites builds a fast, fully SEO-optimized website. $15 a month, and 0% of your sales. Ever.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  )
}
