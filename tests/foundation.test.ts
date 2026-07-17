import { beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import {
  createSessionToken,
  decryptSecret,
  encryptSecret,
  hashPassword,
  readSessionToken,
  verifyPassword,
} from '../lib/foundation/crypto'
import { HttpError, requireProjectRole } from '../lib/foundation/auth'
import { __setStoreForTests } from '../lib/foundation/store'
import { buildRecommendationsFromScan } from '../lib/foundation/recommendations'
import type { Project, Scan, User, WpDeployment } from '../lib/foundation/types'

process.env.APP_SECRET = 'test-secret-for-foundation-suite'

function freshStore(): FileFoundationStore {
  return new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-foundation-')))
}

function makeUser(email: string): User {
  return { id: randomUUID(), email, name: email.split('@')[0], passwordHash: 'x', createdAt: new Date().toISOString() }
}

async function seedUserOrgProject(store: FileFoundationStore, email: string) {
  const user = makeUser(email)
  await store.createUser(user)
  const org = { id: randomUUID(), name: `${email} org`, createdAt: new Date().toISOString() }
  await store.createOrg(org, user.id)
  const project: Project = {
    id: randomUUID(),
    orgId: org.id,
    domain: 'example.com',
    name: 'Example',
    industry: '',
    businessProfile: '',
    goals: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await store.createProject(project)
  return { user, org, project }
}

describe('passwords & sessions', () => {
  it('hashes and verifies passwords; rejects wrong password', async () => {
    const hash = await hashPassword('correct horse battery pin')
    expect(hash.startsWith('scrypt.')).toBe(true)
    expect(await verifyPassword('correct horse battery pin', hash)).toBe(true)
    expect(await verifyPassword('wrong password', hash)).toBe(false)
    expect(await verifyPassword('x', 'garbage')).toBe(false)
  })

  it('session tokens round-trip and reject tampering', async () => {
    const token = await createSessionToken('user-123')
    expect(await readSessionToken(token)).toBe('user-123')
    expect(await readSessionToken(token.slice(0, -3) + 'abc')).toBeNull()
  })

  it('secret encryption round-trips and never stores plaintext', () => {
    const enc = encryptSecret('wp-app-password-xyz')
    expect(enc).not.toContain('wp-app-password-xyz')
    expect(decryptSecret(enc)).toBe('wp-app-password-xyz')
  })
})

describe('store CRUD + persistence', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = freshStore()
  })

  it('persists users, orgs, projects across store instances (survives restart)', async () => {
    const { user, org, project } = await seedUserOrgProject(store, 'a@example.com')
    // Same directory, new instance — simulates a server restart.
    const reopened = new FileFoundationStore((store as unknown as { dir: string })['dir'])
    expect((await reopened.getUserByEmail('a@example.com'))?.id).toBe(user.id)
    expect((await reopened.listProjects(org.id)).map((p) => p.id)).toContain(project.id)
  })

  it('rejects duplicate emails', async () => {
    await store.createUser(makeUser('dup@example.com'))
    await expect(store.createUser(makeUser('dup@example.com'))).rejects.toThrow('email_taken')
  })

  it('stores scans and lists them newest-first', async () => {
    const { user, project } = await seedUserOrgProject(store, 's@example.com')
    for (const ts of ['2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z']) {
      await store.createScan({
        id: randomUUID(),
        projectId: project.id,
        createdBy: user.id,
        createdAt: ts,
        status: 'completed',
        startedAt: ts,
        completedAt: ts,
        error: null,
        summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 70, critical: 0, warning: 1, info: 0 },
        pages: [{ url: 'https://example.com/' }],
        blocked: [],
      })
    }
    const scans = await store.listScans(project.id)
    expect(scans).toHaveLength(2)
    expect(scans[0].createdAt > scans[1].createdAt).toBe(true)
  })

  it('appends audit-log entries scoped to the org', async () => {
    const { user, org } = await seedUserOrgProject(store, 'audit@example.com')
    await store.appendAudit({ id: randomUUID(), orgId: org.id, actorId: user.id, action: 'x', target: 'y', detail: '', at: new Date().toISOString() })
    expect(await store.listAudit(org.id)).toHaveLength(1)
    expect(await store.listAudit('other-org')).toHaveLength(0)
  })
})

describe('tenant isolation & authorization', () => {
  it("user B cannot access user A's project — and gets 404, not 403", async () => {
    const store = freshStore()
    __setStoreForTests(store)
    try {
      const a = await seedUserOrgProject(store, 'a@tenant.com')
      const b = await seedUserOrgProject(store, 'b@tenant.com')

      await expect(requireProjectRole(b.user, a.project.id, 'member')).rejects.toMatchObject({
        status: 404,
      })
      // Owner of the project passes.
      const ok = await requireProjectRole(a.user, a.project.id, 'owner')
      expect(ok.role).toBe('owner')
    } finally {
      __setStoreForTests(null)
    }
  })

  it('a plain member is refused admin-gated actions with 403', async () => {
    const store = freshStore()
    __setStoreForTests(store)
    try {
      const a = await seedUserOrgProject(store, 'owner@team.com')
      const member = makeUser('member@team.com')
      await store.createUser(member)
      await store.addMember({ orgId: a.org.id, userId: member.id, role: 'member', createdAt: new Date().toISOString() })

      await expect(requireProjectRole(member, a.project.id, 'admin')).rejects.toMatchObject({ status: 403 })
      const asMember = await requireProjectRole(member, a.project.id, 'member')
      expect(asMember.role).toBe('member')
    } finally {
      __setStoreForTests(null)
    }
  })

  it('HttpError carries status for the route wrapper', () => {
    const err = new HttpError(403, 'no')
    expect(err.status).toBe(403)
  })
})

