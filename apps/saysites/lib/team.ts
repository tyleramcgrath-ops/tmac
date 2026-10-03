// Staff logins. An owner invites people (intake staff, a paralegal, an
// office manager) by email; each gets their own login and works the site's
// Leads: stages, notes, emails, follow-ups, assignment. Everything else
// (the website, settings, billing, automations, CRM keys) stays the
// owner's. Every change on a lead's timeline says who made it.

import { randomBytes } from 'crypto'
import type { LeadMeta } from './leads'
import type { Site } from './schema'
import type { Store } from './store'

export type Role = 'owner' | 'staff'

export const INVITE_CODE = /^[a-f0-9]{32}$/
export const invitePath = (code: string) => `/invite/${code}`
export const newInviteCode = () => randomBytes(16).toString('hex')

// Who may open a site, and as what. Owners first; staff only through a
// membership the owner created.
export async function siteAccess(store: Store, userId: string, siteId: string): Promise<{ site: Site; role: Role } | null> {
  const own = await store.siteForUser(userId, siteId)
  if (own) return { site: own, role: 'owner' }
  if (await store.isMember(siteId, userId)) {
    const site = await store.siteById(siteId)
    if (site) return { site, role: 'staff' }
  }
  return null
}

// Everyone a lead can be assigned to: the owner, then staff.
export async function teamFor(store: Store, site: Site): Promise<{ userId: string; name: string; email: string; role: Role }[]> {
  const [owner, members] = await Promise.all([store.userById(site.orgId), store.membersForSite(site.id)])
  return [...(owner ? [{ userId: owner.id, name: owner.name, email: owner.email, role: 'owner' as const }] : []), ...members.map((m) => ({ userId: m.userId, name: m.name, email: m.email, role: 'staff' as const }))]
}

// Marks the timeline entries an action just added with who did it.
export function stamp(meta: LeadMeta, by: string, since: string): void {
  for (const e of meta.activity) if (!e.by && e.at >= since) e.by = by.slice(0, 80)
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name
