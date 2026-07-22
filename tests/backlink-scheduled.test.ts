// Automated backlink-profile refresh (the 'backlink_refresh' JobKind): on a
// project's chosen cadence, records one more real, timestamped aggregate
// backlink snapshot from Majestic. Proves the runner directly, the
// MAJESTIC_API_KEY-unset honest no-op, and the full schedule -> job ->
// handler wiring.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { materializeDueSchedules, runDueJobs } from '../lib/foundation/scheduler/engine'
import { productionHandlers } from '../lib/foundation/scheduler/handlers'
import { runBacklinkRefreshJob } from '../lib/foundation/scheduler/backlink-runner'
import type { Job, Organization, Project, Schedule, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'backlink-secret-01'

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

function majesticResponse() {
  return {
    Code: 'OK',
    DataTables: { Results: { Data: [{ ExtBackLinks: '1200', RefDomains: '85', TrustFlow: '32', CitationFlow: '40' }] } },
  }
}

describe('automated backlink refresh', () => {
  let store: FileFoundationStore

  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-backlink-')))
    process.env = { ...ORIGINAL_ENV }
  })
  afterEach(() => {
    __setStoreForTests(null)
    vi.unstubAllGlobals()
    process.env = { ...ORIGINAL_ENV }
  })

  it('runBacklinkRefreshJob records a real, parsed snapshot', async () => {
    process.env.MAJESTIC_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(majesticResponse()), { status: 200 })))
    const { project } = await seedProject(store)

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'backlink_refresh', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runBacklinkRefreshJob(store, job)
    expect(result.checked).toBe(true)
    expect(result.available).toBe(true)

    const snapshots = await store.listBacklinkSnapshots(project.id)
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].totalBacklinks).toBe(1200)
    expect(snapshots[0].referringDomains).toBe(85)
    expect(snapshots[0].trustFlow).toBe(32)
    expect(snapshots[0].citationFlow).toBe(40)
  })

  it('honestly records unavailable on a Majestic error code, never a fabricated zero', async () => {
    process.env.MAJESTIC_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ Code: 'InvalidAppAPIKey', ErrorMessage: 'bad key' }), { status: 200 })))
    const { project } = await seedProject(store)

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'backlink_refresh', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    await runBacklinkRefreshJob(store, job)

    const snapshots = await store.listBacklinkSnapshots(project.id)
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].available).toBe(false)
    expect(snapshots[0].totalBacklinks).toBeNull()
    expect(snapshots[0].message).toMatch(/bad key/)
  })

  it('takes no snapshot and reports why when MAJESTIC_API_KEY is unset', async () => {
    delete process.env.MAJESTIC_API_KEY
    const { project } = await seedProject(store)

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'backlink_refresh', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runBacklinkRefreshJob(store, job)
    expect(result.checked).toBe(false)
    expect(String(result.note)).toMatch(/MAJESTIC_API_KEY/)
    expect(await store.listBacklinkSnapshots(project.id)).toHaveLength(0)
  })

  it('the backlink_refresh JobKind is fully wired: schedule -> job -> real handler', async () => {
    process.env.MAJESTIC_API_KEY = 'test-key'
    __setStoreForTests(store)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(majesticResponse()), { status: 200 })))
    const { project } = await seedProject(store)

    const nowDate = new Date()
    const due: Schedule = {
      id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'backlink_refresh', cron: '0 6 * * 1',
      enabled: true, nextRunAt: new Date(nowDate.getTime() - 1000).toISOString(), lastRunAt: null,
      createdAt: nowDate.toISOString(), updatedAt: nowDate.toISOString(),
    }
    await store.upsertSchedule(due)

    expect(await materializeDueSchedules(store, nowDate)).toBe(1)
    const outcome = await runDueJobs(store, nowDate, 'test-runner', productionHandlers())
    expect(outcome.succeeded).toBe(1)
    expect(outcome.failed).toBe(0)

    const jobs = await store.listJobs(project.id, 10)
    expect(jobs[0].status).toBe('succeeded')
    expect(jobs[0].kind).toBe('backlink_refresh')

    const snapshots = await store.listBacklinkSnapshots(project.id)
    expect(snapshots).toHaveLength(1)
  })
})
