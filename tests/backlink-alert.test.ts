// Backlink-drop alerts: emailed when a scheduled backlink refresh finds the
// referring-domain count dropped significantly since the last real,
// available snapshot. Uses the real file store + the real (logged-only, no
// MAIL_WEBHOOK_URL) mailer so the test proves actual delivery attempts
// happen, not just that a function was called.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { buildBacklinkDropEmail, detectBacklinkDrop, notifyBacklinkDrop } from '../lib/foundation/scheduler/backlink-alert'
import type { BacklinkSnapshot, Organization, Project, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'backlink-alert-secret-01'

function snap(over: Partial<BacklinkSnapshot>): Pick<BacklinkSnapshot, 'available' | 'referringDomains'> {
  return { available: true, referringDomains: 100, ...over }
}

describe('detectBacklinkDrop: real deltas only, never noise', () => {
  it('flags a meaningful drop in referring domains (>= minDrop)', () => {
    const drop = detectBacklinkDrop(snap({ referringDomains: 120 }), snap({ referringDomains: 100 }))
    expect(drop).toEqual({ from: 120, to: 100, lost: 20 })
  })
  it('does not flag ordinary index noise under the threshold', () => {
    const drop = detectBacklinkDrop(snap({ referringDomains: 102 }), snap({ referringDomains: 100 }))
    expect(drop).toBeNull()
  })
  it('does not flag an increase', () => {
    const drop = detectBacklinkDrop(snap({ referringDomains: 90 }), snap({ referringDomains: 120 }))
    expect(drop).toBeNull()
  })
  it('never flags when there is no prior snapshot to compare against', () => {
    expect(detectBacklinkDrop(null, snap({ referringDomains: 50 }))).toBeNull()
  })
  it('never flags against a prior snapshot with no provider configured', () => {
    const drop = detectBacklinkDrop(snap({ available: false, referringDomains: null }), snap({ referringDomains: 50 }))
    expect(drop).toBeNull()
  })
  it('never flags when the CURRENT check failed / has no provider — a failed lookup is not a real drop', () => {
    const drop = detectBacklinkDrop(snap({ referringDomains: 120 }), snap({ available: false, referringDomains: null }))
    expect(drop).toBeNull()
  })
})

describe('buildBacklinkDropEmail: pure, real-data-only content', () => {
  it('reports the real from/to/lost counts', () => {
    const email = buildBacklinkDropEmail({ domain: 'acme.com', name: 'Acme' }, { from: 120, to: 100, lost: 20 })
    expect(email.subject).toContain('lost 20 referring domains')
    expect(email.text).toContain('Referring domains: 120 → 100 (−20)')
  })
})

describe('notifyBacklinkDrop: emails real org owners, never fabricates recipients', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-backlink-alert-')))
  })
  afterEach(() => {})

  it('does nothing when there is no drop', async () => {
    const project = { id: 'p1', orgId: 'o1', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyBacklinkDrop(store, project, null)
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
    const results = await notifyBacklinkDrop(store, project, { from: 120, to: 100, lost: 20 })
    expect(results).toHaveLength(1)
    expect(results[0].via).toBe('logged-only')
  })

  it('sends nothing when the project org has no owner recipient available', async () => {
    const project = { id: 'p1', orgId: 'no-such-org', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyBacklinkDrop(store, project, { from: 120, to: 100, lost: 20 })
    expect(results).toEqual([])
  })
})
