// The one seam between real agent-roster state and the compass. Kept as a
// small pure function (not inline logic scattered in page.tsx) so a future
// push-based agent runtime can drive the exact same compass states later
// without any UI change — only what feeds this function changes.
//
// Deliberately conservative for Milestone 1: only 'failed' and 'active'
// produce an ambient signal, and only 'warning'/'thinking' — states that read
// as ambient background awareness rather than a specific in-progress action
// (which the user-triggered approve flow already owns via its own compass
// calls). This avoids two independent sources fighting over the compass.

import type { AgentRosterDTO } from '../../lib/client'
import type { CompassState } from '../compass'

export function deriveCompassSignal(roster: AgentRosterDTO): CompassState | null {
  if (roster.agents.some((a) => a.status === 'failed')) return 'warning'
  if (roster.agents.some((a) => a.status === 'active' || a.status === 'verifying')) return 'thinking'
  return null
}
