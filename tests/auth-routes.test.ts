// Route-level tests: signup → session cookie → me → login; input validation;
// project route authorization through the real handlers.

import { beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as login } from '../app/api/auth/login/route'
import { POST as logout } from '../app/api/auth/logout/route'
import { GET as me } from '../app/api/auth/me/route'
import { GET as listProjects, POST as createProject } from '../app/api/projects/route'
import { GET as getProject } from '../app/api/projects/[projectId]/route'

process.env.APP_SECRET = 'test-secret-for-route-suite'

const CTX = { params: Promise.resolve({}) }

function jsonReq(url: string, body: unknown, cookie?: string): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
}

function cookieFrom(res: Response): string {
  const raw = res.headers.get('set-cookie') ?? ''
  return raw.split(';')[0]
}

describe('auth routes', () => {
  beforeEach(() => {
    __setStoreForTests(new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-auth-'))))
    __resetRateLimits()
  })

  it('signup issues a session; /me identifies the user; login works; bad password refused', async () => {
    const res = await signup(
      jsonReq('http://t/api/auth/signup', { email: 'kim@agency.com', name: 'Kim', password: 'longenough123' }),
      CTX
    )
    expect(res.status).toBe(201)
    const cookie = cookieFrom(res)
    expect(cookie).toMatch(/^rf_session=/)

    const meRes = await me(new Request('http://t/api/auth/me', { headers: { cookie } }))
    const meBody = (await meRes.json()) as { user: { email: string }; orgs: unknown[] }
    expect(meBody.user.email).toBe('kim@agency.com')
    expect(meBody.orgs).toHaveLength(1)

    const good = await login(jsonReq('http://t/api/auth/login', { email: 'kim@agency.com', password: 'longenough123' }), CTX)
    expect(good.status).toBe(200)
    const bad = await login(jsonReq('http://t/api/auth/login', { email: 'kim@agency.com', password: 'wrong-password' }), CTX)
    expect(bad.status).toBe(401)
  })

  it('rejects weak passwords, bad emails, and duplicate signups', async () => {
    expect((await signup(jsonReq('http://t/s', { email: 'not-an-email', password: 'longenough123' }), CTX)).status).toBe(400)
    expect((await signup(jsonReq('http://t/s', { email: 'a@b.com', password: 'short' }), CTX)).status).toBe(400)
    await signup(jsonReq('http://t/s', { email: 'dup@b.com', password: 'longenough123' }), CTX)
    expect((await signup(jsonReq('http://t/s', { email: 'dup@b.com', password: 'longenough123' }), CTX)).status).toBe(409)
  })

  it('logout everywhere revokes existing sessions (tokenVersion bump)', async () => {
    const cookie = cookieFrom(
      await signup(jsonReq('http://t/s', { email: 'rev@x.com', password: 'longenough123' }), CTX)
    )
    const meBody = async () =>
      (await (await me(new Request('http://t/me', { headers: { cookie } }))).json()) as { user: unknown }
    // Session works.
    expect((await meBody()).user).not.toBeNull()
    // Logout everywhere.
    const out = await logout(jsonReq('http://t/api/auth/logout', { everywhere: true }, cookie), CTX)
    expect(out.status).toBe(200)
    // The OLD cookie is now dead even though its JWT is unexpired + well-signed.
    expect((await meBody()).user).toBeNull()
  })

  it('rate-limits repeated failed logins (429)', async () => {
    await signup(jsonReq('http://t/s', { email: 'brute@x.com', password: 'longenough123' }), CTX)
    let status = 0
    for (let i = 0; i < 12; i++) {
      status = (await login(jsonReq('http://t/l', { email: 'brute@x.com', password: 'nope' }), CTX)).status
    }
    expect(status).toBe(429) // exceeded 10 attempts / window
  })

  it('rejects a cross-origin login (CSRF defense-in-depth)', async () => {
    const req = new Request('http://app.rankforge.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'http://evil.example', host: 'app.rankforge.com' },
      body: JSON.stringify({ email: 'a@b.com', password: 'x' }),
    })
    expect((await login(req, CTX)).status).toBe(403)
  })

  it('project routes: unauthenticated 401; cross-tenant read 404; owner CRUD works', async () => {
    expect((await listProjects(new Request('http://t/api/projects'), CTX)).status).toBe(401)

    const aCookie = cookieFrom(await signup(jsonReq('http://t/s', { email: 'a@x.com', password: 'longenough123' }), CTX))
    const bCookie = cookieFrom(await signup(jsonReq('http://t/s', { email: 'b@x.com', password: 'longenough123' }), CTX))

    const created = await createProject(jsonReq('http://t/api/projects', { domain: 'client-site.com' }, aCookie), CTX)
    expect(created.status).toBe(201)
    const { project } = (await created.json()) as { project: { id: string } }

    const ownCtx = { params: Promise.resolve({ projectId: project.id }) }
    expect((await getProject(new Request('http://t/p', { headers: { cookie: aCookie } }), ownCtx)).status).toBe(200)
    // Tenant isolation: B gets 404, not 403 — existence is not disclosed.
    expect((await getProject(new Request('http://t/p', { headers: { cookie: bCookie } }), ownCtx)).status).toBe(404)
  })
})
