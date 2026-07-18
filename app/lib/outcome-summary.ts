// Aggregate view of the outcome-measurement flywheel (SCHEDULER_DESIGN.md
// §11) across a project's deployment history — pure function of the same
// DeploymentDTO[] the WordPress tab already fetches, no new API call.
//
// This is the actual payoff the flywheel exists for: not "here's one
// deployment's delta" but "here's proof, in aggregate, that RankForge's
// fixes move real metrics." Honest by construction — `measured` only counts
// deployments with a REAL captured delta; pending and skipped are reported
// separately, never folded into the headline number.

import type { DeploymentDTO } from './client'

export interface OutcomeSummary {
  measured: number
  improvedClicks: number
  avgClicksDelta: number
  avgPositionDelta: number // negative = improved (lower rank number is better)
  pending: number
  skipped: number
}

export function summarizeOutcomes(deployments: DeploymentDTO[]): OutcomeSummary {
  const eligible = deployments.filter((d) => d.status === 'verified' || d.status === 'rolled_back')
  const captured = eligible.filter((d) => d.outcome && !d.outcome.skipped)
  const skipped = eligible.filter((d) => d.outcome?.skipped).length
  const pending = eligible.length - captured.length - skipped

  const measured = captured.length
  const improvedClicks = captured.filter((d) => (d.outcome!.delta!.clicks ?? 0) > 0).length
  const avgClicksDelta = measured ? captured.reduce((n, d) => n + (d.outcome!.delta!.clicks ?? 0), 0) / measured : 0
  const avgPositionDelta = measured ? captured.reduce((n, d) => n + (d.outcome!.delta!.position ?? 0), 0) / measured : 0

  return { measured, improvedClicks, avgClicksDelta, avgPositionDelta, pending, skipped }
}
