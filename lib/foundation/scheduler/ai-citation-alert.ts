// AI-citation-loss alerts: when a scheduled AI-answer-engine check finds a
// tracked query that WAS cited is no longer cited — real loss of AI
// visibility (Perplexity stopped surfacing this domain as a source) — the
// org's owners are emailed immediately rather than waiting to notice on the
// dashboard. Mirrors rank-alert.ts/backlink-alert.ts's shape exactly: real
// snapshot data only, nothing invented.

import type { FoundationStore } from '../store'
import type { AiCitationSnapshot, Project } from '../types'
import { sendEmail, type MailResult } from '../mailer'
import { escapeHtml, resolveOwnerEmails } from './notify'

export interface CitationLoss {
  query: string
}

// A loss is real only when the PREVIOUS check actually observed a citation
// (available && cited) and the CURRENT check actually ran (available) and
// found none. A failed/unavailable current check is never treated as a loss
// — that would fabricate a signal out of a missing data point.
export function detectCitationLosses(
  previous: Pick<AiCitationSnapshot, 'query' | 'available' | 'cited'>[],
  current: { query: string; available: boolean; cited: boolean }[]
): CitationLoss[] {
  const prevByQuery = new Map(previous.map((p) => [p.query, p]))
  const losses: CitationLoss[] = []
  for (const c of current) {
    const prev = prevByQuery.get(c.query)
    if (!prev || !prev.available || !prev.cited) continue // wasn't cited before — nothing to lose
    if (!c.available) continue // failed lookup, not an observed loss
    if (!c.cited) losses.push({ query: c.query })
  }
  return losses
}

export interface CitationLossEmail {
  subject: string
  html: string
  text: string
}

export function buildCitationLossEmail(project: Pick<Project, 'domain' | 'name'>, losses: CitationLoss[]): CitationLossEmail {
  const n = losses.length
  const label = project.name || project.domain
  const subject = `Lost AI citation${n !== 1 ? 's' : ''} for ${n} quer${n !== 1 ? 'ies' : 'y'} — ${label}`
  const lines = losses.map((l) => `- "${l.query}"`).join('\n')
  const htmlLines = losses.map((l) => `<li>${escapeHtml(l.query)}</li>`).join('')
  const intro = `RankForge checked ${label}'s tracked AI-answer-engine queries and found ${n} quer${n !== 1 ? 'ies' : 'y'} that WAS being cited but no longer is.`
  const outro = 'AI answer engines (Perplexity and similar) re-crawl and re-rank sources continuously — this can be a content freshness signal, a competitor displacing you as a source, or normal churn. Check AI Visibility for the full history.'
  return {
    subject,
    text: `${intro}\n\n${lines}\n\n${outro}`,
    html: `<p>${escapeHtml(intro)}</p><ul>${htmlLines}</ul><p>${escapeHtml(outro)}</p>`,
  }
}

// Best-effort, like notifyRankDrops/notifyBacklinkDrop: a delivery failure
// for one owner never throws or blocks the AI-citation-check job.
export async function notifyCitationLosses(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  project: Project,
  losses: CitationLoss[]
): Promise<MailResult[]> {
  if (losses.length === 0) return []
  const emails = await resolveOwnerEmails(store, project.orgId)
  if (emails.length === 0) return []

  const content = buildCitationLossEmail(project, losses)
  const results: MailResult[] = []
  for (const to of emails) {
    try {
      results.push(await sendEmail({ to, subject: content.subject, html: content.html, text: content.text }))
    } catch (err) {
      console.warn('[ai-citation-alert] send failed:', err instanceof Error ? err.message : err)
    }
  }
  return results
}
