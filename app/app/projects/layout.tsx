'use client'

import { AuthProvider } from '../lib/auth-context'
import { AppHeader, RequireAuth } from '../lib/ui'
import { PilotBar } from '../lib/PilotBar'
import '@/app/rankforge/rankforge.css'

// All /app/projects/** screens are authenticated and share the app shell.
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <AppHeader />
        <RequireAuth>
          <PilotBar />
          <main className="mx-auto max-w-5xl px-5 pb-8 pt-2">{children}</main>
        </RequireAuth>
      </div>
    </AuthProvider>
  )
}
