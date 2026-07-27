// AI-citation position-drop alerts: emailed when a still-cited query's
// source position gets meaningfully worse. Uses the real file store + the
// real (logged-only, no MAIL_WEBHOOK_URL) mailer so the test proves actual
// delivery attempts happen, not just that a function was called.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import {
  buildCitationPositionDropEmail,
  detectCitationPositionDrops,
  notifyCitationPositionDrops,
} from '../lib/foundation/scheduler/ai-citation-position-alert'
import type { Organization, Project, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'ai-citation-position-alert-secret-01'

function snap(over: Partial<{ available: boolean; cited: boolean; position: number | null }>) {
  return { available: true, cited: true, position: 1, ...over }
}

describe('detectCitationPositionDrops: real deltas only, never noise', () => {
  it('flags a meaningful position drop while still cited', () => {
    const drops = detectCitationPositionDrops(
      [{ query: 'best crm', ...snap({ position: 1 }) }],
      [{ query: 'best crm', ...snap({ position: 6 }) }]
    )
    expect(drops).toEqual([{ query: 'best crm', from: 1, to: 6 }])
  })

  it('does not flag ordinary noise under the threshold', () => {
    const drops = detectCitationPositionDrops(
      [{ query: 'best crm', ...snap({ position: 2 }) }],
      [{ query: 'best crm', ...snap({ position: 3 }) }]
    )
    expect(drops).toEqual([])
  })

  it('does not flag an improvement', () => {
    const drops = detectCitationPositionDrops(
      [{ query: 'best crm', ...snap({ position: 6 }) }],
      [{ query: 'best crm', ...snap({ position: 1 }) }]
    )
    expect(drops).toEqual([])
  })

  it('never flags a citation that was lost entirely — that is a different alert', () => {
    const drops = detectCitationPositionDrops(
      [{ query: 'best crm', ...snap({ position: 1 }) }],
      [{ query: 'best crm', ...snap({ cited: false, position: null }) }]
    )
    expect(drops).toEqual([])
  })

  it('never flags when the previous check was never cited', () => {
    const drops = detectCitationPositionDrops(
      [{ query: 'best crm', ...snap({ cited: false, position: null }) }],
      [{ query: 'best crm', ...snap({ position: 6 }) }]
    )
    expect(drops).toEqual([])
  })

  it('never flags when the current check failed — a missing data point is not an observed drop', () => {
    const drops = detectCitationPositionDrops(
      [{ query: 'best crm', ...snap({ position: 1 }) }],
      [{ query: 'best crm', available: false, cited: false, position: null }]
    )
    expect(drops).toEqual([])
  })

  it('never flags a query with no prior snapshot to compare against', () => {
    const drops = detectCitationPositionDrops([], [{ query: 'brand new query', ...snap({ position: 6 }) }])
    expect(drops).toEqual([])
  })
})

describe('buildCitationPositionDropEmail: pure, real-data-only content', () => {
  it('reports the real from/to source positions', () => {
    const email = buildCitationPositionDropEmail({ domain: 'acme.com', name: 'Acme' }, [{ query: 'best crm', from: 1, to: 6 }])
    expect(email.subject).toContain('1 query')
    expect(email.text).toContain('"best crm": source #1 → #6')
  })
  it('escapes HTML in the query so a hostile tracked query cannot inject markup', () => {
    const email = buildCitationPositionDropEmail({ domain: 'acme.com', name: 'Acme' }, [{ query: '<script>evil()</script>', from: 1, to: 6 }])
    expect(email.html).not.toContain('<script>evil')
    expect(email.html).toContain('&lt;script&gt;')
  })
})

describe('notifyCitationPositionDrops: emails real org owners, never fabricates recipients', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-ai-citation-pos-alert-')))
  })
  afterEach(() => {})

  it('does nothing when there are no drops', async () => {
    const project = { id: 'p1', orgId: 'o1', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyCitationPositionDrops(store, project, [])
    expect(results).toEqual([])
  })

  it('emails every real owner of the project org (logged-only in this environment)', async () => {
    const owner: User = { id: randomUUID(), email: 'owner@acme.com', name: 'Owner', passwordHash: 'x', tokenVersion: 0, createdAt: new Date().toISOString() }
    const member: User = { id: randomUUID(), email: 'member@acme.com', name: 'Member', passwordHash: 'x', tokenVersion: 0, createdAt: new Date().toISOString() }
    const org: Organization = { id: randomUUID(), name: 'Acme Org', createdAt: new Date().toISOString() }
    await store.createUser(owner)
    await store.createUser(member)
    await store.createOrg(org, owner.id)
    await store.addMember({ orgId: org.id, userId: member.id, role: 'member', createdAt: new Date().toISOString() })

    const project: Project = { id: 'p1', orgId: org.id, domain: 'acme.com', name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const results = await notifyCitationPositionDrops(store, project, [{ query: 'best crm', from: 1, to: 6 }])
    expect(results).toHaveLength(1)
    expect(results[0].via).toBe('logged-only')
  })

  it('sends nothing when the project org has no owner recipient available', async () => {
    const project = { id: 'p1', orgId: 'no-such-org', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyCitationPositionDrops(store, project, [{ query: 'best crm', from: 1, to: 6 }])
    expect(results).toEqual([])
  })
})
