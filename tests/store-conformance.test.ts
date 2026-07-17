// Store conformance / schema-drift guard (Phase D.6 P7).
//
// ONE behavioral contract is run against BOTH FoundationStore implementations —
// the file store (always) and Postgres (when RF_TEST_DATABASE_URL is set). If
// the two ever diverge (a write path added to one and not the other, a
// projected column forgotten in an INSERT, an update that drops a field), a
// contract assertion fails on the store that drifted. This is the guardrail the
// D.5 review flagged as missing.

import { afterAll, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import type { FoundationStore } from '../lib/foundation/store'
import type { Competitor, Organization, Project, Recommendation, Scan, User, WpConnection, WpDeployment } from '../lib/foundation/types'

process.env.APP_SECRET = 'store-conformance-secret-01'

const uid = () => randomUUID()
const now = () => new Date().toISOString()

function user(email = `u_${uid()}@x.com`): User {
  return { id: uid(), email, name: 'u', passwordHash: 'scrypt.x', tokenVersion: 0, createdAt: now() }
}
function org(): Organization {
  return { id: uid(), name: 'Org', createdAt: now() }
}
function project(orgId: string): Project {
  return { id: uid(), orgId, domain: `d-${uid().slice(0, 8)}.com`, name: 'P', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
}
function scan(projectId: string, userId: string): Scan {
  return {
    id: uid(), projectId, createdBy: userId, createdAt: now(), status: 'completed', startedAt: now(), completedAt: now(), error: null,
    summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 70, critical: 0, warning: 1, info: 0 },
    pages: [{ url: 'https://example.com/' }], blocked: [],
  }
}
function rec(projectId: string, scanId: string): Recommendation {
  return {
    id: uid(), projectId, scanId, issueId: `missing-title::site::${uid()}`,
    ruleId: 'missing-title', ruleVersion: 1, ruleCategory: 'content', ruleSeverity: 'critical', businessContext: 'money-page',
    title: 'Missing <title>', category: 'content', severity: 'critical', status: 'open', reasoning: 'r', confidence: 90, confidenceBasis: 'x',
    evidence: { affectedUrls: ['https://example.com/'], facts: [] }, expectedImpact: { category: 'content', size: 'high', note: '' },
    risk: { level: 'low', note: '' }, createdAt: now(), history: [],
  }
}
function wpConn(projectId: string): WpConnection {
  return { id: uid(), projectId, siteUrl: 'https://wp.test', username: 'a', appPasswordEnc: 'x.y.z', aioseo: true, createdBy: 'u', createdAt: now() }
}
function wpDep(projectId: string): WpDeployment {
  return {
    id: uid(), projectId, connectionId: 'c', postId: 1, postType: 'pages', postUrl: 'u',
    before: { title: 'a', metaDescription: '', contentHash: '', content: '' }, after: { title: 'b' },
    approvedBy: 'u', approvedAt: now(), reason: 'r', status: 'applied', verification: null, result: 'ok', createdAt: now(),
  }
}

// The shared contract, parameterized over a store factory.
function contract(name: string, make: () => Promise<{ store: FoundationStore; close?: () => Promise<void> }>) {
  describe(`FoundationStore contract — ${name}`, () => {
    let close: (() => Promise<void>) | undefined
    afterAll(async () => {
      if (close) await close()
    })

    it('round-trips the full entity graph and every write path', async () => {
      const { store, close: c } = await make()
      close = c

      // users + orgs + membership
      const u = user()
      await store.createUser(u)
      expect((await store.getUserById(u.id))?.email).toBe(u.email)

      // updateUser (tokenVersion — the P6 field must persist through the store)
      await store.updateUser({ ...u, tokenVersion: 5 })
      expect((await store.getUserById(u.id))?.tokenVersion).toBe(5)

      const o = org()
      await store.createOrg(o, u.id)
      expect((await store.getMembership(o.id, u.id))?.role).toBe('owner')
      expect((await store.listOrgsForUser(u.id)).map((x) => x.id)).toContain(o.id)

      // addMember (upsert path)
      const u2 = user()
      await store.createUser(u2)
      await store.addMember({ orgId: o.id, userId: u2.id, role: 'member', createdAt: now() })
      expect((await store.getMembership(o.id, u2.id))?.role).toBe('member')
      // upsert again → role updates, no duplicate
      await store.addMember({ orgId: o.id, userId: u2.id, role: 'admin', createdAt: now() })
      expect((await store.getMembership(o.id, u2.id))?.role).toBe('admin')

      // projects
      const p = project(o.id)
      await store.createProject(p)
      await store.updateProject({ ...p, notes: 'updated' })
      expect((await store.getProject(p.id))?.notes).toBe('updated')
      expect((await store.listProjects(o.id)).map((x) => x.id)).toContain(p.id)

      // scans
      const s = scan(p.id, u.id)
      await store.createScan(s)
      await store.updateScan({ ...s, status: 'partial' })
      expect((await store.getScan(s.id))?.status).toBe('partial')
      expect((await store.listScans(p.id, 10)).map((x) => x.id)).toContain(s.id)

      // recommendations — createRecommendations + updateRecommendation (which
      // re-points the projected scan_id column on Postgres)
      const s2 = scan(p.id, u.id)
      await store.createScan(s2)
      const r = rec(p.id, s.id)
      await store.createRecommendations([r])
      expect((await store.getRecommendation(r.id))?.status).toBe('open')
      await store.updateRecommendation({ ...r, status: 'accepted', scanId: s2.id })
      const updated = await store.getRecommendation(r.id)
      expect(updated?.status).toBe('accepted')
      expect(updated?.scanId).toBe(s2.id)
      expect((await store.listRecommendations(p.id)).map((x) => x.id)).toContain(r.id)

      // wordpress connection (upsert) + deployment (insert/update)
      const conn = wpConn(p.id)
      await store.upsertWpConnection(conn)
      await store.upsertWpConnection({ ...conn, username: 'b' })
      expect((await store.getWpConnection(p.id))?.username).toBe('b')

      const dep = wpDep(p.id)
      await store.createWpDeployment(dep)
      await store.updateWpDeployment({ ...dep, status: 'verified' })
      expect((await store.getWpDeployment(dep.id))?.status).toBe('verified')
      expect((await store.listWpDeployments(p.id)).map((x) => x.id)).toContain(dep.id)

      // competitors (Phase G)
      const comp: Competitor = { id: uid(), projectId: p.id, domain: 'rival.com', label: 'Rival', addedBy: u.id, createdAt: now() }
      await store.createCompetitor(comp)
      expect((await store.getCompetitor(comp.id))?.domain).toBe('rival.com')
      await store.updateCompetitor({ ...comp, label: 'Rival Inc', overlap: { topicOverlap: 0.4 } })
      expect((await store.getCompetitor(comp.id))?.label).toBe('Rival Inc')
      expect((await store.listCompetitors(p.id)).map((c) => c.id)).toContain(comp.id)
      await store.deleteCompetitor(comp.id)
      expect(await store.getCompetitor(comp.id)).toBeNull()

      // audit
      await store.appendAudit({ id: uid(), orgId: o.id, actorId: u.id, action: 'x', target: 't', detail: '', at: now() })
      expect((await store.listAudit(o.id, 10)).length).toBeGreaterThan(0)
    })
  })
}

contract('file store', async () => {
  const store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-conf-')))
  return { store }
})

const PG_URL = process.env.RF_TEST_DATABASE_URL
if (PG_URL) {
  contract('postgres', async () => {
    const { PostgresFoundationStore } = await import('../lib/foundation/postgres')
    const store = await PostgresFoundationStore.create(PG_URL)
    return { store, close: () => (store as unknown as { pool: { end: () => Promise<void> } }).pool.end() }
  })
} else {
  describe.skip('FoundationStore contract — postgres (set RF_TEST_DATABASE_URL)', () => {
    it('skipped', () => {})
  })
}
