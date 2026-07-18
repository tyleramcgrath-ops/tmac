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
import { buildDigestContent, runMonitorDigest } from '../lib/foundation/scheduler/digest'
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
