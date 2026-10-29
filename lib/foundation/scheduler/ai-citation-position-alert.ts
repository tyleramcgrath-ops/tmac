// AI-citation position-drop alerts: when a tracked query is STILL cited but
// its position among the AI answer's sources gets meaningfully worse (e.g.
// 1st source -> 6th), that's a real decline in AI visibility distinct from
// losing the citation entirely — users skim the first few sources, so a
// citation buried at position 8 is worth far less than one at position 1,
// even though both count as "cited" for detectCitationLosses. Mirrors this
// session's alert modules: real snapshot data only, nothing invented.

import type { FoundationStore } from '../store'
import type { AiCitationSnapshot, Project } from '../types'
import { sendEmail, type MailResult } from '../mailer'
import { escapeHtml, resolveOwnerEmails } from './notify'

export interface CitationPositionDrop {
  query: string
  from: number
  to: number
}

// A drop is real only when BOTH checks actually observed a citation
// (available && cited && position !== null) — never fabricates a "worse"
// position out of a citation that was lost entirely (that's
// detectCitationLosses's job) or a failed/unavailable check.
export function detectCitationPositionDrops(
  previous: Pick<AiCitationSnapshot, 'query' | 'available' | 'cited' | 'position'>[],
  current: { query: string; available: boolean; cited: boolean; position: number | null }[],
  minDrop = 3
): CitationPositionDrop[] {
  const prevByQuery = new Map(previous.map((p) => [p.query, p]))
  const drops: CitationPositionDrop[] = []
  for (const c of current) {
    const prev = prevByQuery.get(c.query)
    if (!prev || !prev.available || !prev.cited || prev.position === null) continue
    if (!c.available || !c.cited || c.position === null) continue
    const delta = c.position - prev.position
    if (delta >= minDrop) drops.push({ query: c.query, from: prev.position, to: c.position })
  }
  return drops
}

export interface CitationPositionDropEmail {
  subject: string
  html: string
  text: string
}

export function buildCitationPositionDropEmail(
  project: Pick<Project, 'domain' | 'name'>,
  drops: CitationPositionDrop[]
): CitationPositionDropEmail {
  const n = drops.length
  const label = project.name || project.domain
  const subject = `AI citation position dropped for ${n} quer${n !== 1 ? 'ies' : 'y'} — ${label}`
  const lineOf = (d: CitationPositionDrop) => `"${d.query}": source #${d.from} → #${d.to}`
  const lines = drops.map((d) => `- ${lineOf(d)}`).join('\n')
  const htmlLines = drops.map((d) => `<li>${escapeHtml(lineOf(d))}</li>`).join('')
  const intro = `RankForge checked ${label}'s tracked AI-answer-engine queries and found ${n} quer${n !== 1 ? 'ies' : 'y'} still cited, but at a meaningfully worse source position than last time.`
  const outro = 'Still cited is good, but a lower position means fewer people actually see it — check AI Visibility for the full history and whether a competitor moved ahead of you as a source.'
  return {
    subject,
    text: `${intro}\n\n${lines}\n\n${outro}`,
    html: `<p>${escapeHtml(intro)}</p><ul>${htmlLines}</ul><p>${escapeHtml(outro)}</p>`,
  }
}

// Best-effort, like the other alert modules: a delivery failure for one
// owner never throws or blocks the AI-citation-check job.
export async function notifyCitationPositionDrops(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  project: Project,
  drops: CitationPositionDrop[]
): Promise<MailResult[]> {
  if (drops.length === 0) return []
  const emails = await resolveOwnerEmails(store, project.orgId)
  if (emails.length === 0) return []

  const content = buildCitationPositionDropEmail(project, drops)
  const results: MailResult[] = []
  for (const to of emails) {
    try {
      results.push(await sendEmail({ to, subject: content.subject, html: content.html, text: content.text }))
    } catch (err) {
      console.warn('[ai-citation-position-alert] send failed:', err instanceof Error ? err.message : err)
    }
  }
  return results
}
