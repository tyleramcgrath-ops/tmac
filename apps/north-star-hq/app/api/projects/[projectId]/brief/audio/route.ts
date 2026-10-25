// Audio briefing: the executive brief as a script meant to be heard.
//
// Returns text, not audio, on purpose. /api/compass/speak reaches an
// unofficial Edge endpoint that 403s from some datacenter IPs; if this route
// synthesized the audio itself, that failure would take the whole briefing
// down. Returning the script lets the client try neural speech and fall back
// to the browser's own speechSynthesis with the same words — worse voice,
// complete briefing.
//
// The written brief and the spoken one come from the same loadExecutiveBrief
// call, so they can never describe different states of the project.

import { handled, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { loadExecutiveBrief } from '@/lib/foundation/briefing/load'
import { buildSpokenBrief } from '@/lib/foundation/briefing/audio'

export const runtime = 'nodejs'

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const store = await getStore()
  const brief = await loadExecutiveBrief(store, project)
  return Response.json({ spoken: buildSpokenBrief(brief), generatedAt: brief.generatedAt })
})
