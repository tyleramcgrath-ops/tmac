import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { AppShell } from '@/components/shell'
import { TraderProvider } from '@/components/trader-context'

export const metadata: Metadata = {
  title: 'TMAC Trader — Automated Trading Dashboard',
  description: 'Safe-by-default automated trading. Paper trading first; live trading locked behind explicit confirmation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <TraderProvider>
            <AppShell>{children}</AppShell>
          </TraderProvider>
        </Providers>
      </body>
    </html>
  )
}
