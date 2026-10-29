// Email verification landing (RC2 P4). Google/None: the user clicks the link in
// their inbox → GET here with ?token. We mark the account verified and redirect
// back to the app. Invalid/expired tokens redirect with a clear status rather
// than erroring. This is a top-level navigation, so it must be a GET.

import { handled } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'

export const runtime = 'nodejs'

function back(request: Request, status: string): Response {
  const origin = new URL(request.url).origin
  return Response.redirect(`${origin}/app?verify=${status}`, 302)
}

export const GET = handled(async (request) => {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  if (!token) return back(request, 'invalid')
  const store = await getStore()
  const user = await store.getUserByVerifyToken(token)
  if (!user || user.verifyToken !== token) return back(request, 'invalid')
  if (user.verifyTokenExpiresAt && Date.parse(user.verifyTokenExpiresAt) < Date.now()) return back(request, 'expired')

  await store.updateUser({ ...user, emailVerified: true, verifyToken: null, verifyTokenExpiresAt: null })
  return back(request, 'success')
})
