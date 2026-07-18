// Exercises the REAL PostgresFoundationStore against a live database.
//
// Skipped unless RF_TEST_DATABASE_URL is set (a live Postgres). CI/local runs
// without a DB skip cleanly; the A12 evidence run sets it to the local cluster.
// This proves persistence, constraints, and tenant isolation on Postgres —
// not the file store.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'crypto'
import type { FoundationStore } from '../lib/foundation/store'
import type { Organization, Project, Scan, User } from '../lib/foundation/types'

const URL = process.env.RF_TEST_DATABASE_URL
const d = URL ? describe : describe.skip

let store: FoundationStore
let closePool: (() => Promise<void>) | null = null

function user(email: string): User {
  return { id: randomUUID(), email, name: email.split('@')[0], passwordHash: 'scrypt.x', createdAt: new Date().toISOString() }
}
function org(name: string): Organization {
  return { id: randomUUID(), name, createdAt: new Date().toISOString() }
}
function project(orgId: string, domain = 'example.com'): Project {
  return {
    id: randomUUID(), orgId, domain, name: domain, industry: '', businessProfile: '',
    goals: [], notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
}
function scan(projectId: string, userId: string): Scan {
  const now = new Date().toISOString()
  return {
    id: randomUUID(), projectId, createdBy: userId, createdAt: now, status: 'completed',
    startedAt: now, completedAt: now, error: null,
    summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 70, critical: 0, warning: 1, info: 0 },
    pages: [{ url: 'https://example.com/' }], blocked: [],
  }
}

d('PostgresFoundationStore (live)', () => {
  beforeAll(async () => {
    const { PostgresFoundationStore } = await import('../lib/foundation/postgres')
    store = await PostgresFoundationStore.create(URL!)
    closePool = () => (store as unknown as { pool: { end: () => Promise<void> } }).pool.end()
  })
  afterAll(async () => {
    if (closePool) await closePool()
  })

  it('persists the full entity graph and reads it back', async () => {
    const u = user(`u_${randomUUID()}@x.com`)
    await store.createUser(u)
    const o = org('Acme')
    await store.createOrg(o, u.id)
    const p = project(o.id, `d-${randomUUID().slice(0, 8)}.com`)
    await store.createProject(p)
    const s = scan(p.id, u.id)
    await store.createScan(s)

    expect((await store.getUserById(u.id))?.email).toBe(u.email)
    expect((await store.listOrgsForUser(u.id)).map((x) => x.id)).toContain(o.id)
    expect((await store.getMembership(o.id, u.id))?.role).toBe('owner')
    expect((await store.listProjects(o.id)).map((x) => x.id)).toContain(p.id)
    expect((await store.getScan(s.id))?.status).toBe('completed')
  })

  it('enforces the unique email constraint at the database level', async () => {
    const email = `dupe_${randomUUID()}@x.com`
    await store.createUser(user(email))
    await expect(store.createUser(user(email))).rejects.toThrow()
  })

  it('enforces the partial unique (org, domain) constraint', async () => {
    const u = user(`o_${randomUUID()}@x.com`)
    await store.createUser(u)
    const o = org('Dup')
    await store.createOrg(o, u.id)
    const dom = `dup-${randomUUID().slice(0, 8)}.com`
    await store.createProject(project(o.id, dom))
    await expect(store.createProject(project(o.id, dom))).rejects.toThrow()
  })

  it('rejects a status outside the CHECK constraint', async () => {
    const u = user(`c_${randomUUID()}@x.com`)
    await store.createUser(u)
    const o = org('Chk')
    await store.createOrg(o, u.id)
    const p = project(o.id, `c-${randomUUID().slice(0, 8)}.com`)
    await store.createProject(p)
    const bad = { ...scan(p.id, u.id), status: 'bogus' as unknown as Scan['status'] }
    await expect(store.createScan(bad)).rejects.toThrow()
  })

  it('cascades deletes via foreign keys (delete project removes its scans)', async () => {
    const u = user(`fk_${randomUUID()}@x.com`)
    await store.createUser(u)
    const o = org('FK')
    await store.createOrg(o, u.id)
    const p = project(o.id, `fk-${randomUUID().slice(0, 8)}.com`)
    await store.createProject(p)
    const s = scan(p.id, u.id)
    await store.createScan(s)
    await store.deleteProject(p.id)
    expect(await store.getScan(s.id)).toBeNull()
  })

  it('isolates tenants: listProjects only returns the org’s own projects', async () => {
    const ua = user(`ta_${randomUUID()}@x.com`)
    const ub = user(`tb_${randomUUID()}@x.com`)
    await store.createUser(ua)
    await store.createUser(ub)
    const oa = org('A')
    const ob = org('B')
    await store.createOrg(oa, ua.id)
    await store.createOrg(ob, ub.id)
    const pa = project(oa.id, `ta-${randomUUID().slice(0, 8)}.com`)
    await store.createProject(pa)
    // B's org has no membership in A and cannot see A's project.
    expect((await store.listProjects(ob.id)).map((x) => x.id)).not.toContain(pa.id)
    expect(await store.getMembership(oa.id, ub.id)).toBeNull()
  })

  it('survives a fresh connection (reconnect) with data intact', async () => {
    const u = user(`re_${randomUUID()}@x.com`)
    await store.createUser(u)
    const { PostgresFoundationStore } = await import('../lib/foundation/postgres')
    const store2 = await PostgresFoundationStore.create(URL!)
    try {
      expect((await store2.getUserById(u.id))?.email).toBe(u.email)
    } finally {
      await (store2 as unknown as { pool: { end: () => Promise<void> } }).pool.end()
    }
  })
})
