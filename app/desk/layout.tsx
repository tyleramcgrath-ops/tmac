import type { Metadata } from 'next'
import './desk.css'

export const metadata: Metadata = {
  title: 'North Star Headquarters — The Horizon',
  description: 'One compass. Endless clarity.',
  robots: { index: false, follow: false },
}

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <div className="hz-root">{children}</div>
}
