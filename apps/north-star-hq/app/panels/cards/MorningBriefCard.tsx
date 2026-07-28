'use client'

// Thin chrome wrapper — all data logic lives in BriefingPanel; this only
// supplies the always-visible right-side card frame around it.

import type { CompassState } from '../../compass'
import BriefingPanel from '../briefing/BriefingPanel'
import ExpandableCard from './ExpandableCard'

export default function MorningBriefCard({
  projectId,
  projectsResolved,
  onCompassState,
  expanded,
  onExpand,
  onCollapse,
}: {
  projectId: string | null
  projectsResolved: boolean
  onCompassState: (s: CompassState) => void
  expanded: boolean
  onExpand: () => void
  onCollapse: () => void
}) {
  return (
    <ExpandableCard expanded={expanded} label="Morning Brief" onExpand={onExpand} onCollapse={onCollapse}>
      <BriefingPanel projectId={projectId} projectsResolved={projectsResolved} onCompassState={onCompassState} />
    </ExpandableCard>
  )
}
