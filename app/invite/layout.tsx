'use client'

import { AuthProvider } from '../lib/auth-context'

// No RequireAuth here — the invite page must render for logged-out visitors
// (to show "log in or sign up to accept") as well as logged-in ones.
export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
