import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Vibe Coding Platform — describe a vibe, ship the app",
  description:
    "An AI agent that writes full-stack apps from a prompt. Sandboxed execution, live preview, one-click deploy. Powered by Claude, GPT, and Grok.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
