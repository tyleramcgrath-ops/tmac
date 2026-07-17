// RC2 P4 (email verification) + P6 (pilot admin) route/flow tests.

import { beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests, getStore } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { __lastVerificationLink, __resetMailer } from '../lib/foundation/mailer'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { GET as verify } from '../app/api/auth/verify/route'
import { POST as resend } from '../app/api/auth/resend/route'
import { POST as feedbackPost, GET as feedbackGet } from '../app/api/feedback/route'
import { GET as scansGet } from '../app/api/projects/[projectId]/scans/route'

process.env.APP_SECRET = 'pilot-test-secret-000000000001'

const C0 = { params: Promise.resolve({}) }
function jreq(body: unknown, cookie?: string, method = 'POST'): Request {
  return new Request('http://t', { method, headers: { 'Content-Type': 'application/json', origin: 'http://t', host: 't', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
}
const cookieOf = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]
const tokenFromLink = (link: string) => new URL(link).searchParams.get('token') ?? ''

let store: FileFoundationStore
beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-pilot-')))
  __setStoreForTests(store)
  __resetRateLimits()
  __resetMailer()
  delete process.env.RF_SIGNUP_ALLOWLIST
})

describe('P6 signup allow-list', () => {
  it('blocks non-allowlisted emails when RF_SIGNUP_ALLOWLIST is set', async () => {
    process.env.RF_SIGNUP_ALLOWLIST = '@acme.com,vip@x.com'
    expect((await signup(jreq({ email: 'stranger@x.com', password: 'longenough123' }), C0)).status).toBe(403)
    expect((await signup(jreq({ email: 'ceo@acme.com', password: 'longenough123' }), C0)).status).toBe(201)
    expect((await signup(jreq({ email: 'vip@x.com', password: 'longenough123' }), C0)).status).toBe(201)
  })
  it('is open when unset', async () => {
    expect((await signup(jreq({ email: 'anyone@x.com', password: 'longenough123' }), C0)).status).toBe(201)
  })
})

describe('P4 email verification', () => {
  it('creates an unverified account, then the emailed link verifies it', async () => {
    const res = await signup(jreq({ email: 'v@x.com', password: 'longenough123' }), C0)
    expect(res.status).toBe(201)
    const link = __lastVerificationLink('v@x.com')!
    expect(link).toContain('/api/auth/verify?token=')
    // Unverified before clicking.
    expect((await store.getUserByEmail('v@x.com'))?.emailVerified).toBe(false)
    // Click the link.
    const vr = await verify(new Request(link), C0)
    expect(vr.status).toBe(302)
    expect(vr.headers.get('location')).toContain('verify=success')
    expect((await store.getUserByEmail('v@x.com'))?.emailVerified).toBe(true)
  })
  it('rejects an invalid or expired token honestly', async () => {
    await signup(jreq({ email: 'e@x.com', password: 'longenough123' }), C0)
    const bad = await verify(new Request('http://t/api/auth/verify?token=nope'), C0)
    expect(bad.headers.get('location')).toContain('verify=invalid')
    // Expire the token.
    const u = (await store.getUserByEmail('e@x.com'))!
    await store.updateUser({ ...u, verifyTokenExpiresAt: new Date(Date.now() - 1000).toISOString() })
    const exp = await verify(new Request(`http://t/api/auth/verify?token=${u.verifyToken}`), C0)
    expect(exp.headers.get('location')).toContain('verify=expired')
  })
  it('resend issues a fresh working token', async () => {
    const cookie = cookieOf(await signup(jreq({ email: 'r@x.com', password: 'longenough123' }), C0))
    const rr = await resend(jreq({}, cookie), C0)
    expect(rr.status).toBe(200)
    const link = __lastVerificationLink('r@x.com')!
    const vr = await verify(new Request(link), C0)
    expect(vr.headers.get('location')).toContain('verify=success')
  })
})

describe('P6 pilot feedback', () => {
  it('accepts feedback + issues and lists them for the org', async () => {
    const cookie = cookieOf(await signup(jreq({ email: 'f@x.com', password: 'longenough123' }), C0))
    expect((await feedbackPost(jreq({ kind: 'feedback', message: 'love it' }, cookie), C0)).status).toBe(201)
    expect((await feedbackPost(jreq({ kind: 'issue', message: 'deploy button unclear' }, cookie), C0)).status).toBe(201)
    expect((await feedbackPost(jreq({ message: '' }, cookie), C0)).status).toBe(400) // empty rejected
    const list = (await (await feedbackGet(new Request('http://t', { headers: { cookie } }), C0)).json()) as { feedback: { kind: string }[] }
    expect(list.feedback).toHaveLength(2)
    expect(list.feedback.map((f) => f.kind).sort()).toEqual(['feedback', 'issue'])
  })
})

describe('P6 pilot expiration', () => {
  it('blocks project access once the pilot window has ended', async () => {
    const cookie = cookieOf(await signup(jreq({ email: 'p@x.com', password: 'longenough123' }), C0))
    const pr = await createProject(jreq({ domain: 'p.com' }, cookie), C0)
    const { project } = (await pr.json()) as { project: { id: string; orgId: string } }
    const ctx = { params: Promise.resolve({ projectId: project.id }) }
    // Works while active.
    expect((await scansGet(new Request('http://t', { headers: { cookie } }), ctx)).status).toBe(200)
    // Expire the org's pilot window.
    const org = (await store.getOrg(project.orgId))!
    await store.updateOrg({ ...org, pilot: { status: 'active', expiresAt: new Date(Date.now() - 1000).toISOString() } })
    const blocked = await scansGet(new Request('http://t', { headers: { cookie } }), ctx)
    expect(blocked.status).toBe(403)
    expect(JSON.stringify(await blocked.json())).toMatch(/pilot access has ended/i)
  })
})
