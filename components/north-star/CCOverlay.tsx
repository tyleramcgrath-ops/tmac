'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export function CCOverlayShell({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="cc-overlay-scrim" onClick={onClose} aria-hidden="true" />
      <div className="cc-overlay-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="cc-overlay-header">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--rf-faint)]">{eyebrow}</p>
            <h2 className="mt-1 text-lg font-semibold text-white leading-snug">{title}</h2>
          </div>
          <button onClick={onClose} className="cc-overlay-close ns-touch" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="cc-overlay-body">{children}</div>
      </div>
    </>
  )
}
