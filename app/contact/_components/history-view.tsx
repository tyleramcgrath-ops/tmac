'use client'

import { ArrowRight, Trash2 } from 'lucide-react'
import { timeAgoFromMs } from '../_lib/format'
import { useStore } from '../_lib/store'
import { scoreBand, scoreScan, type Scan } from '../_lib/types'
import { ScoreDial } from './primitives'

export function HistoryView({
  onOpen,
  onNewScan,
}: {
  onOpen: (scan: Scan) => void
  onNewScan: () => void
}) {
  const { scans, removeScan, clearScans } = useStore()

  return (
    <div className="ctc-stack ctc-g5">
      <div className="ctc-between ctc-wrapflex ctc-g3">
        <div className="ctc-stack ctc-g1">
          <h1 className="ctc-h2" style={{ fontSize: 'var(--t-2xl)' }}>
            Saved scans
          </h1>
          <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
            Run the same brand again in a month and watch the number move.
          </p>
        </div>
        {scans.length > 0 ? (
          <button type="button" className="ctc-btn ctc-btn-ghost ctc-btn-sm" onClick={clearScans}>
            Clear all
          </button>
        ) : null}
      </div>

      {scans.length === 0 ? (
        <div className="ctc-card ctc-empty">
          <div className="ctc-empty-mark" aria-hidden="true">
            <svg width="120" height="76" viewBox="0 0 120 76" fill="none">
              <rect x="6" y="10" width="108" height="56" rx="8" fill="var(--surface-2)" stroke="var(--line-strong)" />
              <line x1="20" y1="52" x2="100" y2="52" stroke="var(--line-strong)" />
              <path d="M22 46l18-12 16 8 18-20 20 10" stroke="var(--ember)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="ctc-h3">No scans saved yet.</h2>
          <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '44ch', margin: '0 auto' }}>
            Every scan you run is kept here on this device, so you can compare a brand against
            itself over time.
          </p>
          <button
            type="button"
            className="ctc-btn ctc-btn-ember"
            style={{ marginTop: 'var(--s-4)' }}
            onClick={onNewScan}
          >
            Run your first scan <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ul className="ctc-history" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {scans.map((scan) => {
            const score = scoreScan(scan.probes)
            const band = scoreBand(score)
            const mentions = scan.probes.filter((probe) => probe.mentioned).length
            return (
              <li key={scan.id} className="ctc-history-card">
                <button
                  type="button"
                  className="ctc-history-open"
                  onClick={() => onOpen(scan)}
                  aria-label={`Open the scan for ${scan.input.brand}`}
                >
                  <ScoreDial value={score} size={78} tone={band.tone} animate={false} />
                  <div className="ctc-stack ctc-g2 ctc-grow" style={{ minWidth: 0 }}>
                    <div className="ctc-stack" style={{ gap: 2 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
                        {scan.input.brand}
                      </span>
                      <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)' }}>
                        {scan.input.category}
                      </span>
                    </div>
                    <div className="ctc-row ctc-g2 ctc-wrapflex">
                      <span className={`ctc-chip ctc-chip-${band.tone}`}>{band.label}</span>
                      <span className="ctc-chip ctc-chip-mono">
                        {mentions}/{scan.probes.length} answers
                      </span>
                      <span className="ctc-faint ctc-num" style={{ fontSize: 'var(--t-2xs)' }}>
                        {timeAgoFromMs(scan.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" className="ctc-probe-chevron" />
                </button>
                <button
                  type="button"
                  className="ctc-icon-btn ctc-history-delete"
                  onClick={() => removeScan(scan.id)}
                  aria-label={`Delete the scan for ${scan.input.brand}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
