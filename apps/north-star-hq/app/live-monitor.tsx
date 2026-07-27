'use client'

// A real, ambient "it's alive and watching" indicator — not a decorative
// loop. Polls the real Activity Stream (the same single event log every
// domain action already writes to) and shows genuine elapsed time since the
// last real event, plus a live pulse while a poll is actually in flight.
// Nothing here is invented: if there's no activity yet, it says so.

import { useEffect, useState } from 'react'
import { api } from './lib/client'
import { useLivePoll } from './_lib/use-live-poll'

const POLL_MS = 20_000

function relativeTime(iso: string, nowMs: number): string {
  const deltaS = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 1000))
  if (deltaS < 5) return 'just now'
  if (deltaS < 60) return `${deltaS}s ago`
  const m = Math.round(deltaS / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default function LiveMonitor({ projectId, enabled }: { projectId: string | null; enabled: boolean }) {
  const { data, loading } = useLivePoll(
    async () => {
      if (!projectId) throw new Error('no project')
      return api.getActivity(projectId, { limit: 1 })
    },
    { enabled: enabled && !!projectId, intervalMs: POLL_MS }
  )
  // ticks the relative-time text once a second between polls, so it visibly
  // counts up rather than only updating every 20s
  const [nowMs, setNowMs] = useState<number | null>(null)
  useEffect(() => {
    if (!enabled) return
    setNowMs(Date.now())
    const t = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [enabled])

  if (!enabled || !projectId || nowMs === null) return null

  const latest = data?.events[0]

  return (
    <p className="ns-livemon" data-pulse={loading ? '' : undefined} aria-live="polite">
      <span className="ns-livemon-dot" aria-hidden />
      {latest ? `Watching your site — synced ${relativeTime(latest.at, nowMs)}` : 'Watching your site — no activity yet'}
    </p>
  )
}
