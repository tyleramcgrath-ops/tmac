import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ChatProvider } from '@/lib/chat-context'
import { CommandLogsStream } from '@/components/commands-logs/commands-logs-stream'
import { ErrorMonitor } from '@/components/error-monitor/error-monitor'
import { SandboxState } from '@/components/modals/sandbox-state'
import { Toaster } from '@/components/ui/sonner'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { siteUrl } from './lib/site-url'
import './globals.css'

const title = 'RankForge — SEO that safely does the work on your WordPress site'
const description =
  'RankForge audits your WordPress site, fixes what matters, and deploys the change for you — then verifies it by read-back, with one-click rollback. Works with Yoast, Rank Math & AIOSEO.'

export const metadata: Metadata = {
  title: {
    default: title,
    template: '%s',
  },
  description,
  applicationName: 'RankForge',
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
}

// Site-wide structured data: who RankForge is (Organization) and what the
// product is (SoftwareApplication). This is read by both classic search
// (Google's knowledge panel / rich results) and AI search engines (Google
// AI Overviews, Perplexity, ChatGPT search) that ground answers in
// structured data rather than re-parsing prose. Kept honest — every claim
// here matches what's actually shipped, not aspirational marketing copy.
const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RankForge',
  url: siteUrl(),
  description,
  sameAs: [],
}
const APP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RankForge',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free SEO audit, no credit card required.' },
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }} />
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_JSON_LD) }} />
        <Suspense fallback={null}>
          <NuqsAdapter>
            <ChatProvider>
              <ErrorMonitor>{children}</ErrorMonitor>
            </ChatProvider>
          </NuqsAdapter>
        </Suspense>
        <Toaster />
        <CommandLogsStream />
        <SandboxState />
      </body>
    </html>
  )
}
