'use client'

// The HUD — the summoned interface layer that sits around the Compass
// instead of covering it: a left wayfinding rail, two always-visible glass
// cards on the right (Agent Status, Morning Brief), a bottom Mission strip
// and command console, and rail-triggered drawers for the deeper views
// (Opportunities, Approvals, Missions, History). Every region keeps the
// same `.ns-hud`/`.up` visibility contract the old `.ns-panels` section
// used — only what's inside it changed.

import { useState } from 'react'
import type { CompassState } from '../compass'
import CommandRail, { type RailDestination } from './rail/CommandRail'
import AgentStatusCard from './cards/AgentStatusCard'
import MorningBriefCard from './cards/MorningBriefCard'
import MissionStrip from './strip/MissionStrip'
import CommandConsole from './console/CommandConsole'
import Drawer from './drawer/Drawer'
import OpportunitiesPanel from './opportunities/OpportunitiesPanel'
import ApprovalsPanel from './approvals/ApprovalsPanel'
import MissionQueuePanel from './missions/MissionQueuePanel'
import MissionOperationsPanel from './operations/MissionOperationsPanel'
import HistoryPanel from './history/HistoryPanel'

type DrawerId = Exclude<RailDestination, 'search'>

const DRAWER_LABEL: Record<DrawerId, string> = {
  opportunities: 'Opportunities',
  approvals: 'Approvals',
  missions: 'Missions',
  history: 'History',
}

export default function PanelHost({
  projectId,
  projectsResolved,
  panelsUp,
  onCompassState,
  onAgentSignal,
  consoleInputRef,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
  onCompassState: (s: CompassState) => void
  // ambient signal derived from real roster deltas — distinct from
  // onCompassState, which approve/command flows call directly and authoritatively.
  onAgentSignal: (s: CompassState | null) => void
  consoleInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [drawer, setDrawer] = useState<DrawerId | null>(null)

  function handleOpen(id: RailDestination) {
    if (id === 'search') {
      consoleInputRef.current?.focus()
      return
    }
    setDrawer((d) => (d === id ? null : id))
  }

  return (
    <div className={`ns-hud${panelsUp ? ' up' : ''}`} aria-hidden={!panelsUp} aria-label="Command interface">
      <CommandRail projectId={projectId} panelsUp={panelsUp} active={drawer} onOpen={handleOpen} />

      <div className="ns-cards">
        <AgentStatusCard
          projectId={projectId}
          projectsResolved={projectsResolved}
          panelsUp={panelsUp}
          onAgentSignal={onAgentSignal}
        />
        <MorningBriefCard projectId={projectId} projectsResolved={projectsResolved} onCompassState={onCompassState} />
      </div>

      <MissionStrip projectId={projectId} panelsUp={panelsUp} />
      <CommandConsole projectId={projectId} panelsUp={panelsUp} onCompassState={onCompassState} inputRef={consoleInputRef} />

      <Drawer open={drawer === 'opportunities'} label={DRAWER_LABEL.opportunities} onClose={() => setDrawer(null)}>
        <OpportunitiesPanel projectId={projectId} projectsResolved={projectsResolved} />
      </Drawer>
      <Drawer open={drawer === 'approvals'} label={DRAWER_LABEL.approvals} onClose={() => setDrawer(null)}>
        <ApprovalsPanel
          projectId={projectId}
          projectsResolved={projectsResolved}
          panelsUp={panelsUp && drawer === 'approvals'}
          onCompassState={onCompassState}
        />
      </Drawer>
      <Drawer open={drawer === 'missions'} label={DRAWER_LABEL.missions} onClose={() => setDrawer(null)}>
        <MissionQueuePanel
          projectId={projectId}
          projectsResolved={projectsResolved}
          panelsUp={panelsUp && drawer === 'missions'}
        />
        <hr className="ns-panel-divider" />
        <MissionOperationsPanel
          projectId={projectId}
          projectsResolved={projectsResolved}
          panelsUp={panelsUp && drawer === 'missions'}
        />
      </Drawer>
      <Drawer open={drawer === 'history'} label={DRAWER_LABEL.history} onClose={() => setDrawer(null)}>
        <HistoryPanel projectId={projectId} enabled={panelsUp && drawer === 'history'} />
      </Drawer>
    </div>
  )
}
