// Cron runner route: secret enforcement + that an authorized tick drains a due
// job through the real handler registry (scheduled_scan → server-side crawl →
// recommendations + consensus). Uses the file store and a stubbed single-page
// site (network guard's test-host seam + a mocked fetch) — no live network.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { makeJob } from '../lib/foundation/scheduler/engine'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import type { Organization, Project, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'cron-route-secret-0123456789abcd'

let store: FileFoundationStore
const uid = () => randomUUID()
const now = () => new Date().toISOString()

const SINGLE_PAGE_HTML = `<!doctype html><html><head>
  <title>Example Domain — home</title>
  <meta name="description" content="A small honest test page with enough body copy to clear the meaningful-content floor.">
</head><body>
  <h1>Example Domain</h1>
  <p>${'This domain is for use in illustrative examples in documents. '.repeat(20)}</p>
</body></html>`

function stubNetwork() {
  __setTrustedHostsForTests(['example.com'])
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    if (/sitemap/i.test(url)) {
      return new Response('', { status: 404 })
    }
    return new Response(SINGLE_PAGE_HTML, { status: 200, headers: { 'content-type': 'text/html' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function seedProject(): Promise<{ projectId: string; orgId: string }> {
  const u: User = { id: uid(), email: `${uid()}@x.com`, name: 'u', passwordHash: 'x', tokenVersion: 0, createdAt: now() }
  const o: Organization = { id: uid(), name: 'O', createdAt: now() }
  const p: Project = { id: uid(), orgId: o.id, domain: 'example.com', name: 'P', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
  await store.createUser(u)
  await store.createOrg(o, u.id)
  await store.createProject(p)
  return { projectId: p.id, orgId: o.id }
}

beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-cron-')))
  __setStoreForTests(store)
  process.env.CRON_SECRET = 'top-secret'
})
afterEach(() => {
  __setStoreForTests(null)
  __setTrustedHostsForTests(null)
  vi.unstubAllGlobals()
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

  it('with the secret, drains a scheduled_scan job through a real crawl to a completed scan', async () => {
    stubNetwork()
    const { projectId, orgId } = await seedProject()
    await store.enqueueJob(makeJob({ orgId, projectId, kind: 'scheduled_scan', runAt: new Date('2020-01-01T00:00:00Z'), now: new Date('2020-01-01T00:00:00Z') }))

    const res = await callCron({ authorization: 'Bearer top-secret' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.ran).toBe(1)
    expect(body.succeeded).toBe(1)

    const [job] = await store.listJobs(projectId)
    expect(job.status).toBe('succeeded')
    expect(job.result?.scanId).toBeTruthy()

    const scans = await store.listScans(projectId, 1)
    expect(scans[0].status === 'completed' || scans[0].status === 'partial').toBe(true)
    expect(scans[0].pages.length).toBeGreaterThan(0)
    expect(scans[0].createdBy).toBe('system:scheduler')
  })
})
