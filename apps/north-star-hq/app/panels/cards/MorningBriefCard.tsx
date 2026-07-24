'use client'

// Thin chrome wrapper — all data logic lives in BriefingPanel; this only
// supplies the always-visible right-side card frame around it.

import type { CompassState } from '../../compass'
import BriefingPanel from '../briefing/BriefingPanel'

export default function MorningBriefCard({
  projectId,
  projectsResolved,
  onCompassState,
}: {
  projectId: string | null
  projectsResolved: boolean
  onCompassState: (s: CompassState) => void
}) {
  return (
    <div className="ns-card ns-glass ns-panel">
      <BriefingPanel projectId={projectId} projectsResolved={projectsResolved} onCompassState={onCompassState} />
    </div>
  )
}
