import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'ReadyAI — Make Any Website AI-Ready in One Click',
  description:
    'Run a free AI-readiness test on any website. Connect your CMS for a full implementation plan, then deploy a chatbot, AI-readability, schema, search, and lead capture in one click for $9.99.',
}

export default function GetStartedLayout({ children }: { children: ReactNode }) {
  return children
}
