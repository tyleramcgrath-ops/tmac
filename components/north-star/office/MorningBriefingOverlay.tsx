'use client'

import { useEffect, useState } from 'react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'
import type { RevealKind } from '@/lib/north-star-investigation'
import type { CompassContext } from '@/lib/north-star-compass'
import { buildBrief, compactSections, type BriefSection } from '@/lib/north-star-brief'
import { CCOverlayShell } from '../CCOverlay'

/** The Morning Briefing rewrites itself from the same real state driving the
 *  rest of the office (Digital DNA, the active opportunity/approval, and the
 *  investigation's outcome) — never a static document with a glow effect.
 *  Section content, lineage, and emphasis all come from lib/north-star-brief;
 *  this component only lays it out and wires the (contextual, per-section)
 *  interactions back into the office. */
export function MorningBriefingOverlay({
  scenario,
  investigating = false,
  currentSource = null,
  lastReveal = null,
  onClose,
  onAskCompass,
  onOpenOpportunity,
  onOpenApproval,
}: {
  scenario: PreviewScenario
  investigating?: boolean
  currentSource?: string | null
  lastReveal?: RevealKind | null
  onClose: () => void
  onAskCompass?: (context: CompassContext) => void
  onOpenOpportunity?: () => void
  onOpenApproval?: () => void
}) {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setCompact(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const brief = buildBrief(scenario, { investigating, currentSource, lastReveal })
  const sections = compact ? compactSections(brief.sections) : brief.sections
  const justUpdated = lastReveal !== null && !investigating

  const runAction = (action: NonNullable<BriefSection['actions']>[number]) => {
    if (action.kind === 'ask-compass') onAskCompass?.(action.compassContext ?? 'command-center')
    else if (action.kind === 'open-opportunity') onOpenOpportunity?.()
    else if (action.kind === 'open-approval') onOpenApproval?.()
  }

  return (
    <CCOverlayShell title={brief.headline} eyebrow={brief.eyebrow} onClose={onClose}>
      {justUpdated && <p className="brief-updated-tag">Updated just now</p>}

      {sections.map((s) => (
        <div key={s.id} className={`cc-field brief-section${s.emphasize ? ' brief-section-changed' : ''}`}>
          <p className="cc-field-label">{s.label}</p>
          {s.value && <p className="cc-field-value">{s.value}</p>}
          {s.bullets && (
            <ul className="brief-bullets">
              {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
          {s.actions && s.actions.length > 0 && (
            <div className="brief-actions">
              {s.actions.map((a, i) => (
                <button key={i} onClick={() => runAction(a)} className="brief-action-link">{a.label} →</button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="brief-lineage" aria-label="Evidence lineage">
        <p><span>Generated</span>{brief.lineage.generatedAt}</p>
        <p><span>Based on</span>{brief.lineage.basedOn}</p>
        <p><span>Compared with</span>{brief.lineage.comparedWith}</p>
        <p><span>Status</span>{brief.lineage.status}</p>
      </div>

      {!investigating && !compact && (
        <div className="cc-field" style={{ marginBottom: 0 }}>
          <p className="cc-field-label">Next check</p>
          <p className="cc-field-value">
            {scenario.briefing.automationConnected
              ? scenario.briefing.automationNote
              : 'North Star can check your business when you ask, but scheduled checks are not active yet.'}
          </p>
        </div>
      )}
    </CCOverlayShell>
  )
}
