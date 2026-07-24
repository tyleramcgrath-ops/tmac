// Command Bar — the API layer (Engine -> API -> UI). A thin wrapper:
// authentication, project authorization, input validation, rate limiting,
// DTO translation. All command interpretation, permission logic, and
// execution lives in lib/foundation/commands/engine.ts.

import { randomUUID } from 'crypto'
import { assertSameOrigin, enforceRateLimit, handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { runCommand } from '@/lib/foundation/commands/engine'

export const runtime = 'nodejs'
export const maxDuration = 60

export const POST = handled(async (request, { params }) => {
  assertSameOrigin(request)
  enforceRateLimit(request, 'command-bar', 60)
  const user = await requireUser(request)
  const { projectId } = await params
  const { project, role } = await requireProjectRole(user, projectId, 'member')

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const raw = typeof body.raw === 'string' ? body.raw.slice(0, 500) : ''
  if (!raw.trim()) {
    return Response.json({ error: 'Empty command.' }, { status: 400 })
  }

  const store = await getStore()
  const commandResult = await runCommand(
    { store, project, userId: user.id, userRole: role },
    {
      commandId: typeof body.commandId === 'string' ? body.commandId : randomUUID(),
      raw,
      projectId,
      missionId: typeof body.missionId === 'string' ? body.missionId : null,
      confirmed: body.confirmed === true,
      params: typeof body.params === 'object' && body.params !== null ? (body.params as Record<string, unknown>) : {},
    }
  )

  return Response.json({ result: commandResult })
})
