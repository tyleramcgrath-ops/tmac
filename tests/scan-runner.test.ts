// Server-side scheduled crawl driver (SCHEDULER_DESIGN.md §6): proves a single
// job invocation does bounded work and re-enqueues a continuation with the
// crawl cursor when the site isn't fully crawled yet, and that draining all
// continuations converges on a completed scan with recommendations —
// identical output shape to the interactive scan-completion path. No live
// network: the SSRF guard's test-host seam + a mocked fetch serve a small
// synthetic link graph deterministically.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { makeJob } from '../lib/foundation/scheduler/engine'
import { runScheduledScan } from '../lib/foundation/scheduler/scan-runner'
import { __setTrustedHostsForTests } from '../app/api/seo-scan/url-guard'
import type { Job, Organization, Project, User } from '../lib/foundation/types'

let store: FileFoundationStore
const uid = () => randomUUID()
const now = () => new Date().toISOString()

const PAGE_COUNT = 18 // > BATCH(10) so one round can't finish the crawl

function pageHtml(title: string, links: string[]): string {
  const body = `${'Real, honest body copy about this page so it clears the content-length floor. '.repeat(15)}`
  const anchors = links.map((l) => `<a href="${l}">${l}</a>`).join('\n')
  return `<!doctype html><html><head><title>${title}</title>
    <meta name="description" content="A synthetic test page with a real description long enough to pass the floor.">
  </head><body><h1>${title}</h1><p>${body}</p>${anchors}</body></html>`
}

function stubLinkGraph() {
  __setTrustedHostsForTests(['example.com'])
  const subPaths = Array.from({ length: PAGE_COUNT - 1 }, (_, i) => `/page-${i}`)
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    if (/sitemap/i.test(url)) return new Response('', { status: 404 })
    const u = new URL(url)
    if (u.pathname === '/' || u.pathname === '') {
      return new Response(pageHtml('Home', subPaths.map((p) => `https://example.com${p}`)), {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    }
    return new Response(pageHtml(`Sub ${u.pathname}`, []), { status: 200, headers: { 'content-type': 'text/html' } })
  })
  vi.stubGlobal('fetch', fetchMock)
}

async function seedProject(): Promise<{ project: Project; orgId: string }> {
  const u: User = { id: uid(), email: `${uid()}@x.com`, name: 'u', passwordHash: 'x', tokenVersion: 0, createdAt: now() }
  const o: Organization = { id: uid(), name: 'O', createdAt: now() }
  const p: Project = { id: uid(), orgId: o.id, domain: 'example.com', name: 'P', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
  await store.createUser(u)
  await store.createOrg(o, u.id)
  await store.createProject(p)
  return { project: p, orgId: o.id }
}

beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-scanrunner-')))
})
afterEach(() => {
  __setTrustedHostsForTests(null)
  vi.unstubAllGlobals()
})

describe('runScheduledScan (server-side crawl driver)', () => {
  it('does bounded work per invocation and re-enqueues a continuation with the crawl cursor', async () => {
    stubLinkGraph()
    const { project, orgId } = await seedProject()
    const seedJob = makeJob({ orgId, projectId: project.id, kind: 'scheduled_scan', runAt: new Date(), now: new Date() })

    const result = await runScheduledScan(store, seedJob)

    expect(result.continued).toBe(true)
    expect(typeof result.scanId).toBe('string')

    // The handler enqueued exactly one continuation job carrying the cursor.
    const jobs = await store.listJobs(project.id, 10)
    const queued = jobs.filter((j) => j.status === 'queued')
    expect(queued.length).toBe(1)
    expect(queued[0].payload.scanId).toBe(result.scanId)
    expect(Array.isArray(queued[0].payload.visited)).toBe(true)
    expect(Array.isArray(queued[0].payload.frontier)).toBe(true)
    expect((queued[0].payload.frontier as string[]).length).toBeGreaterThan(0)

    // The in-progress scan is honestly 'running' with partial pages, not a
    // fabricated completion.
    const scan = await store.getScan(result.scanId as string)
    expect(scan?.status).toBe('running')
    expect(scan!.pages.length).toBeGreaterThan(0)
    expect(scan!.pages.length).toBeLessThan(PAGE_COUNT)
  })

  it('draining every continuation converges on a completed scan identical in shape to the interactive path', async () => {
    stubLinkGraph()
    const { project, orgId } = await seedProject()
    let job: Job = makeJob({ orgId, projectId: project.id, kind: 'scheduled_scan', runAt: new Date(), now: new Date() })

    let finalResult: Record<string, unknown> | undefined
    for (let round = 0; round < 10; round++) {
      const result = await runScheduledScan(store, job)
      if (!result.continued) {
        finalResult = result
        break
      }
      const jobs = await store.listJobs(project.id, 20)
      const next = jobs.find((j) => j.status === 'queued')
      expect(next).toBeTruthy()
      job = next!
    }

    expect(finalResult).toBeTruthy()
    expect(finalResult!.status === 'completed' || finalResult!.status === 'partial').toBe(true)
    expect(finalResult!.pages).toBe(PAGE_COUNT)
    expect(typeof finalResult!.recommendations).toBe('number')

    const scan = await store.getScan(finalResult!.scanId as string)
    expect(scan?.status).toBe(finalResult!.status)
    expect(scan?.createdBy).toBe('system:scheduler')
    expect(scan?.pages.length).toBe(PAGE_COUNT)
    expect(scan?.summary.pagesCrawled).toBe(PAGE_COUNT)

    const recs = await store.listRecommendations(project.id)
    expect(recs.length).toBe(finalResult!.created)
  })

  it('a hard crawl failure (blocked homepage) fails the job honestly with no fabricated scan', async () => {
    __setTrustedHostsForTests(['example.com'])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html><title>Access Denied</title></html>', { status: 403 }))
    )
    const { project, orgId } = await seedProject()
    const job = makeJob({ orgId, projectId: project.id, kind: 'scheduled_scan', runAt: new Date(), now: new Date() })

    await expect(runScheduledScan(store, job)).rejects.toThrow()
    const scans = await store.listScans(project.id, 10)
    expect(scans.length).toBe(0)
  })
})
