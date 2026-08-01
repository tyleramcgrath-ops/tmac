'use client'

// Thin chrome wrapper — all data logic lives in AgentRosterPanel; this only
// supplies the always-visible right-side card frame around it.

import type { CompassState } from '../../compass'
import AgentRosterPanel from '../agents/AgentRosterPanel'
import ExpandableCard from './ExpandableCard'

export default function AgentStatusCard({
  projectId,
  projectsResolved,
  panelsUp,
  onAgentSignal,
  expanded,
  onExpand,
  onCollapse,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
  onAgentSignal: (s: CompassState | null) => void
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
}) {
  return (
    <ExpandableCard expanded={expanded} label="Agent Status" onExpand={onExpand} onCollapse={onCollapse}>
      <AgentRosterPanel
        projectId={projectId}
        projectsResolved={projectsResolved}
        panelsUp={panelsUp}
        onCompassSignal={onAgentSignal}
      />
    </ExpandableCard>
  )
}
