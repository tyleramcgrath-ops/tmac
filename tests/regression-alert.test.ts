// Regression alerts: emailed when a scheduled re-crawl finds a
// previously-verified fix reverted on the live site. Uses the real file
// store + the real (logged-only, no MAIL_WEBHOOK_URL) mailer so the test
// proves actual delivery attempts happen, not just that a function was called.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { buildRegressionEmail, notifyRegressions } from '../lib/foundation/scheduler/regression-alert'
import type { Organization, Project, Recommendation, User } from '../lib/foundation/types'

process.env.APP_SECRET = 'regression-alert-secret-01'

function regressedRec(title: string, url: string): Recommendation {
  return {
    id: randomUUID(), projectId: 'p1', scanId: 's2', issueId: `missing-title::${url}`,
    ruleId: 'missing-title', ruleVersion: 1, ruleCategory: 'content', ruleSeverity: 'critical', businessContext: 'money-page',
    title, category: 'content', severity: 'critical', status: 'regressed', reasoning: 'r', confidence: 90, confidenceBasis: 'x',
    evidence: { affectedUrls: [url], facts: [] }, expectedImpact: { category: 'content', size: 'high', note: '' },
    risk: { level: 'low', note: '' }, createdAt: new Date().toISOString(), history: [],
  }
}

describe('buildRegressionEmail: pure, real-data-only content', () => {
  it('lists the real regressed issues with a real count', () => {
    const regs = [regressedRec('Missing title', 'https://acme.com/pricing')]
    const email = buildRegressionEmail({ domain: 'acme.com', name: 'Acme' }, regs)
    expect(email.subject).toContain('1 fix reverted')
    expect(email.text).toContain('Missing title')
    expect(email.text).toContain('https://acme.com/pricing')
    expect(email.html).toContain('Missing title')
  })
  it('escapes HTML in real page data so a hostile title cannot inject markup', () => {
    const regs = [regressedRec('<script>evil()</script>', 'https://acme.com/x')]
    const email = buildRegressionEmail({ domain: 'acme.com', name: 'Acme' }, regs)
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
  it('caps the listed issues but reports the real total in the subject', () => {
    const regs = Array.from({ length: 15 }, (_, i) => regressedRec(`Issue ${i}`, `https://acme.com/p${i}`))
    const email = buildRegressionEmail({ domain: 'acme.com', name: 'Acme' }, regs)
    expect(email.subject).toContain('15 fixes reverted')
    expect(email.text).toContain('…and 5 more.')
  })
})

describe('notifyRegressions: emails real org owners, never fabricates recipients', () => {
  let store: FileFoundationStore
  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-regression-alert-')))
  })
  afterEach(() => {})

  it('does nothing when there are no regressions', async () => {
    const project = { id: 'p1', orgId: 'o1', domain: 'acme.com', name: 'Acme' } as Project
    const results = await notifyRegressions(store, project, [])
    expect(results).toEqual([])
  })

  it('emails every real owner of the project org (logged-only in this environment)', async () => {
    const owner: User = { id: randomUUID(), email: 'owner@acme.com', name: 'Owner', passwordHash: 'x', tokenVersion: 0, createdAt: new Date().toISOString() }
    const member: User = { id: randomUUID(), email: 'member@acme.com', name: 'Member', passwordHash: 'x', tokenVersion: 0, createdAt: new Date().toISOString() }
    const org: Organization = { id: randomUUID(), name: 'Acme Org', createdAt: new Date().toISOString() }
    await store.createUser(owner)
    await store.createUser(member)
    await store.createOrg(org, owner.id) // creator becomes 'owner'
    await store.addMember({ orgId: org.id, userId: member.id, role: 'member', createdAt: new Date().toISOString() })

    const project: Project = { id: 'p1', orgId: org.id, domain: 'acme.com', name: 'Acme', industry: '', businessProfile: '', goals: [], notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    const regs = [regressedRec('Missing title', 'https://acme.com/pricing')]

    const results = await notifyRegressions(store, project, regs)
    // Only the owner, not the plain member — matches real org membership, never invented recipients.
    expect(results).toHaveLength(1)
    expect(results[0].via).toBe('logged-only') // no MAIL_WEBHOOK_URL in tests — honestly not delivered
  })

  it('sends nothing when the project org has no owner recipient available', async () => {
    const project = { id: 'p1', orgId: 'no-such-org', domain: 'acme.com', name: 'Acme' } as Project
    const regs = [regressedRec('Missing title', 'https://acme.com/pricing')]
    const results = await notifyRegressions(store, project, regs)
    expect(results).toEqual([])
  })
})
