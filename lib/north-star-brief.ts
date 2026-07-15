import type { PreviewScenario, HistoryItem } from './north-star-preview-data'
import type { RevealKind } from './north-star-investigation'
import type { CompassContext } from './north-star-compass'

/**
 * Derives the Morning Briefing's content from the same real state that
 * drives the rest of the office (Digital DNA, the active opportunity or
 * approval, and the investigation's outcome) — never a static document.
 * Every string here is built from real PreviewScenario fields; nothing is
 * a fabricated number, percentage, or outcome. If a section has nothing
 * truthful to say, it says so plainly instead of inventing content.
 */

export type BriefSituation =
  | 'first-visit'
  | 'ready'
  | 'investigating'
  | 'opportunity'
  | 'approval'
  | 'quiet'
  | 'action-completed'
  | 'unreachable'
  | 'insufficient'
  | 'duplicate'

export interface BriefChainState {
  investigating: boolean
  currentSource: string | null
  lastReveal: RevealKind | null
}

export interface BriefAction {
  label: string
  kind: 'ask-compass' | 'open-opportunity' | 'open-approval'
  compassContext?: CompassContext
}

export interface BriefSection {
  id: string
  label: string
  value?: string
  bullets?: string[]
  emphasize?: boolean
  /** At most two contextual actions — never a generic button row. */
  actions?: BriefAction[]
}

export interface BriefLineage {
  generatedAt: string
  basedOn: string
  comparedWith: string
  status: string
}

export interface Brief {
  situation: BriefSituation
  eyebrow: string
  headline: string
  sections: BriefSection[]
  lineage: BriefLineage
  automationNote: string
}

function pastActionCompleted(history: HistoryItem[]): HistoryItem | null {
  return history.find((h) => h.outcome === 'action-completed' && !/today|just now/i.test(h.date)) ?? null
}

function resultStillUnknown(history: HistoryItem[]): HistoryItem | null {
  return history.find((h) => h.outcome === 'result-unknown') ?? null
}

function priorCheck(history: HistoryItem[]): HistoryItem | null {
  return history.find((h) => !/today|just now/i.test(h.date)) ?? null
}

function hasGapSinceLastCheck(scenario: PreviewScenario): boolean {
  const t = scenario.lastCheckedAt || ''
  return /\d+\s*(day|week)/i.test(t)
}

function gapPhrase(lastCheckedAt: string | null): string {
  if (!lastCheckedAt) return 'a while'
  const m = lastCheckedAt.match(/(\d+)\s*(day|week)s?/i)
  if (!m) return 'a while'
  const n = m[1]
  const unit = m[2].toLowerCase()
  return `${n} ${unit}${n === '1' ? '' : 's'}`
}

/** Which of the ten real situations the brief is currently in. Resting
 *  (idle, nothing run this session) reads the scenario's own last-known
 *  state; a fresh reveal (lastReveal set) reflects what just happened. */
export function deriveSituation(scenario: PreviewScenario, chain: BriefChainState): BriefSituation {
  if (chain.investigating) return 'investigating'

  if (chain.lastReveal) {
    switch (chain.lastReveal) {
      case 'failed': return 'unreachable'
      case 'insufficient': return 'insufficient'
      case 'duplicate': return 'duplicate'
      case 'approval': return 'approval'
      case 'opportunity': return 'opportunity'
      case 'quiet': return pastActionCompleted(scenario.history) ? 'action-completed' : 'quiet'
    }
  }

  // Resting: nothing has been run this session — reflect the scenario's own
  // last-known state, exactly as the owner would find it before pressing
  // "Check my business."
  if (scenario.id === 'first-visit') return 'first-visit'
  if (scenario.lastCheckStatus === 'failed') return 'unreachable'
  if (scenario.lastCheckStatus === 'incomplete') return 'insufficient'
  if (scenario.pendingApproval) return 'approval'
  if (scenario.opportunity && !scenario.opportunityStale) {
    return pastActionCompleted(scenario.history) && !scenario.briefing.materialChange ? 'action-completed' : 'opportunity'
  }
  if (scenario.opportunity && scenario.opportunityStale) return 'ready'
  if (scenario.briefing.materialChange) return 'opportunity'
  return pastActionCompleted(scenario.history) ? 'action-completed' : 'quiet'
}

