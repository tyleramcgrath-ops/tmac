// Weekly digest ('monitor' JobKind): was declared in the type since Phase D
// but never had a handler — this proves it now actually runs end-to-end:
// a schedule of kind 'monitor' materializes a job, the job dispatches to the
// real handler, and a real email (real numbers, real recipients) goes out.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { approveLinksFor, buildDigestContent, runMonitorDigest, summarizeDeploymentOutcomes } from '../lib/foundation/scheduler/digest'
import { verifyApproveToken } from '../lib/foundation/scheduler/approve-link'
import type { Recommendation } from '../lib/foundation/types'
import { productionHandlers } from '../lib/foundation/scheduler/handlers'
import { materializeDueSchedules, runDueJobs, makeJob } from '../lib/foundation/scheduler/engine'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as createProject } from '../app/api/projects/route'
import { GET as scheduleGet, PUT as schedulePut, DELETE as scheduleDelete } from '../app/api/projects/[projectId]/schedule/route'
import type { Organization, Project, Schedule, User, WpDeployment } from '../lib/foundation/types'
import { computeOperatorMetrics } from '../lib/foundation/operator/metrics'

process.env.APP_SECRET = 'digest-secret-01'

describe('buildDigestContent: honest, real-data-only summary', () => {
  it('reports "no audit yet" instead of a fabricated score when there is no scan', () => {
    const metrics = computeOperatorMetrics([], [], '2026-07-18')
    const email = buildDigestContent({ domain: 'acme.com', name: 'Acme' }, null, metrics)
    expect(email.subject).toContain('no audit yet')
    expect(email.text).toContain('No audit has completed yet')
  })
  it('reports the real site score and metrics when a scan exists', () => {
    const scan = { summary: { siteScore: 82, pagesCrawled: 12, critical: 2 } } as never
    const metrics = computeOperatorMetrics([], [], '2026-07-18')
    const email = buildDigestContent({ domain: 'acme.com', name: 'Acme' }, scan, metrics)
    expect(email.subject).toContain('site score 82')
    expect(email.text).toContain('Pages crawled: 12')
    expect(email.text).toContain('Critical issues: 2')
  })
  it('omits the proof-of-impact section entirely when nothing has been measured yet — never a fabricated 0', () => {
    const metrics = computeOperatorMetrics([], [], '2026-07-18')
    const email = buildDigestContent({ domain: 'acme.com', name: 'Acme' }, null, metrics, { measured: 0, improvedClicks: 0, avgClicksDelta: 0, avgPositionDelta: 0, pending: 2, skipped: 0 })
    expect(email.text).not.toContain('Proof of impact')
  })
  it('includes the real measured Search Console deltas when outcomes exist', () => {
    const metrics = computeOperatorMetrics([], [], '2026-07-18')
    const email = buildDigestContent({ domain: 'acme.com', name: 'Acme' }, null, metrics, { measured: 3, improvedClicks: 2, avgClicksDelta: 5.5, avgPositionDelta: -1.2, pending: 1, skipped: 0 })
    expect(email.text).toContain('Proof of impact (real Search Console deltas)')
    expect(email.text).toContain('Fixes with measured impact: 3')
    expect(email.text).toContain('Improved clicks: 2 of 3')
    expect(email.text).toContain('Avg. clicks change: +5.5')
    expect(email.text).toContain('Avg. position change: -1.2 (better)')
    expect(email.html).toContain('Proof of impact')
  })
  it('includes one-click approve links when provided, and omits the section when there are none', () => {
    const metrics = computeOperatorMetrics([], [], '2026-07-18')
    const withLinks = buildDigestContent({ domain: 'acme.com', name: 'Acme' }, null, metrics, undefined, [{ title: 'Fix missing title', url: 'https://app.example.com/api/approve/tok123' }])
    expect(withLinks.text).toContain('Approve & deploy now')
    expect(withLinks.text).toContain('Fix missing title: https://app.example.com/api/approve/tok123')
    expect(withLinks.html).toContain('href="https://app.example.com/api/approve/tok123"')

    const withoutLinks = buildDigestContent({ domain: 'acme.com', name: 'Acme' }, null, metrics, undefined, [])
    expect(withoutLinks.text).not.toContain('Approve & deploy now')
  })
})

