import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://saysites.com'),
  title: { default: 'SaySites: tell it about your business, get a website that ranks', template: '%s | SaySites' },
  description: 'SaySites builds a clean, fast, SEO-ready website from a few sentences about your business, then changes anything you ask. Cheaper than Shopify, and 0% of your sales.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
