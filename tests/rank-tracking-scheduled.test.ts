// Automated rank-position history (the 'rank_tracking' JobKind): turns the
// previously point-in-time-only /api/rankings check into real history — on a
// project's chosen cadence, every tracked keyword gets one more real,
// timestamped snapshot. Proves the runner directly, the SERPAPI_KEY-unset
// honest no-op, and the full schedule -> job -> handler wiring.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { materializeDueSchedules, runDueJobs } from '../lib/foundation/scheduler/engine'
import { productionHandlers } from '../lib/foundation/scheduler/handlers'
import { runRankTrackingJob } from '../lib/foundation/scheduler/rank-tracking-runner'
import type { Job, Organization, Project, Schedule, TrackedKeyword, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'rank-tracking-secret-01'

const now = () => new Date().toISOString()
const ORIGINAL_ENV = { ...process.env }

async function seedProject(store: FileFoundationStore) {
  const owner: User = { id: randomUUID(), email: 'owner@acme.com', name: 'Owner', passwordHash: 'x', tokenVersion: 0, createdAt: now() }
  const org: Organization = { id: randomUUID(), name: 'Acme Org', createdAt: now() }
  await store.createUser(owner)
  await store.createOrg(org, owner.id)
  const project: Project = { id: randomUUID(), orgId: org.id, domain: 'acme.com', name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
  await store.createProject(project)
  return { owner, org, project }
}

function serpResponse(link: string | null) {
  return {
    organic_results: link ? [{ link, position: 4 }, { link: 'https://other.com/x', position: 1 }] : [{ link: 'https://other.com/x', position: 1 }],
  }
}

describe('automated rank tracking', () => {
  let store: FileFoundationStore

  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-rank-tracking-')))
    process.env = { ...ORIGINAL_ENV }
  })
  afterEach(() => {
    __setStoreForTests(null)
    vi.unstubAllGlobals()
    process.env = { ...ORIGINAL_ENV }
  })

  it('runRankTrackingJob records a real, honest snapshot per tracked keyword', async () => {
    process.env.SERPAPI_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(serpResponse('https://acme.com/pricing')), { status: 200 })))
    const { project } = await seedProject(store)
    const kw: TrackedKeyword = { id: randomUUID(), projectId: project.id, keyword: 'best crm software', addedBy: 'u', createdAt: now() }
    await store.addTrackedKeyword(kw)

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'rank_tracking', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runRankTrackingJob(store, job)
    expect(result.checked).toBe(1)

    const snapshots = await store.listRankSnapshots(project.id, 'best crm software')
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].position).toBe(4)
    expect(snapshots[0].url).toBe('https://acme.com/pricing')
  })

  it('honestly records position:null when the domain is not found in results, never fabricated', async () => {
    process.env.SERPAPI_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(serpResponse(null)), { status: 200 })))
    const { project } = await seedProject(store)
    await store.addTrackedKeyword({ id: randomUUID(), projectId: project.id, keyword: 'obscure phrase', addedBy: 'u', createdAt: now() })

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'rank_tracking', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    await runRankTrackingJob(store, job)

    const snapshots = await store.listRankSnapshots(project.id, 'obscure phrase')
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].position).toBeNull()
    expect(snapshots[0].url).toBeNull()
  })

  it('takes no snapshots and reports why when SERPAPI_KEY is unset', async () => {
    delete process.env.SERPAPI_KEY
    const { project } = await seedProject(store)
    await store.addTrackedKeyword({ id: randomUUID(), projectId: project.id, keyword: 'best crm software', addedBy: 'u', createdAt: now() })

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'rank_tracking', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runRankTrackingJob(store, job)
    expect(result.checked).toBe(0)
    expect(String(result.note)).toMatch(/SERPAPI_KEY/)
    expect(await store.listRankSnapshots(project.id)).toHaveLength(0)
  })

  it('the rank_tracking JobKind is fully wired: schedule -> job -> real handler', async () => {
    process.env.SERPAPI_KEY = 'test-key'
    __setStoreForTests(store)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(serpResponse('https://acme.com/pricing')), { status: 200 })))
    const { project } = await seedProject(store)
    await store.addTrackedKeyword({ id: randomUUID(), projectId: project.id, keyword: 'best crm software', addedBy: 'u', createdAt: now() })

    const nowDate = new Date()
    const due: Schedule = {
      id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'rank_tracking', cron: '0 6 * * 1',
      enabled: true, nextRunAt: new Date(nowDate.getTime() - 1000).toISOString(), lastRunAt: null,
      createdAt: nowDate.toISOString(), updatedAt: nowDate.toISOString(),
    }
    await store.upsertSchedule(due)

    expect(await materializeDueSchedules(store, nowDate)).toEqual({ materialized: 1, failed: 0 })
    const outcome = await runDueJobs(store, nowDate, 'test-runner', productionHandlers())
    expect(outcome.succeeded).toBe(1)
    expect(outcome.failed).toBe(0)

    const jobs = await store.listJobs(project.id, 10)
    expect(jobs[0].status).toBe('succeeded')
    expect(jobs[0].kind).toBe('rank_tracking')

    const snapshots = await store.listRankSnapshots(project.id)
    expect(snapshots).toHaveLength(1)
  })
})

