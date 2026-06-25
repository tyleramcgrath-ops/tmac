import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Get Started — Make Your Firm’s Site AI-Ready in One Click | FirmAI',
  description:
    'Sign up, connect your website and CMS, and one-click deploy AI tools — a site chatbot, AI-readability (llms.txt + schema), semantic search, and lead capture — built for law firms.',
}

export default function GetStartedLayout({ children }: { children: ReactNode }) {
  return children
}
