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

import { useEffect } from 'react'

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
  // Escape closes, matching the scrim click. Bound only while open so the
  // seven mounted-but-closed drawers don't all race to handle the same key.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div className={`ns-scrim${open ? ' open' : ''}`} onClick={onClose} aria-hidden />
      <div
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
