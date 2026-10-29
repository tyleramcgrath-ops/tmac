import { audit, handled, requireOrgRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

export const DELETE = handled(async (request, ctx) => {
  const { orgId, invitationId } = await ctx.params
  const user = await requireUser(request)
  await requireOrgRole(user, orgId, 'admin')

  const store = await getStore()
  const invitations = await store.listInvitations(orgId)
  const invitation = invitations.find((i) => i.id === invitationId)
  if (!invitation) return Response.json({ error: 'Invitation not found.' }, { status: 404 })
  if (invitation.status !== 'pending') {
    return Response.json({ error: 'This invitation is no longer pending.' }, { status: 400 })
  }

  await store.updateInvitation({ ...invitation, status: 'revoked' })
  await audit(orgId, user.id, 'invitation.revoke', invitationId, invitation.email)
  return Response.json({ ok: true })
})
