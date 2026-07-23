// AI-citation-loss alerts: emailed when a tracked AI-answer-engine query
// that WAS cited stops being cited. Uses the real file store + the real
// (logged-only, no MAIL_WEBHOOK_URL) mailer so the test proves actual
// delivery attempts happen, not just that a function was called.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { buildCitationLossEmail, detectCitationLosses, notifyCitationLosses } from '../lib/foundation/scheduler/ai-citation-alert'
import type { Organization, Project, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'ai-citation-alert-secret-01'

describe('detectCitationLosses: real losses only, never noise', () => {
  it('flags a query that was cited and no longer is', () => {
    const losses = detectCitationLosses(
      [{ query: 'best crm', available: true, cited: true }],
      [{ query: 'best crm', available: true, cited: false }]
    )
    expect(losses).toEqual([{ query: 'best crm' }])
  })

  it('does not flag a query that was never cited', () => {
    const losses = detectCitationLosses(
      [{ query: 'best crm', available: true, cited: false }],
      [{ query: 'best crm', available: true, cited: false }]
    )
    expect(losses).toEqual([])
  })

  it('does not flag a query still cited', () => {
    const losses = detectCitationLosses(
      [{ query: 'best crm', available: true, cited: true }],
      [{ query: 'best crm', available: true, cited: true }]
    )
    expect(losses).toEqual([])
  })

  it('never flags when the current check failed — a missing data point is not an observed loss', () => {
    const losses = detectCitationLosses(
      [{ query: 'best crm', available: true, cited: true }],
      [{ query: 'best crm', available: false, cited: false }]
    )
    expect(losses).toEqual([])
  })

  it('never flags against a previous check that itself failed', () => {
    const losses = detectCitationLosses(
      [{ query: 'best crm', available: false, cited: false }],
      [{ query: 'best crm', available: true, cited: false }]
    )
    expect(losses).toEqual([])
  })

  it('never flags a query with no prior snapshot to compare against', () => {
    const losses = detectCitationLosses([], [{ query: 'brand new query', available: true, cited: false }])
    expect(losses).toEqual([])
  })
})

describe('buildCitationLossEmail: pure, real-data-only content', () => {
  it('lists the real lost queries with a real count', () => {
    const email = buildCitationLossEmail({ domain: 'acme.com', name: 'Acme' }, [{ query: 'best crm' }])
    expect(email.subject).toContain('1 query')
    expect(email.text).toContain('"best crm"')
  })
  it('escapes HTML in the query so a hostile tracked query cannot inject markup', () => {
    const email = buildCitationLossEmail({ domain: 'acme.com', name: 'Acme' }, [{ query: '<script>evil()</script>' }])
    expect(email.html).not.toContain('<script>evil')
    expect(email.html).toContain('&lt;script&gt;')
  })
})

describe('notifyCitationLosses: emails real org owners, never fabricates recipients', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-ai-citation-alert-')))
  })
  afterEach(() => {})

  it('does nothing when there are no losses', async () => {
    const project = { id: 'p1', orgId: 'o1', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyCitationLosses(store, project, [])
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
    const results = await notifyCitationLosses(store, project, [{ query: 'best crm' }])
    expect(results).toHaveLength(1)
    expect(results[0].via).toBe('logged-only')
  })

  it('sends nothing when the project org has no owner recipient available', async () => {
    const project = { id: 'p1', orgId: 'no-such-org', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyCitationLosses(store, project, [{ query: 'best crm' }])
    expect(results).toEqual([])
  })
})
