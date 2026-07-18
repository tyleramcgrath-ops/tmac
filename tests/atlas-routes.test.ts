// Phase G tenant-isolation tests: the competitors and atlas routes must require
// authentication and deny cross-tenant access. 404 (not 403) is used for
// cross-tenant reads so the existence of another tenant's resources is never
// disclosed — consistent with the rest of RankForge.

import { beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { GET as competitorsGet, POST as competitorsPost, DELETE as competitorsDelete } from '../app/api/projects/[projectId]/competitors/route'
import { GET as atlasGet } from '../app/api/projects/[projectId]/atlas/route'

process.env.APP_SECRET = 'atlas-routes-secret-0001'

const CTX0 = { params: Promise.resolve({}) }
function jsonReq(body: unknown, cookie?: string): Request {
  return new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
}
const cookieFrom = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]

async function makeUserWithProject(email: string) {
  const cookie = cookieFrom(await signup(jsonReq({ email, password: 'longenough123' }), CTX0))
  const proj = await createProject(jsonReq({ domain: `${email.split('@')[0]}.com` }, cookie), CTX0)
  const { project } = (await proj.json()) as { project: { id: string } }
  return { cookie, projectId: project.id, ctx: { params: Promise.resolve({ projectId: project.id }) } }
}

describe('atlas + competitors tenant isolation', () => {
  beforeEach(() => {
    __setStoreForTests(new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-atlas-'))))
    __resetRateLimits()
  })

  it('requires authentication', async () => {
    const ctx = { params: Promise.resolve({ projectId: 'anything' }) }
    expect((await competitorsGet(new Request('http://t/c'), ctx)).status).toBe(401)
    expect((await atlasGet(new Request('http://t/a'), ctx)).status).toBe(401)
    expect((await competitorsPost(jsonReq({ domain: 'x.com' }), ctx)).status).toBe(401)
  })

  it('the owner can add + read competitors and load the atlas', async () => {
    const a = await makeUserWithProject('owner@x.com')
    const add = await competitorsPost(jsonReq({ domain: 'rival.com' }, a.cookie), a.ctx)
    expect(add.status).toBe(201)
    const list = (await (await competitorsGet(new Request('http://t/c', { headers: { cookie: a.cookie } }), a.ctx)).json()) as { competitors: unknown[] }
    expect(list.competitors).toHaveLength(1)
    const atlas = await atlasGet(new Request('http://t/a', { headers: { cookie: a.cookie } }), a.ctx)
    expect(atlas.status).toBe(200)
    const { snapshot } = (await atlas.json()) as { snapshot: { providers: { state: string }[]; briefing: { headline: string } } }
    // Disconnected default: every provider disconnected, honest briefing.
    expect(snapshot.providers.every((p) => p.state === 'disconnected')).toBe(true)
    expect(snapshot.briefing.headline).toMatch(/no external data/i)
  })

  it('persists an Atlas change-detection baseline across loads without crashing the disconnected default path', async () => {
    const a = await makeUserWithProject('history@x.com')
    const first = await atlasGet(new Request('http://t/a', { headers: { cookie: a.cookie } }), a.ctx)
    expect(first.status).toBe(200)
    const second = await atlasGet(new Request('http://t/a', { headers: { cookie: a.cookie } }), a.ctx)
    expect(second.status).toBe(200)
    // Everything stays honestly unavailable — a persisted baseline of nulls
    // must never manufacture a "change" out of nothing.
    const { snapshot } = (await second.json()) as { snapshot: { changes: unknown[] } }
    expect(snapshot.changes).toEqual([])
  })

  it('rejects invalid + duplicate competitor domains', async () => {
    const a = await makeUserWithProject('dup@x.com')
    expect((await competitorsPost(jsonReq({ domain: 'not a domain' }, a.cookie), a.ctx)).status).toBe(400)
    expect((await competitorsPost(jsonReq({ domain: 'rival.com' }, a.cookie), a.ctx)).status).toBe(201)
    expect((await competitorsPost(jsonReq({ domain: 'rival.com' }, a.cookie), a.ctx)).status).toBe(409)
  })

  it('a different tenant cannot read, add to, or delete another project’s competitors (404, not 403)', async () => {
    const a = await makeUserWithProject('a@x.com')
    const b = await makeUserWithProject('b@x.com')
    await competitorsPost(jsonReq({ domain: 'rival.com' }, a.cookie), a.ctx)
    const aComp = (await (await competitorsGet(new Request('http://t/c', { headers: { cookie: a.cookie } }), a.ctx)).json()) as { competitors: { id: string }[] }
    const compId = aComp.competitors[0].id

    // B hits A's project id — every path is 404, disclosing nothing.
    expect((await competitorsGet(new Request('http://t/c', { headers: { cookie: b.cookie } }), a.ctx)).status).toBe(404)
    expect((await competitorsPost(jsonReq({ domain: 'evil.com' }, b.cookie), a.ctx)).status).toBe(404)
    expect((await atlasGet(new Request('http://t/a', { headers: { cookie: b.cookie } }), a.ctx)).status).toBe(404)
    const del = await competitorsDelete(new Request(`http://t/c?id=${compId}`, { method: 'DELETE', headers: { cookie: b.cookie } }), a.ctx)
    expect(del.status).toBe(404)

    // A's competitor is untouched.
    const still = (await (await competitorsGet(new Request('http://t/c', { headers: { cookie: a.cookie } }), a.ctx)).json()) as { competitors: unknown[] }
    expect(still.competitors).toHaveLength(1)
  })

  it('a competitor id from another project cannot be deleted via one’s own project route', async () => {
    const a = await makeUserWithProject('a2@x.com')
    const b = await makeUserWithProject('b2@x.com')
    await competitorsPost(jsonReq({ domain: 'rival.com' }, a.cookie), a.ctx)
    const aComp = (await (await competitorsGet(new Request('http://t/c', { headers: { cookie: a.cookie } }), a.ctx)).json()) as { competitors: { id: string }[] }
    // B tries to delete A's competitor id via B's OWN project route → 404 (id not in B's project).
    const del = await competitorsDelete(new Request(`http://t/c?id=${aComp.competitors[0].id}`, { method: 'DELETE', headers: { cookie: b.cookie } }), b.ctx)
    expect(del.status).toBe(404)
  })
})