describe('approveLinksFor', () => {
  const project = { id: 'p1', orgId: 'o1', domain: 'acme.com', name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: '', updatedAt: '' }
  const recAt = (n: number): Recommendation => ({
    id: `r${n}`, projectId: 'p1', scanId: 's', issueId: `rule::x${n}`, ruleId: 'missing-title', ruleVersion: 1,
    ruleCategory: 'content', ruleSeverity: 'warning', businessContext: 'standard', title: `Fix ${n}`, category: 'content',
    severity: 'warning', status: 'accepted', reasoning: 'r', evidence: { affectedUrls: [`https://acme.com/${n}`], facts: [] },
    confidence: 80, confidenceBasis: 'x', expectedImpact: { category: 'content', size: 'medium', note: '' },
    risk: { level: 'low', note: '' }, createdAt: '', history: [],
  })
  const ORIGINAL_ENV = { ...process.env }
  beforeEach(() => { process.env = { ...ORIGINAL_ENV } })
  afterEach(() => { process.env = { ...ORIGINAL_ENV } })

  it('produces no links when the app has no known base URL — never a broken link', () => {
    delete process.env.APP_BASE_URL
    delete process.env.VERCEL_URL
    const links = approveLinksFor(project, [recAt(1)], 'u1', 1000)
    expect(links).toEqual([])
  })
  it('produces a real, independently-verifiable signed link per pending recommendation, capped at 5', () => {
    process.env.APP_BASE_URL = 'https://app.example.com'
    const pending = Array.from({ length: 8 }, (_, i) => recAt(i))
    const links = approveLinksFor(project, pending, 'u1', 1000)
    expect(links).toHaveLength(5)
    expect(links[0].title).toBe('Fix 0')
    expect(links[0].url.startsWith('https://app.example.com/api/approve/')).toBe(true)
    const token = links[0].url.split('/api/approve/')[1]
    const payload = verifyApproveToken(token, 1000 + 1000)
    expect(payload).toEqual({ recommendationId: 'r0', projectId: 'p1', userId: 'u1', issuedAt: 1000 })
  })
})

describe('summarizeDeploymentOutcomes: honest aggregation (never fabricates a measured win)', () => {
  it('separates measured/pending/skipped and never fabricates a measured outcome', () => {
    const now = new Date().toISOString()
    const base = { id: 'd', projectId: 'p', connectionId: 'c', postId: 1, postType: 'pages' as const, postUrl: 'u', before: { title: '', metaDescription: '', contentHash: '', content: '' }, after: {}, approvedBy: 'u', approvedAt: now, reason: 'r', verification: null, result: 'ok', createdAt: now }
    const measured: WpDeployment = { ...base, id: 'm', status: 'verified', outcome: { capturedAt: now, skipped: false, before: { from: '', to: '', clicks: 5, impressions: 50, ctr: 0.1, position: 6 }, after: { from: '', to: '', clicks: 10, impressions: 60, ctr: 0.16, position: 4 }, delta: { clicks: 5, impressions: 10, ctr: 0.06, position: -2 } } }
    const skipped: WpDeployment = { ...base, id: 's', status: 'verified', outcome: { capturedAt: now, skipped: true, reason: 'Search Console not connected.' } }
    const pending: WpDeployment = { ...base, id: 'p2', status: 'verified' }
    const notEligible: WpDeployment = { ...base, id: 'n', status: 'applied' }

    const summary = summarizeDeploymentOutcomes([measured, skipped, pending, notEligible])
    expect(summary.measured).toBe(1)
    expect(summary.improvedClicks).toBe(1)
    expect(summary.avgClicksDelta).toBe(5)
    expect(summary.avgPositionDelta).toBe(-2)
    expect(summary.skipped).toBe(1)
    expect(summary.pending).toBe(1)
  })
})

describe('runMonitorDigest: real project state end-to-end', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-digest-')))
  })
  afterEach(() => {})

  async function seed() {
    const owner: User = { id: randomUUID(), email: 'owner@acme.com', name: 'Owner', passwordHash: 'x', tokenVersion: 0, createdAt: new Date().toISOString() }
    const org: Organization = { id: randomUUID(), name: 'Acme Org', createdAt: new Date().toISOString() }
    await store.createUser(owner)
    await store.createOrg(org, owner.id)
    const project: Project = { id: randomUUID(), orgId: org.id, domain: 'acme.com', name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await store.createProject(project)
    return { owner, org, project }
  }

  it('emails the real project owner with the real state (logged-only in this environment)', async () => {
    const { project } = await seed()
    const dep: WpDeployment = {
      id: randomUUID(), projectId: project.id, connectionId: 'c', postId: 1, postType: 'pages', postUrl: 'u',
      before: { title: 'a', metaDescription: '', contentHash: '', content: '' }, after: { title: 'b' },
      approvedBy: 'u', approvedAt: new Date().toISOString(), reason: 'r', status: 'verified',
      verification: { checkedAt: new Date().toISOString(), titleMatches: true, metaMatches: null, note: 'ok' }, result: 'ok', createdAt: new Date().toISOString(),
    }
    await store.createWpDeployment(dep)

    const job = makeJob({ orgId: project.orgId, projectId: project.id, kind: 'monitor', runAt: new Date(), now: new Date() })
    const result = await runMonitorDigest(store, job)
    expect(result).toEqual({ sent: 1, recipients: 1 })
  })

  it('sends nothing when the org has no owner', async () => {
    const project = { id: randomUUID(), orgId: 'no-such-org', domain: 'x.com', name: 'X' } as Project
    await store.createProject(project)
    const job = makeJob({ orgId: 'no-such-org', projectId: project.id, kind: 'monitor', runAt: new Date(), now: new Date() })
    const result = await runMonitorDigest(store, job)
    expect(result).toEqual({ sent: 0, recipients: 0 })
  })
})

