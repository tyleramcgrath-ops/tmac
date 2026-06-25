import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Firm AI — AI Implementations Built Exclusively for Law Firms',
  description:
    'We design, build, and deploy secure AI systems for law firms — document review, contract analysis, legal research, and intake automation. Confidentiality-first, integrated with your practice.',
}

export default function LawFirmsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children
}
