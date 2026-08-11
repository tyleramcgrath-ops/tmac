'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { initials, warmthTone } from '../_lib/format'

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
   Avatar — monogram, never stock photography.
   ------------------------------------------------------------------ */
export function Avatar({
  name,
  size = 'md',
  tone,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'moss' | 'gold' | 'rust'
}) {
  const cls = size === 'lg' ? 'ctc-avatar-lg' : size === 'sm' ? 'ctc-avatar-sm' : ''
  const ring: CSSProperties = tone
    ? {
        boxShadow: `0 0 0 1px var(--${tone === 'moss' ? 'moss' : tone === 'gold' ? 'gold' : 'rust'})`,
      }
    : {}
  return (
    <span className={`ctc-avatar ${cls}`} style={ring} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

/* ---------------------------------------------------------------------
   Warmth meter — seven bars, the product's signature data mark.
   ------------------------------------------------------------------ */
export function Warmth({
  value,
  height = 16,
  label = true,
}: {
  value: number
  height?: number
  label?: boolean
}) {
  const tone = warmthTone(value)
  const color = tone === 'moss' ? 'var(--moss)' : tone === 'gold' ? 'var(--gold)' : 'var(--rust)'
  const lit = Math.max(1, Math.round((value / 100) * 7))
  return (
    <span className="ctc-row ctc-g2">
      <span
        className="ctc-warmth"
        role="img"
        aria-label={`Warmth ${value} out of 100`}
        style={{ ['--warmth-color' as string]: color }}
      >
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="ctc-warmth-bar"
            data-on={i < lit}
            style={{ height: `${height * (0.55 + (i / 6) * 0.45)}px` }}
          />
        ))}
      </span>
      {label ? (
        <span className="ctc-num" style={{ fontSize: 'var(--t-xs)', color }}>
          {value}
        </span>
      ) : null}
    </span>
  )
}

/* ---------------------------------------------------------------------
   Skeletons — loading always has shape, never a bare spinner.
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
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------------
   Wordmark
   ------------------------------------------------------------------ */
export function Wordmark({ size = 20, onInk = false }: { size?: number; onInk?: boolean }) {
  return (
    <span className="ctc-row ctc-g2" style={{ userSelect: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" fill="var(--ember)" />
        <circle cx="19.4" cy="6.6" r="2.1" fill="currentColor" />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: size * 0.98,
          letterSpacing: '-0.03em',
          color: onInk ? 'var(--paper)' : 'var(--ink)',
          lineHeight: 1,
        }}
      >
        Contact
      </span>
    </span>
  )
}
