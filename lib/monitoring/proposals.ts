// Agentic fix loop — turn a report's recommendations into concrete, approvable
// edits, then publish the approved ones to WordPress. Nothing is ever changed
// without explicit approval; credentials are supplied per-request, never stored.

import type { Report } from '../types'
import {
  buildFaqBlock,
  buildShortAnswerBlock,
  proposeChangesFromReport,
  wpApplyChanges,
  wpFindPost,
  type WpApplyOptions,
  type WpConnection,
} from '../wordpress'
import { getProposal, saveProposal } from './store'
import type { ChangeProposal, ProposedChange } from './types'

function id(): string {
  return `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Derive an approvable change set from a completed report. Lowest-risk edits
 * first (title, meta, short answer, FAQ, schema). Meta and schema are marked
 * non-auto because WordPress stores them outside the core REST surface.
 */
export function buildProposalFromReport(siteId: string, report: Report): ChangeProposal {
  const r = report.results
  const page = r?.userAnalysis?.page ?? null
  const suggested = proposeChangesFromReport(report)
  const changes: ProposedChange[] = []

  if (suggested.title && suggested.title !== page?.title) {
    changes.push({
      field: 'title',
      label: 'Page title',
      before: page?.title ?? null,
      after: suggested.title,
      rationale: 'Tightens the title around the target keyword and intent.',
      auto: true,
    })
  }
  if (suggested.metaDescription && suggested.metaDescription !== page?.metaDescription) {
    changes.push({
      field: 'metaDescription',
      label: 'Meta description',
      before: page?.metaDescription ?? null,
      after: suggested.metaDescription,
      rationale: 'Improves the search snippet and click-through.',
      auto: false, // AIOSEO stores meta separately; verified on apply
    })
  }
  if (suggested.shortAnswer) {
    changes.push({
      field: 'shortAnswer',
      label: 'Short-answer paragraph',
      before: null,
      after: suggested.shortAnswer,
      rationale: 'Gives AI answer engines a citable, direct answer up top (GEO/AEO).',
      auto: true,
    })
  }
  if (suggested.faq && suggested.faq.length > 0) {
    changes.push({
      field: 'faq',
      label: `FAQ section (${suggested.faq.length} questions)`,
      before: null,
      after: suggested.faq.map((f) => `• ${f.q}`).join('\n'),
      rationale: 'Answers real People-Also-Ask questions and adds FAQ schema surface.',
      auto: true,
    })
  }
  const jsonld = r?.schemaGap?.suggestedJsonLd ?? []
  if (jsonld.length > 0) {
    changes.push({
      field: 'schema',
      label: `Structured data (${jsonld.length} block${jsonld.length === 1 ? '' : 's'})`,
      before: (page?.schemaTypes ?? []).join(', ') || null,
      after: JSON.stringify(jsonld, null, 2),
      rationale: 'Adds missing schema types competitors have; ready to paste as JSON-LD.',
      auto: false,
    })
  }

  return {
    id: id(),
    siteId,
    url: report.input.url,
    reportId: report.id,
    createdAt: new Date().toISOString(),
    status: 'proposed',
    changes,
  }
}

/**
 * Publish the auto-appliable changes of an approved proposal to WordPress.
 * The FAQ answers are placeholders until edited, so FAQ is only published when
 * `includeFaq` is explicitly set. Returns the updated proposal.
 */
export async function applyProposal(
  proposalId: string,
  conn: WpConnection,
  report: Report,
  opts?: { includeFaq?: boolean }
): Promise<ChangeProposal> {
  const proposal = await getProposal(proposalId)
  if (!proposal) throw new Error('Proposal not found.')

  const ref = await wpFindPost(conn, proposal.url)
  if (!ref) throw new Error('Could not find this page in WordPress to edit.')

  const suggested = proposeChangesFromReport(report)
  const apply: WpApplyOptions = {}
  const wants = new Set(proposal.changes.filter((c) => c.auto).map((c) => c.field))
  if (wants.has('title') && suggested.title) apply.title = suggested.title
  if (wants.has('shortAnswer') && suggested.shortAnswer) apply.shortAnswerHtml = buildShortAnswerBlock(suggested.shortAnswer)
  if (opts?.includeFaq && wants.has('faq') && suggested.faq) apply.faqHtml = buildFaqBlock(suggested.faq)
  if (suggested.metaDescription) apply.metaDescription = suggested.metaDescription // verified server-side

  const results = await wpApplyChanges(conn, ref, apply)

  // fold results back onto the proposal's changes
  for (const change of proposal.changes) {
    const res = results.find((r) => r.kind === change.field)
    if (res) {
      change.applied = res.applied
      change.resultMessage = res.message
    }
  }
  const appliedCount = proposal.changes.filter((c) => c.applied).length
  const autoCount = proposal.changes.filter((c) => c.auto).length
  proposal.status = appliedCount === 0 ? 'failed' : appliedCount < autoCount ? 'partial' : 'applied'
  proposal.appliedAt = new Date().toISOString()
  await saveProposal(proposal)
  return proposal
}
