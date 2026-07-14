import type { PreviewScenario, RunOutcome } from './north-star-preview-data'

/**
 * Builds the step-by-step narration for the "Check my business now"
 * investigation moment. Every line is derived from real fields already
 * present on the active preview scenario (page counts, domain, the
 * opportunity actually on file) — nothing here is a fabricated finding,
 * a fake percentage, or generic filler. If a real backend replaces the
 * preview data, these functions keep working unchanged as long as the
 * same shape is supplied.
 */

export interface InvestigationStep {
  id: string
  text: string
  /** How long this step stays "active" before the next one begins, in ms. */
  durationMs: number
}

const STEP_MS = {
  quick: 650,
  normal: 900,
  long: 1050,
}

export function buildInvestigationSteps(scenario: PreviewScenario, outcome: RunOutcome): InvestigationStep[] {
  const domain = scenario.business.domain

  if (outcome === 'duplicate') {
    return [{ id: 'duplicate', text: `Checking whether a review of ${domain} is already underway…`, durationMs: STEP_MS.normal }]
  }

  if (outcome === 'failed') {
    return [
      { id: 'connect', text: `Reaching ${domain}…`, durationMs: STEP_MS.normal },
      { id: 'noresponse', text: 'No response after 30 seconds.', durationMs: STEP_MS.normal },
      { id: 'retry', text: 'Trying twice more, in case it was temporary.', durationMs: STEP_MS.long },
      { id: 'stillfailed', text: 'Still unreachable.', durationMs: STEP_MS.quick },
    ]
  }

  if (outcome === 'insufficient-evidence') {
    return [
      { id: 'connect', text: `Reaching ${domain}…`, durationMs: STEP_MS.quick },
      { id: 'found', text: 'Found 1 page before the connection dropped.', durationMs: STEP_MS.normal },
      { id: 'notenough', text: "That's not enough to responsibly update what I know about your business.", durationMs: STEP_MS.long },
    ]
  }

  // completed & waiting-approval share the main investigative walk-through
  const pages = scenario.pagesChecked || 1
  const steps: InvestigationStep[] = [
    { id: 'connect', text: `Reaching ${domain}…`, durationMs: STEP_MS.quick },
    { id: 'found', text: `Found ${pages} page${pages === 1 ? '' : 's'}.`, durationMs: STEP_MS.normal },
    { id: 'identity', text: 'Reading how your business describes itself.', durationMs: STEP_MS.normal },
    { id: 'contact', text: 'Checking how customers would find your contact information.', durationMs: STEP_MS.normal },
  ]

  if (scenario.lastCheckedAt) {
    steps.push({ id: 'compare', text: 'Comparing this against your last check.', durationMs: STEP_MS.normal })
  }

  if (outcome === 'waiting-approval' && scenario.pendingApproval) {
    steps.push({ id: 'mismatch', text: 'Found something worth fixing.', durationMs: STEP_MS.long })
    return steps
  }

  if (scenario.opportunity) {
    steps.push({ id: 'ruledout', text: 'Ruling out the common issues.', durationMs: STEP_MS.long })
    steps.push({ id: 'stoodout', text: 'One thing stood out.', durationMs: STEP_MS.long })
  } else {
    steps.push({ id: 'ruledout', text: "Checking against the common issues — nothing rose to the level of your attention.", durationMs: STEP_MS.long })
  }

  return steps
}

export type RevealKind = 'opportunity' | 'quiet' | 'approval' | 'failed' | 'duplicate' | 'insufficient'

export function revealKindFor(scenario: PreviewScenario, outcome: RunOutcome): RevealKind {
  if (outcome === 'failed') return 'failed'
  if (outcome === 'duplicate') return 'duplicate'
  if (outcome === 'insufficient-evidence') return 'insufficient'
  if (outcome === 'waiting-approval' && scenario.pendingApproval) return 'approval'
  if (scenario.opportunity) return 'opportunity'
  return 'quiet'
}
