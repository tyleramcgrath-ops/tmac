// Regression alerts: when a scheduled re-crawl finds a previously-verified
// fix reverted on the live site (lib/foundation/reco/identity.ts's
// mergeForUpsert), the org's owners are emailed — this is the "monitoring"
// half of regression detection; the dashboard banner (OperatorTab) is the
// passive half. Real content only: every line is built from the actual
// regressed Recommendation records, nothing invented.

import type { FoundationStore } from '../store'
import type { Project, Recommendation } from '../types'
import { sendEmail, type MailResult } from '../mailer'
import { escapeHtml, resolveOwnerEmails } from './notify'

export interface RegressionEmail {
  subject: string
  html: string
  text: string
}

// Pure: builds the email content from real regressed records. Capped at 10
// listed issues so a mass-regression (e.g. a full theme rollback) doesn't
// produce an unreadable wall of text — the count in the subject is always
// the real total, never truncated silently without saying so.
export function buildRegressionEmail(project: Pick<Project, 'domain' | 'name'>, regressed: Recommendation[]): RegressionEmail {
  const n = regressed.length
  const shown = regressed.slice(0, 10)
  const more = n - shown.length
  const label = project.name || project.domain
  const subject = `${n} fix${n !== 1 ? 'es' : ''} reverted on ${label}`

  const lineOf = (r: Recommendation) => `${r.title} (${r.evidence.affectedUrls[0] ?? project.domain})`
  const textLines = shown.map((r) => `- ${lineOf(r)}`).join('\n')
  const htmlLines = shown.map((r) => `<li>${escapeHtml(r.title)} (${escapeHtml(r.evidence.affectedUrls[0] ?? project.domain)})</li>`).join('')

  const intro = `RankForge re-scanned ${label} and found ${n} previously-verified fix${n !== 1 ? 'es' : ''} reverted on the live site.`
  const outro = 'Something outside RankForge changed these pages back — a theme update, a manual edit, or a plugin. Review and redeploy from the Recommendations tab.'
  const moreLine = more > 0 ? `…and ${more} more.` : ''

  return {
    subject,
    text: `${intro}\n\n${textLines}${moreLine ? `\n${moreLine}` : ''}\n\n${outro}`,
    html: `<p>${escapeHtml(intro)}</p><ul>${htmlLines}</ul>${moreLine ? `<p>${escapeHtml(moreLine)}</p>` : ''}<p>${escapeHtml(outro)}</p>`,
  }
}

// Emails every owner of the project's org. Best-effort: a delivery failure
// for one owner never blocks the scan job or throws — it's an alert, not a
// required step of the crawl.
export async function notifyRegressions(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  project: Project,
  regressed: Recommendation[]
): Promise<MailResult[]> {
  if (regressed.length === 0) return []
  const emails = await resolveOwnerEmails(store, project.orgId)
  if (emails.length === 0) return []

  const content = buildRegressionEmail(project, regressed)
  const results: MailResult[] = []
  for (const to of emails) {
    try {
      results.push(await sendEmail({ to, subject: content.subject, html: content.html, text: content.text }))
    } catch (err) {
      console.warn('[regression-alert] send failed:', err instanceof Error ? err.message : err)
    }
  }
  return results
}
