// Backlink-drop alerts: when a scheduled backlink refresh finds the site's
// referring-domain count dropped significantly since the last real snapshot
// — a real link-loss event (removed guest post, expired domain, penalty,
// negative SEO) — the org's owners are emailed immediately rather than
// waiting to notice on the Rankings/Atlas dashboard. Mirrors rank-alert.ts's
// shape exactly: real snapshot data only, nothing invented.

import type { FoundationStore } from '../store'
import type { BacklinkSnapshot, Project } from '../types'
import { sendEmail, type MailResult } from '../mailer'
import { escapeHtml, resolveOwnerEmails } from './notify'

export interface BacklinkDrop {
  from: number
  to: number
  lost: number
}

// A drop is real only when both snapshots actually observed a count (never
// compares against an `available:false` snapshot) and the referring-domain
// count fell by at least `minDrop` domains — never fired on ordinary index
// noise (a provider re-crawl can shed and regain a handful of domains) or
// when there's no prior observed snapshot to compare against.
export function detectBacklinkDrop(
  previous: Pick<BacklinkSnapshot, 'available' | 'referringDomains'> | null,
  current: Pick<BacklinkSnapshot, 'available' | 'referringDomains'>,
  minDrop = 5
): BacklinkDrop | null {
  if (!previous || !previous.available || previous.referringDomains === null) return null
  if (!current.available || current.referringDomains === null) return null
  const from = previous.referringDomains
  const to = current.referringDomains
  const lost = from - to
  if (lost < minDrop) return null
  return { from, to, lost }
}

export interface BacklinkDropEmail {
  subject: string
  html: string
  text: string
}

export function buildBacklinkDropEmail(project: Pick<Project, 'domain' | 'name'>, drop: BacklinkDrop): BacklinkDropEmail {
  const label = project.name || project.domain
  const subject = `${label} lost ${drop.lost} referring domain${drop.lost !== 1 ? 's' : ''}`
  const line = `Referring domains: ${drop.from} → ${drop.to} (−${drop.lost})`
  const intro = `RankForge's latest backlink check for ${label} found a real drop in referring domains since the last check.`
  const outro = 'This can mean a link was removed, a linking domain expired, or a provider re-crawl — check the Backlinks history for the full trend before assuming the worst.'
  return {
    subject,
    text: `${intro}\n\n${line}\n\n${outro}`,
    html: `<p>${escapeHtml(intro)}</p><p>${escapeHtml(line)}</p><p>${escapeHtml(outro)}</p>`,
  }
}

// Best-effort, like notifyRankDrops/notifyRegressions: a delivery failure for
// one owner never throws or blocks the backlink-refresh job.
export async function notifyBacklinkDrop(
  store: Pick<FoundationStore, 'listMembers' | 'getUserById'>,
  project: Project,
  drop: BacklinkDrop | null
): Promise<MailResult[]> {
  if (!drop) return []
  const emails = await resolveOwnerEmails(store, project.orgId)
  if (emails.length === 0) return []

  const content = buildBacklinkDropEmail(project, drop)
  const results: MailResult[] = []
  for (const to of emails) {
    try {
      results.push(await sendEmail({ to, subject: content.subject, html: content.html, text: content.text }))
    } catch (err) {
      console.warn('[backlink-alert] send failed:', err instanceof Error ? err.message : err)
    }
  }
  return results
}
