'use client'

import { AuthProvider } from '../lib/auth-context'
import '@/app/rankforge/rankforge.css'

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="rf-root min-h-screen bg-[var(--rf-bg)]">{children}</div>
    </AuthProvider>
  )
}
