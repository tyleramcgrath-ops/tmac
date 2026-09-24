import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Self-hosted, so builds never depend on a font CDN and pages never wait on one.
const sans = localFont({
  src: [{ path: './fonts/bricolage.woff2', weight: '300 800', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
})
const serif = localFont({
  src: [{ path: './fonts/instrument-serif-italic.woff2', weight: '400', style: 'italic' }],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://saysites.com'),
  title: { default: 'SaySites: say what your business does, get a website that ranks', template: '%s | SaySites' },
  description: 'Describe your business in a sentence and SaySites builds a fast, Google-ready website. $15 a month, and 0% of your sales. Ever.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
