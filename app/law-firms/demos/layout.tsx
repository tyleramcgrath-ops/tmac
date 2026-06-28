import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Live Demos & AI Implementations — FirmAI for Law Firms',
  description:
    'Try interactive demos of the AI tools we build for law firms — contract risk analysis, document summarization, grounded legal research, client intake & conflict checks, and PII redaction — with a plain-English explanation of each implementation.',
}

export default function DemosLayout({ children }: { children: ReactNode }) {
  return children
}
