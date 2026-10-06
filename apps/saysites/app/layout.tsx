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
  title: { default: 'SaySites: say it, and your website does it', template: '%s | SaySites' },
  description: 'Tell Sofie about your business and watch your website appear, then change anything by saying so. Fast, SEO fully optimized websites for small businesses.',
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.png', sizes: '32x32', type: 'image/png' }], apple: '/apple-touch-icon.png' },
  // The picture shown when someone shares a SaySites link in a text or DM.
  openGraph: { siteName: 'SaySites', type: 'website', images: [{ url: '/og-home.jpg', width: 1200, height: 630, alt: 'SaySites: Your site. Your say.' }] },
  twitter: { card: 'summary_large_image', images: ['/og-home.jpg'] },
}

// Google Analytics for saysites.com itself (marketing pages and dashboard).
// Customer websites never load it: they're served as plain HTML by route
// handlers, not through this layout. Google's own snippet, in <head> so
// Google's setup check finds it; the script loads async, never blocking.
const GA_ID = 'G-KP42T8YXTF'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA_ID}');` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
