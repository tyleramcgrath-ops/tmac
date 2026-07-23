import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './hq.css'

// Bible §13 typography: an institutional serif for ceremonial moments paired
// with a highly legible modern sans for operational detail.
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-hq-serif',
  display: 'swap',
})
const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-hq-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Headquarters — North Star',
  description: 'The North Star headquarters.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0B0B0D',
}

export default function HqLayout({ children }: { children: ReactNode }) {
  return <div className={`hq-root ${serif.variable} ${sans.variable}`}>{children}</div>
}
