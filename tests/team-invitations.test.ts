// Team invitations: previously nonexistent — signup always created a fresh
// personal org and there was no path for a second person to join an existing
// one. This proves the real, end-to-end flow: an admin/owner invites an
// email, the invitee signs up/logs in with that exact address, accepts, and
// becomes a real member — plus the safety rails (role gating, last-owner
// protection, email-mismatch rejection, revoke, re-invite dedup).

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { FileFoundationStore } from '../lib/foundation/filestore'
import { __setStoreForTests } from '../lib/foundation/store'
import { __resetRateLimits } from '../lib/foundation/rate-limit'
import { __lastInvitationLink, __resetMailer } from '../lib/foundation/mailer'
import { POST as signup } from '../app/api/auth/signup/route'
import { POST as invitePost } from '../app/api/org/[orgId]/invitations/route'
import { DELETE as invitationDelete } from '../app/api/org/[orgId]/invitations/[invitationId]/route'
import { GET as membersGet } from '../app/api/org/[orgId]/members/route'
import { PATCH as memberPatch, DELETE as memberDelete } from '../app/api/org/[orgId]/members/[userId]/route'
import { GET as invitationGet, POST as invitationAccept } from '../app/api/invitations/[token]/route'

process.env.APP_SECRET = 'team-invitations-secret-01'

