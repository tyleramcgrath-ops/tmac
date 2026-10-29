// Rank-drop alerts: when a scheduled rank-tracking check finds a tracked
// keyword has dropped significantly since its last real snapshot — fell off
// the tracked results entirely, or its position got meaningfully worse — the
// org's owners are emailed immediately, rather than waiting for the weekly
// digest. Mirrors regression-alert.ts's shape exactly (pure content builder +
// notify function): real snapshot data only, nothing invented.

import type { FoundationStore } from '../store'
import type { Project, RankSnapshot } from '../types'
import { sendEmail, type MailResult } from '../mailer'
import { escapeHtml, resolveOwnerEmails } from './notify'

export interface RankDrop {
  keyword: string
  from: number | null // previous real position (null = wasn't ranking)
  to: number | null // new real position (null = no longer ranking)
}

// A drop is real when: the keyword FELL OFF (was ranking, now isn't), or its
// position got worse by at least `minDrop` — never fired on noise (a 1-2
// position wobble is normal SERP volatility, not a signal) or on a keyword
// with no prior snapshot to compare against (nothing to call a "drop" yet).
export function detectRankDrops(
  previous: Pick<RankSnapshot, 'keyword' | 'position'>[],
  current: { keyword: string; position: number | null }[],
  minDrop = 5
): RankDrop[] {
  const prevByKeyword = new Map(previous.map((p) => [p.keyword, p.position]))
  const drops: RankDrop[] = []
  for (const c of current) {
    if (!prevByKeyword.has(c.keyword)) continue
    const from = prevByKeyword.get(c.keyword)!
    if (from === null) continue // wasn't ranking before — nothing to drop from
    const fellOff = from !== null && c.position === null
    const gotWorse = from !== null && c.position !== null && c.position - from >= minDrop
    if (fellOff || gotWorse) drops.push({ keyword: c.keyword, from, to: c.position })
  }
  return drops
}

export interface RankDropEmail {
  subject: string
  html: string
  text: string
}

export function buildRankDropEmail(project: Pick<Project, 'domain' | 'name'>, drops: RankDrop[]): RankDropEmail {
  const n = drops.length
  const label = project.name || project.domain
  const subject = `${n} keyword${n !== 1 ? 's' : ''} dropped in Google for ${label}`

  const lineOf = (d: RankDrop) => `"${d.keyword}": #${d.from} → ${d.to === null ? 'not ranking' : `#${d.to}`}`
  const textLines = drops.map((d) => `- ${lineOf(d)}`).join('\n')
  const htmlLines = drops.map((d) => `<li>${escapeHtml(lineOf(d))}</li>`).join('')

  const intro = `RankForge checked ${label}'s tracked keywords and found ${n} real position drop${n !== 1 ? 's' : ''} since the last check.`
  const outro = 'This can be normal SERP volatility, a Google algorithm update, or a real regression on the page — check Rankings for the full history and compare against recent site changes.'

  return {
    subject,
    text: `${intro}\n\n${textLines}\n\n${outro}`,
    html: `<p>${escapeHtml(intro)}</p><ul>${htmlLines}</ul><p>${escapeHtml(outro)}</p>`,
  }
}

// Best-effort, like notifyRegressions: a delivery failure for one owner
// never throws or blocks the rank-tracking job.
export async function notifyRankDrops(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  project: Project,
  drops: RankDrop[]
): Promise<MailResult[]> {
  if (drops.length === 0) return []
  const emails = await resolveOwnerEmails(store, project.orgId)
  if (emails.length === 0) return []

  const content = buildRankDropEmail(project, drops)
  const results: MailResult[] = []
  for (const to of emails) {
    try {
      results.push(await sendEmail({ to, subject: content.subject, html: content.html, text: content.text }))
    } catch (err) {
      console.warn('[rank-alert] send failed:', err instanceof Error ? err.message : err)
    }
  }
  return results
}
