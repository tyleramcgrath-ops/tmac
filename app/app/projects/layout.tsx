'use client'

import { AuthProvider } from '../lib/auth-context'
import { RequireAuth } from '../lib/ui'
import '@/app/rankforge/rankforge.css'

// All /app/projects/** screens are authenticated. The shared layout only owns
// auth (provider + gate); each page renders its own chrome — the projects list
// uses the compact header, the project workspace renders the full-bleed
// Command Center with its own top bar and sidebar.
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <RequireAuth>{children}</RequireAuth>
      </div>
    </AuthProvider>
  )
}
