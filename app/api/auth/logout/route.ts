import { clearSessionCookie, currentUser, handled, revokeSessions } from '@/lib/foundation/auth'

export const runtime = 'nodejs'

// POST { everywhere?: boolean }
//   - default: clear THIS device's session cookie.
//   - everywhere: bump the user's tokenVersion so ALL their sessions (every
//     device/browser) are invalidated at once (Phase D.6 P6).
export const POST = handled(async (request) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  if (body.everywhere === true) {
    const user = await currentUser(request)
    if (user) await revokeSessions(user.id)
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
  })
})
