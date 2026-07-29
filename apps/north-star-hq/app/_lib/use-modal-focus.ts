'use client'

// Shared focus behaviour for the room's two modal-style surfaces (rail
// Drawer, expandable Cards): both open as `role="dialog" aria-modal`, so
// both owe keyboard/screen-reader users the three things a real modal
// promises and neither previously did:
//
//   1. Focus moves INTO the dialog on open (onto its close button), so a
//      keyboard user isn't left on a trigger that's now behind a dimmed,
//      inert scrim.
//   2. Tab is trapped inside the dialog while open — without this, Tab
//      walks straight past the dialog into the room behind it, which is
//      visually dimmed and inert to the mouse (pointer-events on the scrim)
//      but was never actually removed from the keyboard tab order.
//   3. Focus RETURNS to whatever triggered the dialog on close, so closing
//      it doesn't strand the user at the top of the document.

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function useModalFocus(open: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    const container = containerRef.current
    if (!container) return

    restoreRef.current = document.activeElement as HTMLElement | null

    // The transform/opacity transition is still running on the frame this
    // effect fires; focusing mid-transition is harmless (focus doesn't
    // depend on final layout), but a tick keeps this after the element's
    // first paint in the open state rather than racing it.
    const raf = requestAnimationFrame(() => {
      const first = container.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null // skip anything hidden, e.g. a closed sibling drawer's own controls
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      // Capture phase, same reasoning as the Escape fix in Drawer.tsx /
      // ExpandableCard.tsx: this has to win before anything else on the
      // page sees Tab, or the trap has gaps.
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey, { capture: true })
      // Only steal focus back if it's still where the dialog left it — if
      // the user already clicked/tabbed elsewhere themselves, respect that
      // instead of yanking focus away from something they chose.
      const trigger = restoreRef.current
      if (trigger && document.body.contains(trigger) && container.contains(document.activeElement)) {
        trigger.focus()
      }
    }
  }, [open, containerRef])
}