function evidenceBullets(items: { label: string; detail: string }[]): string[] {
  return items.map((e) => `${e.label}: ${e.detail}`)
}

function buildLineage(scenario: PreviewScenario, situation: BriefSituation, chain: BriefChainState): BriefLineage {
  const justHappened = chain.lastReveal !== null
  const generatedAt =
    situation === 'investigating' ? 'Updating now' :
    justHappened ? `Just now, from this morning's check (${scenario.lastCheckedAt || 'in progress'})` :
    (scenario.lastCheckedAt || 'Not yet run')

  const basedOn =
    situation === 'investigating' ? `Evidence arriving now${chain.currentSource ? ` from ${chain.currentSource}` : ''}` :
    situation === 'first-visit' ? 'Your first check — homepage only' :
    situation === 'unreachable' ? `Attempted website review of ${scenario.business.domain} — could not connect` :
    situation === 'insufficient' ? 'Website review interrupted before enough pages were gathered' :
    'Latest website review'

  const prior = priorCheck(scenario.history)
  const comparedWith = prior ? `Your check on ${prior.date}` : 'No earlier check available'

  const status =
    situation === 'investigating' ? 'Not yet determined — still reviewing evidence' :
    situation === 'first-visit' ? 'Early signal, not yet confirmed' :
    situation === 'approval' ? 'Verified issue, business effect not yet measured' :
    situation === 'opportunity' ? 'Verified from direct evidence' :
    situation === 'insufficient' ? 'Unknown — not enough evidence gathered' :
    situation === 'unreachable' ? 'Unknown — the site could not be reached' :
    situation === 'ready' ? 'Earlier finding, not yet re-verified' :
    situation === 'action-completed' ? 'Applied — confirmed by this check' :
    situation === 'duplicate' ? 'Unknown — a check was already in progress' :
    'Stable, no open findings'

  return { generatedAt, basedOn, comparedWith, status }
}

