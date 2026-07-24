'use client'

// Thin chrome wrapper — all data logic lives in AgentRosterPanel; this only
// supplies the always-visible right-side card frame around it.

import type { CompassState } from '../../compass'
import AgentRosterPanel from '../agents/AgentRosterPanel'

export default function AgentStatusCard({
  projectId,
  projectsResolved,
  panelsUp,
  onAgentSignal,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
  onAgentSignal: (s: CompassState | null) => void
}) {
  return (
    <div className="ns-card ns-glass ns-panel">
      <AgentRosterPanel
        projectId={projectId}
        projectsResolved={projectsResolved}
        panelsUp={panelsUp}
        onCompassSignal={onAgentSignal}
      />
    </div>
  )
}
