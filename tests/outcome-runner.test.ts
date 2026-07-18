// Outcome-measurement flywheel (SCHEDULER_DESIGN.md §11): runOutcomeCapture
// compares GSC metrics before/after a deployment and never fabricates a
// reading. No live network — the disconnected-provider path is exercised via
// the real connectedProviderSet (no stored connection → Null provider, which
// makes no network call), and the connected path via an injected
// MockSearchConsoleProvider.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { makeJob } from '../lib/foundation/scheduler/engine'
import { runOutcomeCapture } from '../lib/foundation/scheduler/outcome-runner'
import { MockSearchConsoleProvider } from '../lib/foundation/external/providers/search-console'
import { connectedProviderSet } from '../lib/foundation/external/service'
import type { Job, Organization, Project, WpDeployment } from '../lib/foundation/types'

let store: FileFoundationStore
const uid = () => randomUUID()
const now = () => new Date().toISOString()

async function seedProject(): Promise<{ project: Project; orgId: string }> {
  const o: Organization = { id: uid(), name: 'O', createdAt: now() }
  const p: Project = { id: uid(), orgId: o.id, domain: 'example.com', name: 'P', industry: '', businessProfile: '', goals: [], notes: '', createdAt: now(), updatedAt: now() }
  await store.createOrg(o, uid())
  await store.createProject(p)
  return { project: p, orgId: o.id }
}

function seedDeployment(projectId: string, approvedAt: string): WpDeployment {
  return {
    id: uid(),
    projectId,
    connectionId: uid(),
    postId: 1,
    postType: 'posts',
    postUrl: 'https://example.com/blog/post-1',
    before: { title: 'Old title', metaDescription: 'old', contentHash: 'x', content: '' },
    after: { title: 'New, better title' },
    approvedBy: 'user-1',
    approvedAt,
    reason: 'test',
    status: 'verified',
    verification: { checkedAt: approvedAt, titleMatches: true, metaMatches: null, note: '' },
    result: 'Applied and verified.',
    createdAt: approvedAt,
  }
}

function outcomeJob(orgId: string, projectId: string, deploymentId: string, attempts = 1): Job {
  const job = makeJob({ orgId, projectId, kind: 'outcome_capture', runAt: new Date(), payload: { deploymentId }, now: new Date() })
  return { ...job, attempts }
}

beforeEach(() => {
  store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-outcome-')))
})
afterEach(() => { /* temp dir left for the OS to reap */ })

describe('runOutcomeCapture', () => {
  it('throws when the deployment does not exist', async () => {
    const { project, orgId } = await seedProject()
    const job = outcomeJob(orgId, project.id, 'missing-dep')
    await expect(runOutcomeCapture(store, job)).rejects.toThrow(/not found/)
  })

  it('records an honest skip (never a fabricated reading) when Search Console is not connected', async () => {
    const { project, orgId } = await seedProject()
    const dep = seedDeployment(project.id, '2026-06-01T00:00:00Z')
    await store.createWpDeployment(dep)
    const job = outcomeJob(orgId, project.id, dep.id)

    // No stored provider connection → connectedProviderSet resolves to the
    // Null provider (no network call), so the real function is safe here.
    const result = await runOutcomeCapture(store, job, { resolveProviders: connectedProviderSet })
    expect(result.captured).toBe(false)

    const stored = await store.getWpDeployment(dep.id)
    expect(stored?.outcome?.skipped).toBe(true)
    if (stored?.outcome?.skipped) expect(stored.outcome.reason).toMatch(/disconnected/)
  })

  it('computes a delta from real before/after windows and persists it on the deployment', async () => {
    const { project, orgId } = await seedProject()
    const dep = seedDeployment(project.id, '2026-06-01T00:00:00Z')
    await store.createWpDeployment(dep)
    const job = outcomeJob(orgId, project.id, dep.id)

    let call = 0
    const resolveProviders = async () => ({
      searchConsole: {
        kind: 'search-console' as const,
        id: 'gsc',
        status: () => ({ id: 'gsc', kind: 'search-console' as const, state: 'connected' as const, detail: '', lastCheckedAt: now() }),
        async fetchReport() {
          throw new Error('not used')
        },
        async fetchPageMetrics(page: string, from: string, to: string) {
          call++
          // First call = before window (fewer clicks), second = after (more).
          const clicks = call === 1 ? 10 : 40
          return {
            ok: true as const,
            data: { range: { from, to }, page, clicks, impressions: clicks * 10, ctr: 0.1, position: call === 1 ? 8 : 5 },
            grade: 'observed' as const,
            source: 'gsc',
            fetchedAt: now(),
          }
        },
      },
    })

    const result = await runOutcomeCapture(store, job, { resolveProviders })
    expect(result.captured).toBe(true)
    expect(result.delta).toEqual({ clicks: 30, impressions: 300, ctr: 0, position: -3 })

    const stored = await store.getWpDeployment(dep.id)
    expect(stored?.outcome?.skipped).toBe(false)
    if (stored?.outcome && !stored.outcome.skipped) {
      expect(stored.outcome.before.clicks).toBe(10)
      expect(stored.outcome.after.clicks).toBe(40)
      expect(stored.outcome.delta.position).toBe(-3) // negative = improved rank
    }
  })

  it('retries a transient failure (rate-limited) instead of recording a fabricated or premature skip', async () => {
    const { project, orgId } = await seedProject()
    const dep = seedDeployment(project.id, '2026-06-01T00:00:00Z')
    await store.createWpDeployment(dep)
    const job = outcomeJob(orgId, project.id, dep.id, 1) // first attempt of maxAttempts=3

    const provider = new MockSearchConsoleProvider('gsc', { connected: true, credential: 'k', failMode: 'rate-limited' })
    const resolveProviders = async () => ({ searchConsole: provider })

    await expect(runOutcomeCapture(store, job, { resolveProviders })).rejects.toThrow(/rate-limited/)
    // No premature fabricated/skipped outcome written on a transient failure
    // that still has retries left.
    const stored = await store.getWpDeployment(dep.id)
    expect(stored?.outcome).toBeUndefined()
  })

  it('falls back to an honest skip once retries are exhausted, so the deployment never stays unset forever', async () => {
    const { project, orgId } = await seedProject()
    const dep = seedDeployment(project.id, '2026-06-01T00:00:00Z')
    await store.createWpDeployment(dep)
    const job = outcomeJob(orgId, project.id, dep.id, 3) // == maxAttempts(3): last attempt

    const provider = new MockSearchConsoleProvider('gsc', { connected: true, credential: 'k', failMode: 'rate-limited' })
    const resolveProviders = async () => ({ searchConsole: provider })

    const result = await runOutcomeCapture(store, job, { resolveProviders })
    expect(result.captured).toBe(false)
    const stored = await store.getWpDeployment(dep.id)
    expect(stored?.outcome?.skipped).toBe(true)
    if (stored?.outcome?.skipped) expect(stored.outcome.reason).toMatch(/rate-limited/)
  })
})
