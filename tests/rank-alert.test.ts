// Rank-drop alerts: emailed when a scheduled rank-tracking check finds a
// tracked keyword dropped significantly since its last real snapshot. Uses
// the real file store + the real (logged-only, no MAIL_WEBHOOK_URL) mailer
// so the test proves actual delivery attempts happen, not just that a
// function was called.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { buildRankDropEmail, detectRankDrops, notifyRankDrops } from '../lib/foundation/scheduler/rank-alert'
import type { Organization, Project, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'rank-alert-secret-01'

describe('detectRankDrops: real deltas only, never noise', () => {
  it('flags a keyword that fell off entirely', () => {
    const drops = detectRankDrops([{ keyword: 'best crm', position: 4 }], [{ keyword: 'best crm', position: null }])
    expect(drops).toEqual([{ keyword: 'best crm', from: 4, to: null }])
  })
  it('flags a position that got meaningfully worse (>= minDrop)', () => {
    const drops = detectRankDrops([{ keyword: 'best crm', position: 3 }], [{ keyword: 'best crm', position: 9 }])
    expect(drops).toEqual([{ keyword: 'best crm', from: 3, to: 9 }])
  })
  it('does not flag ordinary SERP wobble under the threshold', () => {
    const drops = detectRankDrops([{ keyword: 'best crm', position: 3 }], [{ keyword: 'best crm', position: 5 }])
    expect(drops).toEqual([])
  })
  it('does not flag an improvement', () => {
    const drops = detectRankDrops([{ keyword: 'best crm', position: 9 }], [{ keyword: 'best crm', position: 2 }])
    expect(drops).toEqual([])
  })
  it('never flags a keyword with no prior snapshot to compare against', () => {
    const drops = detectRankDrops([], [{ keyword: 'brand new keyword', position: null }])
    expect(drops).toEqual([])
  })
  it('never flags a keyword that was already not ranking', () => {
    const drops = detectRankDrops([{ keyword: 'long tail', position: null }], [{ keyword: 'long tail', position: null }])
    expect(drops).toEqual([])
  })
})

describe('buildRankDropEmail: pure, real-data-only content', () => {
  it('lists the real drops with a real count', () => {
    const email = buildRankDropEmail({ domain: 'acme.com', name: 'Acme' }, [{ keyword: 'best crm', from: 3, to: 9 }])
    expect(email.subject).toContain('1 keyword dropped')
    expect(email.text).toContain('"best crm": #3 → #9')
  })
  it('reports "not ranking" honestly rather than a fabricated position', () => {
    const email = buildRankDropEmail({ domain: 'acme.com', name: 'Acme' }, [{ keyword: 'best crm', from: 4, to: null }])
    expect(email.text).toContain('"best crm": #4 → not ranking')
  })
  it('escapes HTML in the keyword so a hostile tracked keyword cannot inject markup', () => {
    const email = buildRankDropEmail({ domain: 'acme.com', name: 'Acme' }, [{ keyword: '<script>evil()</script>', from: 3, to: 9 }])
    expect(email.html).not.toContain('<script>evil')
    expect(email.html).toContain('&lt;script&gt;')
  })
})

describe('notifyRankDrops: emails real org owners, never fabricates recipients', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-rank-alert-')))
  })
  afterEach(() => {})

  it('does nothing when there are no drops', async () => {
    const project = { id: 'p1', orgId: 'o1', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyRankDrops(store, project, [])
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
    const results = await notifyRankDrops(store, project, [{ keyword: 'best crm', from: 3, to: 9 }])
    expect(results).toHaveLength(1)
    expect(results[0].via).toBe('logged-only')
  })

  it('sends nothing when the project org has no owner recipient available', async () => {
    const project = { id: 'p1', orgId: 'no-such-org', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyRankDrops(store, project, [{ keyword: 'best crm', from: 3, to: 9 }])
    expect(results).toEqual([])
  })
})
