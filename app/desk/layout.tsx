import type { Metadata } from 'next'
import '../rankforge/rankforge.css'
import '../north-star/north-star.css'
import './desk.css'

export const metadata: Metadata = {
  title: 'North Star Headquarters — The Command Table',
  description: 'One compass. Endless clarity.',
  robots: { index: false, follow: false },
}

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <div className="rf-root ns-root hz-root min-h-screen">{children}</div>
}
