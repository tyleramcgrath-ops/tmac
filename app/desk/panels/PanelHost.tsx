'use client'

// Renders the always-on-view panel group inside the existing `.ns-panel`
// wrapper contract (className, `.up` gating via the parent's class, staggered
// `transitionDelay`) — the CSS transition contract in desk.css is untouched;
// only the panels' content is now data-driven instead of hardcoded.

import type { CompassState } from '../compass'
import BriefingPanel from './briefing/BriefingPanel'
import OpportunitiesPanel from './opportunities/OpportunitiesPanel'
import ApprovalsPanel from './approvals/ApprovalsPanel'

const DELAYS = ['0ms', '130ms', '260ms']

export default function PanelHost({
  projectId,
  projectsResolved,
  panelsUp,
  onCompassState,
}: {
  projectId: string | null
  // true once the flagship-project lookup has finished — lets panels tell
  // "still resolving which project" apart from "resolved to no project"
  // (both look like `projectId === null`) instead of skeleton-pulsing forever.
  projectsResolved: boolean
  panelsUp: boolean
  onCompassState: (s: CompassState) => void
}) {
  return (
    <>
      <article className="ns-panel" style={{ transitionDelay: DELAYS[0] }}>
        <BriefingPanel projectId={projectId} projectsResolved={projectsResolved} />
      </article>
      <article className="ns-panel" style={{ transitionDelay: DELAYS[1] }}>
        <OpportunitiesPanel projectId={projectId} projectsResolved={projectsResolved} />
      </article>
      <article className="ns-panel" style={{ transitionDelay: DELAYS[2] }}>
        <ApprovalsPanel
          projectId={projectId}
          projectsResolved={projectsResolved}
          panelsUp={panelsUp}
          onCompassState={onCompassState}
        />
      </article>
    </>
  )
}
