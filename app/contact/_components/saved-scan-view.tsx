'use client'

import { ArrowLeft, Check, X } from 'lucide-react'
import { ordinal, probeTone, timeAgoFromMs } from '../_lib/format'
import {
  INTENT_LABEL,
  SENTIMENT_LABEL,
  scoreBand,
  scoreScan,
  shareOfVoice,
  type Probe,
  type Scan,
} from '../_lib/types'
import { ScoreDial, VoiceBar } from './primitives'

/** A scan pulled back out of history — the report, read-only. */
export function SavedScanView({
  scan,
  onBack,
  onOpenProbe,
}: {
  scan: Scan
  onBack: () => void
  onOpenProbe: (probe: Probe) => void
}) {
  const done = scan.probes.filter((probe) => probe.status === 'done')
  const score = scoreScan(scan.probes)
  const band = scoreBand(score)
  const mentions = done.filter((probe) => probe.mentioned).length
  const voices = shareOfVoice(done, scan.input.brand)
  const maxVoice = voices[0]?.count ?? 1

  return (
    <div className="ctc-stack ctc-g5">
      <button type="button" className="ctc-btn ctc-btn-ghost ctc-btn-sm" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} aria-hidden="true" /> All saved scans
      </button>

      <div className="ctc-report-head">
        <div className="ctc-report-dial">
          <ScoreDial value={score} tone={band.tone} label={band.label} animate={false} />
        </div>
        <div className="ctc-stack ctc-g4 ctc-grow">
          <div className="ctc-stack" style={{ gap: 2 }}>
            <span className="ctc-eyebrow">
              Scanned {timeAgoFromMs(scan.createdAt)} · {scan.input.market || 'global'}
            </span>
            <h1 className="ctc-h3">{scan.input.brand}</h1>
            <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
              {scan.input.category}
            </p>
          </div>
          <div className="ctc-metrics">
            <div className="ctc-metric">
              <span className="ctc-stat" style={{ fontSize: 'var(--t-xl)' }}>
                {mentions}/{scan.probes.length}
              </span>
              <span className="ctc-eyebrow">Answers naming you</span>
            </div>
            <div className="ctc-metric">
              <span className="ctc-stat" style={{ fontSize: 'var(--t-xl)' }}>
                {voices.filter((voice) => !voice.isBrand).length}
              </span>
              <span className="ctc-eyebrow">Rival brands named</span>
            </div>
          </div>
        </div>
      </div>

      {scan.plan ? (
        <div className="ctc-verdict">
          <span className="ctc-eyebrow ctc-eyebrow-ember">The verdict</span>
          <p className="ctc-verdict-text">{scan.plan.verdict}</p>
          <ul className="ctc-actions">
            {scan.plan.actions.map((action, index) => (
              <li key={action.title} className="ctc-action">
                <span className="ctc-num ctc-action-rank">{String(index + 1).padStart(2, '0')}</span>
                <div className="ctc-stack ctc-g1 ctc-grow">
                  <span className="ctc-action-title">{action.title}</span>
                  <span className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
                    {action.why}
                  </span>
                </div>
                <div className="ctc-row ctc-g1 ctc-action-meta">
                  <span className={`ctc-chip ${action.impact === 'high' ? 'ctc-chip-win' : ''}`}>
                    {action.impact} impact
                  </span>
                  <span className="ctc-chip">{action.effort} effort</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {voices.length > 0 ? (
        <div className="ctc-card ctc-panel">
          <span className="ctc-eyebrow">Who the model recommended</span>
          <div className="ctc-stack ctc-g2" style={{ marginTop: 'var(--s-4)' }}>
            {voices.map((voice) => (
              <VoiceBar key={voice.name} {...voice} max={maxVoice} />
            ))}
          </div>
        </div>
      ) : null}

      <ul className="ctc-stack ctc-g3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {done.map((probe) => {
          const tone = probeTone(probe)
          return (
            <li key={probe.id}>
              <button type="button" className={`ctc-probe ctc-probe-${tone}`} onClick={() => onOpenProbe(probe)}>
                <span className="ctc-probe-state">
                  {probe.mentioned ? (
                    <Check size={14} aria-hidden="true" style={{ color: `var(--${tone})` }} />
                  ) : (
                    <X size={14} aria-hidden="true" style={{ color: 'var(--miss)' }} />
                  )}
                </span>
                <div className="ctc-stack ctc-g2 ctc-grow">
                  <span className="ctc-probe-prompt">{probe.prompt}</span>
                  <div className="ctc-row ctc-g2 ctc-wrapflex">
                    <span className="ctc-chip ctc-chip-mono">{INTENT_LABEL[probe.intent]}</span>
                    <span
                      className={`ctc-chip ${probe.mentioned ? (tone === 'win' ? 'ctc-chip-win' : 'ctc-chip-warn') : 'ctc-chip-miss'}`}
                    >
                      {probe.mentioned
                        ? `${SENTIMENT_LABEL[probe.sentiment ?? 'neutral']}${probe.position ? ` · ${ordinal(probe.position)}` : ''}`
                        : 'Not mentioned'}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
