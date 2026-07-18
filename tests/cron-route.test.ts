// Cron runner route: secret enforcement + that an authorized tick drains a due
// job through the real handler registry (scheduled_scan → re-evaluate). Uses the
// file store and a seeded completed scan; no live crawl or network.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { makeJob } from '../lib/foundation/scheduler/engine'
import type { Organization, Project, Scan, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'cron-route-secret-0123456789abcd'

let store: FileFoundationStore
const uid = () => randomUUID()
const now = () => new Date().toISOString()

async function seedProjectWithScan(): Promise<string> {
  const u: User = { id: uid(), email: `${uid()}@x.com`, name: 'u', passwordHash: 'x', tokenVersion: 0, createdAt: now() }
  const o: Organization = { id: uid(), name: 'O', createdAt: now() }
  const p: Project = { id: uid(), orgId: o.id, domain: 'example.com', name: 'P', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
  await store.createUser(u)
  await store.createOrg(o, u.id)
  await store.createProject(p)
  const scan: Scan = {
    id: uid(), projectId: p.id, createdBy: u.id, createdAt: now(), status: 'completed', startedAt: now(), completedAt: now(), error: null,
    summary: { pagesCrawled: 1, urlsDiscovered: 1, blockedCount: 0, siteScore: 70, critical: 0, warning: 0, info: 0 },
    pages: [{ url: 'https://example.com/', status: 200, overall: 70, title: 'Home', titleLength: 4, metaDescription: '', h1Count: 1, wordCount: 800, schemaTypes: [], internalTargets: [], https: true, indexable: true, canonical: 'https://example.com/', mixedContent: false }],
    blocked: [],
  }
  await store.createScan(scan)
  return p.id
}

beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-cron-')))
  __setStoreForTests(store)
  process.env.CRON_SECRET = 'top-secret'
})
afterEach(() => {
  __setStoreForTests(null)
  delete process.env.CRON_SECRET
})

async function callCron(headers: Record<string, string>) {
  const { GET } = await import('../app/api/internal/cron/route')
  return GET(new Request('https://app.test/api/internal/cron', { headers }))
}

describe('cron runner route', () => {
  it('rejects requests without the CRON_SECRET bearer', async () => {
    expect((await callCron({})).status).toBe(401)
    expect((await callCron({ authorization: 'Bearer wrong' })).status).toBe(401)
  })

  it('503s when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET
    expect((await callCron({ authorization: 'Bearer top-secret' })).status).toBe(503)
  })

  it('with the secret, drains a due job through the handler and marks it succeeded', async () => {
    const projectId = await seedProjectWithScan()
    await store.enqueueJob(makeJob({ orgId: 'o', projectId, kind: 'scheduled_scan', runAt: new Date('2020-01-01T00:00:00Z'), now: new Date('2020-01-01T00:00:00Z') }))
    const res = await callCron({ authorization: 'Bearer top-secret' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.ran).toBe(1)
    expect(body.succeeded).toBe(1)
    const [job] = await store.listJobs(projectId)
    expect(job.status).toBe('succeeded')
  })
})