export function buildBrief(scenario: PreviewScenario, chain: BriefChainState): Brief {
  const situation = deriveSituation(scenario, chain)
  const sections: BriefSection[] = []
  const gap = hasGapSinceLastCheck(scenario)
  const welcomeBack = gap ? `Welcome back — it's been ${gapPhrase(scenario.lastCheckedAt)} since your last check. ` : ''
  const fresh = chain.lastReveal !== null
  let eyebrow = 'Morning briefing'
  const headline = scenario.briefing.headline

  switch (situation) {
    case 'investigating': {
      eyebrow = "Updating today's briefing"
      sections.push({
        id: 'status',
        label: 'Latest status',
        value: `North Star is reviewing new evidence${chain.currentSource ? ` from ${chain.currentSource}` : ''} and comparing it with what was already known.`,
      })
      break
    }

    case 'first-visit': {
      const identity = scenario.digitalDna.find((a) => a.key === 'identity')
      sections.push({ id: 'status', label: 'Latest status', value: `Welcome, ${scenario.business.ownerFirstName}. North Star just finished its first look at your business.` })
      sections.push({ id: 'understand', label: 'What I understand', value: identity?.note || 'Your core business identity is partially understood.' })
      sections.push({
        id: 'attention',
        label: 'What needs attention',
        value: scenario.opportunity ? `${scenario.opportunity.headline} — an early signal from your homepage, not yet confirmed.` : 'No current recommendation is ready.',
        actions: scenario.opportunity ? [{ label: 'Review the early finding', kind: 'open-opportunity' }] : undefined,
      })
      sections.push({ id: 'need', label: 'What I still need', value: scenario.opportunity?.additionalDataNeeded[0] || 'A few more checks over time to build a fuller picture.' })
      break
    }

    case 'ready': {
      const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length
      sections.push({ id: 'status', label: 'Latest status', value: `${welcomeBack}North Star is ready to check your business again.` })
      sections.push({ id: 'understand', label: 'What I understand', value: `${understood} of ${scenario.digitalDna.length} areas are well understood from your last check.` })
      sections.push({
        id: 'attention',
        label: 'What needs attention',
        value: scenario.opportunity
          ? `${scenario.opportunity.headline} — found on ${scenario.lastCheckedAt}, but this needs to be re-verified before I'd recommend anything.`
          : 'No current recommendation is ready.',
        actions: scenario.opportunity ? [{ label: 'Review the earlier finding', kind: 'open-opportunity' }] : undefined,
      })
      sections.push({ id: 'need', label: 'What I still need', value: 'A fresh check to confirm this is still true.' })
      break
    }

    case 'unreachable': {
      sections.push({ id: 'status', label: 'Latest status', value: "Today's check could not be completed.", emphasize: fresh })
      sections.push({ id: 'happened', label: 'What happened', value: `${scenario.business.domain} did not respond. North Star will try again automatically.` })
      if (scenario.opportunity) {
        sections.push({ id: 'lastknown', label: 'What I knew as of your last successful check', value: scenario.opportunity.evidenceSummary, actions: [{ label: 'Review that finding', kind: 'open-opportunity' }] })
      }
      break
    }

    case 'insufficient': {
      sections.push({ id: 'status', label: 'Latest status', value: 'Not enough evidence was gathered before the connection dropped.', emphasize: fresh })
      sections.push({ id: 'happened', label: 'What happened', value: `Only ${scenario.pagesChecked} page${scenario.pagesChecked === 1 ? '' : 's'} of ${scenario.business.domain} loaded before the check stopped.` })
      sections.push({ id: 'need', label: 'What I still need', value: "Enough pages to responsibly update what I know about your business. I won't guess in the meantime." })
      break
    }

    case 'duplicate': {
      sections.push({ id: 'status', label: 'Latest status', value: 'A check was already underway.', emphasize: fresh })
      sections.push({ id: 'happened', label: 'What happened', value: 'North Star let the check already in progress finish rather than starting a second one.' })
      break
    }

    case 'opportunity': {
      const o = scenario.opportunity!
      sections.push({
        id: 'changed',
        label: 'What changed',
        value: o.evidenceSummary,
        emphasize: chain.lastReveal === 'opportunity',
        actions: [{ label: 'Open the opportunity', kind: 'open-opportunity' }, { label: 'Ask Compass about this', kind: 'ask-compass', compassContext: 'opportunity' }],
      })
      sections.push({ id: 'matters', label: 'Why it matters', value: o.businessReason })
      sections.push({ id: 'verified', label: 'What North Star verified', bullets: evidenceBullets(o.evidence) })
      sections.push({ id: 'unknown', label: 'What remains unknown', bullets: o.cannotMeasure })
      const preparable = o.prepareChecklist.find((i) => i.status !== 'needs-info')
      sections.push({
        id: 'prepared',
        label: 'What I prepared',
        value: preparable ? preparable.detail : (o.prepareChecklist[0]?.detail ?? 'Nothing is ready to prepare yet.'),
        emphasize: chain.lastReveal === 'opportunity',
      })
      const needsInfo = o.prepareChecklist.find((i) => i.status === 'needs-info')
      sections.push({
        id: 'needfromyou',
        label: 'What I need from you',
        value: needsInfo ? `Confirm ${needsInfo.label.toLowerCase()} so I can prepare this.` : 'Review and approve the prepared changes before anything is published.',
        actions: [{ label: 'Review the opportunity', kind: 'open-opportunity' }],
      })
      const measuring = scenario.history.find((h) => /too early|effect/i.test(h.followUp || ''))
      if (measuring) sections.push({ id: 'measuring', label: 'Also still measuring', value: `${measuring.summary} ${measuring.followUp}` })
      break
    }

    case 'approval': {
      const a = scenario.pendingApproval!
      sections.push({
        id: 'changed',
        label: 'What changed',
        value: a.whatChanges,
        emphasize: chain.lastReveal === 'approval',
        actions: [{ label: 'Open the prepared folder', kind: 'open-approval' }, { label: 'Ask Compass about the risk', kind: 'ask-compass', compassContext: 'approval' }],
      })
      sections.push({ id: 'matters', label: 'Why it matters', value: a.whyRecommended })
      sections.push({ id: 'verified', label: 'What North Star verified', bullets: [`Before: ${a.beforeState}`, `After (proposed): ${a.afterState}`] })
      sections.push({ id: 'measuring', label: "What I'll measure once approved", value: a.whatWillBeMeasured })
      sections.push({ id: 'prepared', label: 'What I prepared', value: `${a.title} — ${a.detail}`, emphasize: chain.lastReveal === 'approval' })
      sections.push({ id: 'needfromyou', label: 'What I need from you', value: 'Review and approve the prepared changes before anything is published.', actions: [{ label: 'Review the prepared folder', kind: 'open-approval' }] })
      break
    }

    case 'quiet': {
      sections.push({ id: 'changed', label: 'What changed', value: 'Nothing important changed.', emphasize: chain.lastReveal === 'quiet' })
      sections.push({ id: 'matters', label: 'Why it matters', value: 'Everything looked the way you left it on your last check — no action needed today.' })
      const gaps = scenario.digitalDna.filter((a) => a.understanding === 'needs-verification' || a.understanding === 'not-connected')
      if (gaps.length) sections.push({ id: 'unknown', label: 'What remains unknown', value: `${gaps[0].label}: ${gaps[0].note}` })
      break
    }

    case 'action-completed': {
      const recent = pastActionCompleted(scenario.history)!
      const stillMeasuring = /too early|effect/i.test(recent.followUp || '')
      sections.push({ id: 'changed', label: 'What changed', value: recent.summary, emphasize: chain.lastReveal === 'quiet' })
      sections.push({
        id: 'measuring',
        label: stillMeasuring ? "What I'm still measuring" : "What I'm watching",
        value: recent.followUp || 'This was applied after your approval — no further action needed.',
      })
      const otherGaps = scenario.digitalDna.filter((a) => a.understanding === 'needs-verification' || a.understanding === 'not-connected')
      if (otherGaps.length) sections.push({ id: 'unknown', label: 'What remains unknown', value: `${otherGaps[0].label}: ${otherGaps[0].note}` })
      break
    }
  }

  // "Result still unknown": a real past entry whose outcome was never
  // confirmed. Shown whenever the active scenario's history carries one,
  // regardless of today's primary situation.
  const unresolved = !chain.investigating && resultStillUnknown(scenario.history)
  if (unresolved) {
    sections.push({ id: 'result-unknown', label: 'Result still unknown', value: `${unresolved.summary}${unresolved.followUp ? ' ' + unresolved.followUp : ''}` })
  }

  return { situation, eyebrow, headline, sections, lineage: buildLineage(scenario, situation, chain), automationNote: scenario.briefing.automationNote }
}

/** Mobile priority order: what changed, what it means, what needs approval,
 *  what remains unknown, evidence source — everything else is dropped so the
 *  brief reads as a focused executive summary, not a scrolling document. */
const MOBILE_PRIORITY = ['status', 'changed', 'happened', 'matters', 'needfromyou', 'prepared', 'unknown', 'measuring', 'result-unknown']

export function compactSections(sections: BriefSection[]): BriefSection[] {
  const ranked = [...sections].sort((a, b) => {
    const ia = MOBILE_PRIORITY.indexOf(a.id)
    const ib = MOBILE_PRIORITY.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  return ranked.slice(0, 5)
}
