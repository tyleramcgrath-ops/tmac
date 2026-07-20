// Pilot admin (RC2 P6 gap closed): org.pilot was previously only settable via
// a direct DB/script edit, and pilot feedback was only readable per-org. This
// proves the real staff-gated admin surface: RF_STAFF_EMAILS decides who can
// see it (everyone else gets an honest, indistinguishable-from-nonexistent
// 404), a staff caller can list every org and set its pilot status, and
// cross-org feedback is visible with real org/user attribution.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as feedbackPost } from '../app/api/feedback/route'
import { GET as adminOrgsGet } from '../app/api/admin/orgs/route'
import { PATCH as adminPilotPatch } from '../app/api/admin/orgs/[orgId]/pilot/route'
import { GET as adminFeedbackGet } from '../app/api/admin/feedback/route'

process.env.APP_SECRET = 'pilot-admin-secret-01'

function req(method: string, body?: unknown, cookie?: string): Request {
  return new Request('http://t', {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}
const cookieFrom = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]
const CTX0 = { params: Promise.resolve({}) }

async function signupAs(email: string) {
  const res = await signup(req('POST', { email, password: 'longenough123' }), CTX0)
  const cookie = cookieFrom(res)
  const { user, org } = (await res.json()) as { user: { id: string; email: string }; org: { id: string; name: string } }
  return { cookie, user, org }
}

describe('pilot admin', () => {
  let store: FileFoundationStore
  const staffEmail = `staff_${randomUUID()}@rankforge.internal`

  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-pilot-admin-')))
    __setStoreForTests(store)
    __resetRateLimits()
    process.env.RF_STAFF_EMAILS = staffEmail
  })
  afterEach(() => {
    __setStoreForTests(null)
    delete process.env.RF_STAFF_EMAILS
  })

  it('a non-staff logged-in user gets an honest 404 from every admin route', async () => {
    const regular = await signupAs(`regular_${randomUUID()}@x.com`)
    const orgsRes = await adminOrgsGet(req('GET', undefined, regular.cookie), CTX0)
    expect(orgsRes.status).toBe(404)
    const feedbackRes = await adminFeedbackGet(req('GET', undefined, regular.cookie), CTX0)
    expect(feedbackRes.status).toBe(404)
    const pilotRes = await adminPilotPatch(
      req('PATCH', { status: 'disabled' }, regular.cookie),
      { params: Promise.resolve({ orgId: regular.org.id }) }
    )
    expect(pilotRes.status).toBe(404)
  })

  it('an unauthenticated caller gets 401, not 404 (no email to check yet)', async () => {
    const res = await adminOrgsGet(req('GET'), CTX0)
    expect(res.status).toBe(401)
  })

  it('a staff user can list every org, set pilot status, and see it persisted', async () => {
    const staff = await signupAs(staffEmail)
    const other = await signupAs(`other_${randomUUID()}@x.com`)

    const listRes = await adminOrgsGet(req('GET', undefined, staff.cookie), CTX0)
    expect(listRes.status).toBe(200)
    const { orgs } = await listRes.json()
    const otherRow = orgs.find((o: { id: string }) => o.id === other.org.id)
    expect(otherRow).toBeTruthy()
    expect(otherRow.pilot).toBeNull()
    expect(otherRow.ownerEmail).toBe(other.user.email)
    expect(otherRow.memberCount).toBe(1)

    const patchRes = await adminPilotPatch(
      req('PATCH', { status: 'expired', expiresAt: '2026-01-01T00:00:00Z', notes: 'trial ended' }, staff.cookie),
      { params: Promise.resolve({ orgId: other.org.id }) }
    )
    expect(patchRes.status).toBe(200)
    const patched = await patchRes.json()
    expect(patched.org.pilot).toEqual({ status: 'expired', expiresAt: '2026-01-01T00:00:00Z', notes: 'trial ended' })

    const relistRes = await adminOrgsGet(req('GET', undefined, staff.cookie), CTX0)
    const { orgs: reOrgs } = await relistRes.json()
    expect(reOrgs.find((o: { id: string }) => o.id === other.org.id).pilot.status).toBe('expired')
  })

  it('rejects an invalid pilot status', async () => {
    const staff = await signupAs(staffEmail)
    const res = await adminPilotPatch(
      req('PATCH', { status: 'not-a-real-status' }, staff.cookie),
      { params: Promise.resolve({ orgId: staff.org.id }) }
    )
    expect(res.status).toBe(400)
  })

  it('a staff user sees cross-org feedback with real attribution, newest first', async () => {
    const staff = await signupAs(staffEmail)
    const alice = await signupAs(`alice_${randomUUID()}@x.com`)
    const bob = await signupAs(`bob_${randomUUID()}@x.com`)

    await feedbackPost(req('POST', { kind: 'feedback', message: 'love it' }, alice.cookie), CTX0)
    await feedbackPost(req('POST', { kind: 'issue', message: 'crawl stalled' }, bob.cookie), CTX0)

    const res = await adminFeedbackGet(req('GET', undefined, staff.cookie), CTX0)
    expect(res.status).toBe(200)
    const { feedback } = await res.json()
    expect(feedback.length).toBe(2)
    const bobEntry = feedback.find((f: { message: string }) => f.message === 'crawl stalled')
    expect(bobEntry.userEmail).toBe(bob.user.email)
    expect(bobEntry.orgName).toBe(bob.org.name)
    expect(bobEntry.kind).toBe('issue')
  })
})
