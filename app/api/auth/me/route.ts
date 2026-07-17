import { currentUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const user = await currentUser(request)
  if (!user) return Response.json({ user: null }, { status: 200 })
  const store = await getStore()
  const orgs = await store.listOrgsForUser(user.id)
  return Response.json({
    user: { id: user.id, email: user.email, name: user.name },
    orgs: orgs.map((o) => ({ id: o.id, name: o.name })),
  })
}
