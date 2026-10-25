'use client'

import { useEffect, useRef } from 'react'
import { Check, Quote, X } from 'lucide-react'
import { ordinal, probeTone } from '../_lib/format'
import { INTENT_LABEL, SENTIMENT_LABEL, type Probe } from '../_lib/types'

export interface ProbeTarget {
  probe: Probe
  brand: string
}

/**
 * The receipt. Anyone can claim a brand is invisible in ChatGPT; this shows
 * the exact question and the exact answer it came from.
 */
export function ProbeDrawer({ target, onClose }: { target: ProbeTarget; onClose: () => void }) {
  const { probe, brand } = target
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const tone = probeTone(probe)

  // Highlight the tracked brand wherever it appears in the answer.
  const segments = (probe.answer ?? '').split(new RegExp(`(${escapeRegExp(brand)})`, 'gi'))

  return (
    <div className="ctc-drawer-root" role="dialog" aria-modal="true" aria-labelledby="probe-title">
      <button type="button" className="ctc-drawer-scrim" onClick={onClose} aria-label="Close" />

      <div className="ctc-drawer" ref={panelRef} tabIndex={-1}>
        <header className="ctc-drawer-head">
          <div className="ctc-stack ctc-g1 ctc-grow" style={{ minWidth: 0 }}>
            <span className="ctc-eyebrow">{INTENT_LABEL[probe.intent]} question</span>
            <h2 id="probe-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
              {probe.prompt}
            </h2>
          </div>
          <button type="button" className="ctc-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="ctc-drawer-body">
          <div className="ctc-row ctc-g2 ctc-wrapflex">
            <span
              className={`ctc-chip ${probe.mentioned ? (tone === 'win' ? 'ctc-chip-win' : 'ctc-chip-warn') : 'ctc-chip-miss'}`}
            >
              {probe.mentioned ? <Check size={11} aria-hidden="true" /> : <X size={11} aria-hidden="true" />}
              {probe.mentioned ? SENTIMENT_LABEL[probe.sentiment ?? 'neutral'] : 'Not mentioned'}
            </span>
            {probe.position ? (
              <span className="ctc-chip ctc-chip-mono">{ordinal(probe.position)} named</span>
            ) : null}
            <span className="ctc-chip ctc-chip-mono">{brand}</span>
          </div>

          {probe.why ? (
            <div className="ctc-well" style={{ padding: 'var(--s-3) var(--s-4)' }}>
              <span className="ctc-eyebrow">Why this question matters</span>
              <p style={{ fontSize: 'var(--t-sm)', marginTop: 4, color: 'var(--text-muted)' }}>
                {probe.why}
              </p>
            </div>
          ) : null}

          {probe.evidence ? (
            <div className="ctc-evidence">
              <Quote size={14} aria-hidden="true" style={{ color: 'var(--ember)', flex: 'none' }} />
              <p>{probe.evidence}</p>
            </div>
          ) : null}

          <div className="ctc-sheet">
            <div className="ctc-sheet-head">
              <span className="ctc-eyebrow">What the model actually answered</span>
            </div>
            <div className="ctc-sheet-body">
              <p className="ctc-answer">
                {segments.map((segment, index) =>
                  segment.toLowerCase() === brand.toLowerCase() ? (
                    <mark key={index} className="ctc-mark">
                      {segment}
                    </mark>
                  ) : (
                    <span key={index}>{segment}</span>
                  )
                )}
              </p>
            </div>
          </div>

          {(probe.brandsNamed?.length ?? 0) > 0 ? (
            <div className="ctc-stack ctc-g2">
              <span className="ctc-eyebrow">Every brand it named</span>
              <div className="ctc-row ctc-g2 ctc-wrapflex">
                {probe.brandsNamed?.map((name) => (
                  <span
                    key={name}
                    className={`ctc-chip ${name.toLowerCase() === brand.toLowerCase() ? 'ctc-chip-ember' : ''}`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {probe.note ? (
            <div className="ctc-well" style={{ padding: 'var(--s-3) var(--s-4)' }}>
              <span className="ctc-eyebrow">Analyst read</span>
              <p style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>{probe.note}</p>
            </div>
          ) : null}

          <p className="ctc-faint" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.5 }}>
            The answer above was generated cold — the model was never told which brand we track.
            A separate call read it back to produce the placement and sentiment.
          </p>
        </div>
      </div>
    </div>
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
