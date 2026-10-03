'use client'

import { useEffect, useState } from 'react'

// The Visibility Score as a dial. It counts up from the score this browser
// last saw, so progress since the last visit is felt, not just read.
export function ScoreDial({ siteId, score, band, size = 168 }: { siteId: string; score: number; band: string; size?: number }) {
  const [shown, setShown] = useState(score)
  const [gain, setGain] = useState(0)

  useEffect(() => {
    const key = `saysites:score:${siteId}`
    let last: number | null = null
    try {
      const raw = window.localStorage.getItem(key)
      last = raw === null ? null : Number(raw)
      window.localStorage.setItem(key, String(score))
    } catch {}
    if (last === null || !Number.isFinite(last) || last === score) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (score > last) setGain(score - last)
    if (reduce) return
    setShown(last)
    const start = performance.now()
    const from = last
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1300)
      const e = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(from + (score - from) * e))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    const delay = setTimeout(() => (raf = requestAnimationFrame(tick)), 350)
    return () => {
      clearTimeout(delay)
      cancelAnimationFrame(raf)
    }
  }, [siteId, score])

  const r = 44
  const c = 2 * Math.PI * r
  // A 300-degree arc, open at the bottom like a gauge.
  const arc = c * (300 / 360)
  return (
    <div className="dial" style={{ width: size, height: size, fontSize: size / 9.5 }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="dial-track" cx="50" cy="50" r={r} strokeDasharray={`${arc} ${c}`} transform="rotate(120 50 50)" />
        <circle className="dial-fill" cx="50" cy="50" r={r} strokeDasharray={`${(arc * shown) / 100} ${c}`} transform="rotate(120 50 50)" />
      </svg>
      <div className="dial-text" role="img" aria-label={`Visibility score ${score} out of 100: ${band}`}>
        <strong>{shown}</strong>
        <span>{band}</span>
      </div>
      {gain > 0 && <span className="dial-gain">+{gain} since last visit</span>}
    </div>
  )
}