describe('recommendations (A8→Phase C V2): evidence/confidence/explainability', () => {
  // V2 reads page SIGNALS (not pre-computed fixes) and is page-type aware.
  const scan: Scan = {
    id: 'scan-1',
    projectId: 'proj-1',
    createdBy: 'u1',
    createdAt: new Date().toISOString(),
    status: 'completed',
    startedAt: new Date('2026-01-01').toISOString(),
    completedAt: new Date('2026-01-01').toISOString(),
    error: null,
    summary: { pagesCrawled: 3, urlsDiscovered: 10, blockedCount: 1, siteScore: 60, critical: 1, warning: 2, info: 0 },
    pages: [
      { url: 'https://x.com/pricing', title: 'Pricing', titleLength: 7, metaDescription: 'p', metaDescriptionLength: 90, h1Count: 1, schemaTypes: [], https: true, mixedContent: false, indexable: true },
      { url: 'https://x.com/product/z', title: '', titleLength: 0, metaDescription: '', metaDescriptionLength: 0, h1Count: 1, schemaTypes: ['Product'], https: true, mixedContent: false, indexable: true },
      // Canonical duplicate must be excluded.
      { url: 'https://x.com/pricing?ref=1', duplicateOf: 'https://x.com/pricing', title: 'Pricing', titleLength: 7, schemaTypes: [], https: true, indexable: true },
    ],
    blocked: [],
  }

  it('emits evidence-backed, explained recommendations with confidence not tied to prevalence', () => {
    const recs = buildRecommendationsFromScan(scan)
    expect(recs.length).toBeGreaterThan(0)
    for (const r of recs) {
      expect(r.evidence.affectedUrls.length).toBeGreaterThan(0)
      expect(r.explanation?.why).toBeTruthy()
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(100)
      expect(r.confidenceBasis).toContain('NOT prevalence')
      expect(['low', 'medium', 'high']).toContain(r.risk.level)
    }
  })

  it('the missing <title> on the product page is highest priority (rank 1)', () => {
    const recs = buildRecommendationsFromScan(scan)
    expect(recs[0].title).toMatch(/Missing <title>/i)
    expect(recs[0].priorityRank).toBe(1)
  })

  it('status history is the audit trail shape the API appends to', async () => {
    const store = freshStore()
    const recs = buildRecommendationsFromScan(scan)
    await store.createRecommendations(recs)
    const rec = (await store.listRecommendations('proj-1'))[0]
    rec.history.push({ at: new Date().toISOString(), by: 'u1', from: 'open', to: 'accepted' })
    rec.status = 'accepted'
    await store.updateRecommendation(rec)
    const reread = await store.getRecommendation(rec.id)
    expect(reread?.status).toBe('accepted')
    expect(reread?.history).toHaveLength(1)
  })
})

describe('WordPress deployment records (A6): durable, rollback-capable', () => {
  it('a deployment record stores before/after/approver/reason and survives reopening the store', async () => {
    const store = freshStore()
    const dep: WpDeployment = {
      id: randomUUID(),
      projectId: 'proj-1',
      connectionId: 'conn-1',
      postId: 42,
      postType: 'pages',
      postUrl: 'https://client.com/services',
      before: { title: 'Old title', metaDescription: 'Old meta', contentHash: 'abc', content: '<p>old</p>' },
      after: { title: 'New title', metaDescription: 'New meta' },
      approvedBy: 'user-1',
      approvedAt: new Date().toISOString(),
      reason: 'Title under 30 chars; recommendation rec-9',
      recommendationId: 'rec-9',
      status: 'verified',
      verification: { checkedAt: new Date().toISOString(), titleMatches: true, metaMatches: true, note: 'ok' },
      result: 'Applied and verified.',
      createdAt: new Date().toISOString(),
    }
    await store.createWpDeployment(dep)

    const reopened = new FileFoundationStore((store as unknown as { dir: string })['dir'])
    const read = await reopened.getWpDeployment(dep.id)
    expect(read?.before.title).toBe('Old title')
    expect(read?.approvedBy).toBe('user-1')
    expect(read?.reason).toContain('rec-9')

    // Rollback data is exactly the captured before-values.
    read!.status = 'rolled_back'
    read!.rolledBackAt = new Date().toISOString()
    read!.rolledBackBy = 'user-2'
    await reopened.updateWpDeployment(read!)
    const final = await reopened.getWpDeployment(dep.id)
    expect(final?.status).toBe('rolled_back')
    expect(final?.before.metaDescription).toBe('Old meta')
  })
})
