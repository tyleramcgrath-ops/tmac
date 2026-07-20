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
import type { Competitor, ContentBrief, Invitation, Job, Organization, Project, ProviderConnection, Recommendation, Scan, Schedule, User, WpConnection, WpDeployment } from '../lib/foundation/types'

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

      // getUserByVerifyToken (RC2 P4)
      await store.updateUser({ ...u, verifyToken: 'tok-123' })
      expect((await store.getUserByVerifyToken('tok-123'))?.id).toBe(u.id)

      const o = org()
      await store.createOrg(o, u.id)
      expect((await store.getMembership(o.id, u.id))?.role).toBe('owner')
      expect((await store.listOrgsForUser(u.id)).map((x) => x.id)).toContain(o.id)
      // updateOrg (RC2 P6 pilot fields)
      await store.updateOrg({ ...o, pilot: { status: 'active', expiresAt: null } })
      expect((await store.getOrg(o.id))?.pilot?.status).toBe('active')
      // pilot feedback
      await store.createFeedback({ id: uid(), orgId: o.id, userId: u.id, kind: 'issue', message: 'x', createdAt: now() })
      expect((await store.listFeedback(o.id)).length).toBe(1)

      // addMember (upsert path)
      const u2 = user()
      await store.createUser(u2)
      await store.addMember({ orgId: o.id, userId: u2.id, role: 'member', createdAt: now() })
      expect((await store.getMembership(o.id, u2.id))?.role).toBe('member')
      // upsert again → role updates, no duplicate
      await store.addMember({ orgId: o.id, userId: u2.id, role: 'admin', createdAt: now() })
      expect((await store.getMembership(o.id, u2.id))?.role).toBe('admin')

      // team invitations
      const inv: Invitation = {
        id: uid(), orgId: o.id, email: 'invitee@x.com', role: 'member', invitedBy: u.id,
        token: uid(), status: 'pending', createdAt: now(), expiresAt: '2100-01-01T00:00:00Z',
      }
      await store.createInvitation(inv)
      expect((await store.getInvitationByToken(inv.token))?.id).toBe(inv.id)
      expect((await store.listInvitations(o.id)).map((i) => i.id)).toContain(inv.id)
      await store.updateInvitation({ ...inv, status: 'accepted', acceptedAt: now() })
      expect((await store.getInvitationByToken(inv.token))?.status).toBe('accepted')

      // removeMember — the third member added above is removable independent
      // of the others (compound-key delete, not a full-collection wipe).
      await store.removeMember(o.id, u2.id)
      expect(await store.getMembership(o.id, u2.id)).toBeNull()
      expect((await store.getMembership(o.id, u.id))?.role).toBe('owner') // untouched

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

      // Atlas change-detection baseline (Phase G)
      expect(await store.getAtlasHistory(p.id)).toBeNull()
      await store.upsertAtlasHistory({ projectId: p.id, data: { gsc: null }, capturedAt: now() })
      expect((await store.getAtlasHistory(p.id))?.data).toEqual({ gsc: null })
      await store.upsertAtlasHistory({ projectId: p.id, data: { gsc: { range: { from: 'a', to: 'b' }, rows: [] } }, capturedAt: now() })
      expect((await store.getAtlasHistory(p.id))?.data).toEqual({ gsc: { range: { from: 'a', to: 'b' }, rows: [] } }) // upsert replaces, no duplicate row

      // content briefs (Content Studio)
      const brief: ContentBrief = {
        id: uid(), projectId: p.id, keyword: 'best crm', createdBy: u.id, createdAt: now(), status: 'draft',
        serpAvailable: false, serpResults: [], competitorsConsidered: [],
        title: 'Best CRM', metaDescription: 'meta', outline: ['Intro'], contentHtml: '<p>hi</p>', rationale: 'r',
      }
      await store.createContentBrief(brief)
      expect((await store.getContentBrief(brief.id))?.keyword).toBe('best crm')
      await store.updateContentBrief({ ...brief, status: 'published', wpPostId: 42, wpPostType: 'posts', wpLink: 'https://wp.test/p/42' })
      expect((await store.getContentBrief(brief.id))?.status).toBe('published')
      expect((await store.listContentBriefs(p.id)).map((b) => b.id)).toContain(brief.id)
      await store.deleteContentBrief(brief.id)
      expect(await store.getContentBrief(brief.id)).toBeNull()

      // provider connections (Phase H) — compound-key upsert + delete
      const pc: ProviderConnection = {
        projectId: p.id, kind: 'search-console', vendor: 'google', credentialEnc: 'iv.tag.data',
        accountEmail: 'owner@x.com', resourceId: null, scope: 'gsc', status: 'connected', detail: 'Connected.',
        connectedBy: u.id, createdAt: now(), updatedAt: now(),
      }
      await store.upsertProviderConnection(pc)
      await store.upsertProviderConnection({ ...pc, resourceId: 'sc-domain:example.com' })
      expect((await store.getProviderConnection(p.id, 'search-console'))?.resourceId).toBe('sc-domain:example.com')
      // A second kind is an independent row (compound PK project_id+kind).
      await store.upsertProviderConnection({ ...pc, kind: 'analytics', resourceId: '123' })
      expect((await store.listProviderConnections(p.id)).map((c) => c.kind).sort()).toEqual(['analytics', 'search-console'])
      await store.deleteProviderConnection(p.id, 'search-console')
      expect(await store.getProviderConnection(p.id, 'search-console')).toBeNull()
      expect((await store.listProviderConnections(p.id)).map((c) => c.kind)).toEqual(['analytics'])

      // scheduler: schedules + job queue (claim / requeue)
      const sched: Schedule = { id: uid(), orgId: o.id, projectId: p.id, kind: 'scheduled_scan', cron: '0 6 * * *', enabled: true, nextRunAt: '2026-01-01T00:00:00Z', lastRunAt: null, createdAt: now(), updatedAt: now() }
      await store.upsertSchedule(sched)
      expect((await store.getSchedule(p.id, 'scheduled_scan'))?.cron).toBe('0 6 * * *')
      expect((await store.listDueSchedules('2026-01-02T00:00:00Z')).map((s) => s.id)).toContain(sched.id)
      const job: Job = { id: uid(), orgId: o.id, projectId: p.id, kind: 'scheduled_scan', status: 'queued', runAt: '2026-01-01T06:00:00Z', payload: {}, attempts: 0, maxAttempts: 3, lockedAt: null, lockedBy: null, lastError: null, result: null, createdAt: now(), updatedAt: now() }
      await store.enqueueJob(job)
      const claimed = await store.claimDueJobs('2026-01-01T06:30:00Z', 5, 'runner1')
      expect(claimed.map((j) => j.id)).toContain(job.id)
      expect((await store.getJob(job.id))?.status).toBe('running')
      // stale-lock reaper returns it to the queue
      expect(await store.requeueStaleJobs('2100-01-01T00:00:00Z')).toBeGreaterThan(0)
      expect((await store.getJob(job.id))?.status).toBe('queued')
      await store.updateJob({ ...job, status: 'succeeded' })
      expect((await store.getJob(job.id))?.status).toBe('succeeded')
      expect((await store.listJobs(p.id)).map((j) => j.id)).toContain(job.id)
      await store.deleteSchedule(p.id, 'scheduled_scan')
      expect(await store.getSchedule(p.id, 'scheduled_scan')).toBeNull()

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
