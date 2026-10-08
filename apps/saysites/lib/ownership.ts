// Proof that the person who claimed a redesign preview runs that business.
// Anyone can make a preview of any website, so a claimed site stays off the
// public web (serve.ts) until its owner proves it, one of three ways:
// - email: a link sent to an address at the business's own website domain;
// - domain: pointing that domain at SaySites (checkDomain);
// - team: the SaySites team checks by hand (admins, /dashboard/outreach).
// Sites made any other way have no `ownership` field and aren't affected.
// Google Business Profile sign-in is planned once Google approves our access.

import { createHmac, timingSafeEqual } from 'crypto'
import type { Site } from './schema'

export type Ownership = NonNullable<Site['ownership']>

const DAY = 86_400_000
export const OWNERSHIP_LINK_DAYS = 3

export const awaitingOwner = (site: Pick<Site, 'ownership'>) => !!site.ownership && !site.ownership.verified

const secret = () => {
  const s = process.env.SAYSITES_SECRET
  if (!s || s.length < 32) throw new Error('SAYSITES_SECRET is not set')
  return s
}

// The local part of an address at the business's domain: letters, digits and
// . _ + - only, so the address is always theirs, never someone else's domain.
export function ownerAddress(local: string, domain: string): string | null {
  const l = local.trim().toLowerCase()
  if (!/^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/.test(l) || !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) return null
  return `${l}@${domain}`
}

const sign = (body: string) => createHmac('sha256', secret()).update(`ownership|${body}`).digest('base64url')

export function ownershipToken(siteId: string, email: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ s: siteId, e: email, x: now + OWNERSHIP_LINK_DAYS * DAY })).toString('base64url')
  return `${body}.${sign(body)}`
}

export function readOwnershipToken(token: string, now = Date.now()): { siteId: string; email: string } | null {
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const want = Buffer.from(sign(body))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const { s, e, x } = JSON.parse(Buffer.from(body, 'base64url').toString()) as { s: string; e: string; x: number }
    if (typeof s !== 'string' || typeof e !== 'string' || typeof x !== 'number' || x < now) return null
    return { siteId: s, email: e }
  } catch {
    return null
  }
}

export const verified = (how: Ownership['how'], domain: string | undefined, now = new Date()): Ownership => ({ verified: true, how, ...(domain ? { domain } : {}), at: now.toISOString() })
