import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import { StoreProvider } from './_lib/store'
import './contact.css'

// Fraunces carries the editorial voice (soft optical axis, a little wonk at
// display sizes); Instrument Sans keeps the interface crisp underneath it;
// JetBrains Mono handles labels and every number in the product.
const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--ctc-font-display',
})

const body = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--ctc-font-body',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--ctc-font-mono',
})

const title = 'Contact — the network you already have'
const description =
  'Contact keeps every person you have met in one place and tells you, each week, exactly who to reconnect with and why. Powered by Claude.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`ctc ${display.variable} ${body.variable} ${mono.variable}`}>
      <StoreProvider>{children}</StoreProvider>
    </div>
  )
}
