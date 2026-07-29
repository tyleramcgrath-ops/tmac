'use client'

// Generic rail-triggered focus view — opens centred and large, over a scrim
// that dims the room behind it. It used to float beside the rail at ~380px
// wide, which was too narrow to actually read: the performance charts, the
// DNA helix and the mission queue all had more to show than the column could
// hold.
//
// Children stay mounted while closed (only opacity/transform animate) so a
// panel's data fetch doesn't re-run every time it reopens. That is also why
// the scrim must be inert when closed — seven of these render at once, and a
// full-bleed element with pointer events left on would swallow every click in
// the room.

import { useEffect, useRef } from 'react'
import { useModalFocus } from '../../_lib/use-modal-focus'

export default function Drawer({
  open,
  label,
  onClose,
  children,
}: {
  open: boolean
  label: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useModalFocus(open, ref)

  // Escape closes, matching the scrim click. Bound only while open so the
  // seven mounted-but-closed drawers don't all race to handle the same key.
  //
  // Registered on the CAPTURE phase and stops propagation — the room
  // (page.tsx) has its own bubble-phase Escape listener on `document` that
  // collapses the entire HUD whenever panels are up. A bubble-phase listener
  // here would fire AFTER that one (document is reached before window on the
  // way back up), so Escape would close this drawer AND wipe the whole room
  // in the same keystroke. Capture fires window -> document -> target, i.e.
  // before the room ever sees the event, so stopping it here means "closing
  // the drawer" and "leaving the room" stay two separate keystrokes.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [open, onClose])

  return (
    <>
      {/* preventDefault on mousedown, not click: a click on any non-focusable
          element natively blurs whatever currently has focus (here, the
          drawer's own close button) to <body> as part of the browser's
          default mousedown handling — before this onClick, or React, ever
          runs. useModalFocus then sees focus already moved and correctly
          (by its own rule) declines to steal it back, reading a native
          side-effect of THIS click as if the user had deliberately focused
          something else. preventDefault on mousedown suppresses that default
          entirely, so closing via the scrim restores focus exactly like
          Escape or the × button already did. Confirmed missing in a real
          browser: without this, scrim-click was the one close path that
          left focus on <body>. */}
      <div className={`ns-scrim${open ? ' open' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={onClose} aria-hidden />
      <div
        ref={ref}
        className={`ns-drawer ns-glass ns-panel${open ? ' open' : ''}`}
        role="dialog"
        aria-modal={open || undefined}
        aria-label={label}
        aria-hidden={!open}
      >
        <header className="ns-drawer-head">
          <p className="ns-drawer-title">{label}</p>
          <button type="button" className="ns-drawer-close" onClick={onClose} aria-label={`Close ${label}`}>
            ×
          </button>
        </header>
        <div className="ns-drawer-body">{children}</div>
      </div>
    </>
  )
}
