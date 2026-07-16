'use client'

import { useEffect, useRef, useState } from 'react'
import { Dna, Target, ClipboardCheck, Compass as CompassIcon } from 'lucide-react'
import type { PreviewScenario, RunOutcome } from '@/lib/north-star-preview-data'
import { buildInvestigationSteps, revealKindFor, type RevealKind } from '@/lib/north-star-investigation'
import type { CompassContext } from '@/lib/north-star-compass'
import { DnaSculpture } from './DnaSculpture'
import { ActivityWall } from './ActivityWall'
import { PriorityWall } from './PriorityWall'
import { ProgressHorizon } from './ProgressHorizon'
import { DeskScene } from './DeskScene'
import { MorningBriefingOverlay } from './MorningBriefingOverlay'
import { CCOpportunityWorkspace } from '../CCOpportunityWorkspace'
import { CCApprovalCenter } from '../CCApprovalCenter'
import { CCCompassPanel } from '../CCCompassPanel'
import { CCWorkInProgressOverlay, CCResultsOverlay, CCSourcesOverlay, CCEmptyOverlay } from '../CCSecondaryOverlays'

type Overlay = 'briefing' | 'opportunity' | 'opportunity-empty' | 'approval' | 'approval-empty' | 'compass' | 'work-in-progress' | 'results' | 'sources' | null
type InvPhase = 'idle' | 'stepping' | 'settling'

/** Investigation step id -> the Digital DNA area it's actually examining, so the
 *  sculpture activates only where the check is genuinely looking — no fake movement. */
const STEP_TO_DNA: Record<string, string | null> = {
  connect: 'website', found: 'website', identity: 'identity', contact: 'conversion',
  compare: null, mismatch: 'reputation', ruledout: 'reputation', stoodout: null,
  noresponse: 'website', retry: 'website', stillfailed: 'website',
  notenough: 'website', duplicate: null,
}

/** Stage 1: every step is Scout gathering evidence from a nameable source in
 *  the outside world — the origin is visually meaningful, never generic. */
const STEP_TO_SOURCE: Record<string, string> = {
  connect: 'Website', found: 'Website', identity: 'Website', contact: 'Website',
  compare: 'Google', mismatch: 'Google Business Profile', ruledout: 'Reviews', stoodout: 'Reviews',
  noresponse: 'Website', retry: 'Website', stillfailed: 'Website', notenough: 'Website', duplicate: 'Website',
}

/** Stage 4: Compass speaks from understanding, generated from real preview
 *  state of the Digital DNA and the check — never from search. */
function compassReactionFor(kind: RevealKind, scenario: PreviewScenario): string {
  const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length
  const gaps = scenario.digitalDna.filter((a) => a.understanding === 'needs-verification' || a.understanding === 'not-connected')
  if (kind === 'approval') return "I found something and connected two patterns. I've prepared the correction on your desk for review."
  if (kind === 'opportunity') return `I found something. Your understanding grew — ${understood} of ${scenario.digitalDna.length} areas are now clear.`
  if (kind === 'failed') return "I couldn't reach your site this time, so I've held off. I'll try again automatically."
  if (gaps.length) return `Nothing needed your attention. I still need more evidence on ${gaps[0].label} before I'd recommend anything.`
  return 'Nothing rose to your attention. Your business looks stable today.'
}

