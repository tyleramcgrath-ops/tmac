import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bidly — Bid on homes like it’s eBay',
  description:
    'Browse, bid on, and win real estate at auction. A Zillow-meets-eBay marketplace for homes, condos, multi-family, and land.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
