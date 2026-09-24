import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Self-hosted, so builds never depend on a font CDN and pages never wait on one.
// Archivo is variable in weight and width: the same file gives the wide,
// heavy display headlines and the normal-width body text.
const sans = localFont({
  src: [{ path: './fonts/archivo.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
})
const serif = localFont({
  src: [{ path: './fonts/instrument-serif-italic.woff2', weight: '400', style: 'italic' }],
  variable: '--font-serif',
  display: 'swap',
})
const mono = localFont({
  src: [{ path: './fonts/plex-mono-500.woff2', weight: '500', style: 'normal' }],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://saysites.com'),
  title: { default: 'SaySites: say what your business does, get a website that ranks', template: '%s | SaySites' },
  description: 'Describe your business in a sentence and SaySites builds a fast, Google-ready website. $15 a month, and 0% of your sales. Ever.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