export function ExecutiveOffice({ scenario }: { scenario: PreviewScenario }) {
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [compassContext, setCompassContext] = useState<CompassContext>('command-center')
  const [selectedDnaKey, setSelectedDnaKey] = useState<string | null>(null)
  const [investigating, setInvestigating] = useState(false)
  const [invPhase, setInvPhase] = useState<InvPhase>('idle')
  const [stepIndex, setStepIndex] = useState(1)
  const [lastReveal, setLastReveal] = useState<RevealKind | null>(null)
  const [compassReaction, setCompassReaction] = useState<string | null>(null)
  const [briefPulse, setBriefPulse] = useState(false)      // Stage 5
  const [approvalArrived, setApprovalArrived] = useState(false) // Stage 6
  const stepsRef = useRef(buildInvestigationSteps(scenario, scenario.defaultRunOutcome))

  // Reset the chain's downstream state whenever the previewed scenario changes.
  useEffect(() => {
    setOverlay(null); setSelectedDnaKey(null); setInvestigating(false); setInvPhase('idle')
    setLastReveal(null); setCompassReaction(null); setBriefPulse(false); setApprovalArrived(false)
  }, [scenario])

  const outcome: RunOutcome = scenario.defaultRunOutcome

  useEffect(() => {
    if (invPhase !== 'stepping') return
    const steps = stepsRef.current
    if (stepIndex >= steps.length) {
      const t = window.setTimeout(() => setInvPhase('settling'), 450)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setStepIndex((n) => n + 1), steps[stepIndex - 1].durationMs)
    return () => window.clearTimeout(t)
  }, [stepIndex, invPhase])

  useEffect(() => {
    if (invPhase !== 'settling') return
    const t = window.setTimeout(() => {
      const kind = revealKindFor(scenario, outcome)
      setInvestigating(false)
      setInvPhase('idle')
      setLastReveal(kind)
      setCompassReaction(compassReactionFor(kind, scenario)) // Stage 4: Compass notices
      setBriefPulse(kind === 'opportunity' || kind === 'approval') // Stage 5
      setApprovalArrived(kind === 'approval') // Stage 6: prepared work slides in
    }, 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invPhase])

  // Morning Brief's "just updated" highlight fades once it's been noticed.
  useEffect(() => {
    if (!briefPulse) return
    const t = window.setTimeout(() => setBriefPulse(false), 4200)
    return () => window.clearTimeout(t)
  }, [briefPulse])

  const runCheck = () => {
    stepsRef.current = buildInvestigationSteps(scenario, outcome)
    setStepIndex(1)
    setInvPhase('stepping')
    setInvestigating(true)
    setLastReveal(null)
    setCompassReaction("I'm connecting what Scout is finding to what I already understand.")
  }

  const openOpportunity = () => setOverlay(scenario.opportunity ? 'opportunity' : 'opportunity-empty')
  const openApproval = () => setOverlay(scenario.pendingApproval ? 'approval' : 'approval-empty')
  const openCompass = (ctx: CompassContext) => { setCompassContext(ctx); setOverlay('compass') }

  const currentStep = investigating ? stepsRef.current[Math.min(stepIndex, stepsRef.current.length) - 1] : null
  const activeDnaKey = currentStep ? STEP_TO_DNA[currentStep.id] ?? null : null
  const currentSource = currentStep ? STEP_TO_SOURCE[currentStep.id] ?? null : null

  // The DNA is the room's light source: aggregate understanding warms and
  // brightens the whole office. One number, computed from the sculpture's
  // state, drives the ambient lighting everywhere else.
  const understanding = scenario.digitalDna.length
    ? scenario.digitalDna.reduce((s, a) => s + (a.understanding === 'well-understood' ? 1 : a.understanding === 'partially-understood' ? 0.5 : a.understanding === 'needs-verification' ? 0.2 : 0), 0) / scenario.digitalDna.length
    : 0

  const quietMessage = !investigating && lastReveal && ['quiet', 'failed', 'duplicate', 'insufficient'].includes(lastReveal)
    ? lastReveal === 'quiet' ? `Checked ${scenario.pagesChecked} pages — nothing rose to the level of your attention.`
    : lastReveal === 'failed' ? `${scenario.business.domain} didn't respond. I'll try again automatically.`
    : lastReveal === 'duplicate' ? 'A check is already underway — let that finish first.'
    : "Not enough evidence gathered before the connection dropped. I'll try again next check."
    : null

  return (
    <div
      className="office-stage"
      id="main-content"
      data-investigating={investigating || undefined}
      style={{ ['--office-understanding' as string]: understanding.toFixed(3) }}
    >
      {/* Ambient room light emitted by the DNA — warmer and brighter as
          understanding grows. Purely presentational, never intercepts input. */}
      <div className="office-ambient" aria-hidden="true" />

      <div className="office-hud">
        <div className="office-brand"><CompassIcon className="h-4 w-4" style={{ color: 'var(--office-brass)' }} aria-hidden="true" /> North Star</div>
        <div className="office-status">
          {scenario.business.name} · <b>{scenario.briefing.subline}</b>
        </div>
      </div>

      {(investigating || quietMessage) && (
        <p className="office-investigation-line" role="status" aria-live="polite">
          <span className="cc-pulse" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--office-brass)', display: 'inline-block' }} aria-hidden="true" />
          {investigating && currentSource && <span className="office-scout-source">Scout · {currentSource}</span>}
          {investigating ? currentStep?.text : quietMessage}
        </p>
      )}
      {!investigating && compassReaction && (
        <p className="office-compass-note" role="status" aria-live="polite">
          <CompassIcon className="h-3.5 w-3.5" style={{ color: 'var(--office-brass-bright)' }} aria-hidden="true" />
          {compassReaction}
        </p>
      )}

      <ProgressHorizon scenario={scenario} onOpen={() => setOverlay('results')} />

      <div className="office-desktop-dna">
        <DnaSculpture
          areas={scenario.digitalDna}
          pagesChecked={scenario.pagesChecked}
          selectedKey={selectedDnaKey}
          activeKey={activeDnaKey}
          investigating={investigating}
          onSelect={(k) => setSelectedDnaKey(k === selectedDnaKey ? null : k)}
          onAskCompass={() => openCompass('digital-dna')}
        />
      </div>

      <div className="office-walls">
        <ActivityWall activity={scenario.activity} investigating={investigating} nearingEnd={stepIndex >= stepsRef.current.length - 1} onOpen={() => setOverlay('work-in-progress')} />
        <div style={{ pointerEvents: 'none' }} />
        <PriorityWall scenario={scenario} onOpenOpportunity={openOpportunity} onOpenApproval={openApproval} />
      </div>

      <DeskScene
        scenario={scenario}
        investigating={investigating}
        briefPulse={briefPulse}
        approvalArrived={approvalArrived}
        compassReaction={compassReaction}
        onOpenBriefing={() => setOverlay('briefing')}
        onOpenCompass={() => openCompass('command-center')}
        onOpenApproval={openApproval}
        onCheckNow={runCheck}
      />

      {/* Mobile executive console — same identity, focused stacked sheets */}
      <div className="office-mobile-console">
        <button className="office-mobile-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOverlay('briefing')}>
          <p className="office-mobile-label">Morning briefing</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{scenario.briefing.headline}</p>
        </button>
        {scenario.pendingApproval && (
          <button className="office-mobile-card" style={{ width: '100%', textAlign: 'left' }} onClick={openApproval}>
            <p className="office-mobile-label">Waiting for approval</p>
            <p style={{ fontSize: 14 }}>{scenario.pendingApproval.title}</p>
          </button>
        )}
        {scenario.opportunity && (
          <button className="office-mobile-card" style={{ width: '100%', textAlign: 'left' }} onClick={openOpportunity}>
            <p className="office-mobile-label">Top opportunity</p>
            <p style={{ fontSize: 14 }}>{scenario.opportunity.headline}</p>
          </button>
        )}
        <button className="office-obj-cta ns-touch" style={{ position: 'static', transform: 'none', width: '100%', margin: '4px 0 14px' }} onClick={runCheck} disabled={investigating}>
          ⚡ {investigating ? 'Checking…' : 'Check my business'}
        </button>
        <DnaSculpture
          areas={scenario.digitalDna}
          pagesChecked={scenario.pagesChecked}
          selectedKey={selectedDnaKey}
          activeKey={activeDnaKey}
          investigating={investigating}
          onSelect={(k) => setSelectedDnaKey(k === selectedDnaKey ? null : k)}
        />
      </div>

      <nav className="office-mobile-bar" aria-label="North Star quick actions">
        <button className="office-mobile-bar-item ns-touch" onClick={() => document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' })}><Dna className="h-5 w-5" aria-hidden="true" />Digital DNA</button>
        <button className="office-mobile-bar-item ns-touch" data-has-badge={!!(scenario.opportunity && !scenario.opportunityStale)} onClick={openOpportunity}><Target className="h-5 w-5" aria-hidden="true" />Opportunities</button>
        <button className="office-mobile-bar-item ns-touch" data-has-badge={!!scenario.pendingApproval} onClick={openApproval}><ClipboardCheck className="h-5 w-5" aria-hidden="true" />Approvals</button>
        <button className="office-mobile-bar-item ns-touch" onClick={() => openCompass('command-center')}><CompassIcon className="h-5 w-5" aria-hidden="true" />Compass</button>
      </nav>

      {overlay === 'briefing' && (
        <MorningBriefingOverlay
          scenario={scenario}
          investigating={investigating}
          currentSource={currentSource}
          lastReveal={lastReveal}
          onClose={() => setOverlay(null)}
          onAskCompass={(ctx) => openCompass(ctx ?? 'command-center')}
          onOpenOpportunity={openOpportunity}
          onOpenApproval={openApproval}
        />
      )}
      {overlay === 'opportunity' && scenario.opportunity && (
        <CCOpportunityWorkspace
          opportunity={scenario.opportunity}
          stale={scenario.opportunityStale}
          onClose={() => setOverlay(null)}
          onExplain={() => openCompass('opportunity')}
        />
      )}
      {overlay === 'opportunity-empty' && (
        <CCEmptyOverlay title="No opportunities" eyebrow="Opportunities" message="North Star hasn't found anything worth reviewing yet." onClose={() => setOverlay(null)} />
      )}
      {overlay === 'approval' && scenario.pendingApproval && (
        <CCApprovalCenter
          approval={scenario.pendingApproval}
          onClose={() => setOverlay(null)}
          onAskCompass={() => openCompass('approval')}
        />
      )}
      {overlay === 'approval-empty' && (
        <CCEmptyOverlay title="Nothing pending" eyebrow="Approvals" message="Nothing is waiting on your approval right now." onClose={() => setOverlay(null)} />
      )}
      {overlay === 'compass' && <CCCompassPanel scenario={scenario} context={compassContext} onClose={() => setOverlay(null)} />}
      {overlay === 'work-in-progress' && <CCWorkInProgressOverlay activity={scenario.activity} onClose={() => setOverlay(null)} />}
      {overlay === 'results' && <CCResultsOverlay history={scenario.history} onClose={() => setOverlay(null)} />}
      {overlay === 'sources' && <CCSourcesOverlay areas={scenario.digitalDna} pagesChecked={scenario.pagesChecked} onClose={() => setOverlay(null)} />}
    </div>
  )
}
