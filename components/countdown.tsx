'use client'

import { useEffect, useState } from 'react'
import { formatTimeLeft, formatTimeLeftLong } from '@/lib/format'

type Props = {
  endsAt: number
  variant?: 'short' | 'long'
  className?: string
  onEnd?: () => void
}

export function Countdown({ endsAt, variant = 'short', className, onEnd }: Props) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (now !== null && now >= endsAt && onEnd) onEnd()
  }, [now, endsAt, onEnd])

  if (now === null) {
    return (
      <span className={className} suppressHydrationWarning>
        {variant === 'short' ? '—' : '— : — : — : —'}
      </span>
    )
  }
  const ms = endsAt - now
  return (
    <span className={className} suppressHydrationWarning>
      {variant === 'short' ? formatTimeLeft(ms) : formatTimeLeftLong(ms)}
    </span>
  )
}
