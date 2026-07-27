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
import IntegrationsPanel from './integrations/IntegrationsPanel'
import PerformancePanel from './performance/PerformancePanel'

type DrawerId = Exclude<RailDestination, 'search'>

const DRAWER_LABEL: Record<DrawerId, string> = {
  performance: 'Performance',
  opportunities: 'Opportunities',
  approvals: 'Approvals',
  missions: 'Missions',
  history: 'History',
  integrations: 'Integrations',
}

export default function PanelHost({
  projectId,
  projectsResolved,
  panelsUp,
  onCompassState,
  onAgentSignal,
  onSummon,
  consoleInputRef,
}: {
  projectId: string | null
  projectsResolved: boolean
  panelsUp: boolean
  onCompassState: (s: CompassState) => void
  // ambient signal derived from real roster deltas — distinct from
  // onCompassState, which approve/command flows call directly and authoritatively.
  onAgentSignal: (s: CompassState | null) => void
  // Lets a child (Integrations, returning from the Google OAuth round-trip)
  // ask the room to summon the HUD even if the user hasn't touched the
  // Compass yet — otherwise the result of a Connect Google attempt lands in
  // a drawer nobody knows to open (IntegrationsPanel's own ?google= effect
  // still runs since Drawer keeps children mounted while closed, but a
  // closed drawer is invisible — see the effect below).
  onSummon: () => void
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

  // Land the user directly on the Integrations drawer, HUD summoned, when
  // they arrive back from Google's consent screen (?google=connected|error —
  // see app/api/oauth/google/callback/route.ts). IntegrationsPanel is the one
  // that calls this: it already reads the query param on mount, and a
  // sibling effect here reading window.location.search independently would
  // race it — React fires a child's effects before its parent's in the same
  // commit, so IntegrationsPanel's own history.replaceState (which strips
  // the param) would already have run by the time this component's effect
  // got to look.
  function handleGoogleReturn() {
    setDrawer('integrations')
    onSummon()
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

      <Drawer open={drawer === 'performance'} label={DRAWER_LABEL.performance} onClose={() => setDrawer(null)}>
        <PerformancePanel projectId={projectId} enabled={panelsUp && drawer === 'performance'} />
      </Drawer>
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
      <Drawer open={drawer === 'integrations'} label={DRAWER_LABEL.integrations} onClose={() => setDrawer(null)}>
        <IntegrationsPanel projectId={projectId} onGoogleReturn={handleGoogleReturn} />
      </Drawer>
    </div>
  )
}
