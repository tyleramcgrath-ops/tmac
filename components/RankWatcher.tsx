'use client'

import { useEffect } from 'react'
import { celebrate } from './Moment'

// When an owner has moved up since they last looked, the moment plays:
// their new position, closed in the quote marks. Once per climb.
export function RankWatcher({ siteId, week, rank, title, caption }: { siteId: string; week: string; rank: number; title: string; caption: string }) {
  useEffect(() => {
    const key = `saysites:rank:${siteId}:${week}`
    let before: number | null = null
    try {
      const raw = window.localStorage.getItem(key)
      before = raw === null ? null : Number(raw)
      window.localStorage.setItem(key, String(rank))
    } catch {}
    if (before !== null && Number.isFinite(before) && rank < before) {
      const t = setTimeout(() => celebrate({ title, caption }), 700)
      return () => clearTimeout(t)
    }
  }, [siteId, week, rank, title, caption])
  return null
}
