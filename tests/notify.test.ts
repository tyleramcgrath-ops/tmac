// Recipient resolution and HTML escaping for every scheduler alert email.
// The escaper is the only thing standing between customer-controlled text
// (page titles, tracked keywords, recommendation titles) and the HTML of an
// email we send on their behalf.

import { describe, expect, it } from 'vitest'
import { escapeHtml, resolveOwnerEmails, resolveOwners } from '../lib/foundation/scheduler/notify'
import type { FoundationStore } from '../lib/foundation/store'
import type { OrgMember, User } from '../lib/foundation/types'

function storeWith(members: Partial<OrgMember>[], users: Partial<User>[]) {
  return {
    listMembers: async () => members as OrgMember[],
    getUserById: async (id: string) => (users.find((u) => u.id === id) as User | undefined) ?? null,
  } as unknown as Pick<FoundationStore, 'listMembers' | 'getUserById'>
}

describe('resolveOwners: real org membership only', () => {
  it('returns the owners of the org with their real addresses', async () => {
    const store = storeWith(
      [{ userId: 'u1', role: 'owner' }, { userId: 'u2', role: 'member' }],
      [{ id: 'u1', email: 'owner@acme.com' }, { id: 'u2', email: 'member@acme.com' }],
    )
    expect(await resolveOwners(store, 'o1')).toEqual([{ userId: 'u1', email: 'owner@acme.com' }])
    expect(await resolveOwnerEmails(store, 'o1')).toEqual(['owner@acme.com'])
  })

  it('returns every owner when an org has several', async () => {
    const store = storeWith(
      [{ userId: 'u1', role: 'owner' }, { userId: 'u2', role: 'owner' }],
      [{ id: 'u1', email: 'a@acme.com' }, { id: 'u2', email: 'b@acme.com' }],
    )
    expect(await resolveOwnerEmails(store, 'o1')).toEqual(['a@acme.com', 'b@acme.com'])
  })

  it('skips an owner whose user record is gone rather than inventing an address', async () => {
    const store = storeWith([{ userId: 'ghost', role: 'owner' }], [])
    expect(await resolveOwnerEmails(store, 'o1')).toEqual([])
  })

  it('returns nothing for an org with no owner, so callers send no email', async () => {
    const store = storeWith([{ userId: 'u1', role: 'member' }], [{ id: 'u1', email: 'm@acme.com' }])
    expect(await resolveOwnerEmails(store, 'o1')).toEqual([])
  })
})

describe('escapeHtml: safe in text AND in an attribute', () => {
  it('escapes the text-context characters', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('escapes an ampersand first so an entity is not double-formed', () => {
    expect(escapeHtml('Tom & Jerry <b>')).toBe('Tom &amp; Jerry &lt;b&gt;')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('escapes quotes, because the digest interpolates escaped values inside href="..."', () => {
    // digest.ts builds `<a href="${escapeHtml(l.url)}">`. A surviving double
    // quote closes the attribute and everything after it becomes markup.
    expect(escapeHtml('" onmouseover="x')).toBe('&quot; onmouseover=&quot;x')
    expect(escapeHtml("' onload='y")).toBe('&#39; onload=&#39;y')
  })

  it('cannot be escaped out of with a crafted title', () => {
    const out = escapeHtml('"><img src=x onerror=alert(1)>')
    expect(out).not.toContain('<')
    expect(out).not.toContain('"')
  })

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Roof Repair Services in Denver')).toBe('Roof Repair Services in Denver')
    expect(escapeHtml('')).toBe('')
  })
})
