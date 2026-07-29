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
import { useModalFocus } from '../../_lib/use-modal-focus'

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
  useModalFocus(expanded, ref)

  // Capture phase + stopPropagation, not the more obvious bubble-phase
  // listener: page.tsx has its own bubble-phase Escape handler on `document`
  // that collapses the ENTIRE HUD whenever panels are up. A bubble listener
  // here fires after that one (document is reached before window on the way
  // back up), so Escape would collapse this card and wipe the whole room in
  // one keystroke — confirmed by driving it in a real browser: closing card
  // one this way left `.ns-hud` without `.up`, so a second card could no
  // longer be clicked at all. Capture fires window -> document -> target, so
  // stopping it here keeps "close the card" and "leave the room" as two
  // separate keystrokes. Same fix applied in Drawer.tsx for the same reason.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onCollapse()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
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
    // useModalFocus captures document.activeElement to restore on close.
    // For Drawer.tsx the trigger is always a distinct rail <button>, which
    // reliably receives native focus on click. Here the card IS its own
    // trigger, and a plain div[tabIndex=0] does not pick up native
    // click-focus as reliably — confirmed in a real browser: without this
    // line, restoreRef captured something other than the card, so closing
    // it never returned focus to it (this was masked earlier by a second,
    // now-fixed bug where the close button's display:none blurred focus to
    // <body> regardless, making the two bugs indistinguishable until fixed
    // one at a time). Focusing explicitly makes the capture deterministic.
    ;(e.currentTarget as HTMLElement).focus()
    onExpand()
  }

  return (
    <div
      ref={ref}
      className={`ns-card ns-glass ns-panel${expanded ? ' expanded' : ''}`}
      onClick={onClick}
      // Two different roles for the same element depending on state, not an
      // oversight: collapsed it IS the trigger control (announces itself as
      // a button you can activate). Expanded it becomes the dialog itself —
      // previously it was neither, with no dialog semantics at all once
      // opened, unlike Drawer.tsx's rail panels which already had this.
      role={expanded ? 'dialog' : 'button'}
      aria-modal={expanded || undefined}
      // -1, not undefined, while expanded: -1 keeps the element
      // programmatically focusable (just out of Tab order), so it stays a
      // legitimate focus target. Removing the attribute entirely makes
      // Chromium treat it as no-longer-focusable and blur it to <body> the
      // instant this element is the one currently focused — which it always
      // is right after a click expands it. That blur happens synchronously
      // during React's commit, before useModalFocus's effect ever runs, so
      // it silently poisoned the "restore focus to the trigger on close"
      // behaviour below every single time. Confirmed by removing this and
      // watching restoreRef capture <body> instead of the card in a real
      // browser, every time.
      tabIndex={expanded ? -1 : 0}
      aria-label={expanded ? label : `Enlarge ${label}`}
      onKeyDown={(e) => {
        if (expanded) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onExpand()
        }
      }}
    >
      {/* Always mounted, hidden via CSS while collapsed — not conditional on
          `expanded`. This close button holds focus while the card is open,
          and unmounting it on collapse blurs it to <body> as part of that
          same DOM removal, before useModalFocus's cleanup effect ever gets
          to see where focus was and restore it. Confirmed in a real browser:
          with it conditionally rendered, closing the card left focus on
          <body> every time; Drawer.tsx's close button was never conditional
          in the first place, which is why that one already worked. */}
      <button
        type="button"
        className="ns-card-close"
        onClick={onCollapse}
        aria-label={`Close ${label}`}
        tabIndex={expanded ? 0 : -1}
        aria-hidden={!expanded}
      >
        ×
      </button>
      {children}
    </div>
  )
}