describe('the monitor JobKind is fully wired: schedule -> job -> real handler', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-digest-wiring-')))
    // productionHandlers()'s handlers resolve the store via the module-level
    // getStore() singleton (matching production, where there's no per-call
    // store to thread through) — point it at this test's store.
    __setStoreForTests(store)
  })
  afterEach(() => {
    __setStoreForTests(null)
  })

  it('a monitor schedule materializes a job that the production handler registry actually runs', async () => {
    const owner: User = { id: randomUUID(), email: 'owner@acme.com', name: 'Owner', passwordHash: 'x', tokenVersion: 0, createdAt: new Date().toISOString() }
    const org: Organization = { id: randomUUID(), name: 'Acme Org', createdAt: new Date().toISOString() }
    await store.createUser(owner)
    await store.createOrg(org, owner.id)
    const project: Project = { id: randomUUID(), orgId: org.id, domain: 'acme.com', name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await store.createProject(project)

    const now = new Date()
    const due: Schedule = {
      id: randomUUID(), orgId: org.id, projectId: project.id, kind: 'monitor', cron: '0 6 * * 1',
      enabled: true, nextRunAt: new Date(now.getTime() - 1000).toISOString(), lastRunAt: null,
      createdAt: now.toISOString(), updatedAt: now.toISOString(),
    }
    await store.upsertSchedule(due)

    const materialized = await materializeDueSchedules(store, now)
    expect(materialized).toBe(1)

    const outcome = await runDueJobs(store, now, 'test-runner', productionHandlers())
    expect(outcome.succeeded).toBe(1)
    expect(outcome.failed).toBe(0)

    const jobs = await store.listJobs(project.id, 10)
    expect(jobs[0].status).toBe('succeeded')
    expect(jobs[0].kind).toBe('monitor')
  })
})

describe('schedule route: monitor + scheduled_scan are independent, per-kind schedules', () => {
  const CTX0 = { params: Promise.resolve({}) }
  function jsonReq(body: unknown, cookie?: string): Request {
    return new Request('http://t', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
  }
  const cookieFrom = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]

  beforeEach(() => {
    __setStoreForTests(new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-schedule-route-'))))
  })
  afterEach(() => {
    __setStoreForTests(null)
  })

  it('setting a monitor schedule does not touch the scheduled_scan schedule, and each deletes independently', async () => {
    const cookie = cookieFrom(await signup(jsonReq({ email: `${randomUUID()}@x.com`, password: 'longenough123' }), CTX0))
    const proj = await createProject(jsonReq({ domain: 'acme.com' }, cookie), CTX0)
    const { project } = (await proj.json()) as { project: { id: string } }
    const ctx = { params: Promise.resolve({ projectId: project.id }) }

    await schedulePut(jsonReq({ frequency: 'weekly', enabled: true, kind: 'scheduled_scan' }, cookie), ctx)
    await schedulePut(jsonReq({ frequency: 'daily', enabled: true, kind: 'monitor' }, cookie), ctx)

    const list1 = (await (await scheduleGet(new Request('http://t', { headers: { cookie } }), ctx)).json()) as { schedules: { kind: string }[] }
    expect(list1.schedules.map((s) => s.kind).sort()).toEqual(['monitor', 'scheduled_scan'])

    const del = await scheduleDelete(new Request('http://t?kind=monitor', { method: 'DELETE', headers: { cookie } }), ctx)
    expect(del.status).toBe(200)

    const list2 = (await (await scheduleGet(new Request('http://t', { headers: { cookie } }), ctx)).json()) as { schedules: { kind: string }[] }
    expect(list2.schedules.map((s) => s.kind)).toEqual(['scheduled_scan']) // monitor removed, scheduled_scan untouched
  })

  it('rejects an unsupported kind rather than silently accepting it', async () => {
    const cookie = cookieFrom(await signup(jsonReq({ email: `${randomUUID()}@x.com`, password: 'longenough123' }), CTX0))
    const proj = await createProject(jsonReq({ domain: 'acme2.com' }, cookie), CTX0)
    const { project } = (await proj.json()) as { project: { id: string } }
    const ctx = { params: Promise.resolve({ projectId: project.id }) }

    const res = await schedulePut(jsonReq({ frequency: 'daily', enabled: true, kind: 'outcome_capture' }, cookie), ctx)
    expect(res.status).toBe(400)
  })
})
