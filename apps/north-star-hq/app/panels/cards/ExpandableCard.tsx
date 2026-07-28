'use client'

// The right-side card frame, with a click-to-enlarge state.
//
// At its resting size the card is ~318px wide, which is fine for a glance and
// too narrow to actually read — the roster's rows wrap and the briefing
// scrolls inside a sliver. Clicking one lifts THE SAME element to the centre
// of the room at focus-view size; it does not mount a second copy of the
// panel. That matters: both panels poll, so a duplicate instance would double
// the request rate and could show two different answers side by side.
//
// A click on something interactive inside the card (a button, a link, a
// field) is left alone — expanding the card out from under a control the user
// was actually aiming at is worse than not expanding at all.

import { useEffect, useRef } from 'react'

export default function ExpandableCard({
  expanded,
  label,
  onExpand,
  onCollapse,
  children,
}: {
  expanded: boolean
  label: string
  onExpand: () => void
  onCollapse: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCollapse()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, onCollapse])

  function onClick(e: React.MouseEvent) {
    if (expanded) return
    const t = e.target as HTMLElement
    const control = t.closest('button, a, input, select, textarea, [role="button"]')
    // `control !== ref.current` is load-bearing: the card itself carries
    // role="button" while collapsed, so closest() matches the card on every
    // click that isn't on a real control — without this the card never
    // expands at all.
    if (control && control !== ref.current) return
    onExpand()
  }

  return (
    <div
      ref={ref}
      className={`ns-card ns-glass ns-panel${expanded ? ' expanded' : ''}`}
      onClick={onClick}
      // Only a control when it is one: collapsed it enlarges on click, so it
      // announces itself as a button. Expanded it is just the content, and the
      // explicit close below is the control.
      role={expanded ? undefined : 'button'}
      tabIndex={expanded ? undefined : 0}
      aria-label={expanded ? undefined : `Enlarge ${label}`}
      onKeyDown={(e) => {
        if (expanded) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onExpand()
        }
      }}
    >
      {expanded && (
        <button type="button" className="ns-card-close" onClick={onCollapse} aria-label={`Close ${label}`}>
          ×
        </button>
      )}
      {children}
    </div>
  )
}
