// Weekly (or daily, whatever cadence the project's `monitor` schedule uses)
// summary email — the 'monitor' JobKind, previously declared in the type but
// never wired to a handler. Real project state only, computed from the same
// data the dashboard shows: latest scan, operator metrics, regressions.
// Agencies (and anyone tracking a project passively) get proof of movement
// without opening the app.

import type { FoundationStore } from '../store'
import type { Job, Project, Scan, WpDeployment } from '../types'
import { computeOperatorMetrics, type OperatorMetrics } from '../operator/metrics'
import { sendEmail, type MailResult } from '../mailer'
import { escapeHtml, resolveOwnerEmails } from './notify'

export interface DigestContent {
  subject: string
  html: string
  text: string
}

// The proof-of-ROI moat (SCHEDULER_DESIGN.md §11's payoff): not "here's what
// we found" but "here's the REAL, measured Search Console impact of what we
// shipped." `measured` only counts deployments with a captured delta —
// pending/skipped are reported separately, never folded into the headline
// number, so a quiet week never reads as a fabricated zero-impact claim.
export interface OutcomeDigestSummary {
  measured: number
  improvedClicks: number
  avgClicksDelta: number
  avgPositionDelta: number // negative = improved (lower rank number is better)
  pending: number
  skipped: number
}

export function summarizeDeploymentOutcomes(deployments: Pick<WpDeployment, 'status' | 'outcome'>[]): OutcomeDigestSummary {
  const eligible = deployments.filter((d) => d.status === 'verified' || d.status === 'rolled_back')
  const captured = eligible.filter((d) => d.outcome && !d.outcome.skipped)
  const skipped = eligible.filter((d) => d.outcome?.skipped).length
  const pending = eligible.length - captured.length - skipped

  const measured = captured.length
  const improvedClicks = captured.filter((d) => (d.outcome && !d.outcome.skipped ? d.outcome.delta.clicks : 0) > 0).length
  const avgClicksDelta = measured ? captured.reduce((n, d) => n + (d.outcome && !d.outcome.skipped ? d.outcome.delta.clicks : 0), 0) / measured : 0
  const avgPositionDelta = measured ? captured.reduce((n, d) => n + (d.outcome && !d.outcome.skipped ? d.outcome.delta.position : 0), 0) / measured : 0

  return { measured, improvedClicks, avgClicksDelta, avgPositionDelta, pending, skipped }
}

// Pure: builds the email from real, already-computed state. `scan` is the
// project's latest scan (null for a project that has never completed one —
// reported honestly as "no audit yet", never a fabricated score). `outcomes`
// is omitted from the email entirely when there's nothing measured yet
// (never a "0 clicks" line that reads as a failed campaign).
export function buildDigestContent(project: Pick<Project, 'domain' | 'name'>, scan: Scan | null, metrics: OperatorMetrics, outcomes?: OutcomeDigestSummary): DigestContent {
  const label = project.name || project.domain
  const subject = scan ? `Weekly summary for ${label} — site score ${scan.summary.siteScore}` : `Weekly summary for ${label} — no audit yet`

  const scanLines: [string, string][] = scan
    ? [
        ['Site score', String(scan.summary.siteScore)],
        ['Pages crawled', String(scan.summary.pagesCrawled)],
        ['Critical issues', String(scan.summary.critical)],
      ]
    : [['Site score', 'No audit has completed yet']]

  const opLines: [string, string][] = [
    ['Verified fixes', String(metrics.verifiedImprovements)],
    ['Pending approvals', String(metrics.pendingApprovals)],
    ['Regressed fixes', String(metrics.regressedRecommendations)],
    ['Trust score', metrics.trustScore === null ? 'no deployments yet' : String(metrics.trustScore)],
  ]

  const outcomeLines: [string, string][] | null = outcomes && outcomes.measured > 0
    ? [
        ['Fixes with measured impact', String(outcomes.measured)],
        ['Improved clicks', `${outcomes.improvedClicks} of ${outcomes.measured}`],
        ['Avg. clicks change', (outcomes.avgClicksDelta >= 0 ? '+' : '') + outcomes.avgClicksDelta.toFixed(1)],
        ['Avg. position change', (outcomes.avgPositionDelta <= 0 ? '' : '+') + outcomes.avgPositionDelta.toFixed(1) + (outcomes.avgPositionDelta < 0 ? ' (better)' : outcomes.avgPositionDelta > 0 ? ' (worse)' : '')],
      ]
    : null

  const rowsText = (rows: [string, string][]) => rows.map(([k, v]) => `- ${k}: ${v}`).join('\n')
  const rowsHtml = (rows: [string, string][]) => rows.map(([k, v]) => `<li>${escapeHtml(k)}: <b>${escapeHtml(v)}</b></li>`).join('')

  const outcomeTextBlock = outcomeLines ? `\n\nProof of impact (real Search Console deltas):\n${rowsText(outcomeLines)}` : ''
  const outcomeHtmlBlock = outcomeLines ? `<p>Proof of impact (real Search Console deltas):</p><ul>${rowsHtml(outcomeLines)}</ul>` : ''

  const text = `Weekly summary for ${label}\n\n${rowsText(scanLines)}\n\n${rowsText(opLines)}${outcomeTextBlock}\n\nOpen RankForge for the full breakdown.`
  const html = `<p>Weekly summary for <b>${escapeHtml(label)}</b></p><ul>${rowsHtml(scanLines)}</ul><ul>${rowsHtml(opLines)}</ul>${outcomeHtmlBlock}<p>Open RankForge for the full breakdown.</p>`

  return { subject, html, text }
}

export async function runMonitorDigest(store: FoundationStore, job: Job): Promise<Record<string, unknown>> {
  const project = await store.getProject(job.projectId)
  if (!project) throw new Error(`Project ${job.projectId} not found`)

  const [scans, recs, deployments] = await Promise.all([
    store.listScans(project.id, 1),
    store.listRecommendations(project.id),
    store.listWpDeployments(project.id),
  ])
  const scan = scans[0] ?? null
  const metrics = computeOperatorMetrics(recs, deployments, new Date().toISOString().slice(0, 10))
  const outcomes = summarizeDeploymentOutcomes(deployments)

  const content = buildDigestContent(project, scan, metrics, outcomes)
  const emails = await resolveOwnerEmails(store, project.orgId)
  const results: MailResult[] = []
  for (const to of emails) {
    try {
      results.push(await sendEmail({ to, subject: content.subject, html: content.html, text: content.text }))
    } catch (err) {
      console.warn('[digest] send failed:', err instanceof Error ? err.message : err)
    }
  }
  return { sent: results.length, recipients: emails.length }
}
