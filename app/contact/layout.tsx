import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import { StoreProvider } from './_lib/store'
import './contact.css'

// Fraunces carries the editorial voice and makes the big result figures feel
// authored rather than dashboarded; Instrument Sans keeps the interface crisp
// underneath it; JetBrains Mono handles labels and tabular data.
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

const title = 'Contact Studios — the search agency built for what’s next'
const description =
  'SEO, content and video for the age of AI search. Scan how your brand ranks inside ChatGPT answers — free, and generated live.'

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
