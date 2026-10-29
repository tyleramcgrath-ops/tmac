import { audit, currentUser, handled } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

function isExpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) < Date.now()
}

// Unauthenticated preview — lets the invite page show "You've been invited to
// join <org> as <role>" before the visitor logs in or signs up. Reveals only
// what the link's holder already implicitly knows (org name + role), never
// other members or org data.
export const GET = handled(async (_request, ctx) => {
  const { token } = await ctx.params
  const store = await getStore()
  const invitation = await store.getInvitationByToken(token)
  if (!invitation) return Response.json({ error: 'Invitation not found.' }, { status: 404 })
  if (invitation.status !== 'pending') {
    return Response.json({ error: 'This invitation has already been used or was revoked.' }, { status: 410 })
  }
  if (isExpired(invitation.expiresAt)) {
    return Response.json({ error: 'This invitation has expired. Ask for a new one.' }, { status: 410 })
  }
  const org = await store.getOrg(invitation.orgId)
  if (!org) return Response.json({ error: 'Invitation not found.' }, { status: 404 })
  return Response.json({ orgName: org.name, role: invitation.role, email: invitation.email })
})

export const POST = handled(async (request, ctx) => {
  const { token } = await ctx.params
  const user = await currentUser(request)
  if (!user) return Response.json({ error: 'Log in or sign up with the invited email address first.' }, { status: 401 })

  const store = await getStore()
  const invitation = await store.getInvitationByToken(token)
  if (!invitation) return Response.json({ error: 'Invitation not found.' }, { status: 404 })
  if (invitation.status !== 'pending') {
    return Response.json({ error: 'This invitation has already been used or was revoked.' }, { status: 410 })
  }
  if (isExpired(invitation.expiresAt)) {
    return Response.json({ error: 'This invitation has expired. Ask for a new one.' }, { status: 410 })
  }
  if (user.email !== invitation.email) {
    return Response.json({ error: `This invitation was sent to ${invitation.email}. Log in with that address to accept it.` }, { status: 403 })
  }

  const existingMembership = await store.getMembership(invitation.orgId, user.id)
  if (!existingMembership) {
    await store.addMember({ orgId: invitation.orgId, userId: user.id, role: invitation.role, createdAt: new Date().toISOString() })
  }
  await store.updateInvitation({ ...invitation, status: 'accepted', acceptedAt: new Date().toISOString() })
  await audit(invitation.orgId, user.id, 'invitation.accept', invitation.id, user.email)

  const org = await store.getOrg(invitation.orgId)
  return Response.json({ org: org ? { id: org.id, name: org.name } : null })
})
