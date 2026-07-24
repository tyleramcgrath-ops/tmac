'use client'

// Generic rail-triggered drawer — floats beside the rail, never a full-screen
// modal. Children stay mounted while closed (only visibility/position
// animate) so a panel's data fetch doesn't re-run every time it reopens.

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
  return (
    <div
      className={`ns-drawer ns-glass ns-panel${open ? ' open' : ''}`}
      role="region"
      aria-label={label}
      aria-hidden={!open}
    >
      <button type="button" className="ns-drawer-close" onClick={onClose} aria-label={`Close ${label}`}>
        ×
      </button>
      {children}
    </div>
  )
}
