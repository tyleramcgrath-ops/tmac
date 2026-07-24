'use client'

// Generic pausable polling hook shared by every "live" Headquarters panel.
// Pauses while the tab is hidden and while `enabled` is false (e.g. the
// panel isn't summoned), resuming with an immediate refresh on return. Uses
// a recursive setTimeout rather than setInterval so a slow request can't
// stack overlapping requests.

import { useEffect, useRef, useState } from 'react'

export interface LivePollResult<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export function useLivePoll<T>(
  fetcher: () => Promise<T>,
  { enabled, intervalMs }: { enabled: boolean; intervalMs: number }
): LivePollResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    function schedule() {
      timer = setTimeout(tick, intervalMs)
    }

    async function tick() {
      timer = null
      try {
        const result = await fetcherRef.current()
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not refresh.')
      } finally {
        if (!cancelled) setLoading(false)
      }
      if (!cancelled && !document.hidden) schedule()
    }

    function onVisibility() {
      if (!document.hidden && !timer && !cancelled) void tick()
    }

    document.addEventListener('visibilitychange', onVisibility)
    void tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, intervalMs])

  return { data, error, loading }
}
