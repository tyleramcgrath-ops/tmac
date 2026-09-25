'use client'

import { useEffect, useState } from 'react'

// Last week's standing arrives as a sealed letter. The owner opens it to see
// where they finished; after that it stays open in this browser.
export function LeagueReveal({ siteId, week, heading, cta, place, of, league, titles }: { siteId: string; week: string; heading: string; cta: string; place: string; of: string; league: string; titles: string[] }) {
  const key = `saysites:reveal:${siteId}:${week}`
  const [state, setState] = useState<'sealed' | 'opening' | 'open'>('sealed')
  useEffect(() => {
    try {
      if (window.localStorage.getItem(key)) setState('open')
    } catch {}
  }, [key])
  const open = () => {
    try {
      window.localStorage.setItem(key, '1')
    } catch {}
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setState(reduce ? 'open' : 'opening')
    if (!reduce) {
      setTimeout(() => {
        try {
          navigator.vibrate?.(10)
        } catch {}
      }, 420)
      setTimeout(() => setState('open'), 1100)
    }
  }
  return (
    <div className={`reveal is-${state}`}>
      <div className="reveal-card" aria-live="polite">
        <span className="stat-label">{heading} · {league}</span>
        <strong className="reveal-place">{place}</strong>
        <span className="muted small">{of}</span>
        {titles.length > 0 && (
          <span className="reveal-titles">
            {titles.map((t) => (
              <span key={t} className="title-seal">{t}</span>
            ))}
          </span>
        )}
      </div>
      {state !== 'open' && (
        <button type="button" className="reveal-envelope" onClick={open} disabled={state === 'opening'} aria-label="Open last week's result">
          <span className="reveal-flap" aria-hidden="true" />
          <span className="reveal-wax" aria-hidden="true">
            <svg viewBox="11 3.6 26 40.8" width="22" height="34"><circle cx="19" cy="19" r="7.5" fill="currentColor" /><path d="M11.5 19C11.5 10.7 17.9 4.7 26.5 4.1v5.2c-5.2.5-9 4.1-9.6 9.7z" fill="currentColor" /><circle cx="29" cy="29" r="7.5" fill="currentColor" /><path d="M36.5 29C36.5 37.3 30.1 43.3 21.5 43.9v-5.2c5.2-.5 9-4.1 9.6-9.7z" fill="currentColor" /></svg>
          </span>
          <span className="reveal-cta">{cta}</span>
        </button>
      )}
    </div>
  )
}
