import type { Metadata } from 'next'
import './globals.css'
import './desk.css'

export const metadata: Metadata = {
  title: 'North Star Headquarters',
  description: 'One compass. Endless clarity.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="hz-root">{children}</body>
    </html>
  )
}
