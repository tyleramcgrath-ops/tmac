import type { Metadata, Viewport } from 'next'
import { Jost, Playfair_Display } from 'next/font/google'
import { Footer, Header } from '@/components/Shell'
import { JsonLd } from '@/components/ui'
import { SITE, orgLd, websiteLd } from '@/lib/site'
import './globals.css'

const display = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '900'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap' })
const sans = Jost({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: Find a Lawyer Near You in All 50 States`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_US', url: SITE.url },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  icons: { icon: '/icon.svg' },
  verification: { google: 'kZSMEKVl7GoLWoAtaMm9-2vGWnxDadxDMYCIktC03NE' },
}

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Motion classes before first paint, so animated sections never flash.
            If the page's scripts don't start within 4s, fall back to static. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(d){var h=d.documentElement;h.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){h.classList.add('fx');setTimeout(function(){if(d.querySelector('.jr')&&!h.classList.contains('jr-live'))h.classList.remove('fx')},4000)}})(document)" }} />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        <JsonLd data={[orgLd, websiteLd]} />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
