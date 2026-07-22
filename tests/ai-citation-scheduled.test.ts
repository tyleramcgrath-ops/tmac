// Automated AI-citation checking (the 'ai_citation_check' JobKind): on a
// project's chosen cadence, every tracked query gets one more real,
// timestamped check against Perplexity for whether this project's domain
// was cited. Proves the runner directly, the PERPLEXITY_API_KEY-unset
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
import { runAiCitationCheckJob } from '../lib/foundation/scheduler/ai-citation-runner'
import type { Job, Organization, Project, Schedule, TrackedAiQuery, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'ai-citation-secret-01'

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

function perplexityResponse(citedUrl: string | null) {
  return { citations: citedUrl ? [citedUrl, 'https://other.com/x'] : ['https://other.com/x'] }
}

describe('automated AI citation checking', () => {
  let store: FileFoundationStore

  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-ai-citation-')))
    process.env = { ...ORIGINAL_ENV }
  })
  afterEach(() => {
    __setStoreForTests(null)
    vi.unstubAllGlobals()
    process.env = { ...ORIGINAL_ENV }
  })

  it('runAiCitationCheckJob records a real, honest snapshot per tracked query', async () => {
    process.env.PERPLEXITY_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(perplexityResponse('https://acme.com/pricing')), { status: 200 })))
    const { project } = await seedProject(store)
    const q: TrackedAiQuery = { id: randomUUID(), projectId: project.id, query: 'best crm software', addedBy: 'u', createdAt: now() }
    await store.addTrackedAiQuery(q)

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'ai_citation_check', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runAiCitationCheckJob(store, job)
    expect(result.checked).toBe(1)

    const snapshots = await store.listAiCitationSnapshots(project.id, 'best crm software')
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].cited).toBe(true)
    expect(snapshots[0].position).toBe(1)
    expect(snapshots[0].citedUrl).toBe('https://acme.com/pricing')
  })

  it('honestly records cited:false when the domain is not among the sources, never fabricated', async () => {
    process.env.PERPLEXITY_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(perplexityResponse(null)), { status: 200 })))
    const { project } = await seedProject(store)
    await store.addTrackedAiQuery({ id: randomUUID(), projectId: project.id, query: 'obscure phrase', addedBy: 'u', createdAt: now() })

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'ai_citation_check', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    await runAiCitationCheckJob(store, job)

    const snapshots = await store.listAiCitationSnapshots(project.id, 'obscure phrase')
    expect(snapshots).toHaveLength(1)
    expect(snapshots[0].available).toBe(true)
    expect(snapshots[0].cited).toBe(false)
    expect(snapshots[0].citedUrl).toBeNull()
  })

  it('takes no snapshots and reports why when PERPLEXITY_API_KEY is unset', async () => {
    delete process.env.PERPLEXITY_API_KEY
    const { project } = await seedProject(store)
    await store.addTrackedAiQuery({ id: randomUUID(), projectId: project.id, query: 'best crm software', addedBy: 'u', createdAt: now() })

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'ai_citation_check', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runAiCitationCheckJob(store, job)
    expect(result.checked).toBe(0)
    expect(String(result.note)).toMatch(/PERPLEXITY_API_KEY/)
    expect(await store.listAiCitationSnapshots(project.id)).toHaveLength(0)
  })

  it('the ai_citation_check JobKind is fully wired: schedule -> job -> real handler', async () => {
    process.env.PERPLEXITY_API_KEY = 'test-key'
    __setStoreForTests(store)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(perplexityResponse('https://acme.com/pricing')), { status: 200 })))
    const { project } = await seedProject(store)
    await store.addTrackedAiQuery({ id: randomUUID(), projectId: project.id, query: 'best crm software', addedBy: 'u', createdAt: now() })

    const nowDate = new Date()
    const due: Schedule = {
      id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'ai_citation_check', cron: '0 6 * * 1',
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
    expect(jobs[0].kind).toBe('ai_citation_check')

    const snapshots = await store.listAiCitationSnapshots(project.id)
    expect(snapshots).toHaveLength(1)
  })
})
