import '../rankforge/rankforge.css'
import type { ReactNode } from 'react'
import { ScanProvider } from '../rankforge/components/scan'
import { DemoProvider } from '../rankforge/components/demo'
import { Footer } from '../rankforge/components/pricing-cta'
import { SiteNav } from './_components/site-nav'

// Shared chrome for the public marketing site. Each route under (marketing) is a
// real, separately-crawlable page (good SEO — we practice what we sell) that
// shares this nav + footer. The app itself lives at /projects (the client area).
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="rf-root">
      <ScanProvider>
        <DemoProvider>
          <div className="min-h-screen bg-[var(--rf-bg)]">
            <SiteNav />
            <main>{children}</main>
            <Footer />
          </div>
        </DemoProvider>
      </ScanProvider>
    </div>
  )
}