// ── Unusable project domain ─────────────────────────────────────────────────
// hostOf returns '' rather than throwing for a domain it cannot parse. An
// empty host matches no SERP result, so every keyword would record position
// null — which detectRankDrops reads as "fell off the rankings" and emails the
// owners about. The runner has to recognise that it cannot check at all.

describe('rank tracking with an unusable project domain', () => {
  let store2: FileFoundationStore

  beforeEach(() => {
    store2 = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-rank-badhost-')))
    process.env = { ...ORIGINAL_ENV }
  })
  afterEach(() => {
    __setStoreForTests(null)
    vi.unstubAllGlobals()
    process.env = { ...ORIGINAL_ENV }
  })

  async function runWithDomain(domain: string) {
    process.env.SERPAPI_KEY = 'test-key'
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(serpResponse('https://acme.com/pricing')), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const owner: User = { id: randomUUID(), email: 'owner2@acme.com', name: 'Owner', passwordHash: 'x', tokenVersion: 0, createdAt: now() }
    const org: Organization = { id: randomUUID(), name: 'Acme Org', createdAt: now() }
    await store2.createUser(owner)
    await store2.createOrg(org, owner.id)
    const project: Project = { id: randomUUID(), orgId: org.id, domain, name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
    await store2.createProject(project)

    const kw: TrackedKeyword = { id: randomUUID(), projectId: project.id, keyword: 'best crm software', addedBy: 'u', createdAt: now() }
    await store2.addTrackedKeyword(kw)
    // A real prior snapshot, so a bogus null this run would register as a drop.
    await store2.recordRankSnapshot({ id: randomUUID(), projectId: project.id, keyword: kw.keyword, position: 4, url: 'https://acme.com/pricing', checkedAt: now() })

    const job: Job = { id: randomUUID(), orgId: org.id, projectId: project.id, kind: 'rank_tracking', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runRankTrackingJob(store2, job)
    return { result, project, keyword: kw.keyword, fetchMock }
  }

  it('checks nothing and says so when the domain cannot be parsed to a host', async () => {
    const { result, fetchMock } = await runWithDomain('not a domain')
    expect(result.checked).toBe(0)
    expect(String(result.note)).toMatch(/host|domain/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('records no snapshot rather than poisoning the history with a null position', async () => {
    const { project, keyword } = await runWithDomain('not a domain')
    const history = await store2.listRankSnapshots(project.id, keyword)
    expect(history).toHaveLength(1)
    expect(history[0].position).toBe(4)
  })

  it('raises no rank-drop alert off a domain it never actually checked', async () => {
    const { result } = await runWithDomain('not a domain')
    expect(result.drops ?? 0).toBe(0)
    expect((result.alerted as unknown[] | undefined)?.length ?? 0).toBe(0)
  })

  it('still works normally for a domain that parses', async () => {
    const { result } = await runWithDomain('acme.com')
    expect(result.checked).toBe(1)
  })
})
