'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

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
  const panelRef = useRef<HTMLDivElement>(null)

  // Modal focus management: while a drawer is open it is a modal dialog, so
  // keyboard focus must stay inside it (never Tab out into the room behind),
  // and must return to whatever opened it once it closes. Purely behavioral —
  // nothing visual changes.
  useEffect(() => {
    const panel = panelRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    // move focus into the dialog so the next Tab starts inside it
    panel?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (focusable.length === 0) {
        // nothing focusable inside — keep focus on the panel itself
        e.preventDefault()
        panel.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      // if focus has drifted outside the panel, pull it back in
      if (!panel.contains(active)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
        return
      }
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      // restore focus to the trigger that opened the drawer
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return (
    <>
      <div className="cc-overlay-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="cc-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
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
