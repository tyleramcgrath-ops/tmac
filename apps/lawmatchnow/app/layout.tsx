import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Public_Sans } from 'next/font/google'
import { Footer, Header } from '@/components/Shell'
import { JsonLd } from '@/components/ui'
import { SITE, orgLd, websiteLd } from '@/lib/site'
import './globals.css'

const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap' })
const sans = Public_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

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

export const viewport: Viewport = { themeColor: '#0e1726', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${display.variable} ${sans.variable}`}>
      <body>
        <JsonLd data={[orgLd, websiteLd]} />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
