import type { Metadata } from 'next'
import '../rankforge/rankforge.css'
import './north-star.css'

export const metadata: Metadata = {
  title: 'North Star — Your business growth advisor',
  description: 'North Star tells you exactly what is working in your business and what to fix first.',
  robots: { index: false, follow: false },
}

export default function NorthStarLayout({ children }: { children: React.ReactNode }) {
  return <div className="rf-root ns-root min-h-screen">{children}</div>
}
