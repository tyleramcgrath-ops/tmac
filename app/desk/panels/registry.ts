// Panel registry for the always-on-view briefing/opportunities/approvals
// group. These three are eagerly imported since they're part of the default
// summoned view (no benefit to code-splitting something shown immediately).
// Later, on-demand panels (agent roster, mission queue, search, knowledge
// base — Phase 2 sub-milestones b–f) should use `React.lazy` here instead,
// per the performance guardrails in the Phase 2 plan.

export type PanelId = 'briefing' | 'opportunities' | 'approvals' | 'agents' | 'missions' | 'operations'

// Transitional note: all six panels show simultaneously for now. A future
// pass on panel selection (the Command Bar covers ad hoc lookups today via
// "show mission 482") would turn this into a true registry of summonable
// panels rather than "everything, always".
export const HOME_PANELS: readonly PanelId[] = ['briefing', 'opportunities', 'approvals', 'agents', 'missions', 'operations']
