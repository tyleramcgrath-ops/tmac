'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/* ---------------------------------------------------------------------
   Reveal — one orchestrated entrance per screen, not scattered twitches.
   ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  style,
}: {
  children: ReactNode
  delay?: number
  as?: 'div' | 'section' | 'li' | 'header' | 'article'
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    observer.observe(node)
    // Belt and braces: nothing stays invisible because an observer misfired.
    const failsafe = window.setTimeout(() => setShown(true), 2500)
    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [])

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-shown={shown}
      className={`ctc-reveal ${className}`}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

/* ---------------------------------------------------------------------
   Score dial — the report's focal point.
   ------------------------------------------------------------------ */
export function ScoreDial({
  value,
  size = 168,
  tone = 'ember',
  label,
  animate = true,
}: {
  value: number
  size?: number
  tone?: 'ember' | 'win' | 'warn' | 'miss'
  label?: string
  animate?: boolean
}) {
  const [shown, setShown] = useState(animate ? 0 : value)

  useEffect(() => {
    if (!animate) {
      setShown(value)
      return
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShown(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic — settles rather than stops dead
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, animate])

  const stroke = 9
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const color = `var(--${tone})`

  return (
    <div
      className="ctc-dial"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Visibility score ${value} out of 100${label ? `. ${label}` : ''}`}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 90ms linear' }}
        />
      </svg>
      <div className="ctc-dial-face">
        <span className="ctc-stat" style={{ fontSize: size * 0.3, color }}>
          {shown}
        </span>
        {label ? <span className="ctc-eyebrow">{label}</span> : null}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------
   Share-of-voice bar
   ------------------------------------------------------------------ */
export function VoiceBar({
  name,
  count,
  max,
  isBrand,
}: {
  name: string
  count: number
  max: number
  isBrand: boolean
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="ctc-voice">
      <span className={`ctc-voice-name ${isBrand ? 'ctc-voice-name-brand' : ''}`}>
        <span className="ctc-truncate">{name}</span>
        {isBrand ? <span className="ctc-voice-you">you</span> : null}
      </span>
      <span className="ctc-voice-track">
        <span
          className="ctc-voice-fill"
          style={{
            width: `${Math.max(pct, 4)}%`,
            background: isBrand ? 'var(--ember)' : 'var(--line-strong)',
          }}
        />
      </span>
      <span className="ctc-num ctc-voice-count">{count}</span>
    </div>
  )
}

/* ---------------------------------------------------------------------
   Skeletons & spinner
   ------------------------------------------------------------------ */
export function SkeletonLine({ w = '100%', h = 12 }: { w?: string | number; h?: number }) {
  return <span className="ctc-skeleton" style={{ display: 'block', width: w, height: h }} />
}

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="ctc-spin"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ---------------------------------------------------------------------
   Wordmark
   ------------------------------------------------------------------ */
export function Wordmark({ size = 20, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <span className="ctc-row ctc-g2" style={{ userSelect: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" fill="var(--ember)" />
        <circle cx="19.4" cy="6.6" r="2.1" fill="currentColor" />
      </svg>
      <span className="ctc-row" style={{ gap: 6, alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: size * 0.98,
            letterSpacing: '-0.035em',
            lineHeight: 1,
          }}
        >
          Contact
        </span>
        {sub ? (
          <span
            className="ctc-eyebrow"
            style={{ fontSize: size * 0.4, letterSpacing: '0.16em' }}
          >
            Studios
          </span>
        ) : null}
      </span>
    </span>
  )
}
