import { handled, requireStaff, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

// Staff-only: pilot feedback/issue reports across every org, newest first.
// Was previously store-only access per KNOWN_LIMITATIONS.md.
export const GET = handled(async (request) => {
  const user = await requireUser(request)
  requireStaff(user)

  const store = await getStore()
  const entries = await store.listAllFeedback(200)
  const orgIds = [...new Set(entries.map((e) => e.orgId))]
  const orgNames = new Map(
    (await Promise.all(orgIds.map(async (id) => [id, (await store.getOrg(id))?.name ?? '(deleted org)'] as const)))
  )
  const userIds = [...new Set(entries.map((e) => e.userId))]
  const userEmails = new Map(
    (await Promise.all(userIds.map(async (id) => [id, (await store.getUserById(id))?.email ?? '(deleted user)'] as const)))
  )

  return Response.json({
    feedback: entries.map((e) => ({
      id: e.id,
      orgId: e.orgId,
      orgName: orgNames.get(e.orgId) ?? '(deleted org)',
      userEmail: userEmails.get(e.userId) ?? '(deleted user)',
      projectId: e.projectId ?? null,
      kind: e.kind,
      message: e.message,
      createdAt: e.createdAt,
    })),
  })
})
