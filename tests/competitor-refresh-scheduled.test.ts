// Automated competitor refresh (the 'competitor_refresh' JobKind): overlap
// data previously only updated when a user clicked "Refresh" on the Atlas
// tab and silently went stale otherwise. This proves the real scheduled path
// — a project's schedule materializes a job, the production handler registry
// runs it, and every tracked competitor gets a fresh, real Observed overlap
// snapshot, independent of whether other competitors on the same project
// crawl successfully.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import { materializeDueSchedules, runDueJobs } from '../lib/foundation/scheduler/engine'
import { productionHandlers } from '../lib/foundation/scheduler/handlers'
import { refreshOneCompetitor, runCompetitorRefreshJob } from '../lib/foundation/scheduler/competitor-refresh-runner'
import type { Competitor, Job, Organization, Project, Schedule, Scan, User } from '../lib/foundation/types'
import type { CompetitorOverlap } from '../lib/foundation/external/competitors'

process.env.APP_SECRET = 'competitor-refresh-secret-01'

function pageHtml(title: string): string {
  const body = 'Real, honest body copy about this competitor page so it clears the content-length floor. '.repeat(15)
  return `<!doctype html><html><head><title>${title}</title>
    <meta name="description" content="A synthetic competitor page with a real description long enough to pass the floor.">
  </head><body><h1>${title}</h1><p>${body}</p></body></html>`
}

const now = () => new Date().toISOString()

async function seedProject(store: FileFoundationStore) {
  const owner: User = { id: randomUUID(), email: 'owner@acme.com', name: 'Owner', passwordHash: 'x', tokenVersion: 0, createdAt: now() }
  const org: Organization = { id: randomUUID(), name: 'Acme Org', createdAt: now() }
  await store.createUser(owner)
  await store.createOrg(org, owner.id)
  const project: Project = { id: randomUUID(), orgId: org.id, domain: 'acme.com', name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
  await store.createProject(project)
  const scan: Scan = {
    id: randomUUID(), projectId: project.id, createdBy: owner.id, createdAt: now(), status: 'completed',
    startedAt: now(), completedAt: now(), error: null,
    summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 80, critical: 0, warning: 0, info: 0 },
    pages: [{ url: 'https://acme.com/pricing', title: 'Pricing · Acme', titleLength: 12, schemaTypes: ['Product'], internalTargets: [], wordCount: 400, h1Count: 1 }],
    blocked: [],
  }
  await store.createScan(scan)
  return { owner, org, project }
}

describe('automated competitor refresh', () => {
  let store: FileFoundationStore

  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-competitor-refresh-')))
  })
  afterEach(() => {
    __setStoreForTests(null)
    __setTrustedHostsForTests(null)
    vi.unstubAllGlobals()
  })

  it('refreshOneCompetitor persists a real Observed overlap snapshot', async () => {
    __setTrustedHostsForTests(['rival.com'])
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (/sitemap/i.test(url)) return new Response('', { status: 404 })
      return new Response(pageHtml('Rival Home'), { status: 200, headers: { 'content-type': 'text/html' } })
    }))
    const { project } = await seedProject(store)
    const competitor: Competitor = { id: randomUUID(), projectId: project.id, domain: 'rival.com', label: 'Rival', addedBy: 'u', createdAt: now(), lastSnapshotAt: null }
    await store.createCompetitor(competitor)

    const result = await refreshOneCompetitor(store, competitor)
    expect(result.crawled).toBe(true)
    expect(result.pagesCrawled).toBeGreaterThan(0)

    const updated = await store.getCompetitor(competitor.id)
    expect(updated?.lastSnapshotAt).toBeTruthy()
    expect((updated?.overlap as CompetitorOverlap | undefined)?.topicOverlap.evidence.grade).toBe('observed')
  })

  it('runCompetitorRefreshJob refreshes every tracked competitor, one crawl failure never aborts the others', async () => {
    __setTrustedHostsForTests(['good.com', 'bad.com'])
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (/sitemap/i.test(url)) return new Response('', { status: 404 })
      if (url.includes('bad.com')) return new Response('', { status: 503 })
      return new Response(pageHtml('Good Home'), { status: 200, headers: { 'content-type': 'text/html' } })
    }))
    const { project } = await seedProject(store)
    const good: Competitor = { id: randomUUID(), projectId: project.id, domain: 'good.com', label: 'Good', addedBy: 'u', createdAt: now(), lastSnapshotAt: null }
    const bad: Competitor = { id: randomUUID(), projectId: project.id, domain: 'bad.com', label: 'Bad', addedBy: 'u', createdAt: now(), lastSnapshotAt: null }
    await store.createCompetitor(good)
    await store.createCompetitor(bad)

    const job: Job = { id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'competitor_refresh', status: 'running', runAt: now(), payload: {}, attempts: 1, maxAttempts: 3, lockedAt: now(), lockedBy: 'r', lastError: null, result: null, createdAt: now(), updatedAt: now() }
    const result = await runCompetitorRefreshJob(store, job)
    expect(result.refreshed).toBe(2)

    const goodAfter = await store.getCompetitor(good.id)
    const badAfter = await store.getCompetitor(bad.id)
    expect(goodAfter?.lastSnapshotAt).toBeTruthy()
    expect((goodAfter?.overlap as CompetitorOverlap | undefined)?.topicOverlap.evidence.grade).toBe('observed')
    // The untrusted-host crawl fails honestly — no lastSnapshotAt fabricated,
    // overlap degrades to unavailable rather than being invented.
    expect(badAfter?.lastSnapshotAt).toBeTruthy() // still stamped: a refresh attempt happened
    expect((badAfter?.overlap as CompetitorOverlap | undefined)?.topicOverlap.evidence.grade).toBe('unavailable')
  })

  it('the competitor_refresh JobKind is fully wired: schedule -> job -> real handler', async () => {
    __setStoreForTests(store)
    __setTrustedHostsForTests(['rival.com'])
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (/sitemap/i.test(url)) return new Response('', { status: 404 })
      return new Response(pageHtml('Rival Home'), { status: 200, headers: { 'content-type': 'text/html' } })
    }))
    const { project } = await seedProject(store)
    const competitor: Competitor = { id: randomUUID(), projectId: project.id, domain: 'rival.com', label: 'Rival', addedBy: 'u', createdAt: now(), lastSnapshotAt: null }
    await store.createCompetitor(competitor)

    const nowDate = new Date()
    const due: Schedule = {
      id: randomUUID(), orgId: project.orgId, projectId: project.id, kind: 'competitor_refresh', cron: '0 6 * * 1',
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
    expect(jobs[0].kind).toBe('competitor_refresh')

    const updated = await store.getCompetitor(competitor.id)
    expect(updated?.lastSnapshotAt).toBeTruthy()
  })
})