function req(method: string, body?: unknown, cookie?: string): Request {
  return new Request('http://t', {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}
const cookieFrom = (r: Response) => (r.headers.get('set-cookie') ?? '').split(';')[0]
const CTX0 = { params: Promise.resolve({}) }

async function signupAs(email: string) {
  const res = await signup(req('POST', { email, password: 'longenough123' }), CTX0)
  const cookie = cookieFrom(res)
  const { user, org } = (await res.json()) as { user: { id: string; email: string }; org: { id: string; name: string } }
  return { cookie, user, org }
}

describe('team invitations', () => {
  let store: FileFoundationStore

  beforeEach(() => {
    store = new FileFoundationStore(mkdtempSync(path.join(tmpdir(), 'rf-invitations-')))
    __setStoreForTests(store)
    __resetRateLimits()
    __resetMailer()
  })
  afterEach(() => {
    __setStoreForTests(null)
  })

  it('an owner invites an email, the invitee signs up and accepts, and becomes a real member', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const inviteeEmail = `invitee_${randomUUID()}@x.com`
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }

    const inviteRes = await invitePost(req('POST', { email: inviteeEmail, role: 'member' }, owner.cookie), orgCtx)
    expect(inviteRes.status).toBe(201)

    const link = __lastInvitationLink(inviteeEmail)
    expect(link).toBeTruthy()
    const token = link!.split('/invite/')[1]

    // Unauthenticated preview shows org + role, nothing else.
    const previewRes = await invitationGet(req('GET'), { params: Promise.resolve({ token }) })
    expect(previewRes.status).toBe(200)
    const preview = await previewRes.json()
    expect(preview.orgName).toBe(owner.org.name)
    expect(preview.role).toBe('member')

    // The invitee signs up with the exact invited address, then accepts.
    const invitee = await signupAs(inviteeEmail)
    const acceptRes = await invitationAccept(req('POST', undefined, invitee.cookie), { params: Promise.resolve({ token }) })
    expect(acceptRes.status).toBe(200)

    // Now a real member of the owner's org, alongside their own personal org.
    const rosterRes = await membersGet(req('GET', undefined, owner.cookie), orgCtx)
    const roster = await rosterRes.json()
    expect(roster.members.map((m: { email: string }) => m.email)).toContain(inviteeEmail)
    expect(roster.invitations).toEqual([]) // no longer pending
  })

  it('rejects accepting with a different logged-in email than the invitation', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const inviteeEmail = `invitee_${randomUUID()}@x.com`
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }
    await invitePost(req('POST', { email: inviteeEmail, role: 'member' }, owner.cookie), orgCtx)
    const token = __lastInvitationLink(inviteeEmail)!.split('/invite/')[1]

    const someoneElse = await signupAs(`someone_${randomUUID()}@x.com`)
    const res = await invitationAccept(req('POST', undefined, someoneElse.cookie), { params: Promise.resolve({ token }) })
    expect(res.status).toBe(403)
  })

  it('a member (non-admin) cannot invite', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const memberEmail = `member_${randomUUID()}@x.com`
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }
    await invitePost(req('POST', { email: memberEmail, role: 'member' }, owner.cookie), orgCtx)
    const token = __lastInvitationLink(memberEmail)!.split('/invite/')[1]
    const memberUser = await signupAs(memberEmail)
    await invitationAccept(req('POST', undefined, memberUser.cookie), { params: Promise.resolve({ token }) })

    const blockedRes = await invitePost(req('POST', { email: `x_${randomUUID()}@x.com`, role: 'member' }, memberUser.cookie), orgCtx)
    expect(blockedRes.status).toBe(403)
  })

  it('re-inviting the same pending email supersedes the old invitation (no duplicate accept)', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const email = `dup_${randomUUID()}@x.com`
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }
    await invitePost(req('POST', { email, role: 'member' }, owner.cookie), orgCtx)
    const firstToken = __lastInvitationLink(email)!.split('/invite/')[1]
    await invitePost(req('POST', { email, role: 'admin' }, owner.cookie), orgCtx)
    const secondToken = __lastInvitationLink(email)!.split('/invite/')[1]
    expect(secondToken).not.toBe(firstToken)

    const firstPreview = await invitationGet(req('GET'), { params: Promise.resolve({ token: firstToken }) })
    expect(firstPreview.status).toBe(410) // superseded → no longer pending

    const rosterRes = await membersGet(req('GET', undefined, owner.cookie), orgCtx)
    const roster = await rosterRes.json()
    expect(roster.invitations.length).toBe(1)
    expect(roster.invitations[0].role).toBe('admin')
  })

  it('revoking a pending invitation removes it from the roster and dead-letters the link', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const email = `revoked_${randomUUID()}@x.com`
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }
    const inviteRes = await invitePost(req('POST', { email, role: 'member' }, owner.cookie), orgCtx)
    const { invitation } = await inviteRes.json()

    const revokeRes = await invitationDelete(req('DELETE', undefined, owner.cookie), { params: Promise.resolve({ orgId: owner.org.id, invitationId: invitation.id }) })
    expect(revokeRes.status).toBe(200)

    const token = __lastInvitationLink(email)!.split('/invite/')[1]
    const previewRes = await invitationGet(req('GET'), { params: Promise.resolve({ token }) })
    expect(previewRes.status).toBe(410)
  })

  it('the last owner cannot be demoted or removed', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }
    const userCtx = { params: Promise.resolve({ orgId: owner.org.id, userId: owner.user.id }) }

    const demoteRes = await memberPatch(req('PATCH', { role: 'admin' }, owner.cookie), userCtx)
    expect(demoteRes.status).toBe(400)

    const removeRes = await memberDelete(req('DELETE', undefined, owner.cookie), userCtx)
    expect(removeRes.status).toBe(400)
    void orgCtx
  })

  it('an admin can change a member role and remove a member, but cannot touch owners', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }

    const adminEmail = `admin_${randomUUID()}@x.com`
    await invitePost(req('POST', { email: adminEmail, role: 'admin' }, owner.cookie), orgCtx)
    const adminToken = __lastInvitationLink(adminEmail)!.split('/invite/')[1]
    const admin = await signupAs(adminEmail)
    await invitationAccept(req('POST', undefined, admin.cookie), { params: Promise.resolve({ token: adminToken }) })

    const memberEmail = `member_${randomUUID()}@x.com`
    await invitePost(req('POST', { email: memberEmail, role: 'member' }, owner.cookie), orgCtx)
    const memberToken = __lastInvitationLink(memberEmail)!.split('/invite/')[1]
    const member = await signupAs(memberEmail)
    await invitationAccept(req('POST', undefined, member.cookie), { params: Promise.resolve({ token: memberToken }) })

    // Admin promotes the member to admin.
    const memberCtx = { params: Promise.resolve({ orgId: owner.org.id, userId: member.user.id }) }
    const promoteRes = await memberPatch(req('PATCH', { role: 'admin' }, admin.cookie), memberCtx)
    expect(promoteRes.status).toBe(200)

    // Admin cannot touch the owner.
    const ownerCtx = { params: Promise.resolve({ orgId: owner.org.id, userId: owner.user.id }) }
    const blockedRes = await memberDelete(req('DELETE', undefined, admin.cookie), ownerCtx)
    expect(blockedRes.status).toBe(403)

    // Admin removes the (now-admin) former member.
    const removeRes = await memberDelete(req('DELETE', undefined, admin.cookie), memberCtx)
    expect(removeRes.status).toBe(200)
    const rosterRes = await membersGet(req('GET', undefined, owner.cookie), orgCtx)
    const roster = await rosterRes.json()
    expect(roster.members.map((m: { email: string }) => m.email)).not.toContain(memberEmail)
  })

  it('inviting someone who is already a member is rejected', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const email = `member_${randomUUID()}@x.com`
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }
    await invitePost(req('POST', { email, role: 'member' }, owner.cookie), orgCtx)
    const token = __lastInvitationLink(email)!.split('/invite/')[1]
    const member = await signupAs(email)
    await invitationAccept(req('POST', undefined, member.cookie), { params: Promise.resolve({ token }) })

    const reinviteRes = await invitePost(req('POST', { email, role: 'admin' }, owner.cookie), orgCtx)
    expect(reinviteRes.status).toBe(409)
  })

  it('an invitation can only grant admin or member, never owner', async () => {
    const owner = await signupAs(`owner_${randomUUID()}@x.com`)
    const orgCtx = { params: Promise.resolve({ orgId: owner.org.id }) }
    const res = await invitePost(req('POST', { email: `x_${randomUUID()}@x.com`, role: 'owner' }, owner.cookie), orgCtx)
    expect(res.status).toBe(400)
  })
})
