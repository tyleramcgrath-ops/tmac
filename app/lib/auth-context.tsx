'use client'

// Session context. Loads /api/auth/me once, exposes the user + orgs and a
// loading flag so screens can show a real loading state (never a fake
// authenticated shell before the session is known).

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, type Org, type SessionUser } from './client'

interface AuthState {
  user: SessionUser | null
  orgs: Org[]
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user, orgs } = await api.me()
      setUser(user)
      setOrgs(orgs ?? [])
    } catch {
      setUser(null)
      setOrgs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => {})
    setUser(null)
    setOrgs([])
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return <Ctx.Provider value={{ user, orgs, loading, refresh, logout }}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
