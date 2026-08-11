'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Account, Scan } from './types'

// The scanner keeps its history on the device. There is no server-side
// account in this build: the workspace is fully interactive and every scan
// you run survives a reload via localStorage. Only the model calls leave
// the browser.

const KEY = 'contact.studios:v1'

interface Persisted {
  account: Account | null
  scans: Scan[]
}

const EMPTY: Persisted = { account: null, scans: [] }

interface StoreValue extends Persisted {
  /** False until localStorage has been read — used to gate skeletons. */
  ready: boolean
  signIn: (account: Account) => void
  signOut: () => void
  saveScan: (scan: Scan) => void
  removeScan: (id: string) => void
  clearScans: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function read(): Persisted {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return { account: parsed.account ?? null, scans: parsed.scans ?? [] }
  } catch {
    return EMPTY
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY)
  const [ready, setReady] = useState(false)

  // Read after mount so server and client render the same first paint.
  useEffect(() => {
    setState(read())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Private mode / quota — the session still works, it just won't persist.
    }
  }, [state, ready])

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      signIn: (account) => setState((prev) => ({ ...prev, account })),
      signOut: () => setState((prev) => ({ ...prev, account: null })),
      saveScan: (scan) =>
        setState((prev) => ({
          ...prev,
          scans: [scan, ...prev.scans.filter((item) => item.id !== scan.id)].slice(0, 20),
        })),
      removeScan: (id) =>
        setState((prev) => ({ ...prev, scans: prev.scans.filter((scan) => scan.id !== id) })),
      clearScans: () => setState((prev) => ({ ...prev, scans: [] })),
    }),
    [state, ready]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}
