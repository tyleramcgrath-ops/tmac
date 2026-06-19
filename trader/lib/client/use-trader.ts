'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchState, type PublicState } from './api'

// Polling hook for the live application state. The trading engine and all state
// live server-side; the UI polls a sanitized snapshot here.
export function useTrader(intervalMs = 5000) {
  const [state, setState] = useState<PublicState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const s = await fetchState()
      setState(s)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load state')
    }
  }, [])

  useEffect(() => {
    void refresh()
    timer.current = setInterval(() => void refresh(), intervalMs)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [refresh, intervalMs])

  return { state, error, refresh }
}
